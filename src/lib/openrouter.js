const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

const apiKey = process.env.OPENROUTER_API_KEY

if (!apiKey) {
  throw new Error(
    'Missing OpenRouter API key. ' +
    'Please set OPENROUTER_API_KEY in your .env.local file.'
  )
}

async function chatCompletionsCreate({ model, messages, ...options }) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
      'X-Title': 'OpenInspect',
    },
    body: JSON.stringify({ model, messages, ...options }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(
      `OpenRouter API error: ${response.status} ${response.statusText}${error.error?.message ? ` - ${error.error.message}` : ''}`
    )
  }

  return response.json()
}

export const openrouter = {
  apiKey,
  baseURL: OPENROUTER_BASE_URL,
  chat: {
    completions: {
      create: chatCompletionsCreate,
    },
  },
}
