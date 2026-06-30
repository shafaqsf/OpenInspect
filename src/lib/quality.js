import { isValidAnnotationType } from './validation'

export function runQualityChecks(dataset, images, labels, annotations) {
  const findings = []
  const datasetId = dataset.id

  function addFinding(severity, code, message, entityType, entityId) {
    findings.push({ severity, code, message, entityType, entityId: entityId || null })
  }

  if (!images || images.length === 0) {
    addFinding('error', 'NO_IMAGES', 'Dataset has no images.', 'dataset', datasetId)
  }

  if (!labels || labels.length === 0) {
    addFinding('error', 'NO_LABELS', 'Dataset has no labels.', 'dataset', datasetId)
  }

  const annotatedImageIds = new Set((annotations || []).map((a) => a.image_id))
  const unannotatedImages = (images || []).filter((i) => !annotatedImageIds.has(i.id))
  unannotatedImages.forEach((img) => {
    addFinding('warning', 'IMAGE_WITHOUT_ANNOTATIONS',
      `Image "${img.filename}" has no annotations.`, 'image', img.id)
  })

  labels.forEach((label) => {
    const count = (annotations || []).filter((a) => a.label_id === label.id).length
    if (count === 0) {
      addFinding('warning', 'LABEL_WITHOUT_EXAMPLES',
        `The label "${label.name}" has no annotations.`, 'label', label.id)
    }
  })

  const filenameCounts = {}
  ;(images || []).forEach((img) => {
    filenameCounts[img.filename] = (filenameCounts[img.filename] || 0) + 1
  })
  Object.entries(filenameCounts).forEach(([name, count]) => {
    if (count > 1) {
      addFinding('warning', 'DUPLICATE_FILENAMES',
        `Filename "${name}" appears ${count} times.`, 'dataset', datasetId)
    }
  })

  ;(images || []).forEach((img) => {
    if (!img.width || !img.height) {
      addFinding('info', 'MISSING_DIMENSIONS',
        `Image "${img.filename}" is missing dimensions.`, 'image', img.id)
    }
    if (!img.storage_path) {
      addFinding('error', 'MISSING_STORAGE_PATH',
        `Image "${img.filename}" has no storage path.`, 'image', img.id)
    }
  })

  ;(annotations || []).forEach((ann) => {
    const img = (images || []).find((i) => i.id === ann.image_id)
    const d = ann.data || {}
    const imgW = img?.width || 0
    const imgH = img?.height || 0

    if (ann.type === 'bbox' || ann.type === 'component' || ann.type === 'ocr' || ann.type === 'qr_code' || ann.type === 'rule_region') {
      if (typeof d.x !== 'number' || typeof d.y !== 'number' ||
          typeof d.width !== 'number' || typeof d.height !== 'number') {
        addFinding('error', 'INVALID_GEOMETRY',
          `Annotation ${ann.id} has invalid geometry.`, 'annotation', ann.id)
      } else {
        if (imgW > 0 && (d.x < 0 || d.y < 0 || d.x + d.width > imgW || d.y + d.height > imgH)) {
          addFinding('warning', 'BBOX_OUTSIDE_BOUNDS',
            `Bounding box in ${img.filename} extends outside image boundaries.`, 'annotation', ann.id)
        }
        if (d.width < 5 || d.height < 5) {
          addFinding('warning', 'BBOX_TOO_SMALL',
            `Bounding box in ${img.filename} is too small (width=${d.width}, height=${d.height}).`, 'annotation', ann.id)
        }
      }
    }

    if (ann.type === 'segmentation') {
      const pts = d.points || []
      if (pts.length < 3) {
        addFinding('error', 'POLYGON_TOO_FEW_POINTS',
          `Polygon annotation in ${img?.filename || 'unknown'} has fewer than 3 points.`, 'annotation', ann.id)
      }
      pts.forEach((p) => {
        if (imgW > 0 && (p.x < 0 || p.y < 0 || p.x > imgW || p.y > imgH)) {
          addFinding('warning', 'POLYGON_OUTSIDE_BOUNDS',
            `Polygon point in ${img?.filename || 'unknown'} is outside image boundaries.`, 'annotation', ann.id)
        }
      })
    }

    if (ann.type === 'keypoint') {
      if (imgW > 0 && (d.x < 0 || d.y < 0 || d.x > imgW || d.y > imgH)) {
        addFinding('warning', 'KEYPOINT_OUTSIDE_BOUNDS',
          `Keypoint in ${img?.filename || 'unknown'} is outside image boundaries.`, 'annotation', ann.id)
      }
    }

    if (ann.type === 'ocr' && (!d.text || !d.text.trim())) {
      addFinding('info', 'OCR_WITHOUT_TRANSCRIPTION',
        `OCR region in ${img?.filename || 'unknown'} has no transcription.`, 'annotation', ann.id)
    }

    if (ann.type === 'qr_code' && (!d.value || !d.value.trim())) {
      addFinding('info', 'QR_WITHOUT_VALUE',
        `QR-code region in ${img?.filename || 'unknown'} has no decoded value.`, 'annotation', ann.id)
    }
  })

  if (labels.length > 0 && annotations.length > 0) {
    const labelCounts = {}
    labels.forEach((l) => { labelCounts[l.id] = 0 })
    annotations.forEach((a) => {
      if (labelCounts[a.label_id] !== undefined) labelCounts[a.label_id]++
    })
    const counts = Object.values(labelCounts)
    const total = counts.reduce((a, b) => a + b, 0)
    const maxCount = Math.max(...counts)
    if (total > 0 && maxCount / total > 0.7) {
      const dominantLabel = labels.find((l) => labelCounts[l.id] === maxCount)
      addFinding('warning', 'LABEL_IMBALANCE',
        `Severe label imbalance: "${dominantLabel?.name}" accounts for ${Math.round(maxCount / total * 100)}% of annotations.`,
        'dataset', datasetId)
    }
  }

  const trainingCount = (images || []).filter((i) => i.split === 'training').length
  const evaluationCount = (images || []).filter((i) => i.split === 'evaluation').length
  const unassignedCount = (images || []).filter((i) => !i.split).length

  if (images.length > 0 && trainingCount === 0) {
    addFinding('warning', 'NO_TRAINING_SPLIT',
      'No images assigned to the training split.', 'dataset', datasetId)
  }
  if (images.length > 0 && evaluationCount === 0) {
    addFinding('info', 'NO_EVALUATION_SPLIT',
      'No images assigned to the evaluation split.', 'dataset', datasetId)
  }

  if (images.length > 0 && images.length < 10) {
    addFinding('info', 'TOO_FEW_IMAGES',
      `Dataset has only ${images.length} image(s). More data is recommended for reliable training.`,
      'dataset', datasetId)
  }

  if (dataset.default_task_type) {
    const taskTypeAnnotationMap = {
      classification: ['classification'],
      detection: ['bbox'],
      segmentation: ['segmentation'],
      component_verification: ['component'],
      ocr: ['ocr'],
      qr_code: ['qr_code'],
      keypoint_detection: ['keypoint'],
      rule_based: ['rule_region'],
    }
    const expectedTypes = taskTypeAnnotationMap[dataset.default_task_type] || []
    const actualTypes = [...new Set((annotations || []).map((a) => a.type))]
    const missingTypes = expectedTypes.filter((t) => !actualTypes.includes(t))
    if (expectedTypes.length > 0 && missingTypes.length > 0 && annotations.length > 0) {
      addFinding('warning', 'TASK_TYPE_MISMATCH',
        `Default task type "${dataset.default_task_type}" expects ${expectedTypes.join(', ')} annotations, but found ${actualTypes.join(', ') || 'none'}.`,
        'dataset', datasetId)
    }
  }

  const score = computeScore(findings, images.length, labels.length)

  return { score, findings, counts: countBySeverity(findings) }
}

export function computeScore(findings, imageCount, labelCount) {
  let score = 100
  const errorCount = findings.filter((f) => f.severity === 'error').length
  const warningCount = findings.filter((f) => f.severity === 'warning').length
  const infoCount = findings.filter((f) => f.severity === 'info').length

  score -= errorCount * 15
  score -= warningCount * 5
  score -= infoCount * 1

  if (imageCount === 0 || labelCount === 0) {
    score = Math.min(score, 20)
  }

  return Math.max(0, Math.min(100, score))
}

export function countBySeverity(findings) {
  return {
    error: findings.filter((f) => f.severity === 'error').length,
    warning: findings.filter((f) => f.severity === 'warning').length,
    info: findings.filter((f) => f.severity === 'info').length,
    total: findings.length,
  }
}