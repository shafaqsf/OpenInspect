import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { count: totalImages } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', id)

  const { data: allImageIds } = await supabaseAdmin
    .from('images')
    .select('id')
    .eq('dataset_id', id)

  const imageIds = allImageIds?.map((i) => i.id) || []

  const { data: annotations } = await supabaseAdmin
    .from('annotations')
    .select('image_id, label:label_id(name)')
    .in('image_id', imageIds)

  const annotatedImageIds = new Set(annotations?.map((a) => a.image_id) || [])
  const totalAnnotated = annotatedImageIds.size

  const labelDistribution = {}
  annotations?.forEach((a) => {
    const name = a.label?.name || 'unknown'
    labelDistribution[name] = (labelDistribution[name] || 0) + 1
  })

  const { count: trainingCount } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', id)
    .eq('split', 'training')

  const { count: evaluationCount } = await supabaseAdmin
    .from('images')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', id)
    .eq('split', 'evaluation')

  const { count: labelCount } = await supabaseAdmin
    .from('labels')
    .select('*', { count: 'exact', head: true })
    .eq('dataset_id', id)

  return NextResponse.json({
    totalImages: totalImages || 0,
    totalAnnotated,
    totalUnannotated: (totalImages || 0) - totalAnnotated,
    labelCount: labelCount || 0,
    splitDistribution: {
      training: trainingCount || 0,
      evaluation: evaluationCount || 0,
      unassigned: (totalImages || 0) - (trainingCount || 0) - (evaluationCount || 0),
    },
    labelDistribution,
  })
}
