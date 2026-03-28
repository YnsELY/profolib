-- CORRECTION COMPLÈTE DES POLICIES RESTANTES
-- COURSE_REQUESTS et TEACHER_REGISTRATIONS

-- =====================================================
-- 1. SUPPRIMER LES ANCIENNES POLICIES SUR COURSE_REQUESTS
-- =====================================================

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

-- =====================================================
-- 2. SUPPRIMER LES ANCIENNES POLICIES SUR TEACHER_REGISTRATIONS
-- =====================================================

drop policy if exists "teacher_registrations_select_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_public" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update_admin" on public.teacher_registrations;
drop policy if exists "teacher_registrations_select" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert" on public.teacher_registrations;
drop policy if exists "teacher_registrations_insert_all" on public.teacher_registrations;
drop policy if exists "teacher_registrations_update" on public.teacher_registrations;
drop policy if exists "teacher_registrations_delete" on public.teacher_registrations;
drop policy if exists "teacher_registrations_delete_admin" on public.teacher_registrations;

-- =====================================================
-- 3. FONCTION is_admin (si pas déjà créée)
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
-- 4. NOUVELLES POLICIES POUR COURSE_REQUESTS
-- =====================================================

-- SELECT: Tout le monde voit toutes les demandes (pour matching)
create policy "requests_select_all"
  on public.course_requests for select
  to authenticated
  using (true);

-- INSERT: Tout utilisateur authentifié peut créer une demande
create policy "requests_insert_all"
  on public.course_requests for insert
  to authenticated
  with check (true);

-- UPDATE: Propriétaires (élève ou prof) peuvent modifier
create policy "requests_update_own"
  on public.course_requests for update
  to authenticated
  using (student_id = auth.uid() or teacher_id = auth.uid())
  with check (student_id = auth.uid() or teacher_id = auth.uid());

-- UPDATE: Admins peuvent modifier toutes les demandes
create policy "requests_update_admin"
  on public.course_requests for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer
create policy "requests_delete_admin"
  on public.course_requests for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 5. NOUVELLES POLICIES POUR TEACHER_REGISTRATIONS
-- =====================================================

-- SELECT: Seuls les admins voient les inscriptions en attente
create policy "teacher_registrations_select_admin"
  on public.teacher_registrations for select
  to authenticated
  using (public.is_admin(auth.uid()));

-- INSERT: Tout le monde peut soumettre une inscription
create policy "teacher_registrations_insert_all"
  on public.teacher_registrations for insert
  to authenticated
  with check (true);

-- UPDATE: Seuls les admins peuvent modifier (valider/refuser)
create policy "teacher_registrations_update_admin"
  on public.teacher_registrations for update
  to authenticated
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- DELETE: Seuls les admins peuvent supprimer
create policy "teacher_registrations_delete_admin"
  on public.teacher_registrations for delete
  to authenticated
  using (public.is_admin(auth.uid()));

-- =====================================================
-- 6. VÉRIFICATIONS
-- =====================================================

-- Testez ces requêtes après exécution :

-- Voir toutes les demandes de cours :
-- select * from course_requests;

-- Voir toutes les inscriptions en attente :
-- select * from teacher_registrations;

-- Voir le nombre total de demandes :
-- select count(*) from course_requests;

-- Voir le nombre d'inscriptions en attente :
-- select count(*) from teacher_registrations where status = 'pending';
