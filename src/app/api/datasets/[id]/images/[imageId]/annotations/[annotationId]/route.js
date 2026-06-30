import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { annotationId } = await params
  const body = await request.json()

  const updates = { updated_at: new Date().toISOString() }
  if (body.label_id !== undefined) updates.label_id = body.label_id
  if (body.data !== undefined) updates.data = body.data
  if (body.type !== undefined) updates.type = body.type

  const { data, error } = await supabaseAdmin
    .from('annotations')
    .update(updates)
    .eq('id', annotationId)
    .select('*, label:label_id(id, name, color)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { annotationId } = await params

  const { error } = await supabaseAdmin.from('annotations').delete().eq('id', annotationId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
