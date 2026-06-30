import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { validateLabelPayload, normalizeLabelName } from '@/lib/validation'

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { labelId } = await params
  const body = await request.json()

  const errors = validateLabelPayload({ ...body, name: body.name || 'x' })
  if (body.name !== undefined && errors.some((e) => e.field === 'name')) {
    return NextResponse.json({ error: errors.find((e) => e.field === 'name').message }, { status: 400 })
  }

  const updates = { updated_at: new Date().toISOString() }
  if (body.name !== undefined) {
    updates.name = body.name.trim()
    updates.normalized_name = normalizeLabelName(body.name)
  }
  if (body.color !== undefined) updates.color = body.color
  if (body.description !== undefined) updates.description = body.description || null
  if (body.defect_type !== undefined) updates.defect_type = body.defect_type || null

  const { data, error } = await supabaseAdmin.from('labels').update(updates).eq('id', labelId).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'A label with this name already exists' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { labelId } = await params

  const { error } = await supabaseAdmin.from('labels').delete().eq('id', labelId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}