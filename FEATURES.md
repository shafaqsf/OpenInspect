# OpenInspect FEATURE.md

## 1. Product Definition

OpenInspect is a visual inspection dataset preparation and quality-control workspace for industrial computer-vision use cases.

The product helps users create image datasets, upload inspection images, define defect/component labels, annotate images, validate dataset quality, and export training-ready datasets in standard machine-learning formats.

This MVP intentionally focuses on the data foundation of an AI inspection platform. It does **not** implement real model training, model deployment, production inference, or live production monitoring yet.

## 2. Product Pivot

OpenInspect is pivoting from a full end-to-end AI inspection platform into a focused dataset preparation platform.

### Previous broad direction

A full industrial AI inspection platform would include:

- Dataset management
- Annotation
- Data quality
- Training jobs
- Model registry
- Inference runs
- Production monitoring
- Root-cause analytics
- Reports
- Alerts
- Deployment workflows

That scope is too large for the first implementation pass.

### New MVP direction

The first version of OpenInspect must focus on:

- Creating datasets
- Uploading inspection images
- Managing labels
- Annotating defects/components
- Checking data quality
- Exporting datasets for training
- Keeping the architecture ready for later training and inference modules

This makes the MVP more realistic, testable, and useful.

## 3. Reference Inspiration

OpenInspect may use the following public product pages as market and feature inspiration:

- https://www.maddox.ai/software/
- https://www.maddox.ai/en/software-en/

Rules:

- Do not copy Maddox AI branding.
- Do not copy proprietary wording.
- Do not copy proprietary UI layouts.
- Do not copy product claims.
- Do not use Maddox assets.
- Use the reference only to understand the category: industrial machine vision, quality inspection, annotation, data quality, training readiness, and inspection workflows.

## 4. MVP Scope

The MVP must implement a real data-management and annotation workflow.

### In scope

- App shell
- Sidebar navigation
- Dashboard
- Dataset CRUD
- Image upload
- Image gallery
- Label CRUD
- Annotation editor
- Bounding box annotations
- Classification annotations
- Segmentation polygon annotations
- Component verification annotations
- OCR/text-region annotations
- QR-code-region annotations
- Keypoint annotations
- Rule-region metadata annotations
- Dataset quality checks
- Dataset export
- COCO JSON export
- YOLO detection export
- OpenInspect JSON export
- CSV summary export
- Settings and diagnostics
- Supabase database migrations
- Supabase Storage buckets
- API routes
- Validation helpers
- Tests
- README update
- `.env.example` update

### Out of scope for MVP

- Real model training
- Real neural-network inference
- Model registry
- Production deployment
- Live camera integration
- Real-time production line monitoring
- Root-cause analytics
- Notification delivery
- Multi-user organizations
- Billing
- Authentication, unless already present
- Role-based access control
- External ML backend implementation

### Important architectural note

Even though training and inference are out of scope, the MVP should structure data so those modules can be added later without rewriting the core dataset model.

## 5. Implementation Rule

All implementation must happen on the **current Git branch**.

Do not create a new branch.

Do not switch branches unless explicitly instructed.

## 6. No Mock Data Policy

The application must not show fake operational data.

Allowed:

- Empty states
- Real database records
- Real uploaded images
- Real labels
- Real annotations
- Real computed counts
- Real diagnostics
- Honest disabled states
- Honest "not configured" messages

Not allowed:

- Fake datasets
- Fake images
- Fake annotation counts
- Fake charts
- Fake model metrics
- Fake training jobs
- Fake inspection results
- Fake users
- Fake notifications
- Fake reports

If there is no data, show an empty state.

## 7. Technical Stack

Use the existing project stack:

- Next.js App Router
- React
- Supabase PostgreSQL
- Supabase Storage
- CSS Modules
- Global CSS variables
- Vitest
- Testing Library
- Existing OpenRouter integration only if already present

Do not add a large UI framework unless absolutely necessary.

## 8. Route Map

The MVP must include these routes:

