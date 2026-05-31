// Universal Vercel serverless proxy — password-protected + rate-limited
// © 2026 4THDMC | EVOLVE LLC. All Rights Reserved.
//
// SETUP PER TOOL (in Vercel project → Settings → Environment Variables):
//   ANTHROPIC_API_KEY   = your rotated Anthropic API key
//   TOOLKIT_PASSWORD    = the password for THIS tool
//                         (set the 4 paid tools to the same value,
//                          set the 2 beta tools to a separate beta value)
//
// This file is identical across every tool. Only the env variables differ.

// --- Simple in-memory rate limiter ---
// Note: serverless instances reset on cold starts, so this caps abuse
// within warm instances. For hard limits at scale, upgrade to Vercel KV later.
const rateLimitStore = new Map();
const MAX_REQUESTS_PER_WINDOW = 40;        // generations allowed per window
const WINDOW_MS = 60 * 60 * 1000;          // 1 hour window

function checkRateLimit(key) {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record || now > record.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, resetAt: record.resetAt };
  }

  record.count += 1;
  return { allowed: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  // --- Password check ---
  const provided = req.headers["x-toolkit-password"] || (req.body && req.body.toolkitPassword);
  const expected = process.env.TOOLKIT_PASSWORD;

  if (!expected) {
    return res.status(500).json({
      error: { message: "Server configuration error: TOOLKIT_PASSWORD not set" }
    });
  }
  if (!provided || provided !== expected) {
    return res.status(401).json({
      error: { message: "Invalid or missing access password.", code: "AUTH_REQUIRED" }
    });
  }

  // --- API key check ---
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: { message: "Server configuration error: ANTHROPIC_API_KEY not set" }
    });
  }

  // --- Rate limit (keyed by password so each access group shares a bucket) ---
  const limit = checkRateLimit(provided);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.resetAt - Date.now()) / 60000);
    return res.status(429).json({
      error: { message: `Rate limit reached. Try again in about ${minutes} minute(s).` }
    });
  }

  // --- Strip our custom field before forwarding to Anthropic ---
  const { toolkitPassword, ...anthropicBody } = req.body || {};

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(anthropicBody),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: { message: "Proxy error: " + error.message }
    });
  }
}
