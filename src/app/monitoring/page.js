import Sidebar from '@/components/Sidebar'
import styles from '../planned.module.css'

export default function MonitoringPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1>Monitoring</h1>
        <div className={styles.planned}>
          <span className={styles.badge}>Planned</span>
          <p>Production monitoring and analytics are planned for a future version of OpenInspect.</p>
        </div>
      </main>
    </div>
  )
}