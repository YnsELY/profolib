-- Correctif : permettre aux utilisateurs non-connectes (anon) de soumettre
-- une demande d'inscription en tant que professeur
-- A executer dans le SQL Editor de Supabase

-- Supprimer l'ancienne policy INSERT
drop policy if exists "teacher_registrations_insert_all" on public.teacher_registrations;

-- Nouvelle policy : tout le monde (anon ET authenticated) peut soumettre une demande
create policy "teacher_registrations_insert_public"
  on public.teacher_registrations for insert
  to anon, authenticated
  with check (true);
