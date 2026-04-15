-- CORRECTION DES POLICIES RLS POUR LES ADMINS
-- Le problème : la fonction is_admin() vérifie dans profiles, mais profiles est protégée par RLS
-- Solution : utiliser une approche différente avec des policies séparées

-- =====================================================
-- 1. SUPPRIMER TOUTES LES POLICIES EXISTANTES
-- =====================================================

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_select_all" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete_admin" on public.profiles;

drop policy if exists "requests_select_authenticated" on public.course_requests;
drop policy if exists "requests_insert_authenticated" on public.course_requests;
drop policy if exists "requests_update_authenticated" on public.course_requests;
drop policy if exists "requests_select_all" on public.course_requests;
drop policy if exists "requests_insert" on public.course_requests;
drop policy if exists "requests_update" on public.course_requests;
drop policy if exists "requests_delete_admin" on public.course_requests;

drop policy if exists "teacher_registrations_select_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_public" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_select" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update" on public.teacher_registrations;
drop policy if exists "teacher_registrations_delete" on public.teacher_registrations;

drop policy if exists "teacher_wallets_select_own" on public.teacher_wallets;
drop policy if exists "teacher_wallets_all_admin" on public.teacher_wallets;
drop policy if exists "teacher_wallets_select" on public.teacher_wallets;
drop policy if exists "teacher_wallets_insert" on public.teacher_wallets;
drop policy if exists "teacher_wallets_update" on public.teacher_wallets;
drop policy if exists "teacher_wallets_delete" on public.teacher_wallets;

drop policy if exists "wallet_transactions_select_own" on public.wallet_transactions;
drop policy if exists "wallet_transactions_all_admin" on public.wallet_transactions;
drop policy if exists "wallet_transactions_select" on public.wallet_transactions;
drop policy if exists "wallet_transactions_insert" on public.wallet_transactions;
drop policy if exists "wallet_transactions_update" on public.wallet_transactions;
drop policy if exists "wallet_transactions_delete" on public.wallet_transactions;

drop policy if exists "payments_select_own_or_admin" on public.payments;
drop policy if exists "payments_all_admin" on public.payments;
drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_insert" on public.payments;
drop policy if exists "payments_update" on public.payments;
drop policy if exists "payments_delete" on public.payments;

-- =====================================================
-- 2. SUPPRIMER L'ANCIENNE FONCTION is_admin (causant le problème)
-- =====================================================

drop function if exists public.is_admin();

-- =====================================================
-- 3. CRÉER UNE FONCTION is_admin SÉCURISÉE (avec SECURITY DEFINER pour bypass RLS)
-- =====================================================

-- Cette fonction utilise security definer pour avoir les droits du créateur (postgres)
-- et ainsi pouvoir lire dans profiles sans être bloqué par RLS
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
-- 4. NOUVELLES POLICIES - ADMINS ONT ACCÈS TOTAL
-- =====================================================

-- PROFILES
-- SELECT: Admins voient tout, utilisateurs normaux voient tout aussi (pour affichage noms)
create policy "profiles_select_all"
  on public.profiles for select
  to authenticated
  using (true);

-- INSERT: Utilisateurs créent leur propre profil, admins peuvent tout créer
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "profiles_insert_admin"
  on public.profiles for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Utilisateurs modifient leur propre profil, admins modifient tout
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_update_admin"
  on public.profiles for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer
create policy "profiles_delete_admin"
  on public.profiles for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- COURSE_REQUESTS
-- SELECT: Tout le monde voit tout (pour matching élève/prof)
create policy "requests_select_all"
  on public.course_requests for select
  to authenticated
  using (true);

-- INSERT: Tout utilisateur authentifié peut créer
create policy "requests_insert_all"
  on public.course_requests for insert
  to authenticated
  with check (true);

-- UPDATE: Propriétaires (élève ou prof) ou admin
create policy "requests_update_own"
  on public.course_requests for update
  to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid())
  with check (student_id = auth.uid() or teacher_id = auth.uid());

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
-- SELECT: Propriétaire ou admin
create policy "teacher_wallets_select_own"
  on public.teacher_wallets for select
  to authenticated
  using (teacher_id = auth.uid());

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
-- SELECT: Propriétaire (via wallet) ou admin
create policy "wallet_transactions_select_own"
  on public.wallet_transactions for select
  to authenticated
  using (
    wallet_id in (select id from public.teacher_wallets where teacher_id = auth.uid())
  );

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
-- SELECT: Propriétaire (student) ou admin
create policy "payments_select_own"
  on public.payments for select
  to authenticated
  using (student_id = auth.uid());

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
-- 5. VÉRIFICATION - TESTEZ CETTE REQUÊTE APRÈS
-- =====================================================

-- Pour vérifier que votre compte est bien admin :
-- select public.is_admin('VOTRE-USER-ID-ICI');
-- Cela doit retourner "true"
