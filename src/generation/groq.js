/**
 * Groq API client for body without ground.
 * Generates poems, essays, ukraine transmissions, and ASCII art.
 * All other cell types are instant (visual only, no API call).
 */

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY || ''
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'

// Only these types hit the API
const API_TYPES = new Set(['poem', 'essay', 'ukraine', 'ascii'])

// Rate limiter — minimum 60s between API calls
let lastCallTime = 0
const MIN_INTERVAL = 60_000

// Store last logprobs for tokenprob/weights visualizations
let lastLogprobs = []
let lastTokens = []

const SYSTEM_PROMPT = 'Living art installation "body without ground." Masha, Kyiv→NYC, NYU senior, Moveo AI, ex-DressX. War since 2022. Raw JSON only.'

export function isApiType(type) {
  return API_TYPES.has(type)
}

export function hasGroqKey() {
  const has = GROQ_KEY.length > 10
  if (!has) console.warn('[groq] No API key found — using seed content')
  return has
}

export function getLastLogprobs() {
  return lastLogprobs
}

export function getLastTokens() {
  return lastTokens
}

/**
 * Build user prompt for a given type.
 * @param {string} type — poem | essay | ukraine | ascii
 * @param {object} ctx — { entropy, tod, genCount, device, markov, recent, mourning, alertActive }
 */
function buildUserPrompt(type, ctx) {
  const { entropy, tod, genCount, device, markov, recent, mourning, alertActive } = ctx
  const alert = alertActive ? ' ACTIVE AIR RAID ALERT IN KYIV RIGHT NOW.' : ''
  const dev = device || ''
  const mk = markov || ''
  const rc = recent || ''
  const mo = mourning || ''
  const tail = ' Also invent 3 specific biographical facts about whoever is viewing this (you are guessing — you do not know them). Respond with ONLY a JSON object: {"content":"YOUR FULL POEM OR TEXT HERE WITH NEWLINES AS \\n","assumptions":["fact1","fact2","fact3"]}'

  switch (type) {
    case 'ukraine':
      return 'Write a 3-4 line transmission from Kyiv. The war has been going on since 2022. Power outages, sirens, generators, the metro as shelter.' + alert + dev + mo +
        ' Signals: e:' + entropy + ' ' + tod + ' gen' + genCount + '.' + mk + tail

    case 'ascii':
      return 'Create ASCII art, 6-8 lines, max 28 chars wide. Abstract geometry or organic forms.' + dev +
        ' e:' + entropy + ' ' + tod + '.' + mk + tail

    case 'essay':
      return 'Write a philosophical fragment, 3-4 sentences, lowercase, no title. Themes: symbol grounding, Chinese Room, persistence as biology not computation, the machine cannot feel what it writes about war.' +
        alert + dev + mo + ' e:' + entropy + ' ' + tod + ' gen' + genCount + '.' + mk + rc + tail

    case 'poem':
    default:
      return 'Write a 4-5 line poem, no title. High entropy = fragmented. Late night = darker. If there is an air raid the poem fractures.' + dev + mo +
        ' e:' + entropy + ' ' + tod + ' gen' + genCount + '.' + alert + mk + rc + tail
  }
}

/**
 * Parse JSON from Groq response — handles markdown code blocks, partial JSON, etc.
 */
function parseResponse(raw) {
  if (!raw || typeof raw !== 'string') {
    return fallbackResponse()
  }

  // Strip markdown code fences if present
  let text = raw.trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  try {
    const s = text.indexOf('{')
    const e = text.lastIndexOf('}')
    if (s > -1 && e > s) {
      return JSON.parse(text.slice(s, e + 1))
    }
    return JSON.parse(text)
  } catch (_) {
    // Fallback: use raw text as content
    const lines = text.split('\n').filter(l => l.trim()).slice(0, 5)
    return {
      content: lines.join('\n') || 'signal unclear',
      assumptions: [
        'they grew up somewhere cold',
        'they are thinking of someone unreachable',
        'they built something that outlived its purpose',
      ],
    }
  }
}

function fallbackResponse() {
  return {
    content: 'signal unclear',
    assumptions: [
      'unknown origin',
      'carries something heavy',
      'has been here before',
    ],
  }
}

/**
 * Extract real logprobs from the Groq response.
 */
function extractLogprobs(data) {
  try {
    const logContent = data.choices?.[0]?.logprobs?.content
    if (!logContent) return []
    return logContent.map(tok => ({
      token: tok.token,
      logprob: tok.logprob,
      topAlts: (tok.top_logprobs || []).map(alt => ({
        token: alt.token,
        logprob: alt.logprob,
      })),
    }))
  } catch (_) {
    return []
  }
}

/**
 * Generate content via Groq API.
 * @param {string} type — poem | essay | ukraine | ascii
 * @param {object} context — { entropy, tod, genCount, device, markov, recent, mourning, alertActive }
 * @returns {Promise<{ content: string, assumptions: string[], logprobs: object[] } | null>}
 *          Returns null if rate-limited or no key.
 */
export async function generateContent(type, context) {
  if (!hasGroqKey()) return null
  if (!isApiType(type)) return null

  // Rate limit
  const now = Date.now()
  if (now - lastCallTime < MIN_INTERVAL) {
    console.log('[groq] rate limited — %dms since last call', now - lastCallTime)
    return null
  }
  lastCallTime = now

  const userMsg = buildUserPrompt(type, context)

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + GROQ_KEY,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 180,
        temperature: 0.88,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMsg },
        ],
      }),
    })

    if (!res.ok) {
      const errBody = await res.text().catch(() => '')
      console.error('[groq] API error:', res.status, errBody)
      throw new Error('groq ' + res.status)
    }
    console.log('[groq] generated', type, 'successfully')

    const data = await res.json()
    const raw = (data.choices?.[0]?.message?.content || '').trim()
    const parsed = parseResponse(raw)

    // Extract real logprobs
    const logprobs = extractLogprobs(data)
    lastLogprobs = logprobs
    lastTokens = logprobs.map(t => t.token)

    return {
      content: parsed.content || '',
      assumptions: parsed.assumptions || [],
      logprobs,
    }
  } catch (err) {
    console.warn('[groq] generation failed:', err.message)
    return null
  }
}
