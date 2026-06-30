import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data: images, error: imgError } = await supabaseAdmin
    .from('images')
    .select('id, filename, width, height')
    .eq('dataset_id', id)

  if (imgError) return NextResponse.json({ error: imgError.message }, { status: 500 })

  const { data: labels, error: lblError } = await supabaseAdmin
    .from('labels')
    .select('id, name')
    .eq('dataset_id', id)

  if (lblError) return NextResponse.json({ error: lblError.message }, { status: 500 })

  const { data: annotations, error: annError } = await supabaseAdmin
    .from('annotations')
    .select('*, label:label_id(name)')
    .in('image_id', images.map((i) => i.id))

  if (annError) return NextResponse.json({ error: annError.message }, { status: 500 })

  const labelMap = {}
  labels.forEach((l, idx) => { labelMap[l.id] = idx })

  const coco = {
    info: { description: 'OpenInspect export', date: new Date().toISOString() },
    categories: labels.map((l) => ({ id: labelMap[l.id], name: l.name, supercategory: 'component' })),
    images: images.map((img, idx) => ({ id: idx, file_name: img.filename, width: img.width, height: img.height })),
    annotations: annotations
      .filter((a) => a.type === 'bbox' || a.type === 'segmentation')
      .map((a, idx) => {
        const imgIdx = images.findIndex((i) => i.id === a.image_id)
        const base = { id: idx, image_id: imgIdx, category_id: labelMap[a.label_id] ?? 0 }
        if (a.type === 'bbox') {
          const { x, y, width, height } = a.data
          return { ...base, bbox: [x, y, width, height], area: width * height, segmentation: [] }
        }
        const points = a.data.points || []
        return { ...base, bbox: [0, 0, 0, 0], area: 0, segmentation: [points.flatMap((p) => [p.x, p.y])] }
      }),
  }

  return NextResponse.json(coco)
}
