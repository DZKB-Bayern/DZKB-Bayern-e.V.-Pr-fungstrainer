-- Self-Service "Code vergessen?" - Rate limit / Audit Log
-- In Supabase SQL Editor ausführen

create table if not exists public.access_code_request_log (
  id bigserial primary key,
  email text not null,
  ip text,
  created_at timestamptz not null default now()
);

create index if not exists access_code_request_log_email_created_at_idx
  on public.access_code_request_log (email, created_at desc);

create index if not exists access_code_request_log_ip_created_at_idx
  on public.access_code_request_log (ip, created_at desc);
