import { describe, it, expect, beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.resetModules()
  process.env.OPENROUTER_API_KEY = 'test-openrouter-key'
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
})

describe('OpenRouter Client', () => {
  it('exports a configured OpenRouter instance', async () => {
    const { openrouter } = await import('@/lib/openrouter')
    expect(openrouter).toBeDefined()
    expect(openrouter.apiKey).toBe('test-openrouter-key')
    expect(openrouter.baseURL).toContain('openrouter.ai')
  })

  it('sends a chat completion request', async () => {
    const mockResponse = {
      id: 'chatcmpl-test',
      choices: [
        {
          message: { role: 'assistant', content: 'Defect found: surface crack' },
          finish_reason: 'stop',
        },
      ],
    }

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    })

    const { openrouter } = await import('@/lib/openrouter')
    const result = await openrouter.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: 'Inspect this component' }],
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/v1/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer test-openrouter-key',
        }),
      })
    )
    expect(result.choices[0].message.content).toBe('Defect found: surface crack')
  })

  it('throws when API key is missing', async () => {
    delete process.env.OPENROUTER_API_KEY
    await expect(async () => {
      await import('@/lib/openrouter')
    }).rejects.toThrow(/api.key|OPENROUTER/i)
  })

  it('includes HTTP-Referer header in requests', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          id: 'chatcmpl-test',
          choices: [{ message: { role: 'assistant', content: 'ok' }, finish_reason: 'stop' }],
        }),
    })

    const { openrouter } = await import('@/lib/openrouter')
    await openrouter.chat.completions.create({
      model: 'openai/gpt-4o',
      messages: [{ role: 'user', content: 'test' }],
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          'HTTP-Referer': 'http://localhost:3000',
        }),
      })
    )
  })
})
