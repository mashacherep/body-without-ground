/**
 * Kyiv/NYC dual clock display.
 */

let kyivEl = null
let nycEl = null

export function initClocks() {
  kyivEl = document.getElementById('kyiv-clock')
  nycEl = document.getElementById('nyc-clock')
  updateClocks()
  setInterval(updateClocks, 30_000) // update every 30s
}

function updateClocks() {
  if (!kyivEl || !nycEl) return
  try {
    const kyiv = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }))
    const nyc = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))

    const kh = kyiv.getHours(), km = kyiv.getMinutes()
    const nh = nyc.getHours(), nm = nyc.getMinutes()
    const kNight = kh < 6 || kh > 21

    kyivEl.textContent = 'KYIV · ' + String(kh).padStart(2, '0') + ':' + String(km).padStart(2, '0')
    nycEl.textContent = 'NYC · ' + String(nh).padStart(2, '0') + ':' + String(nm).padStart(2, '0')
  } catch {}
}

export function getKyivHour() {
  try {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Kyiv' })).getHours()
  } catch { return 12 }
}
