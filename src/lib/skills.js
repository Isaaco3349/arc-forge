export const SKILLS = [
  {
    id: 'use-arc',
    label: 'Build on Arc',
    tag: 'arc',
    description: 'Chain config, contract deployment, USDC as native gas',
    color: 'teal',
  },
  {
    id: 'bridge-stablecoin',
    label: 'Bridge stablecoin',
    tag: 'cctp',
    description: 'Crosschain USDC via CCTP, UX patterns, Bridge Kit SDK',
    color: 'blue',
  },
  {
    id: 'use-gateway',
    label: 'Gateway',
    tag: 'gateway',
    description: 'Unified USDC balance, instant crosschain transfers (<500ms)',
    color: 'blue',
  },
  {
    id: 'use-circle-wallets',
    label: 'Choose a wallet',
    tag: 'wallets',
    description: 'Decision guide: developer-controlled vs user-controlled vs modular',
    color: 'purple',
  },
  {
    id: 'use-developer-controlled-wallets',
    label: 'Developer wallets',
    tag: 'custodial',
    description: 'Payouts, treasury management, automation flows',
    color: 'purple',
  },
  {
    id: 'use-user-controlled-wallets',
    label: 'User wallets',
    tag: 'self-custody',
    description: 'Embedded wallets, Web2 login, no seed phrases',
    color: 'purple',
  },
  {
    id: 'use-modular-wallets',
    label: 'Modular wallets',
    tag: 'erc-4337',
    description: 'Passkey auth, gasless txs, ERC-4337 account abstraction',
    color: 'coral',
  },
  {
    id: 'use-smart-contract-platform',
    label: 'Smart contracts',
    tag: 'contracts',
    description: 'Deploy, import, interact with contracts via Circle API',
    color: 'coral',
  },
]

// Loads a SKILL.md file from /src/skills/
export async function loadSkill(id) {
  try {
    const mod = await import(`../skills/${id}.md?raw`)
    return mod.default
  } catch {
    return null
  }
}
