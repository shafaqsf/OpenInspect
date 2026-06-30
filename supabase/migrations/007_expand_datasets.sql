alter table datasets
  add column if not exists inspection_goal text,
  add column if not exists default_task_type text;

alter table datasets
  add constraint datasets_default_task_type_chk
  check (default_task_type is null or default_task_type in (
    'classification',
    'detection',
    'segmentation',
    'component_verification',
    'ocr',
    'qr_code',
    'keypoint_detection',
    'rule_based'
  ));