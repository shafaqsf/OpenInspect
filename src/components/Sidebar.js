import styles from './Sidebar.module.css';

export default function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.logo}>OpenInspect</h1>
        <span className={styles.version}>v0.1</span>
      </div>

      <nav className={styles.nav} />
    </aside>
  );
}
