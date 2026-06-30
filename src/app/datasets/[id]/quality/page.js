'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function QualityPage() {
  const params = useParams()
  const [quality, setQuality] = useState(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetch(`/api/datasets/${params.id}/quality`)
      .then((r) => r.json())
      .then(setQuality)
  }, [params.id])

  if (!quality) return (
    <div className={styles.layout}><Sidebar /><main className={styles.main}><p>Loading...</p></main></div>
  )

  const filteredFindings = filter === 'all'
    ? quality.findings
    : quality.findings.filter((f) => f.severity === filter)

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Dataset Quality</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>&larr; Back to dataset</Link>
          </div>
        </div>

        <div className={styles.scoreCard}>
          <div className={styles.score}>
            <div className={styles.scoreCircle} style={{
              color: quality.score >= 80 ? '#27ae60' : quality.score >= 50 ? '#f39c12' : '#e94560',
              borderColor: quality.score >= 80 ? '#27ae60' : quality.score >= 50 ? '#f39c12' : '#e94560',
            }}>
              {quality.score}
            </div>
            <span className={styles.scoreLabel}>Quality Score</span>
          </div>
          <div className={styles.counts}>
            <span className={`${styles.count} ${styles.errorCount}`}>{quality.counts.error} errors</span>
            <span className={`${styles.count} ${styles.warningCount}`}>{quality.counts.warning} warnings</span>
            <span className={`${styles.count} ${styles.infoCount}`}>{quality.counts.info} notes</span>
          </div>
        </div>

        <div className={styles.filterRow}>
          <button onClick={() => setFilter('all')} className={filter === 'all' ? styles.active : ''}>All ({quality.counts.total})</button>
          <button onClick={() => setFilter('error')} className={filter === 'error' ? styles.active : ''}>Errors ({quality.counts.error})</button>
          <button onClick={() => setFilter('warning')} className={filter === 'warning' ? styles.active : ''}>Warnings ({quality.counts.warning})</button>
          <button onClick={() => setFilter('info')} className={filter === 'info' ? styles.active : ''}>Notes ({quality.counts.info})</button>
        </div>

        {filteredFindings.length === 0 ? (
          <div className={styles.noFindings}><p>No findings in this category.</p></div>
        ) : (
          <div className={styles.findingsList}>
            {filteredFindings.map((f, i) => (
              <div key={i} className={`${styles.finding} ${styles[f.severity]}`}>
                <span className={styles.severityBadge}>{f.severity}</span>
                <div>
                  <p className={styles.findingCode}>{f.code}</p>
                  <p className={styles.findingMsg}>{f.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}