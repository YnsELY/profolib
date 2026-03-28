-- Mise à jour des politiques RLS pour permettre aux admins d'accéder à toutes les données

-- =====================================================
-- 1. METTRE À JOUR LA CONTRAINTE DE RÔLE
-- =====================================================

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

-- Ajouter la colonne approved si elle n'existe pas
alter table public.profiles add column if not exists approved boolean not null default true;

-- =====================================================
-- 2. CRÉER LES TYPES MANQUANTS
-- =====================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type registration_status as enum ('pending', 'approved', 'rejected');
  end if;
  
  if not exists (select 1 from pg_type where typname = 'payment_status') then
    create type payment_status as enum ('pending', 'paid', 'refunded', 'failed');
  end if;
  
  if not exists (select 1 from pg_type where typname = 'transaction_type') then
    create type transaction_type as enum ('earning', 'withdrawal', 'refund', 'bonus');
  end if;
  
  if not exists (select 1 from pg_type where typname = 'transaction_status') then
    create type transaction_status as enum ('pending', 'completed', 'failed', 'cancelled');
  end if;
end $$;

-- =====================================================
-- 3. CRÉER LES TABLES MANQUANTES
-- =====================================================

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

-- Table des transactions de cagnotte
create table if not exists public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  wallet_id uuid not null references public.teacher_wallets (id) on delete cascade,
  course_request_id uuid null references public.course_requests (id) on delete set null,
  type transaction_type not null,
  amount decimal(10,2) not null,
  description text null,
  status transaction_status not null default 'pending',
  processed_by uuid null references public.profiles (id) on delete set null,
  created_at timestamp with time zone not null default timezone('utc', now()),
  processed_at timestamp with time zone null
);

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

-- =====================================================
-- 4. ACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

alter table public.profiles enable row level security;
alter table public.course_requests enable row level security;
alter table public.teacher_registrations enable row level security;
alter table public.teacher_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.payments enable row level security;

-- =====================================================
-- 5. SUPPRIMER LES ANCIENNES POLICIES
-- =====================================================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

drop policy if exists "requests_select_authenticated" on public.course_requests;
drop policy if exists "requests_insert_authenticated" on public.course_requests;
drop policy if exists "requests_update_authenticated" on public.course_requests;

drop policy if exists "teacher_registrations_select_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_public" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update_admin" on public.teacher_registrations;

drop policy if exists "teacher_wallets_select_own" on public.teacher_wallets;
drop policy if exists "teacher_wallets_all_admin" on public.teacher_wallets;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
drop policy if exists "wallet_transactions_all_admin" on public.wallet_transactions;

drop policy if exists "payments_select_own_or_admin" on public.payments;
drop policy if exists "payments_all_admin" on public.payments;

-- =====================================================
-- 6. CRÉER LES NOUVELLES POLICIES - ADmins ont TOUS les droits
-- =====================================================

-- FONCTION UTILITAIRE POUR VÉRIFIER SI L'UTILISATEUR EST ADMIN
create or replace function public.is_admin()
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- =====================================================
-- PROFILES
-- =====================================================

-- SELECT: Tout le monde peut voir tous les profils (pour afficher les noms)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- INSERT: Les utilisateurs peuvent créer leur propre profil
-- ET les admins peuvent créer n'importe quel profil
create policy "profiles_insert"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id or public.is_admin());

-- UPDATE: Les utilisateurs peuvent modifier leur propre profil
-- ET les admins peuvent modifier tous les profils
create policy "profiles_update"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- DELETE: Seuls les admins peuvent supprimer des profils
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- COURSE_REQUESTS
-- =====================================================

-- SELECT: Tout le monde peut voir toutes les demandes
create policy "requests_select_all"
  on public.course_requests for select
  to authenticated
  using (true);

-- INSERT: Tout utilisateur authentifié peut créer une demande
create policy "requests_insert"
  on public.course_requests for insert
  to authenticated
  with check (true);

-- UPDATE: Les utilisateurs peuvent modifier leurs propres demandes
-- ET les admins peuvent modifier toutes les demandes
create policy "requests_update"
  on public.course_requests for update
  to authenticated
  using (
    student_id = auth.uid() 
    or teacher_id = auth.uid()
    or public.is_admin()
  )
  with check (
    student_id = auth.uid() 
    or teacher_id = auth.uid()
    or public.is_admin()
  );

