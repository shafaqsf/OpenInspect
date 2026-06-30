'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function SettingsPage() {
  const [copied, setCopied] = useState(false)

  const envVars = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', description: 'Supabase project URL' },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', description: 'Supabase anonymous key (client-side)' },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', description: 'Supabase service role key (server-side)' },
    { key: 'OPENROUTER_API_KEY', description: 'OpenRouter API key' },
  ]

  function handleCopy(text) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1 className={styles.title}>Settings</h1>

        <section className={styles.section}>
          <h2>Environment Variables</h2>
          <p className={styles.sectionDesc}>
            These values should be set in your <code>.env.local</code> file.
          </p>
          <div className={styles.envList}>
            {envVars.map((v) => (
              <div key={v.key} className={styles.envRow}>
                <div className={styles.envInfo}>
                  <code className={styles.envKey}>{v.key}</code>
                  <span className={styles.envDesc}>{v.description}</span>
                </div>
                <button onClick={() => handleCopy(v.key)} className={styles.copyBtn}>
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <h2>Storage</h2>
          <p className={styles.sectionDesc}>
            Images are stored in Supabase Storage bucket <code>dataset-images</code>.
            Make sure the migration script has been run to create this bucket.
          </p>
        </section>
      </main>
    </div>
  )
}
