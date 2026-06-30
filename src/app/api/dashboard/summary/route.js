import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  let summary = {
    totalDatasets: 0,
    totalImages: 0,
    annotatedImages: 0,
    unannotatedImages: 0,
    totalLabels: 0,
    totalAnnotations: 0,
    exportableDatasets: 0,
  }

  let dConnErr = null
  try {
    const { count: dsCount } = await supabaseAdmin.from('datasets').select('*', { count: 'exact', head: true })
    summary.totalDatasets = dsCount || 0

    const { count: imgCount } = await supabaseAdmin.from('images').select('*', { count: 'exact', head: true })
    summary.totalImages = imgCount || 0

    const { count: lblCount } = await supabaseAdmin.from('labels').select('*', { count: 'exact', head: true })
    summary.totalLabels = lblCount || 0

    const { count: annCount } = await supabaseAdmin.from('annotations').select('*', { count: 'exact', head: true })
    summary.totalAnnotations = annCount || 0

    if (summary.totalImages > 0) {
      const { data: imgs } = await supabaseAdmin.from('images').select('id')
      const { data: annotated } = await supabaseAdmin
        .from('annotations')
        .select('image_id')
        .in('image_id', (imgs || []).map((i) => i.id))
      const annotatedIds = new Set((annotated || []).map((a) => a.image_id))
      summary.annotatedImages = annotatedIds.size
      summary.unannotatedImages = summary.totalImages - annotatedIds.size
    }

    if (summary.totalImages > 0 && summary.totalLabels > 0) {
      const { count } = await supabaseAdmin
        .from('images')
        .select('*', { count: 'exact', head: true })
        .limit(1)
      if (count !== null) summary.exportableDatasets = summary.totalDatasets
    }
  } catch (e) {
    dConnErr = e.message
  }

  return NextResponse.json({ ...summary, dbError: dConnErr })
}