/**
 * Persistence — localStorage save/load.
 * The garden remembers across sessions.
 * Saves: cells, Markov corpus, deaths, assumptions, session count.
 */

import { createCell, getCells, getAliveCells } from './cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { getCorpus, setCorpus } from '../generation/markov.js'
import { getAllAssumptions, getTotalDeaths, restoreState } from '../generation/scheduler.js'

const STORAGE_KEY = 'bwg-state'
const SESSION_KEY = 'bwg-sessions'
const SAVE_INTERVAL = 30_000 // save every 30 seconds

let saveTimer = null

/**
 * Get session count (incremented each load).
 */
export function getSessionCount() {
  const count = (parseInt(localStorage.getItem(SESSION_KEY)) || 0) + 1
  localStorage.setItem(SESSION_KEY, String(count))
  return count
}

/**
 * Save current state to localStorage.
 */
export function saveState() {
  try {
    const cells = getCells()
    const state = {
      cells: cells.slice(-200).map(c => ({
        type: c.type,
        content: c.content,
        assumptions: c.assumptions,
        entropy: c.entropy,
        createdAt: c.createdAt,
        alive: c.alive,
        position: c.position,
        meta: c.meta,
      })),
      corpus: getCorpus().slice(-400),
      assumptions: getAllAssumptions().slice(-100),
      deaths: getTotalDeaths(),
      savedAt: Date.now(),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {}
}

/**
 * Load state from localStorage. Returns true if state was restored.
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return false

    const state = JSON.parse(raw)
    if (!state.cells || state.cells.length === 0) return false

    // Restore cells
    let restored = 0
    for (const c of state.cells) {
      if (!c.alive) continue // only restore living cells
      const cell = createCell(c.type, c.content || '', {
        assumptions: c.assumptions || [],
        entropy: c.entropy,
        position: c.position,
        meta: c.meta || '',
      })
      // Override createdAt to preserve original age
      cell.createdAt = c.createdAt || Date.now()
      addCellParticles(cell)
      restored++
    }

    // Restore corpus
    if (state.corpus && state.corpus.length > 0) {
      setCorpus(state.corpus)
    }

    // Restore scheduler state
    if (state.assumptions || state.deaths) {
      restoreState({
        assumptions: state.assumptions || [],
        deaths: state.deaths || 0,
      })
    }

    console.log(`[persistence] Restored ${restored} cells, ${(state.corpus || []).length} corpus words, ${state.deaths || 0} deaths`)
    return restored > 0
  } catch (e) {
    console.warn('[persistence] Failed to load:', e)
    return false
  }
}

/**
 * Start auto-saving.
 */
export function startAutoSave() {
  saveTimer = setInterval(saveState, SAVE_INTERVAL)
  // Also save on page unload
  window.addEventListener('beforeunload', saveState)
}

export function stopAutoSave() {
  if (saveTimer) clearInterval(saveTimer)
}
