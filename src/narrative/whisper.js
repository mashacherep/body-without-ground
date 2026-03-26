/**
 * Whisper panel — shows text content from the nearest cell
 * as the camera drifts past. A quiet ambient presence.
 */

import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { getSeedContent } from '../generation/seed-content.js'

const TEXT_TYPES = new Set(['poem', 'essay', 'ukraine', 'ascii', 'about'])
const _camPos = new THREE.Vector3()
const _cellPos = new THREE.Vector3()

let panel = null
let typeEl = null
let textEl = null
let currentCellId = null
let lastCheckTime = 0
const CHECK_INTERVAL = 5000 // check every 5 seconds

export function initWhisper() {
  panel = document.getElementById('whisper-panel')
  typeEl = document.getElementById('whisper-type')
  textEl = document.getElementById('whisper-text')
}

/**
 * Temporarily hide the whisper panel. It will reappear on the
 * next proximity check cycle if the camera is still near a cell.
 */
export function hideWhisper() {
  if (!panel) return
  panel.classList.remove('visible')
  currentCellId = null // allow re-show on next check
}

/**
 * Call every frame. Checks if camera is near a text-type cell
 * and shows its content in the whisper panel.
 */
export function updateWhisper(camera) {
  const now = performance.now()
  if (now - lastCheckTime < CHECK_INTERVAL) return
  lastCheckTime = now

  if (!panel) return

  _camPos.copy(camera.position)

  const cells = getAliveCells()
  let nearest = null
  let nearestDist = 80 // only show if camera is within 80 units

  for (const cell of cells) {
    if (!TEXT_TYPES.has(cell.type)) continue
    _cellPos.set(cell.position[0], cell.position[1], cell.position[2])
    const dist = _camPos.distanceTo(_cellPos)
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = cell
    }
  }

  if (nearest && nearest.id !== currentCellId) {
    currentCellId = nearest.id
    const content = nearest.content || getSeedContent(nearest.type)
    if (content) {
      // Remove old type class
      panel.className = 'visible type-' + nearest.type
      typeEl.textContent = nearest.type
      // Show first 4 lines max
      const lines = content.split('\n').slice(0, 4).join('\n')
      textEl.textContent = lines
    }
  } else if (!nearest) {
    if (currentCellId !== null) {
      panel.classList.remove('visible')
      currentCellId = null
    }
  }
}
