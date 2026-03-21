/**
 * Air raid alert checker — uses alerts.in.ua API.
 * Checks every 2 minutes. When Kyiv has an active alert,
 * the cosmos constricts, breathing holds, nodes dim.
 */

const API_KEY = import.meta.env.VITE_ALERTS_API_KEY || ''
const CHECK_INTERVAL = 120_000 // 2 minutes
const API_URL = 'https://api.alerts.in.ua/v1/alerts/active.json'

let kyivAlertActive = false
let listeners = []
let checkTimer = null

/**
 * Start checking for air raid alerts.
 */
export function startAlertChecking() {
  if (!API_KEY) {
    console.warn('[alerts] No API key — alert checking disabled')
    return
  }
  checkAlerts()
  checkTimer = setInterval(checkAlerts, CHECK_INTERVAL)
}

/**
 * Stop checking.
 */
export function stopAlertChecking() {
  if (checkTimer) clearInterval(checkTimer)
}

/**
 * Register a callback for alert state changes.
 * @param {(active: boolean) => void} fn
 */
export function onAlertChange(fn) {
  listeners.push(fn)
}

/**
 * Get current alert state.
 */
export function isAlertActive() {
  return kyivAlertActive
}

async function checkAlerts() {
  try {
    const res = await fetch(API_URL, {
      headers: { 'Authorization': `Bearer ${API_KEY}` }
    })

    if (!res.ok) {
      // Fallback: time-based simulation if API fails
      fallbackCheck()
      return
    }

    const data = await res.json()

    // Check if Kyiv (region uid "31") or city of Kyiv has active alert
    let kyivAlert = false
    if (Array.isArray(data)) {
      kyivAlert = data.some(a =>
        a.location_uid === '31' ||
        (a.location_title && /Київ|Kyiv/i.test(a.location_title))
      )
    }

    setAlertState(kyivAlert)
  } catch (err) {
    // Network error — fallback
    fallbackCheck()
  }
}

function fallbackCheck() {
  // Time-based simulation: higher probability at night Kyiv time
  try {
    const kyiv = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kiev' }))
    const h = kyiv.getHours()
    const nightRisk = (h >= 22 || h <= 5) ? 0.12 : 0.03
    setAlertState(Math.random() < nightRisk)
  } catch {
    setAlertState(false)
  }
}

function setAlertState(active) {
  if (active !== kyivAlertActive) {
    kyivAlertActive = active
    for (const fn of listeners) {
      try { fn(active) } catch {}
    }
  }
}
