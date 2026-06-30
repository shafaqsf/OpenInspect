import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

const REQUIRED_TABLES = [
  'datasets', 'labels', 'images', 'annotations',
  'quality_findings', 'export_jobs', 'app_settings',
]

const REQUIRED_BUCKETS = ['dataset-images', 'dataset-exports']

export async function GET() {
  const checks = {
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENROUTER_API_KEY: !!process.env.OPENROUTER_API_KEY,
    },
    database: { reachable: false, tables: {}, buckets: {}, error: null },
    checkedAt: new Date().toISOString(),
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    checks.database.error = 'Supabase not configured'
    return NextResponse.json(checks)
  }

  try {
    const { error } = await supabaseAdmin.from('datasets').select('id').limit(1)
    checks.database.reachable = !error

    for (const table of REQUIRED_TABLES) {
      const { error: tErr } = await supabaseAdmin.from(table).select('id').limit(1)
      checks.database.tables[table] = !tErr
    }

    const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets()
    if (bErr) {
      checks.database.bucketError = bErr.message
    } else {
      const bucketIds = new Set((buckets || []).map((b) => b.id))
      for (const b of REQUIRED_BUCKETS) {
        checks.database.buckets[b] = bucketIds.has(b)
      }
    }
  } catch (e) {
    checks.database.error = e.message
  }

  return NextResponse.json(checks)
}