-- CORRECTION DES POLICIES POUR LES SOLDES/CAGNOTTES ET PAIEMENTS
-- À exécuter dans Supabase SQL Editor

-- =====================================================
-- 1. SUPPRIMER LES ANCIENNES POLICIES SUR LES WALLETS
-- =====================================================

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

-- =====================================================
-- 2. SUPPRIMER LES ANCIENNES POLICIES SUR LES TRANSACTIONS
-- =====================================================

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

-- =====================================================
-- 3. SUPPRIMER LES ANCIENNES POLICIES SUR LES PAYMENTS
-- =====================================================

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
-- 4. VÉRIFIER QUE LA FONCTION is_admin EXISTE
-- =====================================================

-- Si la fonction n'existe pas encore, la créer
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
-- 5. NOUVELLES POLICIES POUR TEACHER_WALLETS
-- =====================================================

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

-- INSERT: Seuls les admins peuvent créer des wallets
create policy "teacher_wallets_insert_admin"
  on public.teacher_wallets for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins peuvent modifier les wallets
create policy "teacher_wallets_update_admin"
  on public.teacher_wallets for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer des wallets
create policy "teacher_wallets_delete_admin"
  on public.teacher_wallets for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 6. NOUVELLES POLICIES POUR WALLET_TRANSACTIONS
-- =====================================================

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

-- INSERT: Seuls les admins peuvent créer des transactions
create policy "wallet_transactions_insert_admin"
  on public.wallet_transactions for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins peuvent modifier les transactions
create policy "wallet_transactions_update_admin"
  on public.wallet_transactions for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer des transactions
create policy "wallet_transactions_delete_admin"
  on public.wallet_transactions for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 7. NOUVELLES POLICIES POUR PAYMENTS
-- =====================================================

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

-- INSERT: Seuls les admins peuvent créer des paiements
create policy "payments_insert_admin"
  on public.payments for insert
  to authenticated
  with check (public.is_admin(auth.uid()));

-- UPDATE: Seuls les admins peuvent modifier des paiements
create policy "payments_update_admin"
  on public.payments for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer des paiements
create policy "payments_delete_admin"
  on public.payments for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 8. VÉRIFICATION - TESTEZ CES REQUÊTES APRÈS
-- =====================================================

-- Pour vérifier que vous voyez bien tous les wallets :
-- select * from teacher_wallets;

-- Pour vérifier que vous voyez bien tous les paiements :
-- select * from payments;

-- Pour vérifier que vous voyez bien toutes les transactions :
-- select * from wallet_transactions;