| Route | Purpose |
|---|---|
| `/` | Dashboard |
| `/datasets` | Dataset list |
| `/datasets/new` | Create dataset |
| `/datasets/[id]` | Dataset detail |
| `/datasets/[id]/edit` | Edit dataset |
| `/datasets/[id]/images` | Dataset image gallery |
| `/datasets/[id]/upload` | Upload images |
| `/datasets/[id]/labels` | Manage labels |
| `/datasets/[id]/annotate/[imageId]` | Annotation editor |
| `/datasets/[id]/quality` | Dataset quality checks |
| `/datasets/[id]/export` | Dataset export |
| `/settings` | Settings and diagnostics |

Optional placeholder routes for future modules may exist, but must clearly say "planned" and must not show fake data:

| Route | Future Purpose |
|---|---|
| `/training` | Planned model-training workflow |
| `/models` | Planned model registry |
| `/inspection` | Planned inference workflow |
| `/monitoring` | Planned production analytics |
| `/reports` | Planned reporting module |

## 9. App Shell

The app shell must provide a clean industrial layout.

### Requirements

- Fixed left sidebar
- Main content area
- OpenInspect title/logo
- Version label
- Navigation links
- Active route highlighting
- Responsive behavior
- No user profile card
- No fake avatar
- No fake usage counters
- Keyboard-accessible navigation

### Sidebar links

MVP links:

- Dashboard
- Datasets
- Settings

Dataset-specific navigation should appear inside dataset detail pages, not as fake global counters.

Optional future links may appear under a "Planned" group:

- Training
- Models
- Inspection
- Monitoring
- Reports

If shown, planned links must point to honest planned-feature pages.

## 10. Dashboard

Route: `/`

The dashboard gives an overview of the current real workspace state.

### Required summary cards

All values must come from real database queries:

- Total datasets
- Total images
- Annotated images
- Unannotated images
- Total labels
- Total annotations
- Datasets with quality warnings
- Exportable datasets

### Required quick actions

- Create dataset
- Open datasets
- Open settings

If at least one dataset exists:

- Open latest dataset
- Upload images to latest dataset
- Manage labels for latest dataset

### Required system readiness

Show configured/missing status for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- Supabase connection
- Required database tables
- Required storage buckets

Never show secret values.

### API

`GET /api/dashboard/summary`

The endpoint must:

- Return real counts.
- Handle missing Supabase configuration.
- Handle missing tables gracefully.
- Return JSON errors with useful messages.

## 11. Dataset Management

## 11.1 Dataset List

Route: `/datasets`

### Required features

- List datasets from Supabase.
- Search by name.
- Sort by newest, oldest, name, image count, annotation progress.
- Empty state if no datasets exist.
- Create dataset link.
- Dataset cards or table rows.

### Dataset list fields

- Name
- Description
- Inspection goal
- Default task type
- Created date
- Updated date
- Image count
- Label count
- Annotation count
- Annotation progress

### API

`GET /api/datasets`

Supports optional query parameters:

- `search`
- `sort`

## 11.2 Create Dataset

Route: `/datasets/new`

### Fields

- `name` required
- `description` optional
- `inspection_goal` optional
- `default_task_type` optional

### Supported task types

- `classification`
- `detection`
- `segmentation`
- `component_verification`
- `ocr`
- `qr_code`
- `keypoint_detection`
- `rule_based`

### Validation

- Trim name.
- Reject empty name.
- Reject names over reasonable length.
- Validate task type.
- Show field-level errors.
- Disable submit while saving.

### API

`POST /api/datasets`

## 11.3 Dataset Detail

Route: `/datasets/[id]`

### Required sections

- Dataset header
- Dataset metadata
- Dataset statistics
- Dataset readiness
- Image gallery preview
- Label summary
- Recent annotations
- Quality summary
- Export actions

### Required actions

- Edit dataset
- Upload images
- Manage labels
- Annotate images
- Check quality
- Export dataset
- Delete dataset

### Statistics

- Total images
- Annotated images
- Unannotated images
- Total labels
- Total annotations
- Bounding box count
- Classification count
- Segmentation count
- OCR region count
- QR region count
- Keypoint count
- Rule region count

### API

`GET /api/datasets/[id]`

## 11.4 Edit Dataset

