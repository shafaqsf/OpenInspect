import { describe, it, expect } from 'vitest'
import { runQualityChecks, computeScore } from '../quality'

function baseDataset(overrides = {}) {
  return { id: 'ds-1', name: 'Test', default_task_type: null, ...overrides }
}

describe('runQualityChecks', () => {
  it('reports NO_IMAGES error for empty dataset', () => {
    const result = runQualityChecks(baseDataset(), [], [], [])
    expect(result.findings.some((f) => f.code === 'NO_IMAGES')).toBe(true)
    expect(result.findings.some((f) => f.code === 'NO_LABELS')).toBe(true)
  })

  it('reports IMAGE_WITHOUT_ANNOTATIONS for unannotated images', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg' }
    const lbl = { id: 'l1', name: 'defect' }
    const result = runQualityChecks(baseDataset(), [img], [lbl], [])
    expect(result.findings.some((f) => f.code === 'IMAGE_WITHOUT_ANNOTATIONS')).toBe(true)
  })

  it('reports LABEL_WITHOUT_EXAMPLES', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg' }
    const lbl = { id: 'l1', name: 'defect' }
    const ann = { id: 'a1', image_id: 'i1', label_id: 'l1', type: 'bbox', data: { x: 0, y: 0, width: 10, height: 10 } }
    const lbl2 = { id: 'l2', name: 'ok' }
    const result = runQualityChecks(baseDataset(), [img], [lbl, lbl2], [ann])
    expect(result.findings.some((f) => f.code === 'LABEL_WITHOUT_EXAMPLES')).toBe(true)
  })

  it('reports POLYGON_TOO_FEW_POINTS', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg' }
    const lbl = { id: 'l1', name: 'defect' }
    const ann = { id: 'a1', image_id: 'i1', label_id: 'l1', type: 'segmentation', data: { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] } }
    const result = runQualityChecks(baseDataset(), [img], [lbl], [ann])
    expect(result.findings.some((f) => f.code === 'POLYGON_TOO_FEW_POINTS')).toBe(true)
  })

  it('reports BBOX_OUTSIDE_BOUNDS', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg' }
    const lbl = { id: 'l1', name: 'defect' }
    const ann = { id: 'a1', image_id: 'i1', label_id: 'l1', type: 'bbox', data: { x: 90, y: 90, width: 50, height: 50 } }
    const result = runQualityChecks(baseDataset(), [img], [lbl], [ann])
    expect(result.findings.some((f) => f.code === 'BBOX_OUTSIDE_BOUNDS')).toBe(true)
  })

  it('reports NO_TRAINING_SPLIT', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg', split: null }
    const lbl = { id: 'l1', name: 'defect' }
    const ann = { id: 'a1', image_id: 'i1', label_id: 'l1', type: 'bbox', data: { x: 0, y: 0, width: 10, height: 10 } }
    const result = runQualityChecks(baseDataset(), [img], [lbl], [ann])
    expect(result.findings.some((f) => f.code === 'NO_TRAINING_SPLIT')).toBe(true)
  })

  it('reports TOO_FEW_IMAGES for < 10 images', () => {
    const imgs = Array.from({ length: 5 }, (_, i) => ({ id: `i${i}`, filename: `${i}.jpg`, width: 100, height: 100, storage_path: `x/${i}.jpg`, split: 'training' }))
    const lbl = { id: 'l1', name: 'defect' }
    const anns = imgs.map((img, i) => ({ id: `a${i}`, image_id: img.id, label_id: 'l1', type: 'bbox', data: { x: 0, y: 0, width: 10, height: 10 } }))
    const result = runQualityChecks(baseDataset(), imgs, [lbl], anns)
    expect(result.findings.some((f) => f.code === 'TOO_FEW_IMAGES')).toBe(true)
  })

  it('reports LABEL_IMBALANCE for dominant label', () => {
    const imgs = Array.from({ length: 10 }, (_, i) => ({ id: `i${i}`, filename: `${i}.jpg`, width: 100, height: 100, storage_path: `x/${i}.jpg`, split: 'training' }))
    const lbl1 = { id: 'l1', name: 'defect' }
    const lbl2 = { id: 'l2', name: 'ok' }
    const anns = imgs.map((img, i) => ({ id: `a${i}`, image_id: img.id, label_id: 'l1', type: 'bbox', data: { x: 0, y: 0, width: 10, height: 10 } }))
    const result = runQualityChecks(baseDataset(), imgs, [lbl1, lbl2],anns)
    expect(result.findings.some((f) => f.code === 'LABEL_IMBALANCE')).toBe(true)
  })

  it('reports TASK_TYPE_MISMATCH', () => {
    const img = { id: 'i1', filename: 'a.jpg', width: 100, height: 100, storage_path: 'x/a.jpg', split: 'training' }
    const lbl = { id: 'l1', name: 'img' }
    const ann = { id: 'a1', image_id: 'i1', label_id: 'l1', type: 'bbox', data: { x: 0, y: 0, width: 10, height: 10 } }
    const result = runQualityChecks(baseDataset({ default_task_type: 'segmentation' }), [img], [lbl], [ann])
    expect(result.findings.some((f) => f.code === 'TASK_TYPE_MISMATCH')).toBe(true)
  })

  it('computeScore returns 0 for empty dataset', () => {
    const findings = [
      { severity: 'error', code: 'NO_IMAGES' },
      { severity: 'error', code: 'NO_LABELS' },
    ]
    expect(computeScore(findings, 0, 0)).toBeLessThanOrEqual(20)
  })

  it('computeScore reduces score for warnings', () => {
    const findings = [
      { severity: 'warning', code: 'TEST' },
      { severity: 'warning', code: 'TEST2' },
    ]
    const score = computeScore(findings, 10, 2)
    expect(score).toBe(90)
  })

  it('lowers score for empty dataset with 0 images and 0 labels', () => {
    const result = runQualityChecks(baseDataset(), [], [], [])
    expect(result.score).toBeLessThanOrEqual(20)
  })
})