'use client'

import { useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function UploadPage() {
  const params = useParams()
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [results, setResults] = useState([])

  async function uploadFile(file) {
    if (!file.type.match(/^image\/(jpeg|png|webp)$/)) {
      return { filename: file.name, status: 'error', error: `Unsupported type: ${file.type}` }
    }
    if (file.size === 0) {
      return { filename: file.name, status: 'error', error: 'File is empty' }
    }
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`/api/datasets/${params.id}/images`, { method: 'POST', body: formData })
    if (res.ok) {
      return { filename: file.name, status: 'ok' }
    }
    const err = await res.json()
    return { filename: file.name, status: 'error', error: err.error || 'Upload failed' }
  }

  async function handleFiles(files) {
    setUploading(true)
    const newResults = []
    for (const file of files) {
      const result = await uploadFile(file)
      newResults.push(result)
      setResults([...newResults])
    }
    setUploading(false)
  }

  function handleDragOver(e) { e.preventDefault(); setDragging(true) }
  function handleDragLeave() { setDragging(false) }
  function handleDrop(e) { e.preventDefault(); setDragging(false); handleFiles(Array.from(e.dataTransfer.files)) }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Upload Images</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>&larr; Back to dataset</Link>
          </div>
        </div>

        <div
          className={`${styles.dropZone} ${dragging ? styles.dragging : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            id="fileInput"
            className={styles.fileInput}
            onChange={(e) => handleFiles(Array.from(e.target.files))}
          />
          <label htmlFor="fileInput" className={styles.dropLabel}>
            {uploading ? 'Uploading...' : 'Drop images here or click to browse (JPEG, PNG, WebP)'}
          </label>
        </div>

        {results.length > 0 && (
          <div className={styles.results}>
            <h3>Upload Results</h3>
            <ul className={styles.resultList}>
              {results.map((r, i) => (
                <li key={i} className={`${r.status === 'error' ? styles.resultError : styles.resultOk}`}>
                  <span className={r.status === 'error' ? styles.errDot : styles.okDot} />
                  <span className={styles.resultName}>{r.filename}</span>
                  {r.status === 'error' && <span className={styles.errMsg}> — {r.error}</span>}
                  {r.status === 'ok' && <span> — uploaded</span>}
                </li>
              ))}
            </ul>
            <Link href={`/datasets/${params.id}/images`} className={styles.viewGallery}>View gallery →</Link>
          </div>
        )}
      </main>
    </div>
  )
}