Route: `/datasets/[id]/edit`

### Behavior

- Pre-fill existing values.
- Validate fields.
- Save changes.
- Redirect back to detail page.
- Show errors.

### API

`PUT /api/datasets/[id]`

## 11.5 Delete Dataset

### Behavior

- Require confirmation.
- Delete child records.
- Delete storage objects where possible.
- Return honest partial-failure message if storage cleanup fails.
- Redirect to `/datasets`.

### API

`DELETE /api/datasets/[id]`

## 12. Image Management

## 12.1 Image Upload

Route: `/datasets/[id]/upload`

### Supported files

- JPEG
- PNG
- WebP

### Upload methods

- Drag and drop
- File picker
- Multiple files

### Validation

- Reject non-image files.
- Reject unsupported MIME types.
- Reject empty files.
- Show per-file errors.

### Metadata to store

- Dataset ID
- Original filename
- Safe filename
- Storage path
- Public URL or signed URL strategy
- MIME type
- File size
- Width
- Height
- Split
- Created timestamp

### Storage bucket

`dataset-images`

### Storage path convention

```text
datasets/{dataset_id}/{image_id}-{safe_filename}
```

### API

`POST /api/datasets/[id]/images`

## 12.2 Image Gallery

Route: `/datasets/[id]/images`

### Required features

- Thumbnail grid or table
- Filename
- Dimensions
- File size
- Upload date
- Split badge
- Annotation status
- Annotation count
- Open annotation editor
- Delete image
- Change split

### Filters

- All
- Annotated
- Unannotated
- Training
- Evaluation
- Unassigned
- Has classification
- Has bounding boxes
- Has polygons
- Has OCR regions
- Has QR regions
- Has keypoints

### Sorting

- Newest
- Oldest
- Filename
- Annotation count
- File size

### API

`GET /api/datasets/[id]/images`

## 12.3 Update Image

### Supported updates

- Split
- Metadata

### Split values

- `training`
- `evaluation`
- `null`

### API

`PUT /api/datasets/[id]/images/[imageId]`

## 12.4 Delete Image

### Behavior

- Require confirmation.
- Delete annotations.
- Delete database record.
- Delete storage object where possible.
- Show result.

### API

`DELETE /api/datasets/[id]/images/[imageId]`

## 13. Label Management

Route: `/datasets/[id]/labels`

Labels define the semantic classes used in annotation.

### Required features

- List labels
- Create label
- Edit label
- Delete label
- Show usage count
- Show color
- Show defect/component type
- Prevent duplicate names inside one dataset
- Allow same label names across different datasets

### Fields

- `name` required
- `color` required
- `description` optional
- `defect_type` optional

### Defect types

- `defect`
- `ok`
- `component`
- `text`
- `qr`
- `keypoint`
- `rule`
- `other`

### Preset colors

- `#e94560`
- `#0f3460`
- `#16213e`
- `#f39c12`
- `#27ae60`
- `#2980b9`
- `#8e44ad`
- `#d35400`
- `#16a085`
- `#c0392b`
- `#2c3e50`
- `#7f8c8d`

### APIs

- `GET /api/datasets/[id]/labels`
- `POST /api/datasets/[id]/labels`
- `PUT /api/datasets/[id]/labels/[labelId]`
- `DELETE /api/datasets/[id]/labels/[labelId]`

## 14. Annotation Editor

Route: `/datasets/[id]/annotate/[imageId]`

The annotation editor is the core MVP feature.

## 14.1 Editor Layout

Required UI regions:

- Dataset breadcrumb
- Image filename
- Image dimensions
- Save status
- Tool toolbar
- Label selector
- Image viewport
- Annotation overlay
- Zoom controls
- Annotation list
- Classification panel
- Metadata panel
- Shortcut help
- Previous/next image navigation

## 14.2 Coordinate System

All annotation geometry must be stored in original image coordinate space.

Required behavior:

- Convert viewport coordinates to image coordinates.
- Preserve aspect ratio.
- Clamp geometry to image bounds.
- Prevent negative dimensions.
- Validate polygons.
- Validate keypoints.
- Keep overlays aligned during zoom.
- Store integer or consistent floating-point coordinates.

