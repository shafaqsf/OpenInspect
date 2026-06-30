'use client'

import { useState, useEffect } from 'react'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function SettingsPage() {
  const [diag, setDiag] = useState(null)
  const [settings, setSettings] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/settings/diagnostics').then((r) => r.json()).then(setDiag).catch(() => {})
    fetch('/api/settings').then((r) => r.json()).then(setSettings).catch(() => {})
  }, [])

  async function saveSetting(key, value) {
    setSaving(true)
    await fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [key]: value }),
    })
    setSaving(false)
  }

  const envKeys = diag?.env ? Object.entries(diag.env) : []
  const tables = diag?.database?.tables ? Object.entries(diag.database.tables) : []
  const buckets = diag?.database?.buckets ? Object.entries(diag.database.buckets) : []

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings & Diagnostics</h1>

        <section className={styles.section}>
          <h2>Environment Variables</h2>
          {!diag ? <p>Checking...</p> : (
            <div className={styles.list}>
              {envKeys.map(([key, ok]) => (
                <div key={key} className={styles.row}>
                  <span className={ok ? styles.ok : styles.fail}>{ok ? '\u2713' : '\u2717'}</span>
                  <code>{key}</code>
                  <span className={styles.status}>{ok ? 'configured' : 'missing'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Database</h2>
          {!diag ? <p>Checking...</p> : (
            <div className={styles.list}>
              <div className={styles.row}>
                <span className={diag.database.reachable ? styles.ok : styles.fail}>
                  {diag.database.reachable ? '\u2713' : '\u2717'}
                </span>
                <span>Supabase connection</span>
                <span className={styles.status}>{diag.database.reachable ? 'reachable' : diag.database.error || 'unreachable'}</span>
              </div>
              {tables.map(([table, ok]) => (
                <div key={table} className={styles.row}>
                  <span className={ok ? styles.ok : styles.fail}>{ok ? '\u2713' : '\u2717'}</span>
                  <code>table: {table}</code>
                  <span className={styles.status}>{ok ? 'exists' : 'missing'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>Storage Buckets</h2>
          {!diag ? <p>Checking...</p> : (
            <div className={styles.list}>
              {buckets.map(([bucket, ok]) => (
                <div key={bucket} className={styles.row}>
                  <span className={ok ? styles.ok : styles.fail}>{ok ? '\u2713' : '\u2717'}</span>
                  <code>bucket: {bucket}</code>
                  <span className={styles.status}>{ok ? 'exists' : 'missing'}</span>
                </div>
              ))}
            </div>
          )}
          {diag && <p className={styles.hint}>Last checked: {new Date(diag.checkedAt).toLocaleString()}</p>}
        </section>

        <section className={styles.section}>
          <h2>App Defaults</h2>
          {settings ? (
            <div className={styles.defaults}>
              <label>
                <span>Default task type</span>
                <select
                  defaultValue={settings.default_task_type}
                  onChange={(e) => saveSetting('default_task_type', e.target.value)}
                >
                  <option value="detection">Detection</option>
                  <option value="classification">Classification</option>
                  <option value="segmentation">Segmentation</option>
                  <option value="component_verification">Component Verification</option>
                  <option value="ocr">OCR</option>
                  <option value="qr_code">QR Code</option>
                  <option value="keypoint_detection">Keypoint Detection</option>
                  <option value="rule_based">Rule Based</option>
                </select>
              </label>
              <label>
                <span>Default export format</span>
                <select
                  defaultValue={settings.default_export_format}
                  onChange={(e) => saveSetting('default_export_format', e.target.value)}
                >
                  <option value="coco">COCO JSON</option>
                  <option value="yolo">YOLO</option>
                  <option value="openinspect">OpenInspect JSON</option>
                  <option value="csv">CSV Summary</option>
                </select>
              </label>
              {saving && <span>Saving...</span>}
            </div>
          ) : <p>Loading...</p>}
        </section>
      </main>
    </div>
  )
}