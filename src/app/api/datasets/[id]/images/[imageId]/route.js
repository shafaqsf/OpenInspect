import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isValidSplit } from '@/lib/validation'

export async function DELETE(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params

  const { data: image } = await supabaseAdmin
    .from('images').select('storage_path').eq('id', imageId).single()

  if (!image) return NextResponse.json({ error: 'Image not found' }, { status: 404 })

  if (image.storage_path) {
    await supabaseAdmin.storage.from('dataset-images').remove([image.storage_path])
  }

  const { error } = await supabaseAdmin.from('images').delete().eq('id', imageId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params
  const body = await request.json()

  const updates = { updated_at: new Date().toISOString() }
  if (body.split !== undefined) {
    if (!isValidSplit(body.split)) return NextResponse.json({ error: 'Invalid split value' }, { status: 400 })
    updates.split = body.split || null
  }
  if (body.metadata !== undefined) updates.metadata = body.metadata

  const { data, error } = await supabaseAdmin
    .from('images').update(updates).eq('id', imageId).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(data.storage_path)
  return NextResponse.json({ ...data, public_url: data.public_url || urlData.publicUrl })
}