# OpenInspect — Feature Plan

## Phase 1: Data Foundation

### Datasets
- Create, rename, delete datasets
- Each dataset groups images for one inspection task
- Dataset-level metadata (name, description, creation date)

### Image Management
- Upload images (drag & drop, file picker) to Supabase Storage
- Store metadata in Supabase: filename, dimensions, file size, upload date, dataset association
- Grid gallery view with thumbnails, search by filename, sort by date
- Delete individual images or batch

### Label Management
- Create custom labels per dataset (e.g. "scratch", "dent", "crack", "ok")
- Assign a color to each label for visual distinction in the annotation UI

### Annotation Editor
- Canvas-based image viewer with zoom/pan
- **Bounding boxes** — draw rectangles, resize, move, delete
  - Keyboard: B to draw box, Del to remove selected, Tab to cycle through annotations
- **Classification labels** — assign a label to the full image
  - Keyboard: number keys (1–9) for quick label selection
- **Segmentation masks** — polygon drawing tool with vertex editing
  - Keyboard: P for polygon tool, Esc to cancel drawing, Enter to finalize
- Undo/redo support
- Per-image annotation progress indicator
- Auto-save on each annotation change

### Data Management
- Export annotations (COCO JSON, YOLO format)
- Train/test split: mark images as training or evaluation set
- Dataset statistics (total images, annotated count, label distribution)

---

## Phase 2: Custom Model Training

*To be detailed.*

---

## Phase 3: Inspection / Inference

*To be detailed.*

---

## Settings

- Supabase storage configuration
- API key management

---

## Data Schema

```
datasets
  id              uuid (PK)
  name            text
  description     text
  created_at      timestamptz
  updated_at      timestamptz

labels
  id              uuid (PK)
  dataset_id      uuid (FK → datasets)
  name            text
  color           text
  created_at      timestamptz

images
  id              uuid (PK)
  dataset_id      uuid (FK → datasets)
  filename        text
  storage_path    text
  width           int
  height          int
  file_size       int
  split           text ('training' | 'evaluation' | null)
  created_at      timestamptz

annotations
  id              uuid (PK)
  image_id        uuid (FK → images)
  label_id        uuid (FK → labels)
  type            text ('bbox' | 'classification' | 'segmentation')
  data            jsonb
  created_at      timestamptz
  updated_at      timestamptz
```

## Stack Decisions

- **Storage**: Supabase Storage (bucket: `dataset-images`)
- **Annotation Canvas**: HTML5 Canvas with fabric.js for drawing tools
- **Database**: Supabase PostgreSQL with RLS policies for data isolation
- **Auth**: Single-user (no multi-user support for MVP)
