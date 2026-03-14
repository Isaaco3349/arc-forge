const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL = 'claude-sonnet-4-20250514'

/**
 * Calls the Claude API with a system prompt and message history.
 * Returns the assistant's text response.
 */
export async function generate({ systemPrompt, messages, onStream }) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 4096,
      system: systemPrompt,
      messages,
      stream: !!onStream,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message || `API error ${res.status}`)
  }

  // Streaming path
  if (onStream) {
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter(l => l.startsWith('data: '))
      for (const line of lines) {
        try {
          const data = JSON.parse(line.slice(6))
          if (data.type === 'content_block_delta' && data.delta?.text) {
            fullText += data.delta.text
            onStream(data.delta.text, fullText)
          }
        } catch {}
      }
    }
    return fullText
  }

  // Non-streaming path
  const data = await res.json()
  return data.content.find(b => b.type === 'text')?.text ?? ''
}
