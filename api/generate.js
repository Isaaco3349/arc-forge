// api/generate.js  (ArcForge)
//
// ASSUMPTIONS — verify against your actual code and adjust:
//   1. Request body shape: { skill: string, description: string }
//      (matches the UI: "skill: use-gateway ... " + "describe what you want to build")
//   2. Response shape expected by frontend: { code: string, provider: string }
//   3. Output is Solidity / JS SDK calls against Circle's Arc + Gateway + CCTP APIs.
//   If your real contract differs, tell me the actual field names and I'll fix this exactly.
//
// WHY GEMINI ONLY (no Groq fallback here):
// ArcForge generates code that touches USDC and payment flows. Free open-weight
// models (what Groq serves) have been shown in research to skip standard security
// libraries (e.g. OpenZeppelin's Pausable/Ownable) and produce partial,
// error-prone implementations for fund-handling logic. Gemini Flash is closer to
// Claude/GPT-4o in this respect, so it's used as the sole provider here rather
// than falling back to a weaker model when quota runs out. If Gemini is
// unavailable, the request fails loudly instead of silently degrading to
// less-safe code — you should see the error, not a worse contract.
//
// Env vars needed on Vercel:
//   GEMINI_API_KEY  - from https://aistudio.google.com/apikey
//   (Recommend a Google Cloud project dedicated to ArcForge, separate from
//    ZKPilot, so a busy day on one doesn't starve the other's daily quota.)

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `You are ArcForge, an AI code generator for Circle's Arc chain and related
infrastructure (Gateway, CCTP, ERC-4337 wallets, USDC contracts).

Rules for every response:
- Use OpenZeppelin library contracts (Ownable, Pausable, ReentrancyGuard, etc.)
  wherever standard patterns apply. Do not hand-roll access control or reentrancy
  protection from scratch.
- Target Solidity 0.8.20+ and rely on its built-in overflow protection —
  do not import SafeMath.
- For any function that moves USDC or other value, include explicit checks
  (balance checks, allowance checks, zero-address checks) and emit events for
  state changes.
- Flag in a comment any part of the generated contract that has NOT been
  audited and should be reviewed before mainnet deployment.
- If the request is ambiguous about chain config, gas token, or bridging path,
  state the assumption you made in a comment rather than guessing silently.`;

async function callGemini(skill, description) {
  const prompt = `Skill context: ${skill}\n\nBuild request: ${description}`;
  const url = `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }],
        },
      ],
      generationConfig: { maxOutputTokens: 3000, temperature: 0.4 },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Gemini error ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned no content");
  return text;
}

// --- Self-repair hook -------------------------------------------------
// Plug your real Solidity compiler/linter in here (e.g. solc, hardhat compile,
// or slither for security checks). Return { ok: true } if the code is valid,
// or { ok: false, errors: string } with compiler/linter output if not.
// Currently a stub that always passes — wire this up to get real self-repair.
async function verifyCode(_code) {
  // TODO: replace with actual compile/lint step
  return { ok: true, errors: null };
}

async function generateWithRepair(skill, description, maxAttempts = 3) {
  let lastCode = null;
  let lastErrors = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const retryContext = lastErrors
      ? `\n\nYour previous attempt failed to compile with these errors:\n${lastErrors}\n\nFix the code and return the corrected version.`
      : "";

    const code = await callGemini(skill, description + retryContext);
    const check = await verifyCode(code);

    if (check.ok) {
      return { code, attempts: attempt };
    }

    lastCode = code;
    lastErrors = check.errors;
  }

  // Exhausted attempts — return the last version with a warning rather than nothing.
  return { code: lastCode, attempts: maxAttempts, unresolved: true, errors: lastErrors };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const { skill, description } = req.body || {};
  if (!description || typeof description !== "string") {
    res.status(400).json({ error: "Missing 'description' in request body" });
    return;
  }

  try {
    const result = await generateWithRepair(skill || "general", description);
    res.status(200).json({
      code: result.code,
      provider: "gemini",
      attempts: result.attempts,
      unresolved: result.unresolved || false,
      note: result.unresolved
        ? "Code did not pass verification after max attempts — review manually before use."
        : undefined,
    });
  } catch (err) {
    console.error("ArcForge generation failed:", err.message);
    res.status(502).json({
      error: "Generation failed. Check GEMINI_API_KEY and free-tier quota.",
    });
  }
};
