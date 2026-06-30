alter table annotations
  add column if not exists dataset_id uuid references datasets(id) on delete cascade,
  add column if not exists metadata jsonb;

update annotations
  set dataset_id = (
    select i.dataset_id from images i where i.id = annotations.image_id
  )
  where dataset_id is null;

alter table annotations
  alter column dataset_id set not null;

alter table annotations
  drop constraint if exists annotations_type_check;

alter table annotations
  add constraint annotations_type_chk
  check (type in (
    'bbox',
    'classification',
    'segmentation',
    'component',
    'ocr',
    'qr_code',
    'keypoint',
    'rule_region'
  ));

create index if not exists idx_annotations_dataset on annotations (dataset_id);