## 14.3 Annotation Types

### Bounding box

Type: `bbox`

Used for:

- Defects
- Objects
- Surface issues
- Missing/damaged regions

Data shape:

```json
{
  "x": 120,
  "y": 80,
  "width": 240,
  "height": 160
}
```

### Classification

Type: `classification`

Used for:

- OK/NOK
- Image-level defect class
- Product variant
- Overall quality status

Data shape:

```json
{
  "scope": "image"
}
```

### Segmentation polygon

Type: `segmentation`

Used for:

- Irregular defect regions
- Crack shapes
- Surface contamination
- Precise defect masks

Data shape:

```json
{
  "points": [
    { "x": 100, "y": 100 },
    { "x": 180, "y": 120 },
    { "x": 150, "y": 200 }
  ]
}
```

### Component verification

Type: `component`

Used for:

- Present/missing parts
- Assembly verification
- Component location checks

Data shape:

```json
{
  "x": 120,
  "y": 80,
  "width": 240,
  "height": 160,
  "expected_present": true
}
```

### OCR/text region

Type: `ocr`

Used for:

- Serial numbers
- Lot codes
- Printed labels
- Expiry dates
- Engravings

Data shape:

```json
{
  "x": 100,
  "y": 120,
  "width": 300,
  "height": 80,
  "text": "optional transcription"
}
```

### QR-code region

Type: `qr_code`

Used for:

- QR codes
- Barcodes
- Data matrix codes

Data shape:

```json
{
  "x": 100,
  "y": 120,
  "width": 160,
  "height": 160,
  "value": "optional decoded value"
}
```

### Keypoint

Type: `keypoint`

Used for:

- Alignment points
- Measurement anchors
- Assembly landmarks

Data shape:

```json
{
  "x": 250,
  "y": 300,
  "name": "alignment_point_1"
}
```

### Rule region

Type: `rule_region`

Used for:

- Presence rules
- Region-specific checks
- Later measurement logic
- Later pass/fail rules

Data shape:

```json
{
  "x": 100,
  "y": 100,
  "width": 200,
  "height": 80,
  "rule": {
    "type": "presence",
    "operator": "expected",
    "target": "component_present"
  }
}
```

## 14.4 Tools

Required toolbar tools:

- Select
- Bounding box
- Classification
- Polygon
- Component verification
- OCR region
- QR-code region
- Keypoint
- Rule region
- Delete selected
- Zoom in
- Zoom out
- Reset zoom

## 14.5 Keyboard Shortcuts

| Key | Action |
|---|---|
| `V` | Select |
| `B` | Bounding box |
| `K` | Classification |
| `P` | Polygon |
| `C` | Component verification |
| `O` | OCR region |
| `Q` | QR-code region |
| `Y` | Keypoint |
| `R` | Rule region |
| `1-9` | Select label |
| `Delete` | Delete selected annotation |
| `Backspace` | Delete selected annotation |
| `Enter` | Finalize polygon |
| `Escape` | Cancel active drawing |
| `+` | Zoom in |
| `-` | Zoom out |
| `0` | Reset zoom |
| `Ctrl+Z` / `Cmd+Z` | Undo |
| `Ctrl+Shift+Z` / `Cmd+Shift+Z` | Redo |

Shortcut rules:

- Do not trigger shortcuts while typing in inputs or textareas.
- Prevent browser defaults where necessary.
- Display shortcut help in the UI.

## 14.6 Autosave

The editor must persist annotation changes through APIs.

Save states:

- Unsaved
- Saving
- Saved
- Error

Required behavior:

- Create annotation through API.
- Update geometry through API.
- Delete annotation through API.
- Debounce move/resize updates.
- Show save errors.
- Allow retry.
- Never silently discard changes.

## 14.7 Annotation List

The annotation list must show:

- Annotation type
- Label name
- Label color
- Geometry summary
- Metadata summary
- Selected state
- Delete action

The list must allow:

- Selecting annotation
- Editing metadata
- Deleting annotation
- Highlighting corresponding overlay

### APIs

