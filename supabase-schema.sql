-- =============================================================
-- Noor Safar — table des demandes de Omra
-- À exécuter dans Supabase : Project > SQL Editor > New query
-- Colle tout ce fichier, puis clique "Run".
-- =============================================================

create table if not exists bookings (
  id text primary key,
  ref text not null,
  submitted_at timestamptz not null default now(),
  status text not null default 'Nouvelle demande',

  country_code text,
  country_label text,
  country_flag text,

  omra_date date,
  offer text,
  room_type text,
  price_per_person numeric,
  estimate_total numeric,
  travelers integer,
  group_notes text,

  full_name text,
  phone text,
  email text
);

-- Sécurité au niveau des lignes (obligatoire sur Supabase)
alter table bookings enable row level security;

-- Le formulaire du site (visiteur anonyme) doit pouvoir créer une demande
create policy "Le site peut créer une demande"
on bookings for insert
to anon
with check (true);

-- ⚠️ IMPORTANT — Ces deux règles ci-dessous permettent à N'IMPORTE QUI
-- connaissant l'URL de lire et modifier TOUTES les demandes (nom, téléphone,
-- email des pèlerins compris). C'est le même niveau de protection que sur
-- l'aperçu Claude — pratique pour démarrer, mais PAS sécurisé pour une vraie
-- mise en production. Avant de faire ta pub, remplace ces deux règles par une
-- vraie authentification (Supabase Auth) pour que seul toi puisses accéder à
-- l'espace conciergerie. Demande à Claude de le faire quand tu es prêt.

create policy "Lecture des demandes (à sécuriser avant lancement public)"
on bookings for select
to anon
using (true);

create policy "Modification du statut (à sécuriser avant lancement public)"
on bookings for update
to anon
using (true);
