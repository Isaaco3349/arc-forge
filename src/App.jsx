import { useState } from 'react'
import { composeSystemPrompt, composeUserMessage, loadSkillContent } from './lib/promptComposer'
import { generate } from './lib/claude'

const SKILL_LIST = [
  {id:'use-arc',tag:'arc',name:'Build on Arc',desc:'USDC as native gas, chain config, contract deployment'},
  {id:'bridge-stablecoin',tag:'cctp',name:'Bridge stablecoin',desc:'Crosschain USDC via CCTP, Bridge Kit SDK'},
  {id:'use-gateway',tag:'gateway',name:'Gateway',desc:'Unified USDC balance, instant crosschain transfers'},
  {id:'use-circle-wallets',tag:'wallets',name:'Choose a wallet',desc:'Developer vs user-controlled vs modular'},
  {id:'use-developer-controlled-wallets',tag:'custodial',name:'Developer wallets',desc:'Payouts, treasury, automation flows'},
  {id:'use-user-controlled-wallets',tag:'self-custody',name:'User wallets',desc:'Embedded wallets, Web2 login'},
  {id:'use-modular-wallets',tag:'erc-4337',name:'Modular wallets',desc:'Passkey auth, gasless txs, ERC-4337'},
  {id:'use-smart-contract-platform',tag:'contracts',name:'Smart contracts',desc:'Deploy, import, interact via Circle API'},
  {id:'use-usdc',tag:'usdc',name:'Use USDC',desc:'USDC payments, transfers, 6-decimal precision'},
]

