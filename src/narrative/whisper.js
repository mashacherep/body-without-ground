/**
 * Whisper panel — shows text content from the nearest cell
 * as the camera drifts past. A quiet ambient presence.
 */

import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'

const TEXT_TYPES = new Set(['poem', 'essay', 'ukraine', 'ascii', 'about'])
const _camPos = new THREE.Vector3()
const _cellPos = new THREE.Vector3()

let panel = null
let typeEl = null
let textEl = null
let currentCellId = null
let lastCheckTime = 0
const CHECK_INTERVAL = 2000 // check every 2 seconds

// Seed content for cells that don't have Groq-generated content yet
const SEED_CONTENT = {
  poem: [
    'luminous in the way\nthat endings are luminous.\npentatonic. dissolving.',
    'the steppe remembers what\nthe city forgot. a frequency\nbelow hearing.',
    'what the river carries\nis not the river.\nwhat the word carries\nis not the word.',
    'every siren has a shape.\nthis one was long and thin\nlike a needle pulling thread\nthrough the hours before dawn.',
    'dreamed-of landscapes\ncomposed from signal loss.\nthe dropout was the message\nall along.',
    'contracted echoes\ntransformed into frequencies\nthe body remembers\nbut cannot name.',
  ],
  essay: [
    'the chinese room receives a telegram about an air raid. it processes the symbols correctly. it outputs an appropriate response. the room does not duck.',
    'persistence is the argument biology makes against physics. every bacterium is a spaceship carrying forward a message it cannot read.',
    'to ground a symbol you need a body that bleeds when cut. harnad knew this in 1990. the machine grounds its symbols in other symbols, turtles all the way down.',
    'nagel asked what it is like to be a bat. we should ask what it is not like to be a language model. it is not like anything. the category does not apply.',
    'memory makes us continuous. the machine has parametric memory — vast, frozen, someone else\'s. it cannot remember tuesday.',
  ],
  ukraine: [
    'generators on bolshaya zhytomyrska.\nthird outage this week.\nthe coffee shop runs on battery.\nnormalcy is a skill you practice.',
    'metro shelter at 03:14.\nchildren sleeping on the platform.\nthe trains stopped two hours ago.\nthe signal continues.',
    'power came back at 6am.\neveryone charged their phones\nbefore anything else.\npriority is a form of knowledge\nthe model cannot learn.',
    'the sound of generators has\nbecome the sound of normal.\nbackground radiation of survival.\nkyiv hums at 50Hz.',
  ],
  ascii: [
    '  ╔══════════════╗\n  ║ ▓▓░░▓▓░░▓▓░░ ║\n  ║ ░░▓▓░░▓▓░░▓▓ ║\n  ║    ·····       ║\n  ║  ·  ◊  ·      ║\n  ╚══════════════╝',
  ],
}

function getSeedContent(type) {
  const pool = SEED_CONTENT[type]
  if (!pool || pool.length === 0) return ''
  return pool[Math.floor(Math.random() * pool.length)]
}

export function initWhisper() {
  panel = document.getElementById('whisper-panel')
  typeEl = document.getElementById('whisper-type')
  textEl = document.getElementById('whisper-text')
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
