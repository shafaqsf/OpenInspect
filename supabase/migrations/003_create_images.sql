create table if not exists images (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  filename text not null,
  storage_path text not null,
  width int not null default 0,
  height int not null default 0,
  file_size int not null default 0,
  split text check (split in ('training', 'evaluation')) default null,
  created_at timestamptz not null default now()
);

create index if not exists idx_images_dataset on images (dataset_id);
create index if not exists idx_images_created_at on images (created_at desc);
