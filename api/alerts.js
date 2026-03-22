// api/alerts.js — Vercel serverless function
export default async function handler(req, res) {
  const ALERTS_KEY = process.env.ALERTS_API_KEY
  if (!ALERTS_KEY) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  try {
    const response = await fetch('https://api.alerts.in.ua/v1/alerts/active.json', {
      headers: { 'Authorization': `Bearer ${ALERTS_KEY}` }
    })
    const data = await response.json()
    res.status(response.status).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Proxy error' })
  }
}
