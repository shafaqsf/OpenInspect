import { createClient } from '@supabase/supabase-js'

let client = null

export function getSupabaseAdmin() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  console.error('[supabase-server] NEXT_PUBLIC_SUPABASE_URL present:', !!supabaseUrl)
  console.error('[supabase-server] SUPABASE_SERVICE_ROLE_KEY present:', !!supabaseServiceKey)
  console.error('[supabase-server] NEXT_PUBLIC_SUPABASE_URL value:', supabaseUrl ? supabaseUrl.substring(0, 20) + '...' : 'N/A')
  console.error('[supabase-server] SUPABASE_SERVICE_ROLE_KEY value:', supabaseServiceKey ? supabaseServiceKey.substring(0, 10) + '...' : 'N/A')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('[supabase-server] Missing env vars, returning null')
    return null
  }

  try {
    client = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
    console.error('[supabase-server] Client created successfully')
  } catch (err) {
    console.error('[supabase-server] Failed to create client:', err.message)
    return null
  }

  return client
}
