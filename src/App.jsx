import { useState } from 'react'
import { SKILLS, loadSkill } from './lib/skills'
import { composeSystemPrompt, composeUserMessage } from './lib/promptComposer'
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
      const skillContent = await loadSkill(selectedSkill.id).catch(() => null)
      const systemPrompt = (composeSystemPrompt(skillContent || You are an expert in Circle's  skill.))
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

  return (
    <div style={{background:'#0a0a0f',minHeight:'100vh',color:'#e8e8f0',fontFamily:"'Syne',sans-serif",position:'relative',overflow:'hidden'}}>
      <style>{
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#0a0a0f}
        .grid-bg{position:fixed;inset:0;background-image:linear-gradient(#2a2a3a 1px,transparent 1px),linear-gradient(90deg,#2a2a3a 1px,transparent 1px);background-size:40px 40px;opacity:0.3;pointer-events:none;z-index:0}
        .skill-card{background:#111118;border:1px solid #2a2a3a;border-radius:4px;padding:14px 16px;cursor:pointer;transition:all 0.2s;position:relative}
        .skill-card:hover{border-color:#00d4aa;transform:translateY(-1px);background:#1a1a24}
        .skill-card.active{border-color:#00d4aa;background:#1a1a24;box-shadow:0 0 0 1px #00d4aa22}
        textarea{width:100%;background:#111118;border:1px solid #2a2a3a;border-radius:4px;padding:16px 18px;font-family:'Space Mono',monospace;font-size:13px;color:#e8e8f0;resize:none;outline:none;line-height:1.7;transition:border-color 0.2s}
        textarea:focus{border-color:#3a3a50}
        textarea::placeholder{color:#555568}
        .btn-gen{background:#00d4aa;color:#000;border:none;border-radius:3px;padding:10px 24px;font-family:'Syne',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s}
        .btn-gen:hover{background:#00f0c0;transform:translateY(-1px)}
        .btn-gen:disabled{background:#555568;cursor:not-allowed;transform:none}
        .output-box{background:#111118;border:1px solid #2a2a3a;border-left:3px solid #7c6bff;border-radius:4px;padding:20px;font-family:'Space Mono',monospace;font-size:12px;line-height:1.8;color:#c8d3f5;overflow-x:auto;white-space:pre-wrap;word-break:break-word;max-height:500px;overflow-y:auto}
        .btn-copy{font-family:'Space Mono',monospace;font-size:11px;color:#8888a0;background:#111118;border:1px solid #2a2a3a;border-radius:3px;padding:5px 12px;cursor:pointer;transition:all 0.15s}
        .btn-copy:hover{border-color:#00d4aa;color:#00d4aa}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes spin{to{transform:rotate(360deg)}}
      }</style>
      <div className="grid-bg"/>
      <div style={{position:'relative',zIndex:1,maxWidth:1000,margin:'0 auto',padding:'2rem 1.5rem'}}>

        {/* Header */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'3rem',paddingBottom:'2rem',borderBottom:'1px solid #2a2a3a'}}>
          <div>
            <div style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:'#e8e8f0'}}>Arc<span style={{color:'#00d4aa'}}>Forge</span></div>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:'#555568',letterSpacing:2,textTransform:'uppercase',marginTop:4}}>Circle Skills  AI Code Generator</div>
          </div>
          <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#00d4aa',border:'1px solid #00d4aa44',padding:'4px 10px',borderRadius:2,letterSpacing:1}}>v0.1.0</div>
        </div>

        {/* No API key notice */}
        {!import.meta.env.VITE_ANTHROPIC_API_KEY && (
          <div style={{background:'#f5a62311',border:'1px solid #f5a623',borderRadius:4,padding:'12px 16px',fontFamily:"'Space Mono',monospace",fontSize:11,color:'#f5a623',marginBottom:'1.5rem',lineHeight:1.6}}>
            No API key detected. Add <strong>VITE_ANTHROPIC_API_KEY</strong> to Vercel environment variables to enable live generation.
          </div>
        )}

        {/* Skill selector */}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568',letterSpacing:3,textTransform:'uppercase',marginBottom:'1rem'}}>Select a skill</div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:8,marginBottom:'2rem'}}>
          {SKILL_LIST.map(skill => (
            <div key={skill.id} className={skill-card} onClick={()=>setSelectedSkill(skill)}>
              <div style={{fontFamily:"'Space Mono',monospace",fontSize:9,color:'#00d4aa',letterSpacing:2,textTransform:'uppercase',marginBottom:6}}>{skill.tag}</div>
              <div style={{fontSize:13,fontWeight:600,marginBottom:4,lineHeight:1.3}}>{skill.name}</div>
              <div style={{fontSize:11,color:'#8888a0',lineHeight:1.5}}>{skill.desc}</div>
            </div>
          ))}
        </div>

        {/* Selected skill banner */}
        {selectedSkill && (
          <div style={{background:'#111118',border:'1px solid #00d4aa44',borderLeft:'3px solid #00d4aa',borderRadius:4,padding:'12px 18px',marginBottom:'1.5rem',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:8,height:8,background:'#00d4aa',borderRadius:'50%',flexShrink:0,animation:'pulse 2s infinite'}}/>
            <div style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:'#00d4aa'}}>skill: {selectedSkill.id}  {selectedSkill.desc}</div>
          </div>
        )}

        {/* Intent input */}
        <div style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568',letterSpacing:3,textTransform:'uppercase',marginBottom:'1rem'}}>Describe what you want to build</div>
        <textarea
          rows={5}
          value={intent}
          onChange={e=>setIntent(e.target.value)}
          onKeyDown={e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter')handleGenerate()}}
          placeholder={selectedSkill?Describe what you want to build with ...:'Select a skill first, then describe your intent'}
        />
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:10,marginBottom:'1.5rem'}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568'}}>+Enter to generate</span>
          <button className="btn-gen" disabled={!selectedSkill||!intent.trim()||loading} onClick={handleGenerate}>
            {loading ? <span style={{display:'inline-block',width:12,height:12,border:'2px solid #00000033',borderTopColor:'#000',borderRadius:'50%',animation:'spin 0.6s linear infinite'}}/> : 'Generate'}
          </button>
        </div>

        {/* Error */}
        {error && <div style={{background:'#1a0a0a',border:'1px solid #ff4444',borderRadius:4,padding:'14px 18px',fontFamily:"'Space Mono',monospace",fontSize:12,color:'#ff8888',marginBottom:'1.5rem'}}>{error}</div>}

        {/* Output */}
        {output && (
          <div>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
              <div style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568',letterSpacing:2,textTransform:'uppercase'}}>Output</span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#00d4aa',background:'#00d4aa22',border:'1px solid #00d4aa44',padding:'3px 10px',borderRadius:2}}>{selectedSkill?.tag}</span>
              </div>
              <button className="btn-copy" onClick={copyOutput}>{copied?'Copied!':'Copy'}</button>
            </div>
            <div className="output-box">{output}</div>
          </div>
        )}

        {/* Session */}
        {history.length > 0 && (
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem',paddingTop:'1rem',borderTop:'1px solid #2a2a3a'}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568'}}><span style={{color:'#00d4aa'}}>{history.length/2}</span> turns in session</span>
            <button onClick={()=>setHistory([])} style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568',background:'none',border:'none',cursor:'pointer'}}>Clear session</button>
          </div>
        )}

        {/* Footer */}
        <div style={{marginTop:'3rem',paddingTop:'1.5rem',borderTop:'1px solid #2a2a3a',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <span style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568'}}>Built with Circle Skills + Claude API</span>
          <div style={{display:'flex',gap:16}}>
            {[['Circle Skills','https://github.com/circlefin/skills'],['Circle Docs','https://developers.circle.com'],['Anthropic','https://console.anthropic.com']].map(([label,url])=>(
              <a key={label} href={url} target="_blank" style={{fontFamily:"'Space Mono',monospace",fontSize:10,color:'#555568',textDecoration:'none'}}>{label}</a>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
