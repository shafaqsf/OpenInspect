'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

const AnnotationCanvas = dynamic(
  () => import('@/components/AnnotationCanvas'),
  { ssr: false }
)

export default function AnnotatePage() {
  const params = useParams()
  const [image, setImage] = useState(null)
  const [labels, setLabels] = useState([])
  const [annotations, setAnnotations] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [imgRes, lblRes, annRes] = await Promise.all([
      fetch(`/api/datasets/${params.id}/images`).then((r) => r.json()),
      fetch(`/api/datasets/${params.id}/labels`).then((r) => r.json()),
      fetch(`/api/datasets/${params.id}/images/${params.imageId}/annotations`).then((r) => r.json()),
    ])

    const img = imgRes.find((i) => i.id === params.imageId)
    setImage(img || null)
    setLabels(lblRes)
    setAnnotations(annRes)
    setLoading(false)
  }, [params.id, params.imageId])

  useEffect(() => { load() }, [load])

  async function saveAnnotation(labelId, type, data) {
    const res = await fetch(`/api/datasets/${params.id}/images/${params.imageId}/annotations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label_id: labelId, type, data }),
    })
    if (res.ok) {
      const created = await res.json()
      setAnnotations((prev) => [...prev, created])
    }
  }

  async function updateAnnotation(annotationId, data, labelId) {
    const res = await fetch(
      `/api/datasets/${params.id}/images/${params.imageId}/annotations/${annotationId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data, label_id: labelId }),
      }
    )
    if (res.ok) {
      const updated = await res.json()
      setAnnotations((prev) => prev.map((a) => (a.id === annotationId ? updated : a)))
    }
  }

  async function deleteAnnotation(annotationId) {
    await fetch(
      `/api/datasets/${params.id}/images/${params.imageId}/annotations/${annotationId}`,
      { method: 'DELETE' }
    )
    setAnnotations((prev) => prev.filter((a) => a.id !== annotationId))
  }

  if (loading) {
    return (
      <div className={styles.layout}>
        <Sidebar />
        <main className={styles.main}><p>Loading...</p></main>
      </div>
    )
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Annotation</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>
              &larr; Back to dataset
            </Link>
          </div>
          {image && (
            <p className={styles.imageInfo}>
              {image.filename} &middot; {image.width}&times;{image.height}
            </p>
          )}
        </div>

        {labels.length === 0 ? (
          <div className={styles.noLabels}>
            <p>No labels defined yet.</p>
            <Link href={`/datasets/${params.id}/labels`} className={styles.link}>
              Create labels first
            </Link>
          </div>
        ) : !image ? (
          <p className={styles.error}>Image not found.</p>
        ) : (
          <AnnotationCanvas
            image={image}
            labels={labels}
            annotations={annotations}
            onSave={saveAnnotation}
            onUpdate={updateAnnotation}
            onDelete={deleteAnnotation}
          />
        )}
      </main>
    </div>
  )
}
