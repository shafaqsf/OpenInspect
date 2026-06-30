'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

const presetColors = [
  '#e94560', '#0f3460', '#16213e', '#7f8c8d',
  '#f39c12', '#27ae60', '#2980b9', '#8e44ad',
  '#d35400', '#16a085', '#c0392b', '#2c3e50',
]

const defectTypes = [
  { value: '', label: 'None' },
  { value: 'defect', label: 'Defect' },
  { value: 'ok', label: 'OK' },
  { value: 'component', label: 'Component' },
  { value: 'text', label: 'Text' },
  { value: 'qr', label: 'QR' },
  { value: 'keypoint', label: 'Keypoint' },
  { value: 'rule', label: 'Rule' },
  { value: 'other', label: 'Other' },
]

export default function LabelsPage() {
  const params = useParams()
  const [labels, setLabels] = useState([])
  const [name, setName] = useState('')
  const [color, setColor] = useState(presetColors[0])
  const [defectType, setDefectType] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editDefectType, setEditDefectType] = useState('')

  const load = useCallback(async () => {
    const res = await fetch(`/api/datasets/${params.id}/labels`)
    setLabels(await res.json())
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) return

    const res = await fetch(`/api/datasets/${params.id}/labels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        color,
        defect_type: defectType || null,
      }),
    })

    if (res.ok) {
      setName('')
      setColor(presetColors[0])
      setDefectType('')
      await load()
    } else {
      const err = await res.json()
      alert(err.error)
    }
  }

  async function handleUpdate(labelId) {
    if (!editName.trim()) return

    const res = await fetch(`/api/datasets/${params.id}/labels/${labelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        color: editColor,
        defect_type: editDefectType || null,
      }),
    })

    if (res.ok) {
      setEditingId(null)
      await load()
    } else {
      const err = await res.json()
      alert(err.error)
    }
  }

  async function handleDelete(labelId) {
    if (!confirm('Delete this label? Annotations using it will also be removed.')) return
    await fetch(`/api/datasets/${params.id}/labels/${labelId}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Labels</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>&larr; Back to dataset</Link>
          </div>
        </div>

        <form onSubmit={handleCreate} className={styles.createForm}>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Label name" className={styles.input} required />
          <select value={defectType} onChange={(e) => setDefectType(e.target.value)} className={styles.input}>
            {defectTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <div className={styles.colorPicker}>
            {presetColors.map((c) => (
              <button key={c} type="button" className={`${styles.colorSwatch} ${color === c ? styles.selected : ''}`} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
          <button type="submit" disabled={!name.trim()} className={styles.addBtn}>Add Label</button>
        </form>

        {labels.length === 0 ? (
          <p className={styles.empty}>No labels yet. Create one above.</p>
        ) : (
          <div className={styles.list}>
            {labels.map((label) => (
              <div key={label.id} className={styles.labelRow}>
                {editingId === label.id ? (
                  <>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={styles.input} autoFocus />
                    <select value={editDefectType} onChange={(e) => setEditDefectType(e.target.value)} className={styles.input}>
                      {defectTypes.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                    <div className={styles.colorPicker}>
                      {presetColors.map((c) => (
                        <button key={c} type="button" className={`${styles.colorSwatch} ${editColor === c ? styles.selected : ''}`} style={{ background: c }} onClick={() => setEditColor(c)} />
                      ))}
                    </div>
                    <button onClick={() => handleUpdate(label.id)} className={styles.saveBtn}>Save</button>
                    <button onClick={() => setEditingId(null)} className={styles.cancelBtn}>Cancel</button>
                  </>
                ) : (
                  <>
                    <span className={styles.labelDot} style={{ background: label.color }} />
                    <span className={styles.labelName}>{label.name}</span>
                    {label.defect_type && <span className={styles.defectTag}>{label.defect_type}</span>}
                    {label.usage_count !== undefined && <span className={styles.usageCount}>{label.usage_count} uses</span>}
                    <button onClick={() => { setEditingId(label.id); setEditName(label.name); setEditColor(label.color); setEditDefectType(label.defect_type || '') }} className={styles.editBtn}>Edit</button>
                    <button onClick={() => handleDelete(label.id)} className={`${styles.editBtn} ${styles.dangerBtn}`}>Delete</button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}