-- DELETE: Seuls les admins peuvent supprimer des demandes
create policy "requests_delete_admin"
  on public.course_requests for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- TEACHER_REGISTRATIONS
-- =====================================================

-- SELECT: Seuls les admins peuvent voir les inscriptions
create policy "teacher_registrations_select"
  on public.teacher_registrations for select
  to authenticated
  using (public.is_admin());

-- INSERT: Tout utilisateur peut soumettre une inscription
create policy "teacher_registrations_insert"
  on public.teacher_registrations for insert
  to authenticated
  with check (true);

-- UPDATE: Seuls les admins peuvent modifier les inscriptions
create policy "teacher_registrations_update"
  on public.teacher_registrations for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: Seuls les admins peuvent supprimer des inscriptions
create policy "teacher_registrations_delete"
  on public.teacher_registrations for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- TEACHER_WALLETS
-- =====================================================

-- SELECT: Les professeurs voient leur propre wallet, les admins voient tout
create policy "teacher_wallets_select"
  on public.teacher_wallets for select
  to authenticated
  using (teacher_id = auth.uid() or public.is_admin());

-- INSERT: Seuls les admins peuvent créer des wallets
create policy "teacher_wallets_insert"
  on public.teacher_wallets for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: Seuls les admins peuvent modifier les wallets
create policy "teacher_wallets_update"
  on public.teacher_wallets for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: Seuls les admins peuvent supprimer des wallets
create policy "teacher_wallets_delete"
  on public.teacher_wallets for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- WALLET_TRANSACTIONS
-- =====================================================

-- SELECT: Les professeurs voient leurs propres transactions, les admins voient tout
create policy "wallet_transactions_select"
  on public.wallet_transactions for select
  to authenticated
  using (
    wallet_id in (select id from public.teacher_wallets where teacher_id = auth.uid())
    or public.is_admin()
  );

-- INSERT: Seuls les admins peuvent créer des transactions
create policy "wallet_transactions_insert"
  on public.wallet_transactions for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: Seuls les admins peuvent modifier des transactions
create policy "wallet_transactions_update"
  on public.wallet_transactions for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: Seuls les admins peuvent supprimer des transactions
create policy "wallet_transactions_delete"
  on public.wallet_transactions for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- PAYMENTS
-- =====================================================

-- SELECT: Les élèves voient leurs propres paiements, les admins voient tout
create policy "payments_select"
  on public.payments for select
  to authenticated
  using (student_id = auth.uid() or public.is_admin());

-- INSERT: Seuls les admins peuvent créer des paiements
create policy "payments_insert"
  on public.payments for insert
  to authenticated
  with check (public.is_admin());

-- UPDATE: Seuls les admins peuvent modifier des paiements
create policy "payments_update"
  on public.payments for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- DELETE: Seuls les admins peuvent supprimer des paiements
create policy "payments_delete"
  on public.payments for delete
  to authenticated
  using (public.is_admin());

-- =====================================================
-- 7. FONCTIONS TRIGGERS
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

-- Trigger pour créer le wallet automatiquement
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

-- Trigger pour teacher_wallets
drop trigger if exists update_teacher_wallets_updated_at on public.teacher_wallets;
create trigger update_teacher_wallets_updated_at
  before update on public.teacher_wallets
  for each row
  execute function public.update_updated_at_column();

-- =====================================================
-- 8. ACTIVER REALTIME
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

-- =====================================================
-- 9. INDEX POUR LES PERFORMANCES
-- =====================================================

create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_approved_idx on public.profiles (approved);
create index if not exists course_requests_teacher_id_idx on public.course_requests (teacher_id);
create index if not exists course_requests_payment_status_idx on public.course_requests (payment_status);
create index if not exists teacher_registrations_status_idx on public.teacher_registrations (status, created_at desc);
create index if not exists teacher_wallets_teacher_id_idx on public.teacher_wallets (teacher_id);
create index if not exists wallet_transactions_wallet_id_idx on public.wallet_transactions (wallet_id);
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_student_id_idx on public.payments (student_id);
create index if not exists payments_created_at_idx on public.payments (created_at desc);
