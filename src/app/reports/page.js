import Sidebar from '@/components/Sidebar'
import styles from '../planned.module.css'

export default function ReportsPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1>Reports</h1>
        <div className={styles.planned}>
          <span className={styles.badge}>Planned</span>
          <p>The reporting module is planned for a future version of OpenInspect.</p>
        </div>
      </main>
    </div>
  )
}