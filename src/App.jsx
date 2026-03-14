import { useState } from 'react'
import { SKILLS, loadSkill } from './lib/skills'
import { composeSystemPrompt, composeUserMessage } from './lib/promptComposer'
import { generate } from './lib/claude'

export default function App() {
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [intent, setIntent] = useState('')
  const [output, setOutput] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    if (!selectedSkill || !intent.trim()) return
    setLoading(true)
    setError(null)
    setOutput('')

    try {
      const skillContent = await loadSkill(selectedSkill.id)
      if (!skillContent) throw new Error(`Skill "${selectedSkill.id}" not found — have you run npx skills add circlefin/skills?`)

      const systemPrompt = composeSystemPrompt(skillContent)
      const messages = composeUserMessage(intent, history)

      const result = await generate({
        systemPrompt,
        messages,
        onStream: (_, full) => setOutput(full),
      })

      setHistory(prev => [
        ...prev,
        { role: 'user', content: intent },
        { role: 'assistant', content: result },
      ])
      setIntent('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', fontFamily: 'var(--font-sans, system-ui)' }}>

      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 28, fontWeight: 500, margin: 0, color: 'var(--color-text-primary, #111)' }}>Arc Forge</h1>
        <p style={{ fontSize: 15, color: 'var(--color-text-secondary, #666)', margin: '4px 0 0' }}>
          AI code generator for Circle's stablecoin-native stack
        </p>
      </header>

      {/* Skill selector */}
      <section style={{ marginBottom: '1.5rem' }}>
        <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 10, color: 'var(--color-text-secondary, #666)' }}>
          Select a skill
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SKILLS.map(skill => (
            <button
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                border: `1px solid ${selectedSkill?.id === skill.id ? '#1D9E75' : '#ddd'}`,
                background: selectedSkill?.id === skill.id ? '#E1F5EE' : 'transparent',
                color: selectedSkill?.id === skill.id ? '#085041' : 'var(--color-text-primary, #111)',
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: selectedSkill?.id === skill.id ? 500 : 400,
                transition: 'all 0.15s',
              }}
            >
              {skill.label}
            </button>
          ))}
        </div>
        {selectedSkill && (
          <p style={{ fontSize: 12, color: 'var(--color-text-secondary, #888)', marginTop: 8 }}>
            {selectedSkill.description}
          </p>
        )}
      </section>

      {/* Intent input */}
      <section style={{ marginBottom: '1.5rem' }}>
        <textarea
          value={intent}
          onChange={e => setIntent(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleGenerate() }}
          placeholder={selectedSkill ? `Describe what you want to build with ${selectedSkill.label}…` : 'Select a skill first, then describe your intent…'}
          rows={4}
          style={{
            width: '100%',
            padding: '12px 14px',
            fontSize: 14,
            borderRadius: 10,
            border: '1px solid #ddd',
            resize: 'vertical',
            background: 'var(--color-background-primary, #fff)',
            color: 'var(--color-text-primary, #111)',
            boxSizing: 'border-box',
            outline: 'none',
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-text-secondary, #aaa)' }}>⌘+Enter to generate</span>
          <button
            onClick={handleGenerate}
            disabled={!selectedSkill || !intent.trim() || loading}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              background: loading ? '#aaa' : '#1D9E75',
              color: '#fff',
              fontSize: 14,
              fontWeight: 500,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </section>

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 14px', borderRadius: 8, background: '#FEE2E2', color: '#991B1B', fontSize: 13, marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Output */}
      {output && (
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <p style={{ fontSize: 13, fontWeight: 500, margin: 0, color: 'var(--color-text-secondary, #666)' }}>Output</p>
            <button
              onClick={() => navigator.clipboard.writeText(output)}
              style={{ fontSize: 12, color: '#1D9E75', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Copy
            </button>
          </div>
          <pre style={{
            background: 'var(--color-background-secondary, #f5f5f5)',
            borderRadius: 10,
            padding: '1.25rem',
            fontSize: 13,
            lineHeight: 1.6,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'var(--color-text-primary, #111)',
            border: '1px solid #e5e5e5',
          }}>
            {output}
          </pre>
        </section>
      )}

      {/* Session history count */}
      {history.length > 0 && (
        <p style={{ fontSize: 12, color: 'var(--color-text-secondary, #aaa)', marginTop: 16 }}>
          {history.length / 2} turn{history.length / 2 !== 1 ? 's' : ''} in session ·{' '}
          <button onClick={() => setHistory([])} style={{ fontSize: 12, color: '#E24B4A', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            Clear
          </button>
        </p>
      )}
    </div>
  )
}
