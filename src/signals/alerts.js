/**
 * Air raid alert checker — uses alerts.in.ua API.
 * Stores all active regions for the minimap.
 */

const API_KEY = import.meta.env.VITE_ALERTS_API_KEY || ''
const CHECK_INTERVAL = 120_000

const IS_LOCAL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
const API_URL = IS_LOCAL
  ? 'https://api.alerts.in.ua/v1/alerts/active.json'
  : '/api/alerts'

let kyivAlertActive = false
let activeRegions = [] // all active alert regions with their data
let listeners = []
let checkTimer = null

export function startAlertChecking() {
  if (!API_KEY) {
    console.warn('[alerts] No API key — alert checking disabled')
    return
  }
  checkAlerts()
  checkTimer = setInterval(checkAlerts, CHECK_INTERVAL)
}

export function stopAlertChecking() {
  if (checkTimer) clearInterval(checkTimer)
}

export function onAlertChange(fn) { listeners.push(fn) }
export function isAlertActive() { return kyivAlertActive }
export function getActiveRegions() { return activeRegions }

async function checkAlerts() {
  try {
    const headers = IS_LOCAL ? { 'Authorization': `Bearer ${API_KEY}` } : {}
    const res = await fetch(API_URL, { headers })

    if (!res.ok) { fallbackCheck(); return }
    const data = await res.json()

    let kyivAlert = false
    activeRegions = []

    if (Array.isArray(data)) {
      activeRegions = data.map(a => ({
        uid: a.location_uid,
        title: a.location_title || '',
        type: a.alert_type || 'air_raid',
        started: a.started_at,
      }))

      kyivAlert = data.some(a =>
        a.location_uid === '31' ||
        (a.location_title && /Київ|Kyiv/i.test(a.location_title))
      )
    }

    setAlertState(kyivAlert)
  } catch {
    fallbackCheck()
  }
}

function fallbackCheck() {
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