- `GET /api/datasets/[id]/images/[imageId]/annotations`
- `POST /api/datasets/[id]/images/[imageId]/annotations`
- `PUT /api/datasets/[id]/images/[imageId]/annotations/[annotationId]`
- `DELETE /api/datasets/[id]/images/[imageId]/annotations/[annotationId]`

## 15. Dataset Quality

Route: `/datasets/[id]/quality`

OpenInspect must include real data-quality checks.

### Quality checks

Implement these checks using real persisted data:

1. Dataset has no images.
2. Dataset has no labels.
3. Images without annotations.
4. Labels without examples.
5. Duplicate filenames.
6. Missing image dimensions.
7. Missing storage paths.
8. Invalid annotation geometry.
9. Bounding box outside image boundaries.
10. Bounding box too small.
11. Polygon with fewer than 3 points.
12. Polygon points outside image boundaries.
13. Keypoints outside image boundaries.
14. OCR region without transcription.
15. QR-code region without value.
16. Severe label imbalance.
17. Training split missing.
18. Evaluation split missing.
19. Too few images for reliable training.
20. Dataset task type mismatches annotation types.

### Quality severity levels

- `info`
- `warning`
- `error`

### Quality score

Compute a score from 0 to 100 based on real findings.

Example logic:

- Start at 100.
- Subtract points for warnings and errors.
- Clamp to 0.
- Empty datasets should have a low readiness score.
- Show explanation.

### Finding shape

```json
{
  "severity": "warning",
  "code": "LABEL_WITHOUT_EXAMPLES",
  "message": "The label scratch has no annotations.",
  "entityType": "label",
  "entityId": "..."
}
```

### UI requirements

- Show quality score.
- Show finding counts.
- Filter findings by severity.
- Link findings to relevant image or label.
- Provide suggested next action.
- No fake findings.

### API

`GET /api/datasets/[id]/quality`

## 16. Dataset Export

Route: `/datasets/[id]/export`

OpenInspect must export real datasets.

## 16.1 COCO JSON Export

Purpose:

- Object detection
- Segmentation

Must include:

- `info`
- `images`
- `categories`
- `annotations`

For bounding boxes:

```json
"bbox": [x, y, width, height]
```

For segmentation polygons:

```json
"segmentation": [[x1, y1, x2, y2, x3, y3]]
```

Do not force OCR, QR, keypoint, or rule-region annotations into invalid COCO structures. Include them only in an extension block if needed.

API:

`GET /api/datasets/[id]/export?format=coco`

## 16.2 YOLO Detection Export

Purpose:

- Object detection training

Format:

```text
<class_id> <x_center_norm> <y_center_norm> <width_norm> <height_norm>
```

Rules:

- Use only bounding-box-like annotations.
- Normalize by original image width and height.
- Clamp values between 0 and 1.
- Generate class list.
- Respect training/evaluation split if present.

API:

`GET /api/datasets/[id]/export?format=yolo`

## 16.3 OpenInspect JSON Export

Purpose:

- Full-fidelity export of every OpenInspect annotation type.

Must include:

- Dataset metadata
- Images
- Labels
- Annotations
- Annotation types
- Splits
- Quality summary
- Export timestamp

API:

`GET /api/datasets/[id]/export?format=openinspect`

## 16.4 CSV Summary Export

Purpose:

- Spreadsheet-friendly dataset overview

Columns:

- Image ID
- Filename
- Width
- Height
- Split
- Annotation count
- Labels present
- Annotation types present
- Classification label
- Created date

API:

`GET /api/datasets/[id]/export?format=csv`

## 17. Settings and Diagnostics

Route: `/settings`

Settings must help the user understand whether the app is correctly configured.

### Environment diagnostics

