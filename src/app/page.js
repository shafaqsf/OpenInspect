'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [diag, setDiag] = useState(null)

  useEffect(() => {
    fetch('/api/dashboard/summary').then((r) => r.json()).then(setSummary).catch(() => setSummary(null))
    fetch('/api/settings/diagnostics').then((r) => r.json()).then(setDiag).catch(() => setDiag(null))
  }, [])

  const cards = summary ? [
    { label: 'Datasets', value: summary.totalDatasets, link: '/datasets' },
    { label: 'Images', value: summary.totalImages },
    { label: 'Annotated', value: summary.annotatedImages },
    { label: 'Unannotated', value: summary.unannotatedImages },
    { label: 'Labels', value: summary.totalLabels },
    { label: 'Annotations', value: summary.totalAnnotations },
    { label: 'Exportable', value: summary.exportableDatasets },
  ] : []

  const envKeys = diag?.env ? Object.entries(diag.env) : []
  const tables = diag?.database?.tables ? Object.entries(diag.database.tables) : []
  const buckets = diag?.database?.buckets ? Object.entries(diag.database.buckets) : []
  const dbReachable = diag?.database?.reachable

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}><h1>Dashboard</h1></div>

        <div className={styles.quickActions}>
          <Link href="/datasets/new" className={styles.actionCard}><h3>+ New Dataset</h3></Link>
          <Link href="/datasets" className={styles.actionCard}><h3>Datasets</h3></Link>
          <Link href="/settings" className={styles.actionCard}><h3>Settings</h3></Link>
        </div>

        <section className={styles.section}>
          <h2>Summary</h2>
          {!summary ? (
            <p className={styles.loading}>Loading...</p>
          ) : summary.totalDatasets === 0 ? (
            <div className={styles.empty}><p>No datasets yet. Create one to get started.</p></div>
          ) : (
            <div className={styles.summaryGrid}>
              {cards.map((c) => (
                <div key={c.label} className={styles.summaryCard}>
                  <h3>{c.label}</h3>
                  <p className={styles.summaryValue}>{c.value}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>System Readiness</h2>
          {!diag ? (
            <p className={styles.loading}>Checking...</p>
          ) : (
            <div className={styles.readiness}>
              <div className={styles.readinessGroup}>
                <h3>Environment</h3>
                {envKeys.map(([key, ok]) => (
                  <div key={key} className={styles.readinessRow}>
                    <span className={ok ? styles.ok : styles.fail}>{ok ? '✓' : '✗'}</span>
                    <code>{key}</code>
                    <span className={styles.readinessStatus}>{ok ? 'configured' : 'missing'}</span>
                  </div>
                ))}
              </div>

              <div className={styles.readinessGroup}>
                <h3>Database</h3>
                <div className={styles.readinessRow}>
                  <span className={dbReachable ? styles.ok : styles.fail}>{dbReachable ? '✓' : '✗'}</span>
                  <span>Supabase connection</span>
                  <span className={styles.readinessStatus}>{dbReachable ? 'reachable' : (diag.database?.error || 'unreachable')}</span>
                </div>
                {tables.map(([table, ok]) => (
                  <div key={table} className={styles.readinessRow}>
                    <span className={ok ? styles.ok : styles.fail}>{ok ? '✓' : '✗'}</span>
                    <code>table: {table}</code>
                    <span className={styles.readinessStatus}>{ok ? 'exists' : 'missing'}</span>
                  </div>
                ))}
              </div>

              <div className={styles.readinessGroup}>
                <h3>Storage Buckets</h3>
                {buckets.map(([bucket, ok]) => (
                  <div key={bucket} className={styles.readinessRow}>
                    <span className={ok ? styles.ok : styles.fail}>{ok ? '✓' : '✗'}</span>
                    <code>bucket: {bucket}</code>
                    <span className={styles.readinessStatus}>{ok ? 'exists' : 'missing'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}