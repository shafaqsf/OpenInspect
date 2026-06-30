import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

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
  return NextResponse.json(data)
}

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params
  const body = await request.json()

  if (!body.label_id || !body.type) {
    return NextResponse.json({ error: 'label_id and type are required' }, { status: 400 })
  }
  if (!['bbox', 'classification', 'segmentation'].includes(body.type)) {
    return NextResponse.json({ error: 'Invalid annotation type' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('annotations')
    .insert({ image_id: imageId, label_id: body.label_id, type: body.type, data: body.data || {} })
    .select('*, label:label_id(id, name, color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
