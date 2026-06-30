import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { validateDatasetPayload } from '@/lib/validation'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data, error } = await supabaseAdmin.from('datasets').select('*').eq('id', id).single()
  if (error) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params
  const body = await request.json()

  const errors = validateDatasetPayload(body)
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0].message, errors }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('datasets')
    .update({
      name: body.name.trim(),
      description: body.description || null,
      inspection_goal: body.inspection_goal || null,
      default_task_type: body.default_task_type || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data: images } = await supabaseAdmin.from('images').select('storage_path').eq('dataset_id', id)
  if (images && images.length > 0) {
    const paths = images.map((i) => i.storage_path)
    await supabaseAdmin.storage.from('dataset-images').remove(paths)
  }

  const { error } = await supabaseAdmin.from('datasets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}