'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import styles from './AnnotationCanvas.module.css'

export default function AnnotationCanvas({ image, labels, annotations, onSave, onUpdate, onDelete }) {
  const canvasEl = useRef(null)
  const fabricRef = useRef(null)
  const canvasRef = useRef(null)
  const bgImageRef = useRef(null)

  const [activeTool, setActiveTool] = useState('select')
  const [currentLabelId, setCurrentLabelId] = useState(labels[0]?.id || null)
  const [selectedAnnId, setSelectedAnnId] = useState(null)
  const [classificationLabel, setClassificationLabel] = useState(null)
  const [shortcutHint, setShortcutHint] = useState('')

  const autoSaveTimer = useRef(null)
  const polygonPoints = useRef([])
  const polygonLines = useRef([])

  const annotationMap = useRef({})

  const classificationAnn = annotations.find((a) => a.type === 'classification')

  useEffect(() => {
    let cancelled = false

    async function init() {
      const fabric = await import('fabric')

      const canvas = new fabric.Canvas(canvasEl.current, {
        width: 800,
        height: 600,
        selection: activeTool === 'select',
      })

      canvasRef.current = canvas

      const img = await fabric.FabricImage.fromURL(image.public_url)
      const scale = Math.min(760 / img.width, 560 / img.height, 1)
      img.set({ scaleX: scale, scaleY: scale, selectable: false, evented: false })
      canvas.setWidth(img.width * scale)
      canvas.setHeight(img.height * scale)
      canvas.centerObject(img)
      canvas.add(img)
      canvas.renderAll()
      bgImageRef.current = img

      loadAnnotations(fabric, canvas)

      if (!cancelled) {
        fabricRef.current = fabric
      }
    }

    init()

    return () => {
      cancelled = true
      if (canvasRef.current) {
        canvasRef.current.dispose()
        canvasRef.current = null
      }
    }
  }, [image.public_url])

  useEffect(() => {
    if (fabricRef.current && canvasRef.current) {
      reloadAnnotations()
    }
  }, [annotations])

  function loadAnnotations(fabric, canvas) {
    annotationMap.current = {}
    canvas.getObjects().forEach((obj) => {
      if (obj !== bgImageRef.current) canvas.remove(obj)
    })

    annotations.forEach((ann) => {
      if (ann.type === 'bbox') {
        createBboxObject(fabric, canvas, ann)
      } else if (ann.type === 'segmentation') {
        createSegmentationObject(fabric, canvas, ann)
      }
    })

    if (annotations.find((a) => a.type === 'classification')) {
      setClassificationLabel(annotations.find((a) => a.type === 'classification'))
    }

    canvas.renderAll()
  }

  function reloadAnnotations() {
    const fabric = fabricRef.current
    const canvas = canvasRef.current
    if (!fabric || !canvas) return

    annotationMap.current = {}
    canvas.getObjects().forEach((obj) => {
      if (obj !== bgImageRef.current) canvas.remove(obj)
    })

    annotations.forEach((ann) => {
      if (ann.type === 'bbox') {
        createBboxObject(fabric, canvas, ann)
      } else if (ann.type === 'segmentation') {
        createSegmentationObject(fabric, canvas, ann)
      }
    })

    const cls = annotations.find((a) => a.type === 'classification')
    setClassificationLabel(cls || null)

    canvas.renderAll()
  }

  function createBboxObject(fabric, canvas, ann) {
    const d = ann.data
    const label = labels.find((l) => l.id === ann.label_id)
    const color = label?.color || '#e94560'

    const rect = new fabric.Rect({
      left: d.x,
      top: d.y,
      width: d.width,
      height: d.height,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeUniform: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      annotationId: ann.id,
      labelData: { id: ann.label_id, name: label?.name, color },
    })

    rect.on('modified', () => {
      handleAnnotationModified(ann.id, rect)
    })

    rect.on('selected', () => {
      setSelectedAnnId(ann.id)
    })

    canvas.add(rect)
    annotationMap.current[ann.id] = rect
  }

  function createSegmentationObject(fabric, canvas, ann) {
    const d = ann.data
    const label = labels.find((l) => l.id === ann.label_id)
    const color = label?.color || '#e94560'
    const points = d.points?.map((p) => p.x !== undefined ? { x: p.x, y: p.y } : p) || []

    if (points.length < 3) return

    const poly = new fabric.Polygon(points, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeUniform: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      objectCaching: false,
      annotationId: ann.id,
      labelData: { id: ann.label_id, name: label?.name, color },
    })

    poly.on('modified', () => {
      handleAnnotationModified(ann.id, poly)
    })

    poly.on('selected', () => {
      setSelectedAnnId(ann.id)
    })

    canvas.add(poly)
    annotationMap.current[ann.id] = poly
  }

  function handleAnnotationModified(annId, obj) {
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      let data
      if (obj.type === 'rect') {
        data = { x: obj.left, y: obj.top, width: obj.width * obj.scaleX, height: obj.height * obj.scaleY }
      } else {
        const pts = obj.points.map((p) => ({ x: p.x + obj.left, y: p.y + obj.top }))
        data = { points: pts }
      }
      onUpdate(annId, data, currentLabelId)
    }, 300)
  }

  function handleMouseDown(e) {
    const fabric = fabricRef.current
    const canvas = canvasRef.current
    if (!fabric || !canvas) return

    const pointer = canvas.getPointer(e)

    if (activeTool === 'bbox') {
      startBboxDraw(fabric, canvas, pointer)
    } else if (activeTool === 'polygon') {
      addPolygonPoint(canvas, pointer)
    }
  }

  function startBboxDraw(fabric, canvas, pointer) {
    const label = labels.find((l) => l.id === currentLabelId)
    const color = label?.color || '#e94560'

    const rect = new fabric.Rect({
      left: pointer.x,
      top: pointer.y,
      width: 0,
      height: 0,
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeUniform: true,
      hasControls: false,
      hasBorders: false,
      lockRotation: true,
    })

    canvas.add(rect)
    setShortcutHint('Drag to draw bounding box')

    function onMouseMove(ev) {
      const p = canvas.getPointer(ev)
      const left = Math.min(pointer.x, p.x)
      const top = Math.min(pointer.y, p.y)
      rect.set({
        left,
        top,
        width: Math.abs(p.x - pointer.x),
        height: Math.abs(p.y - pointer.y),
      })
      canvas.renderAll()
    }

    function onMouseUp() {
      canvas.off('mouse:move', onMouseMove)
      canvas.off('mouse:up', onMouseUp)

      if (rect.width < 5 || rect.height < 5) {
        canvas.remove(rect)
        setShortcutHint('')
        return
      }

      rect.set({ hasControls: true, hasBorders: true })
      canvas.setActiveObject(rect)
      canvas.renderAll()
      setShortcutHint('')

      const data = { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      onSave(currentLabelId, 'bbox', data).then((ann) => {
        if (ann) {
          rect.annotationId = ann.id
          rect.labelData = { id: ann.label_id, name: label?.name, color }

          rect.on('modified', () => handleAnnotationModified(ann.id, rect))
          rect.on('selected', () => setSelectedAnnId(ann.id))

          annotationMap.current[ann.id] = rect
        }
      })
    }

    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)
  }

  function addPolygonPoint(canvas, pointer) {
    const fabric = fabricRef.current
    if (!fabric) return

    polygonPoints.current.push({ x: pointer.x, y: pointer.y })

    if (polygonPoints.current.length === 1) {
      setShortcutHint('Click to add points, Enter to finish, Esc to cancel')
    }

    const dot = new fabric.Circle({
      left: pointer.x - 3,
      top: pointer.y - 3,
      radius: 3,
      fill: '#e94560',
      selectable: false,
      evented: false,
    })
    canvas.add(dot)
    polygonLines.current.push(dot)

    if (polygonPoints.current.length >= 2) {
      const pts = polygonPoints.current
      const last = pts[pts.length - 2]
      const line = new fabric.Line([last.x, last.y, pointer.x, pointer.y], {
        stroke: '#e94560',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      })
      canvas.add(line)
      polygonLines.current.push(line)
    }

    canvas.renderAll()
  }

  function finishPolygon() {
    const fabric = fabricRef.current
    const canvas = canvasRef.current
    if (!fabric || !canvas || polygonPoints.current.length < 3) return

    const label = labels.find((l) => l.id === currentLabelId)
    const color = label?.color || '#e94560'

    const poly = new fabric.Polygon(polygonPoints.current, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeUniform: true,
      hasControls: true,
      hasBorders: true,
      lockRotation: true,
      objectCaching: false,
    })

    polygonLines.current.forEach((obj) => canvas.remove(obj))
    polygonLines.current = []
    const pts = polygonPoints.current
    polygonPoints.current = []

    canvas.add(poly)
    canvas.renderAll()
    setShortcutHint('')

    const data = { points: pts.map((p) => ({ x: p.x, y: p.y })) }
    onSave(currentLabelId, 'segmentation', data).then((ann) => {
      if (ann) {
        poly.annotationId = ann.id
        poly.labelData = { id: ann.label_id, name: label?.name, color }

        poly.on('modified', () => handleAnnotationModified(ann.id, poly))
        poly.on('selected', () => setSelectedAnnId(ann.id))

        annotationMap.current[ann.id] = poly
      }
    })
  }

  function cancelPolygon() {
    const canvas = canvasRef.current
    if (!canvas) return

    polygonLines.current.forEach((obj) => canvas.remove(obj))
    polygonLines.current = []
    polygonPoints.current = []
    setShortcutHint('')
    canvas.renderAll()
  }

  function handleCanvasClick(e) {
    const canvas = canvasRef.current
    if (!canvas) return

    if (activeTool === 'classification' && currentLabelId) {
      handleClassify()
    }
  }

  async function handleClassify() {
    if (classificationAnn) {
      await onUpdate(classificationAnn.id, {}, currentLabelId)
    } else {
      await onSave(currentLabelId, 'classification', {})
    }
    setShortcutHint('')
  }

  function handleKeyDown(e) {
    const canvas = canvasRef.current
    if (!canvas) return

    if (e.key === 'b' || e.key === 'B') {
      setActiveTool('bbox')
      setShortcutHint('B: Drag to draw bounding box')
      e.preventDefault()
    } else if (e.key === 'p' || e.key === 'P') {
      setActiveTool('polygon')
      setShortcutHint('P: Click to add polygon points')
      e.preventDefault()
    } else if (e.key === 'v' || e.key === 'V') {
      setActiveTool('select')
      if (canvas) canvas.selection = true
      setShortcutHint('V: Select mode')
      setTimeout(() => setShortcutHint(''), 1500)
      e.preventDefault()
    }

    if (activeTool === 'polygon') {
      if (e.key === 'Enter') {
        finishPolygon()
        e.preventDefault()
      } else if (e.key === 'Escape') {
        cancelPolygon()
        e.preventDefault()
      }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const active = canvas.getActiveObject()
      if (active && active.annotationId) {
        const annId = active.annotationId
        canvas.remove(active)
        delete annotationMap.current[annId]
        onDelete(annId)
        setSelectedAnnId(null)
      }
      e.preventDefault()
    }

    if (e.key === 'Tab' && activeTool === 'select') {
      e.preventDefault()
      const objs = canvas.getObjects().filter((o) => o !== bgImageRef.current)
      if (objs.length === 0) return
      const active = canvas.getActiveObject()
      if (active) {
        const idx = objs.indexOf(active)
        const next = objs[(idx + 1) % objs.length]
        canvas.setActiveObject(next)
        setSelectedAnnId(next.annotationId)
      } else {
        canvas.setActiveObject(objs[0])
        setSelectedAnnId(objs[0].annotationId)
      }
    }

    const num = parseInt(e.key)
    if (num >= 1 && num <= 9 && labels[num - 1]) {
      setCurrentLabelId(labels[num - 1].id)
      setShortcutHint(`${num}: ${labels[num - 1].name}`)
      setTimeout(() => setShortcutHint(''), 1500)
      e.preventDefault()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) {
      e.preventDefault()
    }

    if (e.key === '=' || e.key === '+') {
      canvas.setZoom(canvas.getZoom() * 1.2)
      canvas.renderAll()
      e.preventDefault()
    }
    if (e.key === '-') {
      canvas.setZoom(canvas.getZoom() / 1.2)
      canvas.renderAll()
      e.preventDefault()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, labels, currentLabelId, classificationAnn])

  function handleToolSelect(tool) {
    setActiveTool(tool)
    const canvas = canvasRef.current
    if (canvas) {
      canvas.selection = tool === 'select'
      canvas.discardActiveObject()
      canvas.renderAll()
    }
    if (tool === 'bbox') setShortcutHint('Drag to draw bounding box')
    else if (tool === 'polygon') setShortcutHint('Click to add points, Enter to finish')
    else if (tool === 'classification') setShortcutHint('Click to assign classification label')
    else setShortcutHint('')
  }

  async function handleRemoveClassification() {
    if (classificationAnn) {
      await onDelete(classificationAnn.id)
      setClassificationLabel(null)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          <button
            className={`${styles.toolBtn} ${activeTool === 'select' ? styles.toolActive : ''}`}
            onClick={() => handleToolSelect('select')}
            title="Select (V)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z"/></svg>
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'bbox' ? styles.toolActive : ''}`}
            onClick={() => handleToolSelect('bbox')}
            title="Bounding Box (B)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'polygon' ? styles.toolActive : ''}`}
            onClick={() => handleToolSelect('polygon')}
            title="Polygon (P)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L22 8.5V15.5L12 22L2 15.5V8.5L12 2z"/></svg>
          </button>
          <button
            className={`${styles.toolBtn} ${activeTool === 'classification' ? styles.toolActive : ''}`}
            onClick={() => handleToolSelect('classification')}
            title="Classification Label"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
          </button>
        </div>

        <div className={styles.labelGroup}>
          <span className={styles.labelLabel}>Label:</span>
          {labels.map((label, idx) => (
            <button
              key={label.id}
              className={`${styles.labelBtn} ${currentLabelId === label.id ? styles.labelActive : ''}`}
              style={{ borderColor: label.color }}
              onClick={() => { setCurrentLabelId(label.id); setShortcutHint(`${idx + 1}: ${label.name}`); setTimeout(() => setShortcutHint(''), 1500) }}
              title={`${idx + 1}: ${label.name}`}
            >
              <span className={styles.labelDot} style={{ background: label.color }} />
              {label.name}
            </button>
          ))}
        </div>

        <div className={styles.zoomGroup}>
          <button className={styles.zoomBtn} onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(c.getZoom() / 1.2); c.renderAll() } }} title="Zoom Out (-)">−</button>
          <button className={styles.zoomBtn} onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(1); c.renderAll() } }} title="Reset Zoom">1:1</button>
          <button className={styles.zoomBtn} onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(c.getZoom() * 1.2); c.renderAll() } }} title="Zoom In (+)">+</button>
        </div>
      </div>

      {shortcutHint && <div className={styles.hint}>{shortcutHint}</div>}

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasEl}
          id="annotationCanvas"
          onMouseDown={handleMouseDown}
          onClick={handleCanvasClick}
          className={styles.canvas}
        />
      </div>

      <div className={styles.sidebar}>
        <h3>Annotations</h3>
        <div className={styles.annList}>
          {annotations.filter((a) => a.type !== 'classification').map((ann) => {
            const label = labels.find((l) => l.id === ann.label_id)
            return (
              <div
                key={ann.id}
                className={`${styles.annItem} ${selectedAnnId === ann.id ? styles.annSelected : ''}`}
                onClick={() => {
                  const obj = annotationMap.current[ann.id]
                  if (obj && canvasRef.current) {
                    canvasRef.current.setActiveObject(obj)
                    canvasRef.current.renderAll()
                    setSelectedAnnId(ann.id)
                  }
                }}
              >
                <span className={styles.annDot} style={{ background: label?.color || '#e94560' }} />
                <span className={styles.annType}>{ann.type}</span>
                <span className={styles.annLabel}>{label?.name || 'unknown'}</span>
                <button
                  className={styles.annDelete}
                  onClick={(e) => {
                    e.stopPropagation()
                    const obj = annotationMap.current[ann.id]
                    if (obj && canvasRef.current) canvasRef.current.remove(obj)
                    delete annotationMap.current[ann.id]
                    onDelete(ann.id)
                  }}
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>

        <h3>Classification</h3>
        {classificationAnn ? (
          <div className={styles.classInfo}>
            <span className={styles.annDot} style={{ background: labels.find((l) => l.id === classificationAnn.label_id)?.color }} />
            <span>{labels.find((l) => l.id === classificationAnn.label_id)?.name || 'unknown'}</span>
            <button className={styles.annDelete} onClick={handleRemoveClassification}>×</button>
          </div>
        ) : (
          <p className={styles.noClass}>No classification label set.</p>
        )}
      </div>
    </div>
  )
}
