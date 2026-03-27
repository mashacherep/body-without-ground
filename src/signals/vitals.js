/**
 * Machine vitals HUD — shows real device signals.
 * CPU pressure and frame timing — the machine's body made visible.
 */

import { getAliveCells } from '../state/cells.js'
import { getGenCount, getTotalDeaths } from '../generation/scheduler.js'

let vitalsEl = null
let updateTimer = null
let lastFrameTime = 16.6

export function initVitals() {
  vitalsEl = document.getElementById('vitals-hud')
  updateTimer = setInterval(updateVitals, 2000)
}

function updateVitals() {
  if (!vitalsEl) return

  const alive = getAliveCells().length
  const deaths = getTotalDeaths()
  const gens = getGenCount()
  const upMin = Math.round(performance.now() / 60000)

  vitalsEl.innerHTML = [
    `<span>CELLS · ${alive}</span>`,
    `<span>DEAD · ${deaths}</span>`,
    `<span>GEN · ${gens}</span>`,
    `<span>FRAME · ${lastFrameTime.toFixed(1)}ms</span>`,
    `<span>UP · ${upMin}m</span>`,
  ].join('')
}

/**
 * Call from animation loop to track frame timing.
 */
export function reportFrameTime(dt) {
  lastFrameTime = dt * 1000
}

export function stopVitals() {
  if (updateTimer) clearInterval(updateTimer)
}