export default function App() {
  const [selectedSkill, setSelectedSkill] = useState(null)
  const [intent, setIntent] = useState('')
  const [output, setOutput] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleGenerate() {
    if (!selectedSkill || !intent.trim()) return
    setLoading(true)
    setError(null)
    setOutput('')
    try {
      const skillContent = await loadSkillContent(selectedSkill.id); const systemPrompt = composeSystemPrompt(skillContent, selectedSkill.name)
      const messages = composeUserMessage(intent, history)
      const result = await generate({ systemPrompt, messages, onStream: (_, full) => setOutput(full) })
      setHistory(prev => [...prev, { role: 'user', content: intent }, { role: 'assistant', content: result }])
      setIntent('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  function copyOutput() {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const mono = "'Space Mono', monospace"
  const sans = "'Syne', sans-serif"

  return (
    <div style={{background:'#0a0a0f',minHeight:'100vh',color:'#e8e8f0',fontFamily:sans,position:'relative',overflow:'hidden'}}>
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap" />
      <div style={{position:'fixed',inset:0,backgroundImage:'linear-gradient(#2a2a3a 1px,transparent 1px),linear-gradient(90deg,#2a2a3a 1px,transparent 1px)',backgroundSize:'40px 40px',opacity:0.3,pointerEvents:'none',zIndex:0}} />
      <div style={{position:'relative',zIndex:1,maxWidth:1000,margin:'0 auto',padding:'2rem 1.5rem'}}>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'3rem',paddingBottom:'2rem',borderBottom:'1px solid #2a2a3a'}}>
          <div>
            <div style={{fontSize:32,fontWeight:800,letterSpacing:-1}}>Arc<span style={{color:'#00d4aa'}}>Forge</span></div>
            <div style={{fontFamily:mono,fontSize:11,color:'#555568',letterSpacing:2,textTransform:'uppercase',marginTop:4}}>Circle Skills . AI Code Generator</div>
          </div>
          <div style={{fontFamily:mono,fontSize:10,color:'#00d4aa',border:'1px solid #00d4aa44',padding:'4px 10px',borderRadius:2,letterSpacing:1}}>v0.1.0</div>
        </div>

        <div style={{fontFamily:mono,fontSize:10,color:'#555568',letterSpacing:3,textTransform:'uppercase',marginBottom:'1rem'}}>Select a skill</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8,marginBottom:'2rem'}}>
          {SKILL_LIST.map(skill => (
            <div
              key={skill.id}
              onClick={() => setSelectedSkill(skill)}
              style={{
                background: selectedSkill?.id === skill.id ? '#1a1a24' : '#111118',
                border: selectedSkill?.id === skill.id ? '1px solid #00d4aa' : '1px solid #2a2a3a',
                borderRadius:4,padding:'14px 16px',cursor:'pointer',transition:'all 0.2s'
              }}
            >
              <div style={{fontFamily:mono,fontSize:9,color:'#00d4aa',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>{skill.tag}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4,lineHeight:1.3}}>{skill.name}</div>
              <div style={{fontSize:11,color:'#8888a0',lineHeight:1.5}}>{skill.desc}</div>
            </div>
          ))}
        </div>

        {selectedSkill && (
          <div style={{background:'#111118',border:'1px solid #00d4aa44',borderLeft:'3px solid #00d4aa',borderRadius:4,padding:'12px 18px',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:8,height:8,background:'#00d4aa',borderRadius:'50%',flexShrink:0}} />
            <div style={{fontFamily:mono,fontSize:12,color:'#00d4aa'}}>skill: {selectedSkill.id} . {selectedSkill.desc}</div>
          </div>
        )}

        <div style={{fontFamily:mono,fontSize:10,color:'#555568',letterSpacing:3,textTransform:'uppercase',marginBottom:'1rem'}}>Describe what you want to build</div>
        <textarea
          rows={5}
          value={intent}
          onChange={e => setIntent(e.target.value)}
          onKeyDown={e => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleGenerate() }}
          placeholder={selectedSkill ? 'Describe what you want to build with ' + selectedSkill.name + '...' : 'Select a skill first, then describe your intent…'}
          style={{width:'100%',background:'#111118',border:'1px solid #2a2a3a',borderRadius:4,padding:'16px 18px',fontFamily:mono,fontSize:13,color:'#e8e8f0',resize:'none',outline:'none',lineHeight:1.7,boxSizing:'border-box'}}
        />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,marginBottom:'1.5rem'}}>
          <span style={{fontFamily:mono,fontSize:10,color:'#555568'}}>Ctrl+Enter to generate</span>
          <button
            disabled={!selectedSkill || !intent.trim() || loading}
            onClick={handleGenerate}
            style={{background: loading || !selectedSkill || !intent.trim() ? '#555568' : '#00d4aa',color:'#000',border:'none',borderRadius:3,padding:'10px 24px',fontFamily:sans,fontSize:13,fontWeight:700,cursor:'pointer'}}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </div>

        {error && (
          <div style={{background:'#1a0a0a',border:'1px solid #ff4444',borderRadius:4,padding:'14px 18px',fontFamily:mono,fontSize:12,color:'#ff8888',marginBottom:'1.5rem'}}>{error}</div>
        )}

        {output && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:mono,fontSize:10,color:'#555568',letterSpacing:2,textTransform:'uppercase'}}>Output</span>
                <span style={{fontFamily:mono,fontSize:10,color:'#00d4aa',background:'#00d4aa22',border:'1px solid #00d4aa44',padding:'3px 10px',borderRadius:2}}>{selectedSkill?.tag}</span>
              </div>
              <button onClick={copyOutput} style={{fontFamily:mono,fontSize:11,color: copied ? '#00d4aa' : '#8888a0',background:'#111118',border: copied ? '1px solid #00d4aa' : '1px solid #2a2a3a',borderRadius:3,padding:'5px 12px',cursor:'pointer'}}>
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre style={{background:'#111118',border:'1px solid #2a2a3a',borderLeft:'3px solid #7c6bff',borderRadius:4,padding:20,fontFamily:mono,fontSize:12,lineHeight:1.8,color:'#c8d3f5',overflowX:'auto',whiteSpace:'pre-wrap',wordBreak:'break-word',maxHeight:500,overflowY:'auto'}}>{output}</pre>
          </div>
        )}

        {history.length > 0 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem',paddingTop:'1rem',borderTop:'1px solid #2a2a3a'}}>
            <span style={{fontFamily:mono,fontSize:10,color:'#555568'}}><span style={{color:'#00d4aa'}}>{history.length / 2}</span> turns in session</span>
            <button onClick={() => setHistory([])} style={{fontFamily:mono,fontSize:10,color:'#555568',background:'none',border:'none',cursor:'pointer'}}>Clear session</button>
          </div>
        )}

        <div style={{marginTop:'3rem',paddingTop:'1.5rem',borderTop:'1px solid #2a2a3a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontFamily:mono,fontSize:10,color:'#555568'}}>Built with Circle Skills + Claude API</span>
          <div style={{display:'flex',gap:16}}>
            <a href="https://github.com/circlefin/skills" target="_blank" style={{fontFamily:mono,fontSize:10,color:'#555568',textDecoration:'none'}}>Circle Skills</a>
            <a href="https://developers.circle.com" target="_blank" style={{fontFamily:mono,fontSize:10,color:'#555568',textDecoration:'none'}}>Circle Docs</a>
            <a href="https://console.anthropic.com" target="_blank" style={{fontFamily:mono,fontSize:10,color:'#555568',textDecoration:'none'}}>Anthropic</a>
          </div>
        </div>

      </div>
    </div>
  )
}


