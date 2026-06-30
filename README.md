# OpenInspect

OpenInspect is a visual inspection dataset preparation and quality-control workspace for industrial computer-vision use cases. It helps users create image datasets, upload inspection images, define defect/component labels, annotate images, validate dataset quality, and export training-ready datasets in standard machine-learning formats.

## Product Scope

This MVP focuses on the **data foundation** of an AI inspection platform:

- Dataset management (CRUD)
- Image upload and gallery
- Label management
- Annotation editor (bounding boxes, classification, segmentation, component verification, OCR, QR-code regions, keypoints, rule regions)
- Dataset quality checks
- Dataset export (COCO JSON, YOLO, OpenInspect JSON, CSV)
- Settings and diagnostics

### Out of Scope

- Real model training
- Real neural-network inference
- Model registry
- Production monitoring
- Authentication / multi-user
- Billing

These modules are planned for future phases and have placeholder routes marked as "Planned".

## Inspiration

OpenInspect draws category inspiration from [Maddox AI](https://www.maddox.ai/software/) (industrial machine vision, quality inspection, annotation, data quality, training readiness). OpenInspect does not copy Maddox branding, wording, UI layouts, assets, or proprietary claims.

## Setup

### Prerequisites

- Node.js 18+
- A Supabase project (PostgreSQL + Storage)

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key (client-side) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side, bypasses RLS) |
| `OPENROUTER_API_KEY` | No | OpenRouter API key (existing integration) |
| `NEXT_PUBLIC_SITE_URL` | No | Site URL for OpenRouter HTTP-Referer header |

### Supabase Migration

Run the SQL migration scripts in `supabase/migrations/` in numerical order (001 through 015) using the Supabase SQL Editor or `supabase db push`.

```bash
# If using Supabase CLI:
supabase db push
```

Or manually copy and paste each file's contents into the Supabase SQL Editor.

### Storage Buckets

The migration scripts create two required storage buckets:

- `dataset-images` (public) — uploads and image thumbnails
- `dataset-exports` (private) — generated export files (future)

## Development

```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run test     # Vitest watch mode
npm run test:run # Vitest single run
```

## No Mock Data Policy

OpenInspect does not display fake operational data. All counts, statistics, and diagnostics come from real database records, real uploaded files, real annotations, real computed summaries, or real diagnostics. If there is no data, the UI shows an empty state.

## Future Roadmap

| Phase | Module | Status |
|-------|--------|--------|
| 2 | Training Orchestration | Planned |
| 3 | Model Registry | Planned |
| 4 | Inference | Planned |
| 5 | Monitoring | Planned |
| 6 | Collaboration | Planned |

## License

Private project.