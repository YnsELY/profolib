-- Schema for EduConnect - Full Admin Access (CORRIGÉ)

-- =====================================================
-- 1. TYPES ENUM
-- =====================================================

create type request_status as enum ('pending', 'accepted', 'completed', 'cancelled');
create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
create type registration_status as enum ('pending', 'approved', 'rejected');
create type transaction_type as enum ('earning', 'withdrawal', 'refund', 'bonus');
create type transaction_status as enum ('pending', 'completed', 'failed', 'cancelled');

-- =====================================================
-- 2. TABLES
-- =====================================================

-- Table des profils
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('student', 'teacher', 'admin')),
  subjects text[] null,
  approved boolean not null default true,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create unique index if not exists profiles_email_key on public.profiles (email);
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_approved_idx on public.profiles (approved);

-- Table des demandes de cours
create table if not exists public.course_requests (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  student_name text not null,
  subject text not null,
  level text not null,
  description text not null,
  status request_status not null default 'pending',
  teacher_id uuid null references public.profiles (id) on delete set null,
  teacher_name text null,
  video_link text null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  accepted_at timestamp with time zone null,
  duration_minutes integer not null default 20,
  student_price decimal(10,2) not null default 5.00,
  teacher_revenue decimal(10,2) not null default 3.50,
  platform_commission decimal(10,2) not null default 1.50,
  payment_status payment_status not null default 'pending'
);

create index if not exists course_requests_status_created_at_idx on public.course_requests (status, created_at desc);
create index if not exists course_requests_student_id_idx on public.course_requests (student_id);
create index if not exists course_requests_teacher_id_idx on public.course_requests (teacher_id);
create index if not exists course_requests_payment_status_idx on public.course_requests (payment_status);

-- Table des inscriptions professeurs en attente
create table if not exists public.teacher_registrations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  name text not null,
  subjects text[] not null,
  diplomas text null,
  experience text null,
  motivation text not null,
  status registration_status not null default 'pending',
  reviewed_by uuid null references public.profiles (id) on delete set null,
  review_notes text null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  reviewed_at timestamp with time zone null
);

create index if not exists teacher_registrations_status_idx on public.teacher_registrations (status, created_at desc);

