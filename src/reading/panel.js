// src/reading/panel.js
import { renderTextContent } from './text.js'
import { renderVizContent, stopActiveViz } from './viz.js'
import { exitReadingView } from '../camera/transitions.js'
import { clearOverlay } from '../narrative/overlay.js'
import { hideWhisper } from '../narrative/whisper.js'

const TEXT_TYPES = new Set(['poem', 'essay', 'ukraine', 'ascii', 'about', 'music'])

let activeCell = null
let assumptionTimer = null
let kyivClockInterval = null

export function showReadingPanel(cell) {
  activeCell = cell

  // Dismiss all ambient text layers before showing the reading panel
  clearOverlay()
  hideWhisper()
  const genFeed = document.getElementById('gen-feed')
  if (genFeed) genFeed.classList.remove('visible')

  const overlay = document.getElementById('reading-overlay')
  const typeEl = document.getElementById('reading-type')
  const contentEl = document.getElementById('reading-content')
  const assumptionsEl = document.getElementById('reading-assumptions')
  const metaEl = document.getElementById('reading-meta')

  // Reset
  contentEl.className = ''
  contentEl.innerHTML = ''
  assumptionsEl.textContent = ''
  assumptionsEl.classList.remove('visible')
  if (assumptionTimer) clearTimeout(assumptionTimer)
  if (kyivClockInterval) clearInterval(kyivClockInterval)

  // Type label
  typeEl.textContent = cell.type

  // Content
  if (TEXT_TYPES.has(cell.type)) {
    renderTextContent(cell, contentEl)
  } else {
    renderVizContent(cell, contentEl)
  }

  // Ukraine clock
  if (cell.type === 'ukraine') {
    const clockEl = document.createElement('div')
    clockEl.className = 'reading-kyiv-clock'
    contentEl.appendChild(clockEl)
    const updateClock = () => {
      const now = new Date()
      const kyiv = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kyiv' }))
      const h = String(kyiv.getHours()).padStart(2, '0')
      const m = String(kyiv.getMinutes()).padStart(2, '0')
      const s = String(kyiv.getSeconds()).padStart(2, '0')
      clockEl.textContent = `kyiv ${h}:${m}:${s}`
    }
    updateClock()
    kyivClockInterval = setInterval(updateClock, 1000)
  }

  // Assumptions — delayed reveal
  if (cell.assumptions && cell.assumptions.length > 0) {
    assumptionsEl.textContent = cell.assumptions.join(' / ')
    assumptionTimer = setTimeout(() => {
      assumptionsEl.classList.add('visible')
    }, 1000)
  }

  // Meta line
  const gen = cell.id
  const entropy = cell.entropy
  const latency = ((Math.random() * 180 + 20) | 0) + 'ms'
  metaEl.textContent = `gen ${gen} | entropy ${entropy} | latency ${latency}`

  // Show
  overlay.classList.add('visible')
}

export function hideReadingPanel() {
  const overlay = document.getElementById('reading-overlay')
  overlay.classList.remove('visible')

  stopActiveViz()

  if (assumptionTimer) { clearTimeout(assumptionTimer); assumptionTimer = null }
  if (kyivClockInterval) { clearInterval(kyivClockInterval); kyivClockInterval = null }

  activeCell = null
  exitReadingView()
}

export function isReadingPanelVisible() {
  return activeCell !== null
}
