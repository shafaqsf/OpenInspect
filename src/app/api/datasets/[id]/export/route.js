import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'
import { isValidExportFormat, isValidAnnotationType } from '@/lib/validation'
import { exportCoco, exportYolo, exportOpenInspect, exportCsv } from '@/lib/exporters'

export async function GET(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const format = new URL(request.url).searchParams.get('format') || 'coco'
  if (!isValidExportFormat(format)) {
    return NextResponse.json({ error: `Invalid export format: ${format}` }, { status: 400 })
  }

  const { data: dataset, error: dsErr } = await supabaseAdmin.from('datasets').select('*').eq('id', id).single()
  if (dsErr) return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })

  const { data: images } = await supabaseAdmin.from('images').select('*').eq('dataset_id', id).order('created_at', { ascending: true })
  const { data: labels } = await supabaseAdmin.from('labels').select('*').eq('dataset_id', id).order('created_at', { ascending: true })

  const imageIds = (images || []).map((i) => i.id)
  let annotations = []
  if (imageIds.length > 0) {
    const { data: anns } = await supabaseAdmin.from('annotations').select('*').in('image_id', imageIds)
    annotations = anns || []
  }

  if (format === 'coco') {
    const coco = exportCoco(dataset, images || [], labels || [], annotations)
    return NextResponse.json(coco)
  }

  if (format === 'yolo') {
    const yolo = exportYolo(dataset, images || [], labels || [], annotations)
    return new NextResponse(JSON.stringify(yolo, null, 2), {
      headers: { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="yolo_${id}.json"` },
    })
  }

  if (format === 'openinspect') {
    const oi = exportOpenInspect(dataset, images || [], labels || [], annotations)
    return NextResponse.json(oi)
  }

  if (format === 'csv') {
    const csv = exportCsv(dataset, images || [], labels || [], annotations)
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="dataset_${id}.csv"` },
    })
  }

  return NextResponse.json({ error: 'Unsupported format' }, { status: 400 })
}