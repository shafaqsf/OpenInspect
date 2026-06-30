import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { validateLabelPayload, normalizeLabelName } from '@/lib/validation'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('labels')
    .select('*')
    .eq('dataset_id', id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const labelIds = (data || []).map((l) => l.id)
  const { count } = await supabaseAdmin
    .from('annotations')
    .select('*', { count: 'exact', head: true })
    .in('label_id', labelIds)

  const labelsWithCounts = (data || []).map((l) => ({
    ...l,
    usage_count: 0,
  }))

  if (labelIds.length > 0) {
    const { data: annCounts } = await supabaseAdmin
      .from('annotations')
      .select('label_id')
      .in('label_id', labelIds)
    if (annCounts) {
      const counts = {}
      annCounts.forEach((a) => { counts[a.label_id] = (counts[a.label_id] || 0) + 1 })
      labelsWithCounts.forEach((l) => { l.usage_count = counts[l.id] || 0 })
    }
  }

  return NextResponse.json(labelsWithCounts)
}

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params
  const body = await request.json()

  const errors = validateLabelPayload(body)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('labels')
    .insert({
      dataset_id: id,
      name: body.name.trim(),
      normalized_name: normalizeLabelName(body.name),
      color: body.color || '#e94560',
      description: body.description || null,
      defect_type: body.defect_type || null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A label with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data, { status: 201 })
}