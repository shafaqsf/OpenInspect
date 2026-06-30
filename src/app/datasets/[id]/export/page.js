'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import styles from './page.module.css'

const FORMATS = [
  { id: 'coco', name: 'COCO JSON', desc: 'Object detection and segmentation with extensions for special types' },
  { id: 'yolo', name: 'YOLO Detection', desc: 'Normalized bounding boxes for YOLO training' },
  { id: 'openinspect', name: 'OpenInspect JSON', desc: 'Full-fidelity export of all annotation types' },
  { id: 'csv', name: 'CSV Summary', desc: 'Per-image overview for spreadsheets' },
]

export default function ExportPage() {
  const params = useParams()

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <div>
            <h1>Export Dataset</h1>
            <Link href={`/datasets/${params.id}`} className={styles.backLink}>&larr; Back to dataset</Link>
          </div>
        </div>

        <div className={styles.formatList}>
          {FORMATS.map((fmt) => (
            <div key={fmt.id} className={styles.formatCard}>
              <div className={styles.formatInfo}>
                <h3>{fmt.name}</h3>
                <p>{fmt.desc}</p>
              </div>
              <a
                href={`/api/datasets/${params.id}/export?format=${fmt.id}`}
                className={styles.exportBtn}
                target={fmt.id === 'coco' || fmt.id === 'openinspect' ? '_blank' : undefined}
                rel={fmt.id === 'coco' || fmt.id === 'openinspect' ? 'noreferrer' : undefined}
              >
                Download
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}