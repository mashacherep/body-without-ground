/**
 * Machine vitals HUD — shows real device signals updating in real time.
 * Makes the machine's body visible to the viewer.
 */

import { getAliveCells } from '../state/cells.js'
import { getGenCount, getTotalDeaths, getAllAssumptions } from '../generation/scheduler.js'
import { getCorpusSize } from '../generation/markov.js'
import { getLorenzState } from '../cosmos/attractors.js'

let vitalsEl = null
let assumptionsEl = null
let battery = { level: 1, charging: true }
let updateTimer = null

export function initVitals() {
  vitalsEl = document.getElementById('vitals-hud')
  assumptionsEl = document.getElementById('assumptions-counter')

  // Get battery
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      battery.level = b.level
      battery.charging = b.charging
      b.addEventListener('levelchange', () => { battery.level = b.level })
      b.addEventListener('chargingchange', () => { battery.charging = b.charging })
    }).catch(() => {})
  }

  updateTimer = setInterval(updateVitals, 2000)
}

function updateVitals() {
  if (!vitalsEl) return

  const upMin = Math.round(performance.now() / 60000)
  const bat = Math.round(battery.level * 100)
  const alive = getAliveCells().length
  const deaths = getTotalDeaths()
  const gens = getGenCount()
  const words = getCorpusSize()
  const lorenz = getLorenzState()
  const mem = navigator.deviceMemory || '?'

  vitalsEl.innerHTML = [
    `uptime ${upMin}m`,
    `battery ${bat}% ${battery.charging ? 'charging' : 'discharging'}`,
    `cells ${alive} alive · ${deaths} dead`,
    `generations ${gens}`,
    `markov ${words} words`,
    `lorenz \u03C1 = ${lorenz.rho.toFixed(1)}`,
    `memory ${mem}GB`,
  ].join('<br>')

  // Update assumptions counter
  const assumptions = getAllAssumptions()
  if (assumptions.length > 0 && assumptionsEl) {
    assumptionsEl.classList.add('visible')
    assumptionsEl.textContent = `the machine has invented ${assumptions.length} facts about you. none of them true.`
  }
}

export function stopVitals() {
  if (updateTimer) clearInterval(updateTimer)
}
