create table if not exists export_jobs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references datasets(id) on delete cascade,
  format text not null check (format in ('coco', 'yolo', 'openinspect', 'csv')),
  status text not null check (status in ('pending', 'completed', 'failed')),
  storage_path text,
  error_message text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_export_jobs_dataset on export_jobs (dataset_id);