import Sidebar from '@/components/Sidebar'
import styles from '../planned.module.css'

export default function InspectionPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1>Inspection</h1>
        <div className={styles.planned}>
          <span className={styles.badge}>Planned</span>
          <p>The inference and inspection workflow is planned for a future version of OpenInspect.</p>
        </div>
      </main>
    </div>
  )
}