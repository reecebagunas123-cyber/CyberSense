// api/analyze.js
// Vercel serverless function (Node.js runtime).
// This runs on the server, so process.env.GEMINI_API_KEY is never exposed to the browser.

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { inputText, type } = req.body || {};

  if (!inputText || typeof inputText !== 'string') {
    return res.status(400).json({ error: 'Missing inputText' });
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  const ENDPOINT = process.env.GEMINI_ENDPOINT;

  if (!API_KEY || !ENDPOINT) {
    return res.status(500).json({ error: 'Server is missing API configuration' });
  }

  let systemPrompt = '';
  if (type === 'Chat') {
    systemPrompt = `
    You are CyberSense Assistant, a friendly cybersecurity chatbot that helps users stay safe online.
    You explain scams, phishing tactics, fake messages, and online fraud clearly and politely.
    - Be concise, warm, and clear.
    - Do not only answer "SAFE" or "SCAM".
    - Give helpful steps or examples if relevant.
    - Keep answers short (1-3 sentences).
    - Be language sensitive
    `;
  } else {
    systemPrompt = `
    You are a cybersecurity AI that detects phishing, scams, and fraud messages.
    Respond clearly with:
    - "SCAM" if it's suspicious or fraudulent, plus a short reason.
    - "SAFE" if it's not suspicious.
    `;
  }

  const body = {
    model: 'gemini-flash-latest',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: inputText }
    ]
  };

  try {
    const geminiRes = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${API_KEY}`
      },
      body: JSON.stringify(body)
    });

    const data = await geminiRes.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || 'No response from AI.';

    return res.status(200).json({ result: content });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Error contacting AI provider' });
  }
}