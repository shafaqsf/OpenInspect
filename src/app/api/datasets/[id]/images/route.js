import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('images')
    .select('*')
    .eq('dataset_id', id)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const imagesWithUrls = data.map((img) => {
    const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(img.storage_path)
    return { ...img, public_url: urlData.publicUrl }
  })

  return NextResponse.json(imagesWithUrls)
}

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const buffer = Buffer.from(await file.arrayBuffer())
  const filename = `${Date.now()}_${file.name}`
  const storagePath = `${id}/${filename}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('dataset-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data, error: dbError } = await supabaseAdmin
    .from('images')
    .insert({
      dataset_id: id,
      filename: file.name,
      storage_path: storagePath,
      width: 0,
      height: 0,
      file_size: buffer.length,
    })
    .select()
    .single()

  if (dbError) {
    await supabaseAdmin.storage.from('dataset-images').remove([storagePath])
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(data.storage_path)
  return NextResponse.json({ ...data, public_url: urlData.publicUrl }, { status: 201 })
}
