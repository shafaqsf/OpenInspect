alter table images
  add column if not exists safe_filename text,
  add column if not exists public_url text,
  add column if not exists mime_type text,
  add column if not exists metadata jsonb default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

alter table images
  add constraint images_split_chk
  check (split is null or split in ('training', 'evaluation'));