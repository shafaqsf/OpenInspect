import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import styles from './page.module.css'

export const dynamic = 'force-dynamic'

export default async function DatasetsPage() {
  const supabaseAdmin = getSupabaseAdmin()
  let datasets = []

  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('datasets')
      .select('*')
      .order('created_at', { ascending: false })
    datasets = data || []
  }

  return (
    <div className={styles.layout}>
      <Sidebar />
      <main className={styles.main}>
        <div className={styles.topBar}>
          <h1>Datasets</h1>
          <Link href="/datasets/new" className={styles.createBtn}>+ New Dataset</Link>
        </div>

        {datasets.length === 0 ? (
          <div className={styles.empty}>
            <p>No datasets yet.</p>
            <Link href="/datasets/new" className={styles.createBtn}>Create your first dataset</Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {datasets.map((ds) => (
              <Link key={ds.id} href={`/datasets/${ds.id}`} className={styles.card}>
                <div className={styles.cardBody}>
                  <h3>{ds.name}</h3>
                  {ds.description && <p>{ds.description}</p>}
                </div>
                <div className={styles.cardFooter}>
                  <span>{new Date(ds.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
