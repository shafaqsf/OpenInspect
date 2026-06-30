import { describe, it, expect } from 'vitest'
import { exportCoco, exportYolo, exportOpenInspect, exportCsv } from '../exporters'

const dataset = {
  id: 'ds-1',
  name: 'Test Dataset',
  description: 'A test',
  inspection_goal: 'Detect scratches',
  default_task_type: 'detection',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const images = [
  { id: 'img-1', filename: 'img1.jpg', width: 800, height: 600, split: 'training', mime_type: 'image/jpeg', file_size: 1000, created_at: '2024-01-01T00:00:00Z' },
  { id: 'img-2', filename: 'img2.jpg', width: 800, height: 600, split: 'evaluation', mime_type: 'image/jpeg', file_size: 1000, created_at: '2024-01-01T00:00:00Z' },
]

const labels = [
  { id: 'lbl-1', name: 'scratch', color: '#e94560', description: null, defect_type: 'defect' },
  { id: 'lbl-2', name: 'ok', color: '#27ae60', description: null, defect_type: 'ok' },
]

const annotations = [
  { id: 'ann-1', image_id: 'img-1', label_id: 'lbl-1', type: 'bbox', data: { x: 100, y: 100, width: 200, height: 150 }, metadata: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'ann-2', image_id: 'img-1', label_id: 'lbl-1', type: 'segmentation', data: { points: [{ x: 10, y: 10 }, { x: 100, y: 10 }, { x: 50, y: 100 }] }, metadata: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'ann-3', image_id: 'img-2', label_id: 'lbl-2', type: 'classification', data: { scope: 'image' }, metadata: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
  { id: 'ann-4', image_id: 'img-1', label_id: 'lbl-1', type: 'keypoint', data: { x: 250, y: 300, name: 'point1' }, metadata: null, created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' },
]

describe('exportCoco', () => {
  it('produces COCO structure with info, categories, images, annotations', () => {
    const coco = exportCoco(dataset, images, labels, annotations)
    expect(coco.info).toBeDefined()
    expect(coco.categories).toHaveLength(2)
    expect(coco.images).toHaveLength(2)
    expect(coco.annotations).toHaveLength(2) // bbox + segmentation only
  })

  it('produces correct bbox annotation', () => {
    const coco = exportCoco(dataset, images, labels, annotations)
    const bbox = coco.annotations.find((a) => a.bbox[2] === 200)
    expect(bbox).toBeDefined()
    expect(bbox.bbox).toEqual([100, 100, 200, 150])
    expect(bbox.area).toBe(30000)
  })

  it('produces segmentation from polygon', () => {
    const coco = exportCoco(dataset, images, labels, annotations)
    const seg = coco.annotations.find((a) => a.segmentation.length > 0 && a.segmentation[0].length > 0)
    expect(seg).toBeDefined()
    expect(seg.segmentation[0]).toEqual([10, 10, 100, 10, 50, 100])
  })

  it('includes extensions for non-COCO types', () => {
    const coco = exportCoco(dataset, images, labels, annotations)
    expect(coco.extensions).toBeDefined()
    expect(coco.extensions.length).toBeGreaterThan(0)
  })
})

describe('exportYolo', () => {
  it('produces normalized bbox lines', () => {
    const yolo = exportYolo(dataset, images, labels, annotations)
    expect(yolo.classes).toEqual(['scratch', 'ok'])
    expect(yolo.format).toBe('yolo')
    const lines = Object.values(yolo.files)[0].split('\n')
    const [classId, xc, , w, h] = lines[0].split(' ')
    expect(Number(classId)).toBe(0)
    expect(Number(xc)).toBeGreaterThan(0)
    expect(Number(xc)).toBeLessThanOrEqual(1)
  })
})

describe('exportOpenInspect', () => {
  it('includes all annotation types', () => {
    const oi = exportOpenInspect(dataset, images, labels, annotations)
    expect(oi.format).toBe('openinspect')
    expect(oi.annotations).toHaveLength(4)
    expect(oi.dataset.name).toBe('Test Dataset')
    expect(oi.quality_summary.total_annotations).toBe(4)
  })

  it('type counts include all types', () => {
    const oi = exportOpenInspect(dataset, images, labels, annotations)
    expect(oi.quality_summary.type_counts.bbox).toBe(1)
    expect(oi.quality_summary.type_counts.segmentation).toBe(1)
    expect(oi.quality_summary.type_counts.classification).toBe(1)
    expect(oi.quality_summary.type_counts.keypoint).toBe(1)
  })
})

describe('exportCsv', () => {
  it('produces CSV with header and rows', () => {
    const csv = exportCsv(dataset, images, labels, annotations)
    const lines = csv.split('\n')
    expect(lines[0]).toContain('image_id')
    expect(lines[0]).toContain('filename')
    expect(lines[0]).toContain('annotation_count')
    expect(lines).toHaveLength(3) // header + 2 images
  })
})