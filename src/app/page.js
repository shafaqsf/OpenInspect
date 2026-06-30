import Sidebar from '@/components/Sidebar';
import styles from './page.module.css';

export default function Dashboard() {
  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1>OpenInspect</h1>
        </div>
      </main>
    </div>
  );
}
