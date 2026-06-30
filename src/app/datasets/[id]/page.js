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
  const [stats, setStats] = useState(null)
  const [quality, setQuality] = useState(null)

  const load = useCallback(async () => {
    const [dsRes, statsRes, qualityRes] = await Promise.all([
      fetch(`/api/datasets/${params.id}`),
      fetch(`/api/datasets/${params.id}/stats`),
      fetch(`/api/datasets/${params.id}/quality`),
    ])
    setDataset(await dsRes.json())
    const s = await statsRes.json()
    setStats(s)
    const q = await qualityRes.json()
    setQuality(q)
  }, [params.id])

  useEffect(() => { load() }, [load])

  async function handleDeleteDataset() {
    if (!confirm('Delete this dataset and all its images, labels, and annotations?')) return
    await fetch(`/api/datasets/${params.id}`, { method: 'DELETE' })
    router.push('/datasets')
  }

  if (!dataset) return (
    <div className={styles.layout}><Sidebar /><main className={styles.main}><p>Loading...</p></main></div>
  )

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>{dataset.name}</h1>
            {dataset.description && <p className={styles.desc}>{dataset.description}</p>}
            {dataset.inspection_goal && <p className={styles.goal}>Goal: {dataset.inspection_goal}</p>}
            {dataset.default_task_type && <p className={styles.goal}>Task: {dataset.default_task_type}</p>}
          </div>
          <div className={styles.topActions}>
            <Link href={`/datasets/${params.id}/edit`} className={styles.btn}>Edit</Link>
            <button onClick={handleDeleteDataset} className={`${styles.btn} ${styles.dangerBtn}`}>Delete</button>
          </div>
        </div>

        <div className={styles.actionGrid}>
          <Link href={`/datasets/${params.id}/upload`} className={styles.actionTile}>
            <h3>Upload Images</h3>
            <p>Add images to this dataset</p>
          </Link>
          <Link href={`/datasets/${params.id}/images`} className={styles.actionTile}>
            <h3>Image Gallery</h3>
            <p>Browse and manage images</p>
          </Link>
          <Link href={`/datasets/${params.id}/labels`} className={styles.actionTile}>
            <h3>Labels</h3>
            <p>Manage annotation labels</p>
          </Link>
          <Link href={`/datasets/${params.id}/quality`} className={styles.actionTile}>
            <h3>Quality</h3>
            <p>Check dataset readiness</p>
          </Link>
          <Link href={`/datasets/${params.id}/export`} className={styles.actionTile}>
            <h3>Export</h3>
            <p>Download annotations</p>
          </Link>
        </div>

        {stats && (
          <section className={styles.section}>
            <h2>Statistics</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}><h3>Images</h3><p className={styles.statValue}>{stats.totalImages ?? 0}</p></div>
              <div className={styles.statCard}><h3>Annotated</h3><p className={styles.statValue}>{stats.totalAnnotated ?? 0}</p></div>
              <div className={styles.statCard}><h3>Unannotated</h3><p className={styles.statValue}>{stats.totalUnannotated ?? 0}</p></div>
              <div className={styles.statCard}><h3>Labels</h3><p className={styles.statValue}>{stats.labelCount ?? 0}</p></div>
            </div>
            {stats.labelDistribution && Object.keys(stats.labelDistribution).length > 0 && (
              <div className={styles.labelDist}>
                <h3>Label Distribution</h3>
                {Object.entries(stats.labelDistribution).map(([label, count]) => (
                  <div key={label} className={styles.distRow}>
                    <span>{label}</span>
                    <div className={styles.distBar}><div className={styles.distFill} style={{ width: `${(count / (stats.totalAnnotations || 1)) * 100}%` }} /></div>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {quality && (
          <section className={styles.section}>
            <h2>Quality</h2>
            <div className={styles.qualityBar}>
              <div className={styles.qualityScore}>
                <span className={styles.scoreNum}>{quality.score}</span>
                <span className={styles.scoreLabel}>/ 100</span>
              </div>
              <div className={styles.qualityCounts}>
                <span className={styles.errCount}>{quality.counts.error} errors</span>
                <span className={styles.warnCount}>{quality.counts.warning} warnings</span>
                <span className={styles.infoCount}>{quality.counts.info} notes</span>
                <Link href={`/datasets/${params.id}/quality`} className={styles.viewLink}>View details →</Link>
              </div>
            </div>
          </section>
        )}

        {stats && stats.totalImages > 0 && (
          <section className={styles.section}>
            <h2>Quick Start</h2>
            <p className={styles.quickStart}>
              <Link href={`/datasets/${params.id}/images`} className={styles.link}>Go to gallery</Link> to browse images and start annotating, or <Link href={`/datasets/${params.id}/upload`} className={styles.link}>upload more images</Link>.
            </p>
          </section>
        )}
      </main>
    </div>
  )
}