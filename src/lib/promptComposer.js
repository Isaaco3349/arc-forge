/**
 * Loads the actual SKILL.md content for a given skill ID.
 * Skills are stored in .agents/skills/{id}/SKILL.md
 */
export async function loadSkillContent(skillId) {
  try {
    const mod = await import(`../../.agents/skills/${skillId}/SKILL.md?raw`)
    return mod.default
  } catch {
    return null
  }
}

/**
 * Composes the system prompt sent to Claude.
 * Injects the full SKILL.md content as context when available.
 */
export function composeSystemPrompt(skillContent, skillName) {
  if (skillContent) {
    return `You are Arc Forge, an expert developer assistant for Circle's stablecoin-native platform.

You have been given the following Circle Skill as your primary guidance. Follow it precisely — it contains
best-practice patterns, correct API usage, common mistakes to avoid, and decision frameworks.

--- CIRCLE SKILL START ---
${skillContent}
--- CIRCLE SKILL END ---

When generating code:
- Use TypeScript by default unless the user specifies otherwise
- Include all necessary imports
- Add short inline comments explaining Circle-specific decisions
- Flag any step that requires an API key or testnet setup
- If the skill mentions a common mistake, avoid it and note why`
  }

  return `You are Arc Forge, an expert developer assistant for Circle's stablecoin-native platform.
You are using the "${skillName}" skill. Generate clean, production-ready TypeScript code following Circle's best practices.
Include all imports, inline comments for Circle-specific decisions, and flag any steps requiring API keys or testnet setup.`
}

export function composeUserMessage(intent, history = []) {
  return [
    ...history,
    {
      role: 'user',
      content: intent,
    },
  ]
}
