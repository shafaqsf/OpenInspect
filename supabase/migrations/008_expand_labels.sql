alter table labels
  add column if not exists normalized_name text,
  add column if not exists description text,
  add column if not exists defect_type text,
  add column if not exists updated_at timestamptz not null default now();

alter table labels
  add constraint labels_defect_type_chk
  check (defect_type is null or defect_type in (
    'defect',
    'ok',
    'component',
    'text',
    'qr',
    'keypoint',
    'rule',
    'other'
  ));

update labels set normalized_name = lower(trim(name)) where normalized_name is null;

drop index if exists idx_labels_dataset;

alter table labels
  drop constraint if exists labels_dataset_id_name_key;

alter table labels
  add constraint labels_dataset_id_normalized_name_key
  unique (dataset_id, normalized_name);

create index if not exists idx_labels_dataset on labels (dataset_id);