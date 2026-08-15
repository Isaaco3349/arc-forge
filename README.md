# Arc Forge

AI-powered code generator for Circle's stablecoin-native stack.

Select a skill → describe what you want → get production-ready code guided by Circle's best practices.

## What it is

Arc Forge is an interactive developer tool that combines:

- **Circle Skills** — 8 curated `SKILL.md` files encoding Circle's best-practice patterns for USDC payments, crosschain transfers, wallets, and smart contracts
- **Gemini API** — `gemini-3.6-flash` generates context-aware, skill-grounded code
- **Circle MCP server** — live SDK signatures, contract addresses, and chain IDs pulled directly from Circle's infrastructure

You describe what you want to build. Arc Forge picks the right skill context, composes a grounded prompt, and returns clean, annotated code you can drop into your project.

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

## How it works

1. User selects skill + describes intent
2. Prompt composer injects `SKILL.md` context + user message
3. Server-side `/api/generate` calls the Gemini API (`gemini-3.6-flash`) to generate grounded code
4. Circle MCP server enriches with live SDK + address data
5. Syntax-highlighted output with copy + export

## Project structure

```
arc-forge/
├── api/
│   └── generate.js               # Serverless function — calls Gemini server-side
├── src/
│   ├── components/
│   │   ├── SkillSelector.jsx     # 8-skill picker with descriptions
│   │   ├── PromptInput.jsx       # Intent input + submit
│   │   ├── CodeOutput.jsx        # Syntax-highlighted output + copy
│   │   ├── SessionHistory.jsx    # Multi-turn conversation context
│   │   └── SkillBadge.jsx        # Skill pill component
│   ├── lib/
│   │   ├── claude.js             # Frontend client — calls our own /api/generate
│   │   │                         # (kept this filename for now; does NOT call
│   │   │                         # Anthropic directly, and never sees the API key)
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
├── vercel.json
└── README.md
```

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
```

Add your Gemini API key to `.env` (server-side only — **never** prefix with `VITE_`, or it will be bundled into the browser and exposed):

```
GEMINI_API_KEY=AQ.Ab...
```

Get a key from [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Google is migrating keys to the newer `AQ.` format (Auth keys); this project sends the key via the `x-goog-api-key` header rather than a `?key=` URL parameter, since the older query-param style rejects `AQ.` keys with `API_KEY_INVALID`.

### 3. Pull the Circle Skills (optional — already bundled)

```bash
npx skills add circlefin/skills
```

### 4. Run

```bash
vercel dev
```

> **Note:** use `vercel dev`, not `vite`/`npm run dev` directly — the app relies on the `/api/generate` serverless function, which plain Vite does not serve.

## Circle MCP server (optional enrichment)

For live SDK method signatures and contract addresses, connect the Circle MCP server:

```bash
# Claude Code
claude mcp add --transport http circle https://api.circle.com/v1/codegen/mcp --scope user
```

Or add to your `mcp.json`:

```json
{
  "mcpServers": {
    "circle": { "url": "https://api.circle.com/v1/codegen/mcp" }
  }
}
```

Skills work standalone. MCP adds accuracy for SDK details that change between versions.

## Stack

- **Frontend** — React + Vite
- **AI** — Gemini API (`gemini-3.6-flash`)
- **Skill context** — Circle Skills (`circlefin/skills`)
- **Live enrichment** — Circle MCP server (optional)
- **Syntax highlighting** — Prism.js

## Security notes

- The Gemini API key lives server-side only, in the `/api/generate` serverless function. It is never sent to or readable from the browser.
- The self-repair hook (`verifyCode()` in `api/generate.js`) is currently a stub that always returns `ok: true` — no real compilation or linting happens yet. Treat all generated code as unverified until that's wired to a real compiler/linter (e.g. `solc`, `hardhat compile`, or `slither`).

## Roadmap

- [ ] Skill explorer — browse all 8 skills with pattern summaries
- [ ] Multi-skill composition — combine e.g. `use-gateway` + `use-modular-wallets`
- [ ] Code export — download as `.ts` or `.sol` with imports resolved
- [ ] Testnet playground — run generated code against Circle's testnet faucet
- [ ] Circle MCP live enrichment — SDK signatures injected at generation time
- [ ] Real self-repair — wire `verifyCode()` up to an actual compiler/linter

## Resources

- [Circle Developer Docs](https://developers.circle.com)
- [Arc Docs](https://developers.circle.com/arc)
- [Circle Skills repo](https://github.com/circlefin/skills)
- [Circle MCP server](https://api.circle.com/v1/codegen/mcp)
- [Testnet Faucet](https://faucet.circle.com)

## License

MIT
