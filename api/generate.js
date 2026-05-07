// Vercel serverless function — proxies requests to Anthropic API
// Keeps the API key server-side, never exposed to the browser
// © 2025 4THDMC | EVOLVE LLC. All Rights Reserved.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: { message: "Method not allowed" } });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({
      error: { message: "Server configuration error: ANTHROPIC_API_KEY not set" }
    });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);
  } catch (error) {
    return res.status(500).json({
      error: { message: "Proxy error: " + error.message }
    });
  }
}
