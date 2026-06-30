import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isValidImageMime } from '@/lib/validation'

export async function GET(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const url = new URL(request.url)
  const filter = url.searchParams.get('filter')
  const sort = url.searchParams.get('sort') || 'newest'

  let query = supabaseAdmin.from('images').select('*').eq('dataset_id', id)

  if (sort === 'newest') query = query.order('created_at', { ascending: false })
  else if (sort === 'oldest') query = query.order('created_at', { ascending: true })
  else if (sort === 'filename') query = query.order('filename', { ascending: true })

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const images = data || []
  const imageIds = images.map((i) => i.id)
  let annotationCounts = {}
  if (imageIds.length > 0) {
    const { data: anns } = await supabaseAdmin
      .from('annotations')
      .select('image_id, type')
      .in('image_id', imageIds)
    if (anns) {
      anns.forEach((a) => {
        if (!annotationCounts[a.image_id]) annotationCounts[a.image_id] = { count: 0, types: {} }
        annotationCounts[a.image_id].count++
        annotationCounts[a.image_id].types[a.type] = (annotationCounts[a.image_id].annotatedTypes?.[a.type] || 0) + 1
      })
    }
  }

  const withMeta = images.map((img) => {
    const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(img.storage_path)
    const annInfo = annotationCounts[img.id] || { count: 0, types: {} }
    return {
      ...img,
      public_url: img.public_url || urlData.publicUrl,
      annotation_count: annInfo.count,
      annotation_types: annInfo.types,
      annotated: annInfo.count > 0,
    }
  })

  let filtered = withMeta
  if (filter === 'annotated') filtered = withMeta.filter((i) => i.annotated)
  else if (filter === 'unannotated') filtered = withMeta.filter((i) => !i.annotated)
  else if (filter === 'training') filtered = withMeta.filter((i) => i.split === 'training')
  else if (filter === 'evaluation') filtered = withMeta.filter((i) => i.split === 'evaluation')
  else if (filter === 'unassigned') filtered = withMeta.filter((i) => !i.split)
  else if (filter === 'has_bbox') filtered = withMeta.filter((i) => (i.annotation_types.bbox || 0) > 0)
  else if (filter === 'has_classification') filtered = withMeta.filter((i) => (i.annotation_types.classification || 0) > 0)
  else if (filter === 'has_polygon') filtered = withMeta.filter((i) => (i.annotation_types.segmentation || 0) > 0)

  return NextResponse.json(filtered)
}

export async function POST(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!isValidImageMime(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}. Only JPEG, PNG, and WebP are allowed.` }, { status: 400 })
  }

  if (file.size === 0) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${id}/${Date.now()}_${safeFilename}`

  const { error: uploadError } = await supabaseAdmin.storage
    .from('dataset-images')
    .upload(storagePath, buffer, { contentType: file.type, upsert: false })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: urlData } = supabaseAdmin.storage.from('dataset-images').getPublicUrl(storagePath)

  const { data, error: dbError } = await supabaseAdmin
    .from('images')
    .insert({
      dataset_id: id,
      filename: file.name,
      safe_filename: safeFilename,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      mime_type: file.type,
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

  return NextResponse.json(data, { status: 201 })
}