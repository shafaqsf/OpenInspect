import { describe, it, expect, beforeEach, vi } from 'vitest'

const REQUIRED_VARS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY']

beforeEach(() => {
  vi.resetModules()
  process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test-project.supabase.co'
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key'
})

describe('Supabase Client', () => {
  it('creates a Supabase client when env vars are set', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
    expect(client.from).toBeDefined()
  })

  it('exports a singleton client from the lib module', async () => {
    const { supabase } = await import('@/lib/supabase')
    expect(supabase).toBeDefined()
    expect(supabase.auth).toBeDefined()
    expect(supabase.from).toBeDefined()
  })

  it('throws when env vars are missing', async () => {
    REQUIRED_VARS.forEach((v) => { delete process.env[v] })
    await expect(async () => {
      await import('@/lib/supabase')
    }).rejects.toThrow(/environment/i)
  })
})
