'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Sidebar.module.css'

const links = [
  { href: '/', label: 'Dashboard' },
  { href: '/datasets', label: 'Datasets' },
  { href: '/settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <h1 className={styles.logo}>OpenInspect</h1>
        <span className={styles.version}>v0.1</span>
      </div>

      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.link} ${isActive ? styles.active : ''}`}
            >
              {link.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