-- Table des cagnottes des professeurs
create table if not exists public.teacher_wallets (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null unique references public.profiles (id) on delete cascade,
  balance decimal(10,2) not null default 0.00,
  total_earned decimal(10,2) not null default 0.00,
  total_withdrawn decimal(10,2) not null default 0.00,
  created_at timestamp with time zone not null default timezone('utc', now()),
  updated_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists teacher_wallets_teacher_id_idx on public.teacher_wallets (teacher_id);

-- Table des transactions de cagnotte
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.teacher_wallets (id) on delete cascade,
  course_request_id uuid null references public.course_requests (id) on delete set null,
  type transaction_type not null,
  amount decimal(10,2) not null, -- Montant de la transaction (revenu prof pour les gains, montant négatif pour retraits)
  student_price decimal(10,2) null, -- Prix payé par l'élève (pour les gains)
  teacher_revenue decimal(10,2) null, -- Revenu du professeur (pour les gains, égal à amount si type = earning)
  platform_commission decimal(10,2) null, -- Commission de la plateforme (student_price - teacher_revenue)
  description text null,
  status transaction_status not null default 'pending',
  processed_by uuid null references public.profiles (id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  processed_at timestamp with time zone null
);

create index if not exists wallet_transactions_wallet_id_idx on public.wallet_transactions (wallet_id);

-- Table des paiements des élèves
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  course_request_id uuid not null unique references public.course_requests (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount decimal(10,2) not null,
  platform_commission decimal(10,2) not null,
  teacher_revenue decimal(10,2) not null,
  payment_method text null,
  payment_intent_id text null,
  status payment_status not null default 'pending',
  paid_at timestamp with time zone null,
  refunded_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_student_id_idx on public.payments (student_id);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

-- =====================================================
-- 3. FONCTION POUR VÉRIFIER SI ADMIN
-- SECURITY DEFINER permet de bypass RLS
-- =====================================================

create or replace function public.is_admin(user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = user_id and role = 'admin'
  );
end;
$$;

-- Fonction pour créditer le wallet d'un professeur après un cours
-- Cette fonction est appelée par le trigger ou manuellement
CREATE OR REPLACE FUNCTION public.credit_wallet_for_course(
  p_teacher_id uuid,
  p_amount decimal,
  p_course_request_id uuid,
  p_description text,
  p_student_price decimal DEFAULT NULL,
  p_platform_commission decimal DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_wallet_id uuid;
  v_teacher_revenue decimal;
BEGIN
  -- Récupérer l'ID du wallet du professeur
  SELECT id INTO v_wallet_id
  FROM public.teacher_wallets
  WHERE teacher_id = p_teacher_id;

  -- Si le wallet n'existe pas, le créer
  IF v_wallet_id IS NULL THEN
    INSERT INTO public.teacher_wallets (teacher_id, balance, total_earned, total_withdrawn)
    VALUES (p_teacher_id, 0, 0, 0)
    RETURNING id INTO v_wallet_id;
  END IF;

  -- Le montant passé est déjà le revenu prof
  v_teacher_revenue := p_amount;

  -- Mettre à jour le wallet
  UPDATE public.teacher_wallets
  SET 
    balance = balance + v_teacher_revenue,
    total_earned = total_earned + v_teacher_revenue,
    updated_at = timezone('utc', now())
  WHERE id = v_wallet_id;

  -- Créer la transaction avec les détails
  INSERT INTO public.wallet_transactions (
    wallet_id,
    course_request_id,
    type,
    amount,
    student_price,
    teacher_revenue,
    platform_commission,
    description,
    status,
    created_at,
    processed_at
  ) VALUES (
    v_wallet_id,
    p_course_request_id,
    'earning',
    v_teacher_revenue,
    p_student_price,
    v_teacher_revenue,
    p_platform_commission,
    p_description,
    'completed',
    timezone('utc', now()),
    timezone('utc', now())
  );
END;
$$;

-- =====================================================
-- 4. ACTIVER RLS
-- =====================================================

alter table public.profiles enable row level security;
alter table public.course_requests enable row level security;
alter table public.teacher_registrations enable row level security;
alter table public.teacher_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payments enable row level security;

-- =====================================================
-- 5. POLICIES RLS - ADMINS ONT ACCÈS TOTAL
-- =====================================================

-- PROFILES
-- SELECT: Tout le monde voit tous les profils (pour afficher les noms)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- INSERT: Utilisateurs créent leur propre profil
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- INSERT: Admins peuvent créer n'importe quel profil
create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Utilisateurs modifient leur propre profil
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- UPDATE: Admins modifient tout
create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- COURSE_REQUESTS
-- SELECT: Tout le monde voit tout
create policy "requests_select_all"
  on public.course_requests for select
  to authenticated
  using (true);

-- INSERT: Tout utilisateur peut créer
create policy "requests_insert_all"
  on public.course_requests for insert
  to authenticated
  with check (true);

-- UPDATE: Propriétaires (élève ou prof)
create policy "requests_update_own"
  on public.course_requests for update
  to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid())
  with check (student_id = auth.uid() or teacher_id = auth.uid());

-- UPDATE: Admins
create policy "requests_update_admin"
  on public.course_requests for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "requests_delete_admin"
  on public.course_requests for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- TEACHER_REGISTRATIONS
-- SELECT: Seuls les admins
create policy "teacher_registrations_select_admin"
  on public.teacher_registrations for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- INSERT: Tout le monde peut soumettre
create policy "teacher_registrations_insert_all"
  on public.teacher_registrations for insert
  to authenticated
  with check (true);

-- UPDATE: Seuls les admins
create policy "teacher_registrations_update_admin"
  on public.teacher_registrations for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "teacher_registrations_delete_admin"
  on public.teacher_registrations for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- TEACHER_WALLETS
-- SELECT: Propriétaire
create policy "teacher_wallets_select_own"
  on public.teacher_wallets for select
  to authenticated
  using (teacher_id = auth.uid());

-- SELECT: Admins
create policy "teacher_wallets_select_admin"
  on public.teacher_wallets for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- INSERT: Seuls les admins
create policy "teacher_wallets_insert_admin"
  on public.teacher_wallets for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins
create policy "teacher_wallets_update_admin"
  on public.teacher_wallets for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "teacher_wallets_delete_admin"
  on public.teacher_wallets for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- WALLET_TRANSACTIONS
-- SELECT: Propriétaire (via son wallet)
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  to authenticated
  using (
    wallet_id in (select id from public.teacher_wallets where teacher_id = auth.uid())
  );

-- SELECT: Admins
create policy "wallet_transactions_select_admin"
  on public.wallet_transactions for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- INSERT: Seuls les admins
create policy "wallet_transactions_insert_admin"
  on public.wallet_transactions for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins
create policy "wallet_transactions_update_admin"
  on public.wallet_transactions for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "wallet_transactions_delete_admin"
  on public.wallet_transactions for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- PAYMENTS
-- SELECT: Propriétaire (student)
create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (student_id = auth.uid());

-- SELECT: Admins
create policy "payments_select_admin"
  on public.payments for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- INSERT: Seuls les admins
create policy "payments_insert_admin"
  on public.payments for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins
create policy "payments_update_admin"
  on public.payments for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins
create policy "payments_delete_admin"
  on public.payments for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Fonction pour créer automatiquement un wallet lors de l'approbation d'un professeur
create or replace function public.create_teacher_wallet()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.role = 'teacher' and new.approved = true then
    insert into public.teacher_wallets (teacher_id, balance, total_earned, total_withdrawn)
    values (new.id, 0.00, 0.00, 0.00)
    on conflict (teacher_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists create_wallet_on_teacher_approval on public.profiles;
create trigger create_wallet_on_teacher_approval
  after insert or update on public.profiles
  for each row
  execute function public.create_teacher_wallet();

-- Fonction pour mettre à jour le timestamp updated_at
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists update_teacher_wallets_updated_at on public.teacher_wallets;
create trigger update_teacher_wallets_updated_at
  before update on public.teacher_wallets
  for each row
  execute function public.update_updated_at_column();

-- =====================================================
-- 7. REALTIME
-- =====================================================

do $$
begin
  alter publication supabase_realtime add table public.course_requests;
  alter publication supabase_realtime add table public.teacher_registrations;
  alter publication supabase_realtime add table public.teacher_wallets;
  alter publication supabase_realtime add table public.wallet_transactions;
  alter publication supabase_realtime add table public.payments;
exception
  when duplicate_object then null;
end $$;
