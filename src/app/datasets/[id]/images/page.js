'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

const FILTERS = [
  { value: '', label: 'All' },
  { value: 'annotated', label: 'Annotated' },
  { value: 'unannotated', label: 'Unannotated' },
  { value: 'training', label: 'Training' },
  { value: 'evaluation', label: 'Evaluation' },
  { value: 'unassigned', label: 'Unassigned' },
]

export default function ImageGalleryPage() {
  const params = useParams()
  const [images, setImages] = useState([])
  const [filter, setFilter] = useState('')
  const [sort, setSort] = useState('newest')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const url = `/api/datasets/${params.id}/images?filter=${filter}&sort=${sort}`
    const res = await fetch(url)
    const data = await res.json()
    setImages(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [params.id, filter, sort])

  useEffect(() => { load() }, [load])

  async function handleSplit(imageId, split) {
    await fetch(`/api/images/${imageId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ split }),
    })
    await load()
  }

  async function handleDelete(imageId) {
    if (!confirm('Delete this image and all its annotations?')) return
    await fetch(`/api/datasets/${params.id}/images/${imageId}`, { method: 'DELETE' })
    await load()
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Image Gallery</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>&larr; Back to dataset</Link>
          </div>
          <div className={styles.controls}>
            <select value={filter} onChange={(e) => setFilter(e.target.value)} className={styles.select}>
              {FILTERS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className={styles.select}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="filename">Filename</option>
            </select>
            <Link href={`/datasets/${params.id}/upload`} className={styles.uploadBtn}>Upload</Link>
          </div>
        </div>

        {loading ? <p>Loading...</p> : images.length === 0 ? (
          <div className={styles.empty}>
            <p>No images found.</p>
            <Link href={`/datasets/${params.id}/upload`} className={styles.uploadBtn}>Upload images</Link>
          </div>
        ) : (
          <div className={styles.gallery}>
            {images.map((img) => (
              <div key={img.id} className={styles.imageCard}>
                <Link href={`/datasets/${params.id}/annotate/${img.id}`}>
                  <img src={img.public_url} alt={img.filename} className={styles.thumb} />
                </Link>
                <div className={styles.info}>
                  <p className={styles.filename} title={img.filename}>{img.filename}</p>
                  <p className={styles.dimensions}>{img.width || '?'}x{img.height || '?'}</p>
                  <div className={styles.badges}>
                    {img.split && <span className={`${styles.badge} ${styles[img.split]}`}>{img.split}</span>}
                    <span className={`${styles.badge} ${img.annotated ? styles.annotated : styles.unannotated}`}>
                      {img.annotation_count || 0} ann
                    </span>
                  </div>
                  <div className={styles.row}>
                    <select value={img.split || ''} onChange={(e) => handleSplit(img.id, e.target.value || null)} className={styles.splitSelect}>
                      <option value="">No split</option>
                      <option value="training">Training</option>
                      <option value="evaluation">Evaluation</option>
                    </select>
                    <Link href={`/datasets/${params.id}/annotate/${img.id}`} className={styles.actionBtn}>Annotate</Link>
                    <button onClick={() => handleDelete(img.id)} className={`${styles.actionBtn} ${styles.danger}`}>Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}