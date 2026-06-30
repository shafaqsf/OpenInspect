import { describe, it, expect } from 'vitest'
import {
  isUUID,
  isValidColor,
  isValidTaskType,
  isValidAnnotationType,
  isValidDefectType,
  isValidSplit,
  isValidExportFormat,
  isValidImageMime,
  validateDatasetPayload,
  validateLabelPayload,
  validateAnnotationPayload,
  validateAnnotationGeometry,
  clampBbox,
  clampPoint,
  normalizeBboxForYolo,
  normalizeLabelName,
} from '../validation'

describe('isUUID', () => {
  it('accepts valid UUIDs', () => {
    expect(isUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true)
  })
  it('rejects invalid UUIDs', () => {
    expect(isUUID('not-a-uuid')).toBe(false)
    expect(isUUID('')).toBe(false)
    expect(isUUID(null)).toBe(false)
  })
})

describe('isValidColor', () => {
  it('accepts hex colors', () => {
    expect(isValidColor('#e94560')).toBe(true)
    expect(isValidColor('#0F3460')).toBe(true)
  })
  it('rejects non-hex', () => {
    expect(isValidColor('red')).toBe(false)
    expect(isValidColor('#fff')).toBe(false)
    expect(isValidColor(null)).toBe(false)
  })
})

describe('isValidTaskType', () => {
  it('accepts null and valid types', () => {
    expect(isValidTaskType(null)).toBe(true)
    expect(isValidTaskType(undefined)).toBe(true)
    expect(isValidTaskType('detection')).toBe(true)
  })
  it('rejects invalid types', () => {
    expect(isValidTaskType('invalid')).toBe(false)
  })
})

describe('isValidAnnotationType', () => {
  it('accepts valid types', () => {
    expect(isValidAnnotationType('bbox')).toBe(true)
    expect(isValidAnnotationType('keypoint')).toBe(true)
    expect(isValidAnnotationType('rule_region')).toBe(true)
  })
  it('rejects invalid types', () => {
    expect(isValidAnnotationType('invalid')).toBe(false)
  })
})

describe('isValidSplit', () => {
  it('accepts valid splits', () => {
    expect(isValidSplit('training')).toBe(true)
    expect(isValidSplit('evaluation')).toBe(true)
    expect(isValidSplit(null)).toBe(true)
  })
  it('rejects invalid splits', () => {
    expect(isValidSplit('test')).toBe(false)
  })
})

describe('isValidExportFormat', () => {
  it('accepts valid formats', () => {
    expect(isValidExportFormat('coco')).toBe(true)
    expect(isValidExportFormat('yolo')).toBe(true)
    expect(isValidExportFormat('openinspect')).toBe(true)
    expect(isValidExportFormat('csv')).toBe(true)
  })
  it('rejects invalid', () => {
    expect(isValidExportFormat('xml')).toBe(false)
  })
})

describe('isValidImageMime', () => {
  it('accepts valid types', () => {
    expect(isValidImageMime('image/jpeg')).toBe(true)
    expect(isValidImageMime('image/png')).toBe(true)
    expect(isValidImageMime('image/webp')).toBe(true)
  })
  it('rejects invalid', () => {
    expect(isValidImageMime('image/gif')).toBe(false)
    expect(isValidImageMime('application/pdf')).toBe(false)
  })
})

describe('validateDatasetPayload', () => {
  it('passes for valid data', () => {
    expect(validateDatasetPayload({ name: 'test' })).toHaveLength(0)
    expect(validateDatasetPayload({ name: 'test', description: 'd', inspection_goal: 'g', default_task_type: 'detection' })).toHaveLength(0)
  })
  it('fails for missing name', () => {
    expect(validateDatasetPayload({})).toHaveLength(1)
  })
  it('fails for empty name', () => {
    expect(validateDatasetPayload({ name: '  ' })).toHaveLength(1)
  })
  it('fails for invalid task type', () => {
    expect(validateDatasetPayload({ name: 'x', default_task_type: 'bad' })).toHaveLength(1)
  })
})

describe('validateLabelPayload', () => {
  it('passes for valid data', () => {
    expect(validateLabelPayload({ name: 'scratch', color: '#ff0000' })).toHaveLength(0)
  })
  it('fails for missing name', () => {
    expect(validateLabelPayload({ color: '#ff0000' })).toHaveLength(1)
  })
  it('fails for invalid color', () => {
    expect(validateLabelPayload({ name: 'x', color: 'red' })).toHaveLength(1)
  })
})

describe('validateAnnotationGeometry', () => {
  it('passes for valid bbox', () => {
    expect(validateAnnotationGeometry('bbox', { x: 1, y: 2, width: 10, height: 20 })).toHaveLength(0)
  })
  it('fails for negative bbox', () => {
    expect(validateAnnotationGeometry('bbox', { x: -1, y: 2, width: 10, height: 20 })).toHaveLength(1)
  })
  it('fails for zero-size bbox', () => {
    expect(validateAnnotationGeometry('bbox', { x: 1, y: 2, width: 0, height: 20 })).toHaveLength(1)
  })
  it('passes for valid polygon', () => {
    expect(validateAnnotationGeometry('segmentation', { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }, { x: 3, y: 3 }] })).toHaveLength(0)
  })
  it('fails for polygon with < 3 points', () => {
    expect(validateAnnotationGeometry('segmentation', { points: [{ x: 1, y: 1 }, { x: 2, y: 2 }] })).toHaveLength(1)
  })
  it('passes for keypoint', () => {
    expect(validateAnnotationGeometry('keypoint', { x: 1, y: 2 })).toHaveLength(0)
  })
  it('fails for keypoint without coords', () => {
    expect(validateAnnotationGeometry('keypoint', { x: 'a', y: 2 })).toHaveLength(1)
  })
})

describe('clampBbox', () => {
  it('clamps to image bounds', () => {
    expect(clampBbox({ x: -10, y: -5, width: 200, height: 200 }, 100, 100)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
  })
  it('preserves valid bbox', () => {
    expect(clampBbox({ x: 10, y: 10, width: 50, height: 50 }, 100, 100)).toEqual({ x: 10, y: 10, width: 50, height: 50 })
  })
})

describe('clampPoint', () => {
  it('clamps point', () => {
    expect(clampPoint({ x: -10, y: 200 }, 100, 100)).toEqual({ x: 0, y: 99 })
  })
})

describe('normalizeBboxForYolo', () => {
  it('normalizes to 0-1 range', () => {
    const result = normalizeBboxForYolo({ x: 0, y: 0, width: 100, height: 100 }, 200, 200)
    expect(result.x_center).toBeCloseTo(0.25)
    expect(result.y_center).toBeCloseTo(0.25)
    expect(result.width).toBeCloseTo(0.5)
    expect(result.height).toBeCloseTo(0.5)
  })
  it('clamps to 0-1', () => {
    const result = normalizeBboxForYolo({ x: -100, y: -100, width: 500, height: 500 }, 100, 100)
    expect(result.x_center).toBeGreaterThanOrEqual(0)
    expect(result.x_center).toBeLessThanOrEqual(1)
  })
})

describe('normalizeLabelName', () => {
  it('trims and lowercases', () => {
    expect(normalizeLabelName('  Scratch  ')).toBe('scratch')
  })
})