// src/lib/claude.js
//
// Previously called Anthropic's API directly from the browser using
// VITE_ANTHROPIC_API_KEY — that exposed the key to anyone viewing the
// page source or network tab. This version calls our own /api/generate
// serverless function instead, which holds the real key server-side.
//
// NOTE: this version is NOT streaming — it calls onStream once with the
// full result when the response arrives, so existing UI code that expects
// an onStream callback still works, but won't show live token-by-token
// output. Ask if you want true streaming wired up next.

const API_URL = '/api/generate'

/**
 * Calls our server-side generate endpoint with a system prompt and message
 * history. Returns the assistant's text response.
 */
export async function generate({ systemPrompt, messages, onStream }) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      skill: systemPrompt, // matches the "skill" field expected by api/generate.js
      description: messages?.[messages.length - 1]?.content ?? '',
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error || `API error ${res.status}`)
  }

  const data = await res.json()
  const fullText = data.code ?? ''

  if (onStream) {
    onStream(fullText, fullText)
  }

  return fullText
}