Show configured/missing status for:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENROUTER_API_KEY`

Do not display secret values.

### Supabase diagnostics

Show:

- Database reachable
- Required tables exist
- Required storage buckets exist
- Last diagnostic check time
- Error message if unavailable

### Required storage buckets

- `dataset-images`
- `dataset-exports`

Optional future buckets:

- `model-artifacts`
- `inspection-inputs`
- `inspection-results`
- `reports`

### App defaults

Persist settings:

- Default task type
- Default export format
- Default annotation tool
- Default image split behavior

### APIs

- `GET /api/settings/diagnostics`
- `GET /api/settings`
- `PUT /api/settings`

## 18. Database Schema

Create Supabase migrations under:

```text
supabase/migrations/
```

Use deterministic migration files.

### Required tables

- `datasets`
- `labels`
- `images`
- `annotations`
- `quality_findings`
- `export_jobs`
- `app_settings`

### Future-ready tables, optional but recommended

These may be created now but not surfaced as MVP features:

- `training_jobs`
- `training_logs`
- `models`
- `inspection_runs`
- `inspection_inputs`
- `inspection_predictions`
- `reports`
- `notification_rules`
- `notification_events`

If future-ready tables are created, the UI must still not pretend those modules are implemented.

## 18.1 datasets

Fields:

- `id uuid primary key default gen_random_uuid()`
- `name text not null`
- `description text`
- `inspection_goal text`
- `default_task_type text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

## 18.2 labels

Fields:

- `id uuid primary key default gen_random_uuid()`
- `dataset_id uuid not null references datasets(id) on delete cascade`
- `name text not null`
- `normalized_name text not null`
- `color text not null`
- `description text`
- `defect_type text`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints:

- Unique `dataset_id`, `normalized_name`

## 18.3 images

Fields:

