create table if not exists annotations (
  id uuid primary key default gen_random_uuid(),
  image_id uuid not null references images(id) on delete cascade,
  label_id uuid not null references labels(id) on delete cascade,
  type text not null check (type in ('bbox', 'classification', 'segmentation')),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_annotations_image on annotations (image_id);
create index if not exists idx_annotations_label on annotations (label_id);
