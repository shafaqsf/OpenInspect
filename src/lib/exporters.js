import { normalizeBboxForYolo, isValidAnnotationType } from './validation'

export function exportCoco(dataset, images, labels, annotations) {
  const labelMap = {}
  labels.forEach((l, idx) => { labelMap[l.id] = idx })

  const coco = {
    info: {
      description: `OpenInspect export: ${dataset.name}`,
      date: new Date().toISOString(),
      version: '1.0',
    },
    categories: labels.map((l, idx) => ({
      id: idx,
      name: l.name,
      supercategory: 'component',
    })),
    images: images.map((img, idx) => ({
      id: idx,
      file_name: img.filename,
      width: img.width || 0,
      height: img.height || 0,
    })),
    annotations: annotations
      .filter((a) => a.type === 'bbox' || a.type === 'segmentation')
      .map((a, idx) => {
        const imgIdx = images.findIndex((i) => i.id === a.image_id)
        const base = {
          id: idx,
          image_id: imgIdx,
          category_id: labelMap[a.label_id] ?? 0,
        }
        if (a.type === 'bbox') {
          const d = a.data || {}
          return {
            ...base,
            bbox: [d.x || 0, d.y || 0, d.width || 0, d.height || 0],
            area: (d.width || 0) * (d.height || 0),
            segmentation: [],
          }
        }
        const points = a.data?.points || []
        return {
          ...base,
          bbox: [0, 0, 0, 0],
          area: 0,
          segmentation: [points.flatMap((p) => [p.x, p.y])],
        }
      }),
  }

  const extended = annotations.filter((a) =>
    ['component', 'ocr', 'qr_code', 'keypoint', 'rule_region', 'classification'].includes(a.type)
  )
  if (extended.length > 0) {
    coco.extensions = extended.map((a) => {
      const imgIdx = images.findIndex((i) => i.id === a.image_id)
      return {
        image_id: imgIdx,
        type: a.type,
        label_id: labelMap[a.label_id] ?? null,
        data: a.data,
      }
    })
  }

  return coco
}

export function exportYolo(dataset, images, labels, annotations) {
  const labelMap = {}
  labels.forEach((l, idx) => { labelMap[l.id] = idx })

  const files = {}

  images.forEach((img, idx) => {
    const imgAnns = annotations.filter(
      (a) => a.image_id === img.id && (a.type === 'bbox' || a.type === 'component')
    )
    if (imgAnns.length === 0) return

    const lines = imgAnns.map((a) => {
      const classId = labelMap[a.label_id] ?? 0
      const norm = normalizeBboxForYolo(a.data || {}, img.width, img.height)
      return `${classId} ${norm.x_center.toFixed(6)} ${norm.y_center.toFixed(6)} ${norm.width.toFixed(6)} ${norm.height.toFixed(6)}`
    })

    const base = img.filename.replace(/\.[^.]+$/, '')
    files[`${base}.txt`] = lines.join('\n')
  })

  return {
    classes: labels.map((l) => l.name),
    files,
    format: 'yolo',
  }
}

export function exportOpenInspect(dataset, images, labels, annotations) {
  const annotatedImageIds = new Set(annotations.map((a) => a.image_id))
  const annotatedCount = [...annotatedImageIds].filter((id) => images.some((i) => i.id === id)).length

  const typeCounts = {}
  annotations.forEach((a) => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1
  })

  return {
    format: 'openinspect',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    dataset: {
      id: dataset.id,
      name: dataset.name,
      description: dataset.description,
      inspection_goal: dataset.inspection_goal,
      default_task_type: dataset.default_task_type,
      created_at: dataset.created_at,
      updated_at: dataset.updated_at,
    },
    images: images.map((img) => ({
      id: img.id,
      filename: img.filename,
      width: img.width,
      height: img.height,
      split: img.split,
      mime_type: img.mime_type,
      file_size: img.file_size,
      created_at: img.created_at,
    })),
    labels: labels.map((l) => ({
      id: l.id,
      name: l.name,
      color: l.color,
      description: l.description,
      defect_type: l.defect_type,
    })),
    annotations: annotations.map((a) => ({
      id: a.id,
      image_id: a.image_id,
      label_id: a.label_id,
      type: a.type,
      data: a.data,
      metadata: a.metadata,
      created_at: a.created_at,
      updated_at: a.updated_at,
    })),
    quality_summary: {
      total_images: images.length,
      annotated_images: annotatedCount,
      total_annotations: annotations.length,
      type_counts: typeCounts,
    },
  }
}

export function exportCsv(dataset, images, labels, annotations) {
  const header = [
    'image_id',
    'filename',
    'width',
    'height',
    'split',
    'annotation_count',
    'labels_present',
    'annotation_types',
    'classification_label',
    'created_date',
  ]

  const rows = images.map((img) => {
    const imgAnns = annotations.filter((a) => a.image_id === img.id)
    const labelNames = [...new Set(imgAnns.map((a) => {
      const l = labels.find((l) => l.id === a.label_id)
      return l?.name
    }).filter(Boolean))]
    const typeNames = [...new Set(imgAnns.map((a) => a.type))]
    const cls = imgAnns.find((a) => a.type === 'classification')
    const clsLabel = cls ? labels.find((l) => l.id === cls.label_id)?.name || '' : ''

    return [
      img.id,
      img.filename,
      img.width || 0,
      img.height || 0,
      img.split || '',
      imgAnns.length,
      labelNames.join(';'),
      typeNames.join(';'),
      clsLabel,
      img.created_at || '',
    ]
  })

  const csv = [header, ...rows]
    .map((row) => row.map((cell) => {
      const s = String(cell)
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"'
      }
      return s
    }).join(','))

  return csv.join('\n')
}