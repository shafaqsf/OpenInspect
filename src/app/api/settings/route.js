import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

export async function GET() {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({})

  const defaults = {
    default_task_type: 'detection',
    default_export_format: 'coco',
    default_annotation_tool: 'bbox',
    default_split_behavior: 'unassigned',
  }

  const { data } = await supabaseAdmin.from('app_settings').select('*')
  const settings = { ...defaults }
  ;(data || []).forEach((row) => {
    settings[row.key] = row.value
  })

  return NextResponse.json(settings)
}

export async function PUT(request) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const body = await request.json()
  const allowedKeys = ['default_task_type', 'default_export_format', 'default_annotation_tool', 'default_split_behavior']

  for (const [key, value] of Object.entries(body)) {
    if (!allowedKeys.includes(key)) continue
    await supabaseAdmin
      .from('app_settings')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })
  }

  return NextResponse.json({ success: true })
}