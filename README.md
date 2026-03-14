# Arc Forge

> AI-powered code generator for Circle's stablecoin-native stack.  
> Select a skill → describe what you want → get production-ready code guided by Circle's best practices.

---

## What it is

Arc Forge is an interactive developer tool that combines:

- **Circle Skills** — 8 curated `SKILL.md` files encoding Circle's best-practice patterns for USDC payments, crosschain transfers, wallets, and smart contracts
- **Claude API** — `claude-sonnet-4` generates context-aware, skill-grounded code
- **Circle MCP server** — live SDK signatures, contract addresses, and chain IDs pulled directly from Circle's infrastructure

You describe what you want to build. Arc Forge picks the right skill context, composes a grounded prompt, and returns clean, annotated code you can drop into your project.

---

## Skills available

| Skill | What it covers |
|---|---|
| `use-arc` | Build on Arc — USDC as native gas, chain config, contract deployment |
| `bridge-stablecoin` | CCTP crosschain USDC transfers, UX patterns, Bridge Kit SDK |
| `use-gateway` | Unified USDC balance across chains, instant transfers (<500ms) |
| `use-circle-wallets` | Choose the right wallet type for your use case |
| `use-developer-controlled-wallets` | Custodial flows, payouts, treasury automation |
| `use-user-controlled-wallets` | Self-custody embedded wallets, Web2 login |
| `use-modular-wallets` | Passkey wallets, ERC-4337 account abstraction, gasless txs |
| `use-smart-contract-platform` | Deploy, import, interact with contracts via Circle API |

---

## How it works

```
User selects skill + describes intent
        ↓
Prompt composer injects SKILL.md context + user message
        ↓
Claude API (claude-sonnet-4) generates grounded code
        ↓
Circle MCP server enriches with live SDK + address data
        ↓
Syntax-highlighted output with copy + export
```

---

## Project structure

```
arc-forge/
├── src/
│   ├── components/
│   │   ├── SkillSelector.jsx     # 8-skill picker with descriptions
│   │   ├── PromptInput.jsx       # Intent input + submit
│   │   ├── CodeOutput.jsx        # Syntax-highlighted output + copy
│   │   ├── SessionHistory.jsx    # Multi-turn conversation context
│   │   └── SkillBadge.jsx        # Skill pill component
│   ├── lib/
│   │   ├── claude.js             # Anthropic API client
│   │   ├── skills.js             # Skill metadata + SKILL.md loader
│   │   ├── promptComposer.js     # Assembles skill + user intent → prompt
│   │   └── mcp.js                # Circle MCP server integration (optional)
│   ├── skills/                   # Local copies of Circle SKILL.md files
│   │   ├── use-arc.md
│   │   ├── bridge-stablecoin.md
│   │   ├── use-gateway.md
│   │   ├── use-circle-wallets.md
│   │   ├── use-developer-controlled-wallets.md
│   │   ├── use-user-controlled-wallets.md
│   │   ├── use-modular-wallets.md
│   │   └── use-smart-contract-platform.md
│   ├── App.jsx
│   └── main.jsx
├── public/
├── .env.example
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/your-org/arc-forge
cd arc-forge
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
# Add your Anthropic API key to .env
```

```env
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Pull the Circle Skills (optional — already bundled)

```bash
npx skills add circlefin/skills
```

### 4. Run

```bash
npm run dev
```

---

## Circle MCP server (optional enrichment)

For live SDK method signatures and contract addresses, connect the Circle MCP server:

```bash
# Claude Code
claude mcp add --transport http circle https://api.circle.com/v1/codegen/mcp --scope user

# Or add to your mcp.json
{
  "mcpServers": {
    "circle": { "url": "https://api.circle.com/v1/codegen/mcp" }
  }
}
```

Skills work standalone. MCP adds accuracy for SDK details that change between versions.

---

## Stack

- **Frontend** — React + Vite
- **AI** — Anthropic Claude API (`claude-sonnet-4`)
- **Skill context** — Circle Skills (`circlefin/skills`)
- **Live enrichment** — Circle MCP server (optional)
- **Syntax highlighting** — Prism.js

---

## Roadmap

- [ ] Skill explorer — browse all 8 skills with pattern summaries
- [ ] Multi-skill composition — combine e.g. `use-gateway` + `use-modular-wallets`
- [ ] Code export — download as `.ts` or `.sol` with imports resolved
- [ ] Testnet playground — run generated code against Circle's testnet faucet
- [ ] Circle MCP live enrichment — SDK signatures injected at generation time

---

## Resources

- [Circle Developer Docs](https://developers.circle.com)
- [Arc Docs](https://docs.arc.network)
- [Circle Skills repo](https://github.com/circlefin/skills)
- [Circle MCP server](https://developers.circle.com/ai/mcp)
- [Testnet Faucet](https://faucet.circle.com)

---

## License

MIT
