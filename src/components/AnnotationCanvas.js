'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './AnnotationCanvas.module.css'

const TOOLS = [
  { id: 'select', key: 'V', label: 'Select', icon: '↖' },
  { id: 'bbox', key: 'B', label: 'BBox', icon: '▭' },
  { id: 'classification', key: 'K', label: 'Classify', icon: '🏷' },
  { id: 'polygon', key: 'P', label: 'Polygon', icon: '◇' },
  { id: 'component', key: 'C', label: 'Component', icon: '🔧' },
  { id: 'ocr', key: 'O', label: 'OCR', icon: 'T' },
  { id: 'qr_code', key: 'Q', label: 'QR', icon: '⊞' },
  { id: 'keypoint', key: 'Y', label: 'Keypoint', icon: '•' },
  { id: 'rule_region', key: 'R', label: 'Rule', icon: '⊷' },
]

const RECT_TYPES = ['bbox', 'component', 'ocr', 'qr_code', 'rule_region']

export default function AnnotationCanvas({
  image,
  labels,
  annotations,
  onSave,
  onUpdate,
  onDelete,
}) {
  const canvasEl = useRef(null)
  const fabricRef = useRef(null)
  const canvasRef = useRef(null)
  const bgImageRef = useRef(null)
  const annotationMap = useRef({})

  const [activeTool, setActiveTool] = useState('select')
  const [currentLabelId, setCurrentLabelId] = useState(labels[0]?.id || null)
  const [selectedAnnId, setSelectedAnnId] = useState(null)
  const [classificationAnn, setClassificationAnn] = useState(null)
  const [shortcutHint, setShortcutHint] = useState('')
  const [saveStatus, setSaveStatus] = useState('saved')
  const [ocrText, setOcrText] = useState('')
  const [qrValue, setQrValue] = useState('')
  const [keypointName, setKeypointName] = useState('')

  const autoSaveTimer = useRef(null)
  const polygonPoints = useRef([])
  const polygonLines = useRef([])

  useEffect(() => {
    setClassificationAnn(annotations.find((a) => a.type === 'classification') || null)
  }, [annotations])

  useEffect(() => {
    let cancelled = false

    async function init() {
      const fabric = await import('fabric')
      const canvas = new fabric.Canvas(canvasEl.current, {
        width: 800,
        height: 600,
        selection: false,
        backgroundColor: '#1a1a1a',
      })
      canvasRef.current = canvas

      const img = await fabric.FabricImage.fromURL(image.public_url)
      const scale = Math.min(760 / img.width, 560 / img.height, 1)
      img.set({
        scaleX: scale,
        scaleY: scale,
        selectable: false,
        evented: false,
        hoverCursor: 'crosshair',
      })
      canvas.setWidth(Math.min(img.width * scale, 800))
      canvas.setHeight(Math.min(img.height * scale, 600))
      canvas.centerObject(img)
      canvas.add(img)
      bgImageRef.current = img

      renderAnnotations(fabric, canvas)

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
        fabricRef.current = null
      }
    }
  }, [image.public_url])

  function getLabel(labelId) {
    return labels.find((l) => l.id === labelId)
  }

  function renderAnnotations(fabric, canvas) {
    canvas.getObjects().forEach((obj) => {
      if (obj !== bgImageRef.current) canvas.remove(obj)
    })
    annotationMap.current = {}

    annotations.forEach((ann) => {
      if (ann.type === 'classification') return
      const label = getLabel(ann.label_id)
      const color = label?.color || '#e94560'
      let obj = null

      if (RECT_TYPES.includes(ann.type)) {
        const d = ann.data
        obj = new fabric.Rect({
          left: d.x,
          top: d.y,
          width: d.width,
          height: d.height,
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
          strokeUniform: true,
          lockRotation: true,
        })
      } else if (ann.type === 'segmentation') {
        const pts = (ann.data.points || []).map((p) => ({ x: p.x, y: p.y }))
        if (pts.length < 3) return
        obj = new fabric.Polygon(pts, {
          fill: 'transparent',
          stroke: color,
          strokeWidth: 2,
          strokeUniform: true,
          objectCaching: false,
          lockRotation: true,
        })
      } else if (ann.type === 'keypoint') {
        const d = ann.data
        obj = new fabric.Circle({
          left: d.x - 5,
          top: d.y - 5,
          radius: 5,
          fill: color,
          stroke: '#fff',
          strokeWidth: 1,
          hasControls: false,
          lockMovementX: false,
          lockMovementY: false,
        })
      }

      if (obj) {
        obj.annotationId = ann.id
        obj.annotationType = ann.type
        obj.labelData = { id: ann.label_id, name: label?.name, color }
        obj.on('modified', () => handleModified(ann.id, obj))
        obj.on('selected', () => setSelectedAnnId(ann.id))
        canvas.add(obj)
        annotationMap.current[ann.id] = obj
      }
    })

    canvas.renderAll()
  }

  function handleModified(annId, obj) {
    setSaveStatus('saving')
    clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(() => {
      const ann = annotations.find((a) => a.id === annId)
      if (!ann) return
      let data
      if (RECT_TYPES.includes(obj.annotationType)) {
        data = { x: obj.left, y: obj.top, width: obj.width * obj.scaleX, height: obj.height * obj.scaleY }
        if (ann.type === 'component') data.expected_present = ann.data?.expected_present ?? true
        if (ann.type === 'ocr') data.text = ann.data?.text || ''
        if (ann.type === 'qr_code') data.value = ann.data?.value || ''
      } else if (obj.annotationType === 'segmentation') {
        data = { points: obj.points.map((p) => ({ x: p.x + obj.left, y: p.y + obj.top })) }
      } else if (obj.annotationType === 'keypoint') {
        data = { x: obj.left + 5, y: obj.top + 5, name: ann.data?.name || '' }
      }
      onUpdate(annId, data, ann.label_id)
      setSaveStatus('saved')
    }, 300)
  }

  function handleMouseDown(e) {
    const fabric = fabricRef.current
    const canvas = canvasRef.current
    if (!fabric || !canvas) return
    if (activeTool === 'select') return

    const pointer = canvas.getPointer(e)

    if (RECT_TYPES.includes(activeTool)) {
      startRectDraw(fabric, canvas, pointer)
    } else if (activeTool === 'polygon') {
      addPolygonPoint(canvas, pointer)
    } else if (activeTool === 'keypoint') {
      addKeypoint(fabric, canvas, pointer)
    } else if (activeTool === 'classification') {
      handleClassify()
    }
  }

  function startRectDraw(fabric, canvas, pointer) {
    const label = getLabel(currentLabelId)
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
      selectable: false,
    })
    canvas.add(rect)

    function onMouseMove(ev) {
      const p = canvas.getPointer(ev)
      rect.set({
        left: Math.min(pointer.x, p.x),
        top: Math.min(pointer.y, p.y),
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
        return
      }

      rect.set({ hasControls: true, selectable: true, lockRotation: true })
      canvas.renderAll()

      let data = { x: rect.left, y: rect.top, width: rect.width, height: rect.height }
      if (activeTool === 'component') data.expected_present = true
      if (activeTool === 'ocr') data.text = ocrText || ''
      if (activeTool === 'qr_code') data.value = qrValue || ''

      setSaveStatus('saving')
      onSave(currentLabelId, activeTool, data).then((ann) => {
        if (ann) {
          rect.annotationId = ann.id
          rect.annotationType = activeTool
          rect.labelData = { id: ann.label_id, name: label?.name, color }
          rect.on('modified', () => handleModified(ann.id, rect))
          rect.on('selected', () => setSelectedAnnId(ann.id))
          annotationMap.current[ann.id] = rect
          setSaveStatus('saved')
        }
      })
    }

    canvas.on('mouse:move', onMouseMove)
    canvas.on('mouse:up', onMouseUp)
  }

  function addPolygonPoint(canvas, pointer) {
    polygonPoints.current.push({ x: pointer.x, y: pointer.y })
    if (polygonPoints.current.length === 1) {
      setShortcutHint('Click to add points, Enter to finish, Esc to cancel')
    }

    const fabric = fabricRef.current
    if (!fabric) return

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
      const line = new fabric.Line(
        [pts[pts.length - 2].x, pts[pts.length - 2].y, pointer.x, pointer.y],
        { stroke: '#e94560', strokeWidth: 2, selectable: false, evented: false }
      )
      canvas.add(line)
      polygonLines.current.push(line)
    }
    canvas.renderAll()
  }

  function finishPolygon() {
    const fabric = fabricRef.current
    const canvas = canvasRef.current
    if (!fabric || !canvas || polygonPoints.current.length < 3) return

    const label = getLabel(currentLabelId)
    const color = label?.color || '#e94560'

    const poly = new fabric.Polygon(polygonPoints.current, {
      fill: 'transparent',
      stroke: color,
      strokeWidth: 2,
      strokeUniform: true,
      objectCaching: false,
      lockRotation: true,
    })

    polygonLines.current.forEach((o) => canvas.remove(o))
    polygonLines.current = []
    const pts = polygonPoints.current
    polygonPoints.current = []

    canvas.add(poly)
    canvas.renderAll()
    setShortcutHint('')

    const data = { points: pts.map((p) => ({ x: p.x, y: p.y })) }
    setSaveStatus('saving')
    onSave(currentLabelId, 'segmentation', data).then((ann) => {
      if (ann) {
        poly.annotationId = ann.id
        poly.annotationType = 'segmentation'
        poly.labelData = { id: ann.label_id, name: label?.name, color }
        poly.on('modified', () => handleModified(ann.id, poly))
        poly.on('selected', () => setSelectedAnnId(ann.id))
        annotationMap.current[ann.id] = poly
        setSaveStatus('saved')
      }
    })
  }

  function cancelPolygon() {
    const canvas = canvasRef.current
    if (!canvas) return
    polygonLines.current.forEach((o) => canvas.remove(o))
    polygonLines.current = []
    polygonPoints.current = []
    setShortcutHint('')
    canvas.renderAll()
  }

  function addKeypoint(fabric, canvas, pointer) {
    const label = getLabel(currentLabelId)
    const color = label?.color || '#e94560'

    const point = new fabric.Circle({
      left: pointer.x - 5,
      top: pointer.y - 5,
      radius: 5,
      fill: color,
      stroke: '#fff',
      strokeWidth: 1,
      hasControls: false,
      lockRotation: true,
    })
    canvas.add(point)
    canvas.renderAll()

    const data = { x: pointer.x, y: pointer.y, name: keypointName || '' }
    setSaveStatus('saving')
    onSave(currentLabelId, 'keypoint', data).then((ann) => {
      if (ann) {
        point.annotationId = ann.id
        point.annotationType = 'keypoint'
        point.labelData = { id: ann.label_id, name: label?.name, color }
        point.on('modified', () => handleModified(ann.id, point))
        point.on('selected', () => setSelectedAnnId(ann.id))
        annotationMap.current[ann.id] = point
        setSaveStatus('saved')
      }
    })
  }

  async function handleClassify() {
    if (!currentLabelId) return
    setSaveStatus('saving')
    if (classificationAnn) {
      await onUpdate(classificationAnn.id, { scope: 'image' }, currentLabelId)
    } else {
      await onSave(currentLabelId, 'classification', { scope: 'image' })
    }
    setSaveStatus('saved')
    setShortcutHint('')
  }

  function handleKeyDown(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return

    const tool = TOOLS.find((t) => t.key.toLowerCase() === e.key.toLowerCase())
    if (tool) {
      setActiveTool(tool.id)
      const canvas = canvasRef.current
      if (canvas) {
        canvas.selection = tool.id === 'select'
        canvas.discardActiveObject()
        canvas.renderAll()
      }
      if (tool.id === 'polygon') setShortcutHint('Click to add points, Enter to finish')
      else if (tool.id === 'classification') setShortcutHint('Click canvas to assign classification')
      else if (tool.id === 'select') setShortcutHint('')
      else setShortcutHint(`Draw to create ${tool.label}`)
      e.preventDefault()
      return
    }

    if (activeTool === 'polygon') {
      if (e.key === 'Enter') { finishPolygon(); e.preventDefault() }
      else if (e.key === 'Escape') { cancelPolygon(); e.preventDefault() }
    }

    if (e.key === 'Delete' || e.key === 'Backspace') {
      const canvas = canvasRef.current
      const active = canvas?.getActiveObject()
      if (active && active.annotationId) {
        canvas.remove(active)
        delete annotationMap.current[active.annotationId]
        onDelete(active.annotationId)
        setSelectedAnnId(null)
      }
      e.preventDefault()
    }

    const num = parseInt(e.key)
    if (num >= 1 && num <= 9 && labels[num - 1]) {
      setCurrentLabelId(labels[num - 1].id)
      e.preventDefault()
    }

    if (e.key === '0') {
      canvasRef.current?.setZoom(1)
      canvasRef.current?.renderAll()
      e.preventDefault()
    }
    if (e.key === '+' || e.key === '=') {
      const c = canvasRef.current
      if (c) { c.setZoom(c.getZoom() * 1.2); c.renderAll() }
      e.preventDefault()
    }
    if (e.key === '-') {
      const c = canvasRef.current
      if (c) { c.setZoom(c.getZoom() / 1.2); c.renderAll() }
      e.preventDefault()
    }

    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault()
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeTool, labels, currentLabelId, classificationAnn])

  const visibleAnnotations = annotations.filter((a) => a.type !== 'classification')

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <div className={styles.toolGroup}>
          {TOOLS.map((tool) => (
            <button
              key={tool.id}
              className={`${styles.toolBtn} ${activeTool === tool.id ? styles.toolActive : ''}`}
              onClick={() => {
                setActiveTool(tool.id)
                const c = canvasRef.current
                if (c) { c.selection = tool.id === 'select'; c.discardActiveObject(); c.renderAll() }
                if (tool.id === 'polygon') setShortcutHint('Click to add points, Enter to finish')
                else if (tool.id === 'classification') setShortcutHint('Click canvas to assign classification')
                else if (tool.id === 'select') setShortcutHint('')
                else setShortcutHint(`Draw to create ${tool.label}`)
              }}
              title={`${tool.label} (${tool.key})`}
            >
              <span className={styles.toolIcon}>{tool.icon}</span>
              <span className={styles.toolKey}>{tool.key}</span>
            </button>
          ))}
        </div>

        <div className={styles.labelGroup}>
          <span className={styles.labelLabel}>Label:</span>
          {labels.map((label, idx) => (
            <button
              key={label.id}
              className={`${styles.labelBtn} ${currentLabelId === label.id ? styles.labelActive : ''}`}
              style={{ borderColor: label.color }}
              onClick={() => setCurrentLabelId(label.id)}
              title={`${idx + 1}: ${label.name}`}
            >
              <span className={styles.labelDot} style={{ background: label.color }} />
              {label.name}
            </button>
          ))}
        </div>

        <div className={styles.rightGroup}>
          <span className={styles.saveStatus}>{saveStatus}</span>
          <button onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(c.getZoom() / 1.2); c.renderAll() } }}>−</button>
          <button onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(1); c.renderAll() } }}>1:1</button>
          <button onClick={() => { const c = canvasRef.current; if (c) { c.setZoom(c.getZoom() * 1.2); c.renderAll() } }}>+</button>
        </div>
      </div>

      {(activeTool === 'ocr' || activeTool === 'qr_code' || activeTool === 'keypoint') && (
        <div className={styles.metaInputs}>
          {activeTool === 'ocr' && (
            <input type="text" placeholder="OCR text transcription (optional)" value={ocrText} onChange={(e) => setOcrText(e.target.value)} className={styles.metaInput} />
          )}
          {activeTool === 'qr_code' && (
            <input type="text" placeholder="QR decoded value (optional)" value={qrValue} onChange={(e) => setQrValue(e.target.value)} className={styles.metaInput} />
          )}
          {activeTool === 'keypoint' && (
            <input type="text" placeholder="Keypoint name (optional)" value={keypointName} onChange={(e) => setKeypointName(e.target.value)} className={styles.metaInput} />
          )}
        </div>
      )}

      {shortcutHint && <div className={styles.hint}>{shortcutHint}</div>}

      <div className={styles.canvasWrapper}>
        <canvas
          ref={canvasEl}
          onMouseDown={handleMouseDown}
          className={styles.canvas}
        />
      </div>

      <div className={styles.sidebar}>
        <h3>Annotations ({visibleAnnotations.length})</h3>
        <div className={styles.annList}>
          {visibleAnnotations.map((ann) => {
            const label = getLabel(ann.label_id)
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
                <span className={styles.annLabel}>{label?.name || '?'}</span>
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
            <span className={styles.annDot} style={{ background: getLabel(classificationAnn.label_id)?.color }} />
            <span>{getLabel(classificationAnn.label_id)?.name || '?'}</span>
            <button className={styles.annDelete} onClick={() => { onDelete(classificationAnn.id) }}>×</button>
          </div>
        ) : (
          <p className={styles.noClass}>No classification label set.</p>
        )}

        <h3>Shortcuts</h3>
        <div className={styles.shortcutList}>
          {TOOLS.map((t) => (
            <div key={t.id} className={styles.shortcutRow}>
              <code>{t.key}</code>
              <span>{t.label}</span>
            </div>
          ))}
          <div className={styles.shortcutRow}><code>1–9</code><span>Select label</span></div>
          <div className={styles.shortcutRow}><code>Enter</code><span>Finish polygon</span></div>
          <div className={styles.shortcutRow}><code>Esc</code><span>Cancel drawing</span></div>
          <div className={styles.shortcutRow}><code>Del</code><span>Delete selected</span></div>
          <div className={styles.shortcutRow}><code>0</code><span>Reset zoom</span></div>
        </div>
      </div>
    </div>
  )
}