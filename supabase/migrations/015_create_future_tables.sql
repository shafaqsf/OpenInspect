create table if not exists training_jobs (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references datasets(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'failed')),
  config jsonb,
  created_at timestamptz not null default now()
);

create table if not exists training_logs (
  id uuid primary key default gen_random_uuid(),
  training_job_id uuid references training_jobs(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists models (
  id uuid primary key default gen_random_uuid(),
  training_job_id uuid references training_jobs(id) on delete set null,
  dataset_id uuid references datasets(id) on delete set null,
  version text,
  metrics jsonb,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists inspection_runs (
  id uuid primary key default gen_random_uuid(),
  model_id uuid references models(id) on delete set null,
  dataset_id uuid references datasets(id) on delete cascade,
  status text not null default 'planned' check (status in ('planned', 'running', 'completed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists inspection_inputs (
  id uuid primary key default gen_random_uuid(),
  inspection_run_id uuid references inspection_runs(id) on delete cascade,
  image_id uuid references images(id) on delete cascade,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists inspection_predictions (
  id uuid primary key default gen_random_uuid(),
  inspection_input_id uuid references inspection_inputs(id) on delete cascade,
  label_id uuid references labels(id) on delete set null,
  type text,
  data jsonb,
  confidence float,
  status text default 'pending' check (status in ('pending', 'accepted', 'rejected', 'corrected')),
  created_at timestamptz not null default now()
);

create table if not exists reports (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references datasets(id) on delete cascade,
  format text,
  storage_path text,
  created_at timestamptz not null default now()
);

create table if not exists notification_rules (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid references datasets(id) on delete cascade,
  rule jsonb,
  created_at timestamptz not null default now()
);

create table if not exists notification_events (
  id uuid primary key default gen_random_uuid(),
  notification_rule_id uuid references notification_rules(id) on delete cascade,
  payload jsonb,
  created_at timestamptz not null default now()
);