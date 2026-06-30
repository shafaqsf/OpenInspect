import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { runQualityChecks } from '@/lib/quality'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data: dataset, error: dsErr } = await supabaseAdmin.from('datasets').select('*').eq('id', id).single()
  if (dsErr) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })

  const { data: images } = await supabaseAdmin.from('images').select('*').eq('dataset_id', id)
  const { data: labels } = await supabaseAdmin.from('labels').select('*').eq('dataset_id', id)

  const imageIds = (images || []).map((i) => i.id)
  let annotations = []
  if (imageIds.length > 0) {
    const { data: anns } = await supabaseAdmin.from('annotations').select('*').in('image_id', imageIds)
    annotations = anns || []
  }

  const result = runQualityChecks(dataset, images || [], labels || [], annotations)
  return NextResponse.json(result)
}