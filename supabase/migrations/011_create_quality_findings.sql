create table if not exists quality_findings (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references datasets(id) on delete cascade,
  severity text not null check (severity in ('info', 'warning', 'error')),
  code text not null,
  message text not null,
  entity_type text,
  entity_id uuid,
  resolved boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_quality_findings_dataset on quality_findings (dataset_id);
create index if not exists idx_quality_findings_severity on quality_findings (severity);