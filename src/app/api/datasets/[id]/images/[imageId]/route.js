import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function DELETE(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id, imageId } = await params

  const { data: image } = await supabaseAdmin
    .from('images')
    .select('storage_path')
    .eq('id', imageId)
    .single()

  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  await supabaseAdmin.storage.from('dataset-images').remove([image.storage_path])
  const { error } = await supabaseAdmin.from('images').delete().eq('id', imageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params
  const body = await request.json()

  if (body.split && !['training', 'evaluation', null].includes(body.split)) {
    return NextResponse.json({ error: 'Invalid split value' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('images')
    .update({ split: body.split || null })
    .eq('id', imageId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
