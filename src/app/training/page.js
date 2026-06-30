import Sidebar from '@/components/Sidebar'
import styles from '../planned.module.css'

export default function TrainingPage() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <h1>Training</h1>
        <div className={styles.planned}>
          <span className={styles.badge}>Planned</span>
          <p>The model training workflow is planned for a future version of OpenInspect.</p>
          <p>This module will allow you to create training jobs, monitor training progress, and link trained models to datasets.</p>
        </div>
      </main>
    </div>
  )
}