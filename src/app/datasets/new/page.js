'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

const TASK_TYPES = [
  { value: '', label: 'None' },
  { value: 'classification', label: 'Classification' },
  { value: 'detection', label: 'Detection' },
  { value: 'segmentation', label: 'Segmentation' },
  { value: 'component_verification', label: 'Component Verification' },
  { value: 'ocr', label: 'OCR' },
  { value: 'qr_code', label: 'QR Code' },
  { value: 'keypoint_detection', label: 'Keypoint Detection' },
  { value: 'rule_based', label: 'Rule Based' },
]

export default function NewDatasetPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [inspectionGoal, setInspectionGoal] = useState('')
  const [taskType, setTaskType] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError('')

    const res = await fetch('/api/datasets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        inspection_goal: inspectionGoal,
        default_task_type: taskType || null,
      }),
    })

    if (!res.ok) {
      const err = await res.json()
      setError(err.error || 'Failed to create dataset')
      setSaving(false)
      return
    }

    const data = await res.json()
    router.push(`/datasets/${data.id}`)
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>New Dataset</h1>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.field}>
            <label htmlFor="name">Name *</label>
            <input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus maxLength={200} />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>

          <div className={styles.field}>
            <label htmlFor="inspectionGoal">Inspection Goal</label>
            <input id="inspectionGoal" type="text" value={inspectionGoal} onChange={(e) => setInspectionGoal(e.target.value)} placeholder="e.g. Detect surface scratches on metal parts" />
          </div>

          <div className={styles.field}>
            <label htmlFor="taskType">Default Task Type</label>
            <select id="taskType" value={taskType} onChange={(e) => setTaskType(e.target.value)}>
              {TASK_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <button type="submit" disabled={saving || !name.trim()} className={styles.saveBtn}>
            {saving ? 'Creating...' : 'Create Dataset'}
          </button>
        </form>
      </main>
    </div>
  )
}