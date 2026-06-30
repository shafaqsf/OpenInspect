'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function NewDatasetPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)

    const res = await fetch('/api/datasets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })

    if (!res.ok) {
      alert('Failed to create dataset')
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
          <div className={styles.field}>
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. PCB Defect Detection"
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="description">Description (optional)</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this dataset is for..."
              rows={3}
            />
          </div>

          <div className={styles.actions}>
            <button type="submit" disabled={saving || !name.trim()} className={styles.saveBtn}>
              {saving ? 'Creating...' : 'Create Dataset'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
