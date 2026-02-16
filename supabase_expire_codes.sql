-- DZKB Prüfungstrainer: Zugangscodes nach 12 Monaten automatisch deaktivieren
-- Diese SQL im Supabase SQL Editor ausführen.

-- 1) Funktion, die alle aktiven, aber abgelaufenen Codes deaktiviert
create or replace function public.deactivate_expired_access_codes()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.access_codes
  set is_active = false
  where is_active = true
    and created_at < (now() - interval '12 months');
end;
$$;

-- 2) Optional: einmal sofort ausführen (damit Altlasten gleich bereinigt sind)
select public.deactivate_expired_access_codes();

-- 3) Täglicher Job (03:10 Uhr) über pg_cron
-- Hinweis: In Supabase ist pg_cron in der Regel verfügbar. Falls nicht, meldet Supabase beim Ausführen einen Fehler.
create extension if not exists pg_cron;

-- Falls du den Job schon mal angelegt hast, erst löschen:
-- select cron.unschedule('deactivate_expired_access_codes_daily');

select cron.schedule(
  'deactivate_expired_access_codes_daily',
  '10 3 * * *',
  $$select public.deactivate_expired_access_codes();$$
);
