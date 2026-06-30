create table if not exists labels (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null references datasets(id) on delete cascade,
  name text not null,
  color text not null default '#e94560',
  created_at timestamptz not null default now(),
  unique (dataset_id, name)
);

create index if not exists idx_labels_dataset on labels (dataset_id);
