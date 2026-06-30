'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function DatasetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [dataset, setDataset] = useState(null)
  const [images, setImages] = useState([])
  const [stats, setStats] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [deleting, setDeleting] = useState(null)

  const load = useCallback(async () => {
    const [dsRes, imgRes, statsRes] = await Promise.all([
      fetch(`/api/datasets/${params.id}`),
      fetch(`/api/datasets/${params.id}/images`),
      fetch(`/api/datasets/${params.id}/stats`),
    ])
    setDataset(await dsRes.json())
    setImages(await imgRes.json())
    setStats(await statsRes.json())
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function handleUpload(files) {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', files[0])

    const res = await fetch(`/api/datasets/${params.id}/images`, {
      method: 'POST',
      body: formData,
    })

    if (res.ok) {
      await load()
    }
    setUploading(false)
  }

  async function handleDelete(imageId) {
    if (!confirm('Delete this image and all its annotations?')) return
    setDeleting(imageId)
    await fetch(`/api/datasets/${params.id}/images/${imageId}`, { method: 'DELETE' })
    await load()
    setDeleting(null)
  }

  async function handleSplit(imageId, split) {
    await fetch(`/api/images/${imageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ split }),
    })
    await load()
  }

  async function handleDeleteDataset() {
    if (!confirm('Delete this dataset and all its images, labels, and annotations?')) return
    await fetch(`/api/datasets/${params.id}`, { method: 'DELETE' })
    router.push('/datasets')
  }

  function handleDragOver(e) { e.preventDefault(); setDragging(true) }
  function handleDragLeave() { setDragging(false) }
  function handleDrop(e) { e.preventDefault(); setDragging(false); handleUpload(e.dataTransfer.files) }

  if (!dataset) return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}><p>Loading...</p></main>
    </div>
  )

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>{dataset.name}</h1>
            {dataset.description && <p className={styles.desc}>{dataset.description}</p>}
          </div>
          <div className={styles.topActions}>
            <Link href={`/datasets/${params.id}/edit`} className={styles.btn}>Edit</Link>
            <Link href={`/datasets/${params.id}/labels`} className={styles.btn}>Labels</Link>
            <button onClick={handleDeleteDataset} className={`${styles.btn} ${styles.dangerBtn}`}>Delete</button>
          </div>
        </div>

        {stats && (
          <div className={styles.statsRow}>
            <span>{stats.totalImages} images</span>
            <span>{stats.totalAnnotated} annotated</span>
            <span>{stats.labelCount} labels</span>
            <span>Training: {stats.splitDistribution.training}</span>
            <span>Eval: {stats.splitDistribution.evaluation}</span>
          </div>
        )}

        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/*"
            id="fileInput"
            className={styles.fileInput}
            onChange={(e) => { if (e.target.files[0]) handleUpload(e.target.files) }}
          />
          <label htmlFor="fileInput" className={styles.dropLabel}>
            {uploading ? 'Uploading...' : 'Drop images here or click to browse'}
          </label>
        </div>

        {images.length === 0 ? (
          <div className={styles.empty}>
            <p>No images yet. Upload your first image above.</p>
          </div>
        ) : (
          <div className={styles.gallery}>
            {images.map((img) => (
              <div key={img.id} className={`${styles.imageCard} ${deleting === img.id ? styles.deleting : ''}`}>
                <Link href={`/datasets/${params.id}/annotate/${img.id}`} className={styles.imageLink}>
                  <img src={img.public_url} alt={img.filename} className={styles.thumb} />
                </Link>
                <div className={styles.imageInfo}>
                  <p className={styles.filename} title={img.filename}>{img.filename}</p>
                  <p className={styles.dimensions}>{img.width}×{img.height}</p>
                  <select
                    value={img.split || ''}
                    onChange={(e) => handleSplit(img.id, e.target.value || null)}
                    className={styles.splitSelect}
                  >
                    <option value="">No split</option>
                    <option value="training">Training</option>
                    <option value="evaluation">Evaluation</option>
                  </select>
                </div>
                <div className={styles.imageActions}>
                  <Link href={`/datasets/${params.id}/annotate/${img.id}`} className={styles.actionBtn}>
                    Annotate
                  </Link>
                  <button
                    onClick={() => handleDelete(img.id)}
                    className={`${styles.actionBtn} ${styles.dangerBtn}`}
                    disabled={deleting === img.id}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
