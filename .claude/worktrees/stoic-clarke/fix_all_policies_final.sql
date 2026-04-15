-- SQL COMPLET ADAPTÉ À VOTRE SCHÉMA
-- Tables existantes : profiles, course_requests, teacher_wallets, wallet_transactions, pricing
-- Tables à créer : teacher_registrations, payments

-- =====================================================
-- 1. CRÉER LES TYPES MANQUANTS
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
-- 2. METTRE À JOUR LA TABLE PROFILES (ajouter approved et modifier role)
-- =====================================================

-- Ajouter la colonne approved si elle n'existe pas
alter table public.profiles add column if not exists approved boolean not null default true;

-- Mettre à jour la contrainte role pour accepter 'admin'
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('student', 'teacher', 'admin'));

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

-- Index pour les inscriptions
create index if not exists teacher_registrations_status_idx on public.teacher_registrations (status, created_at desc);

-- Table des paiements
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  course_request_id uuid not null unique references public.course_requests (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  amount decimal(10,2) not null,
  platform_commission decimal(10,2) not null,
  teacher_revenue decimal(10,2) not null,
  payment_method text null,
  payment_intent_id text null,
  status text not null default 'pending',
  paid_at timestamp with time zone null,
  refunded_at timestamp with time zone null,
  created_at timestamp with time zone not null default timezone('utc', now())
);

-- Index pour les paiements
create index if not exists payments_status_idx on public.payments (status);
create index if not exists payments_student_id_idx on public.payments (student_id);
create index if not exists payments_created_at_idx on public.payments (created_at desc);

-- =====================================================
-- 4. ACTIVER RLS SUR TOUTES LES TABLES
-- =====================================================

alter table public.profiles enable row level security;
alter table public.course_requests enable row level security;
alter table public.teacher_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.teacher_registrations enable row level security;
alter table public.payments enable row level security;
-- Note : pricing est probablement une table de référence, pas besoin de RLS

-- =====================================================
-- 5. FONCTION POUR VÉRIFIER SI ADMIN
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

-- =====================================================
-- 6. SUPPRIMER TOUTES LES ANCIENNES POLICIES
-- =====================================================

-- Profiles
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;
drop policy if exists "profiles_insert_admin" on public.profiles;

-- Course requests
drop policy if exists "requests_select_authenticated" on public.course_requests;
drop policy if exists "requests_insert_authenticated" on public.course_requests;
drop policy if exists "requests_update_authenticated" on public.course_requests;
drop policy if exists "requests_select_all" on public.course_requests;
drop policy if exists "requests_insert_all" on public.course_requests;
drop policy if exists "requests_insert" on public.course_requests;
drop policy if exists "requests_update" on public.course_requests;
drop policy if exists "requests_update_own" on public.course_requests;
drop policy if exists "requests_update_admin" on public.course_requests;
drop policy if exists "requests_delete_admin" on public.course_requests;

-- Teacher wallets
drop policy if exists "teacher_wallets_select_own" on public.teacher_wallets;
drop policy if exists "teacher_wallets_all_admin" on public.teacher_wallets;
drop policy if exists "teacher_wallets_select" on public.teacher_wallets;
drop policy if exists "teacher_wallets_insert" on public.teacher_wallets;
drop policy if exists "teacher_wallets_update" on public.teacher_wallets;
drop policy if exists "teacher_wallets_delete" on public.teacher_wallets;
drop policy if exists "teacher_wallets_select_admin" on public.teacher_wallets;
drop policy if exists "teacher_wallets_insert_admin" on public.teacher_wallets;
drop policy if exists "teacher_wallets_update_admin" on public.teacher_wallets;
drop policy if exists "teacher_wallets_delete_admin" on public.teacher_wallets;

-- Wallet transactions
drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
drop policy if exists "wallet_transactions_all_admin" on public.wallet_transactions;
drop policy if exists "wallet_transactions_select" on public.wallet_transactions;
drop policy if exists "wallet_transactions_insert" on public.wallet_transactions;
drop policy if exists "wallet_transactions_update" on public.wallet_transactions;
drop policy if exists "wallet_transactions_delete" on public.wallet_transactions;
drop policy if exists "wallet_transactions_select_admin" on public.wallet_transactions;
drop policy if exists "wallet_transactions_insert_admin" on public.wallet_transactions;
drop policy if exists "wallet_transactions_update_admin" on public.wallet_transactions;
drop policy if exists "wallet_transactions_delete_admin" on public.wallet_transactions;

-- Teacher registrations
drop policy if exists "teacher_registrations_select_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_public" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_select" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_all" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update" on public.teacher_registrations;
drop policy if exists "teacher_registrations_delete" on public.teacher_registrations;
drop policy if exists "teacher_registrations_delete_admin" on public.teacher_registrations;

-- Payments
drop policy if exists "payments_select_own_or_admin" on public.payments;
drop policy if exists "payments_all_admin" on public.payments;
drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_insert" on public.payments;
drop policy if exists "payments_update" on public.payments;
drop policy if exists "payments_delete" on public.payments;
drop policy if exists "payments_select_own" on public.payments;
drop policy if exists "payments_select_admin" on public.payments;
drop policy if exists "payments_insert_admin" on public.payments;
drop policy if exists "payments_update_admin" on public.payments;
drop policy if exists "payments_delete_admin" on public.payments;

-- =====================================================
-- 7. CRÉER LES NOUVELLES POLICIES
-- =====================================================

-- ========== PROFILES ==========

-- SELECT: Tout le monde voit tous les profils
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

-- ========== COURSE_REQUESTS ==========

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

-- ========== TEACHER_WALLETS ==========

-- SELECT: Propriétaire voit son propre wallet
create policy "teacher_wallets_select_own"
  on public.teacher_wallets for select
  to authenticated
  using (teacher_id = auth.uid());

-- SELECT: Admins voient tous les wallets
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

-- ========== WALLET_TRANSACTIONS ==========

-- SELECT: Propriétaire voit ses propres transactions
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  to authenticated
  using (
    wallet_id in (select id from public.teacher_wallets where teacher_id = auth.uid())
  );

-- SELECT: Admins voient toutes les transactions
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

-- ========== TEACHER_REGISTRATIONS ==========

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

-- ========== PAYMENTS ==========

-- SELECT: Élèves voient leurs propres paiements
create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (student_id = auth.uid());

-- SELECT: Admins voient tous les paiements
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
-- 8. TRIGGERS UTILES
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

-- =====================================================
-- 9. ACTIVER REALTIME SUR LES NOUVELLES TABLES
-- =====================================================

do $$
begin
  alter publication supabase_realtime add table public.teacher_registrations;
  alter publication supabase_realtime add table public.payments;
exception
  when duplicate_object then null;
end $$;

-- =====================================================
-- 10. TESTS - VÉRIFIEZ CES REQUÊTES APRÈS EXÉCUTION
-- =====================================================

-- Test 1 : Vérifier que vous êtes admin
-- select public.is_admin('VOTRE-USER-ID');

-- Test 2 : Voir tous les utilisateurs
-- select * from profiles;

-- Test 3 : Voir toutes les cagnottes
-- select * from teacher_wallets;

-- Test 4 : Voir toutes les transactions
-- select * from wallet_transactions;

-- Test 5 : Voir tous les paiements
-- select * from payments;

-- Test 6 : Voir toutes les inscriptions en attente
-- select * from teacher_registrations;
