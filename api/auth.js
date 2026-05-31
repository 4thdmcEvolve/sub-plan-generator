// Lightweight password validation endpoint
// © 2025 4THDMC | EVOLVE LLC. All Rights Reserved.
//
// Used by the password gate to validate the password BEFORE unlocking.
// Returns 200 if correct, 401 if wrong.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const expected = process.env.TOOLKIT_PASSWORD;
  if (!expected) {
    return res.status(500).json({ ok: false, error: "Server not configured" });
  }

  const provided = (req.body && req.body.password) || "";

  if (provided === expected) {
    return res.status(200).json({ ok: true });
  }

  return res.status(401).json({ ok: false, error: "Incorrect password" });
}
