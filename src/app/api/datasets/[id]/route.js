import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-server'

function getAdmin() {
  const admin = getSupabaseAdmin()
  if (!admin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  return admin
}

export async function GET(_, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params

  const { data, error } = await supabaseAdmin
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    return NextResponse.json({ error: 'Dataset not found' }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(request, { params }) {
  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  const { id } = await params
  const body = await request.json()

  if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('datasets')
    .update({ name: body.name.trim(), description: body.description || '', updated_at: new Date().toISOString() })
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

  const { error } = await supabaseAdmin.from('datasets').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