- `id uuid primary key default gen_random_uuid()`
- `dataset_id uuid not null references datasets(id) on delete cascade`
- `filename text not null`
- `safe_filename text`
- `storage_path text not null`
- `public_url text`
- `mime_type text`
- `width integer`
- `height integer`
- `file_size integer`
- `split text`
- `metadata jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Split constraint:

- `training`
- `evaluation`
- `null`

## 18.4 annotations

Fields:

- `id uuid primary key default gen_random_uuid()`
- `dataset_id uuid not null references datasets(id) on delete cascade`
- `image_id uuid not null references images(id) on delete cascade`
- `label_id uuid references labels(id) on delete set null`
- `type text not null`
- `data jsonb not null`
- `metadata jsonb`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Supported type values:

- `bbox`
- `classification`
- `segmentation`
- `component`
- `ocr`
- `qr_code`
- `keypoint`
- `rule_region`

## 18.5 quality_findings

Fields:

- `id uuid primary key default gen_random_uuid()`
- `dataset_id uuid references datasets(id) on delete cascade`
- `severity text not null`
- `code text not null`
- `message text not null`
- `entity_type text`
- `entity_id uuid`
- `resolved boolean not null default false`
- `metadata jsonb`
- `created_at timestamptz not null default now()`

## 18.6 export_jobs

Fields:

- `id uuid primary key default gen_random_uuid()`
- `dataset_id uuid references datasets(id) on delete cascade`
- `format text not null`
- `status text not null`
- `storage_path text`
- `error_message text`
- `metadata jsonb`
- `created_at timestamptz not null default now()`
- `completed_at timestamptz`

## 18.7 app_settings

Fields:

- `key text primary key`
- `value jsonb not null`
- `updated_at timestamptz not null default now()`

## 19. Storage

### Required buckets

- `dataset-images`
- `dataset-exports`

### Future buckets

- `model-artifacts`
- `inspection-inputs`
- `inspection-results`
- `reports`

### Storage rules

- Use safe filenames.
- Store files under dataset-specific paths.
- Do not expose service-role operations to browser code.
- Use signed URLs if public bucket access is not desired.
- Handle storage failures honestly.

## 20. API Standards

Every API route must:

- Validate params.
- Validate body.
- Validate UUIDs.
- Validate enum fields.
- Return JSON.
- Use useful HTTP status codes.
- Handle Supabase errors.
- Handle missing environment configuration.
- Avoid leaking secrets.

### JSON error shape

```json
{
  "error": "Human-readable error message"
}
```

### HTTP status conventions

| Status | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 204 | Deleted |
| 400 | Invalid request |
| 404 | Not found |
| 409 | Conflict |
| 500 | Server or configuration error |

## 21. Validation Helpers

Create reusable validation utilities for:

- UUID validation
- Dataset payload validation
- Label payload validation
- Color validation
- Image MIME validation
- Task type validation
- Annotation type validation
- Annotation geometry validation
- Split validation
- Export format validation
- Settings validation

## 22. Export Helpers

Create reusable export utilities for:

- COCO conversion
- YOLO conversion
- OpenInspect JSON conversion
- CSV conversion
- Bounding-box normalization
- Polygon flattening
- Label index generation
- Dataset export validation

## 23. Quality Helpers

Create reusable quality utilities for:

- Dataset readiness scoring
- Finding generation
- Class imbalance detection
- Annotation geometry checking
- Annotation type/task mismatch detection
- Split validation
- Label usage counting

## 24. UI Standards

The UI should feel like a professional engineering tool.

### Visual style

- Clean
- Industrial
- Minimal
- Data-focused
- No playful fake dashboard
- No decorative fake charts
- No fake AI magic

### Required UI states

- Loading
- Empty
- Saving
- Saved
- Error
- Disabled
- Confirm delete
- Not configured
- No data available

### Accessibility

- Form labels
- Keyboard-accessible buttons
- Visible focus states
- Semantic tables
- Color not the only status indicator
- Descriptive empty states
- Useful error messages

## 25. Testing

Existing tests must continue passing.

Add tests for:

### Validation

- Dataset validation
- Label validation
- Color validation
- UUID validation
- Image MIME validation
- Annotation geometry validation
- Export format validation

### Annotation utilities

- Coordinate conversion
- Bounding-box validation
- Polygon validation
- Keypoint validation
- Geometry clamping

### Export utilities

- COCO export
- YOLO bbox normalization
- OpenInspect JSON export
- CSV summary export

### Quality utilities

- Empty dataset finding
- Labels without examples
- Images without annotations
- Invalid geometry
- Split missing
- Class imbalance

### UI

- Dashboard empty state
- Dataset list empty state
- Create dataset form
- Label form validation
- Settings diagnostics rendering

### API

Where practical:

- Dataset create validation
- Label duplicate rejection
- Annotation create validation
- Quality endpoint
- Export endpoint

## 26. README Requirements

Update `README.md` with:

- Project overview
- Product scope
- MVP scope
- Out-of-scope modules
- Setup instructions
- Environment variables
- Supabase migration instructions
- Storage bucket instructions
- Development command
- Build command
- Test command
- No mock data policy
- Maddox inspiration note
- Future roadmap

## 27. Environment Variables

Update `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENROUTER_API_KEY=
```

Future variables may be included but clearly marked optional:

```env
TRAINING_BACKEND_URL=
TRAINING_BACKEND_API_KEY=
INFERENCE_BACKEND_URL=
INFERENCE_BACKEND_API_KEY=
```

## 28. Future Roadmap

These features are explicitly planned for later versions.

### Phase 2: Training Orchestration

- Training job creation
- Dataset readiness gate
- Training logs
- Model manifest
- Local baseline training adapter
- External training backend contract

### Phase 3: Model Registry

- Model versions
- Dataset/model linkage
- Metrics
- Artifacts
- Default model selection

### Phase 4: Inference

- Inspection runs
- Batch image inference
- Prediction review
- Accepted/rejected/corrected predictions
- Export inspection results

### Phase 5: Monitoring

- Defect rate
- Pass/fail rate
- Model usage
- Confidence distribution
- Hotspot heatmaps
- Root-cause breakdowns
- Notification rules

### Phase 6: Collaboration

- Authentication
- Organizations
- Projects
- Roles
- Review workflows
- Audit logs

## 29. Acceptance Criteria

The MVP is complete when:

- The app builds with `npm run build`.
- Tests pass with `npm run test:run`.
- A user can create a dataset.
- A user can upload real images.
- A user can create labels.
- A user can annotate images.
- Annotations are persisted.
- Dataset quality checks use real data.
- Dataset exports use real data.
- Settings diagnostics show real configuration state.
- Supabase migrations exist.
- Storage bucket requirements are documented.
- README is updated.
- No operational mock data appears in the UI.
- The implementation happens on the current branch.