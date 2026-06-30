import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { validateAnnotationPayload } from '@/lib/validation'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params

  const { data, error } = await supabaseAdmin
    .from('annotations')
    .select('*, label:label_id(id, name, color)')
    .eq('image_id', imageId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id, imageId } = await params
  const body = await request.json()

  const errors = validateAnnotationPayload(body)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('annotations')
    .insert({
      dataset_id: id,
      image_id: imageId,
      label_id: body.label_id,
      type: body.type,
      data: body.data || {},
      metadata: body.metadata || null,
    })
    .select('*, label:label_id(id, name, color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}