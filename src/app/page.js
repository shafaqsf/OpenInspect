import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

export default function Dashboard() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1>Dashboard</h1>
        </div>

        <div className={styles.quickActions}>
          <Link href="/datasets" className={styles.actionCard}>
            <h3>Datasets</h3>
            <p>Manage your image datasets</p>
          </Link>
          <Link href="/datasets/new" className={styles.actionCard}>
            <h3>New Dataset</h3>
            <p>Create a new dataset to get started</p>
          </Link>
          <Link href="/settings" className={styles.actionCard}>
            <h3>Settings</h3>
            <p>Configure your workspace</p>
          </Link>
        </div>
      </main>
    </div>
  )
}
