import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { imageId } = await params
  const body = await request.json()

  if (body.split !== undefined && body.split !== null && !['training', 'evaluation'].includes(body.split)) {
    return NextResponse.json({ error: 'Invalid split value' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('images')
    .update({ split: body.split || null })
    .eq('id', imageId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(data.storage_path)
  return NextResponse.json({ ...data, public_url: urlData.publicUrl })
}
