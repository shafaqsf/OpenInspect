const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function isUUID(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

const TASK_TYPES = [
  'classification',
  'detection',
  'segmentation',
  'component_verification',
  'ocr',
  'qr_code',
  'keypoint_detection',
  'rule_based',
]

const ANNOTATION_TYPES = [
  'bbox',
  'classification',
  'segmentation',
  'component',
  'ocr',
  'qr_code',
  'keypoint',
  'rule_region',
]

const DEFECT_TYPES = [
  'defect',
  'ok',
  'component',
  'text',
  'qr',
  'keypoint',
  'rule',
  'other',
]

const EXPORT_FORMATS = ['coco', 'yolo', 'openinspect', 'csv']

const SPLIT_VALUES = ['training', 'evaluation', null]

const PRESET_COLORS = [
  '#e94560', '#0f3460', '#16213e', '#f39c12',
  '#27ae60', '#2980b9', '#8e44ad', '#d35400',
  '#16a085', '#c0392b', '#2c3e50', '#7f8c8d',
]

const HEX_COLOR_RE = /^#[0-9a-f]{6}$/i

export function isValidColor(value) {
  return typeof value === 'string' && HEX_COLOR_RE.test(value)
}

export function isValidTaskType(value) {
  return value === null || value === undefined || TASK_TYPES.includes(value)
}

export function isValidAnnotationType(value) {
  return ANNOTATION_TYPES.includes(value)
}

export function isValidDefectType(value) {
  return value === null || value === undefined || DEFECT_TYPES.includes(value)
}

export function isValidSplit(value) {
  return SPLIT_VALUES.includes(value)
}

export function isValidExportFormat(value) {
  return EXPORT_FORMATS.includes(value)
}

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp']

export function isValidImageMime(value) {
  return ALLOWED_MIMES.includes(value)
}

export function validateDatasetPayload(body) {
  const errors = []
  if (!body || typeof body !== 'object') {
    return [{ field: 'body', message: 'Request body is required' }]
  }
  const name = body.name
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (name.trim().length > 200) {
    errors.push({ field: 'name', message: 'Name must be 200 characters or fewer' })
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' })
  }
  if (body.inspection_goal !== undefined && body.inspection_goal !== null && typeof body.inspection_goal !== 'string') {
    errors.push({ field: 'inspection_goal', message: 'Inspection goal must be a string' })
  }
  if (body.default_task_type !== undefined && body.default_task_type !== null) {
    if (!isValidTaskType(body.default_task_type)) {
      errors.push({ field: 'default_task_type', message: 'Invalid task type' })
    }
  }
  return errors
}

export function validateLabelPayload(body) {
  const errors = []
  if (!body || typeof body !== 'object') {
    return [{ field: 'body', message: 'Request body is required' }]
  }
  const name = body.name
  if (!name || typeof name !== 'string' || !name.trim()) {
    errors.push({ field: 'name', message: 'Name is required' })
  } else if (name.trim().length > 100) {
    errors.push({ field: 'name', message: 'Name must be 100 characters or fewer' })
  }
  if (body.color !== undefined && body.color !== null) {
    if (!isValidColor(body.color)) {
      errors.push({ field: 'color', message: 'Color must be a valid hex color (#rrggbb)' })
    }
  }
  if (body.defect_type !== undefined && body.defect_type !== null) {
    if (!isValidDefectType(body.defect_type)) {
      errors.push({ field: 'defect_type', message: 'Invalid defect type' })
    }
  }
  if (body.description !== undefined && body.description !== null && typeof body.description !== 'string') {
    errors.push({ field: 'description', message: 'Description must be a string' })
  }
  return errors
}

export function normalizeLabelName(name) {
  return (name || '').trim().toLowerCase()
}

export function validateAnnotationPayload(body) {
  const errors = []
  if (!body || typeof body !== 'object') {
    return [{ field: 'body', message: 'Request body is required' }]
  }
  if (!body.label_id || !isUUID(body.label_id)) {
    errors.push({ field: 'label_id', message: 'A valid label_id is required' })
  }
  if (!body.type || !isValidAnnotationType(body.type)) {
    errors.push({ field: 'type', message: 'A valid annotation type is required' })
  }
  if (body.data !== undefined && body.data !== null) {
    const geomErrors = validateAnnotationGeometry(body.type, body.data)
    errors.push(...geomErrors)
  }
  return errors
}

export function validateAnnotationGeometry(type, data) {
  const errors = []
  if (!data || typeof data !== 'object') return [{ field: 'data', message: 'Data is required' }]

  if (type === 'bbox' || type === 'component' || type === 'ocr' || type === 'qr_code' || type === 'rule_region') {
    if (typeof data.x !== 'number' || typeof data.y !== 'number' ||
        typeof data.width !== 'number' || typeof data.height !== 'number') {
      errors.push({ field: 'data', message: 'x, y, width, height must be numbers' })
    } else {
      if (data.width <= 0 || data.height <= 0) {
        errors.push({ field: 'data', message: 'width and height must be positive' })
      }
      if (data.x < 0 || data.y < 0) {
        errors.push({ field: 'data', message: 'x and y must be non-negative' })
      }
    }
  }

  if (type === 'segmentation') {
    if (!Array.isArray(data.points) || data.points.length < 3) {
      errors.push({ field: 'data', message: 'Segmentation requires at least 3 points' })
    } else {
      data.points.forEach((p, i) => {
        if (typeof p.x !== 'number' || typeof p.y !== 'number') {
          errors.push({ field: `data.points[${i}]`, message: 'Each point must have numeric x and y' })
        }
      })
    }
  }

  if (type === 'keypoint') {
    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      errors.push({ field: 'data', message: 'Keypoint requires numeric x and y' })
    }
  }

  if (type === 'classification') {
    // classification has no geometry constraints
  }

  return errors
}

export function clampBbox(bbox, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) return bbox
  let { x, y, width, height } = bbox
  x = Math.max(0, Math.min(x, imageWidth - 1))
  y = Math.max(0, Math.min(y, imageHeight - 1))
  width = Math.min(width, imageWidth - x)
  height = Math.min(height, imageHeight - y)
  return { x, y, width, height }
}

export function clampPoint(point, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) return point
  return {
    x: Math.max(0, Math.min(point.x, imageWidth - 1)),
    y: Math.max(0, Math.min(point.y, imageHeight - 1)),
  }
}

export function normalizeBboxForYolo(bbox, imageWidth, imageHeight) {
  if (!imageWidth || !imageHeight) {
    return { x_center: 0, y_center: 0, width: 0, height: 0 }
  }
  const cx = (bbox.x + bbox.width / 2) / imageWidth
  const cy = (bbox.y + bbox.height / 2) / imageHeight
  const w = bbox.width / imageWidth
  const h = bbox.height / imageHeight
  return {
    x_center: Math.max(0, Math.min(1, cx)),
    y_center: Math.max(0, Math.min(1, cy)),
    width: Math.max(0, Math.min(1, w)),
    height: Math.max(0, Math.min(1, h)),
  }
}

export { TASK_TYPES, ANNOTATION_TYPES, DEFECT_TYPES, EXPORT_FORMATS, PRESET_COLORS, ALLOWED_MIMES }