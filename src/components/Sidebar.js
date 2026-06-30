'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/settings', label: 'Settings' },
]

const plannedLinks = [
  { href: '/training', label: 'Training' },
  { href: '/models', label: 'Models' },
  { href: '/inspection', label: 'Inspection' },
  { href: '/monitoring', label: 'Monitoring' },
  { href: '/reports', label: 'Reports' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.logoMark}>OI</div>
        <span className={styles.logo}>OpenInspect</span>
        <span className={styles.version}>v0.1</span>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href} className={`${styles.link} ${isActive ? styles.active : ''}`}>
              {link.label}
            </Link>
          )
        })}

        <div className={styles.plannedSection}>
          <p className={styles.plannedHeader}>Planned</p>
          {plannedLinks.map((link) => (
            <Link key={link.href} href={link.href} className={`${styles.link} ${styles.plannedLink}`}>
              {link.label}
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  )
}