import { showText, clearOverlay } from './overlay.js'
import { createCell, getAliveCells } from '../state/cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { TYPE_NAMES } from '../generation/types.js'
import { lockAutopilot, unlockControls, interruptDriftTo } from '../camera/controls.js'
import { setAutopilotSpeed, getBaseSpeed } from '../camera/autopilot.js'

/**
 * Run the intro sequence. Resolves when the intro is complete and the
 * camera begins its normal drift.
 *
 * @param {THREE.PerspectiveCamera} camera — to position for the opening shot
 * @returns {Promise<void>}
 */
export async function runIntro(camera) {
  lockAutopilot()

  // Start camera very close, in darkness
  camera.position.set(0, 2, 8)
  camera.lookAt(0, 0, 0)

  // Slow autopilot speed for the intro pull-back
  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // ---- Beat 1: "the machine forgets." ----
  // First node ignites behind the text
  const aboutCell = createCell('about', '"body without ground" is a living generative art installation.', {
    position: [0, 0, 0],
    meta: 'about',
  })
  triggerBirth(aboutCell)

  await showText('the machine forgets.', {
    fadeIn: 1200,
    hold: 2500,
    fadeOut: 800,
  })

  // Pull camera back a bit
  camera.position.set(0, 10, 30)

  // ---- Beat 2: "you carry it." ----
  // Scatter a few nodes
  const earlyTypes = ['poem', 'essay', 'music']
  for (const type of earlyTypes) {
    const cell = createCell(type)
    addCellParticles(cell)
  }

  await showText('you carry it.', {
    fadeIn: 1000,
    hold: 2000,
    fadeOut: 800,
  })

  await sleep(400)

  // ---- Beat 3: "built from kyiv. running in new york." ----
  // Ukraine cluster ignites amber
  for (let i = 0; i < 3; i++) {
    const cell = createCell('ukraine')
    triggerBirth(cell)
  }
  interruptDriftTo(getCellPositionByType('ukraine'), 0.3)

  await showText('built from kyiv. running in new york.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  // Camera pulls back further
  camera.position.set(0, 30, 80)

  await sleep(300)

  // ---- Beat 4: "this machine uses its own body to create." ----
  // More types appear — Lorenz attractor is already running from Phase 1
  const midTypes = ['conway', 'attention', 'gradient', 'tokenprob', 'wavefunction']
  for (const type of midTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('this machine uses its own body to create.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  await sleep(300)

  // ---- Beat 5: "every five minutes something new grows." ----
  // A birth happens on cue
  const birthTypes = ['embedding', 'reactiondiffusion', 'apoptosis', 'network', 'lsystem']
  for (const type of birthTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('every five minutes something new grows.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  // Camera pulls to full view
  camera.position.set(0, 60, 150)

  await sleep(400)

  // ---- Beat 6: "is this alive?" ----
  // Seed remaining types so the cosmos is full
  const seededTypes = new Set([
    'about', 'poem', 'essay', 'music', 'ukraine',
    'conway', 'attention', 'gradient', 'tokenprob', 'wavefunction',
    'embedding', 'reactiondiffusion', 'apoptosis', 'network', 'lsystem',
  ])
  for (const type of TYPE_NAMES) {
    if (seededTypes.has(type)) continue
    for (let i = 0; i < 2; i++) {
      const cell = createCell(type)
      addCellParticles(cell)
    }
  }

  await showText('is this alive?', {
    fadeIn: 1000,
    hold: 3000,
    fadeOut: 1500,
  })

  // ---- Intro complete ----
  clearOverlay()
  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}

/**
 * Get the average position of alive cells of a given type.
 * Returns [x, y, z].
 */
function getCellPositionByType(type) {
  const cells = getAliveCells().filter(c => c.type === type)
  if (cells.length === 0) return [0, 0, 0]
  const avg = [0, 0, 0]
  for (const c of cells) {
    avg[0] += c.position[0]
    avg[1] += c.position[1]
    avg[2] += c.position[2]
  }
  return [avg[0] / cells.length, avg[1] / cells.length, avg[2] / cells.length]
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
