import { showText, clearOverlay } from './overlay.js'
import { createCell, getAliveCells } from '../state/cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { TYPE_NAMES } from '../generation/types.js'
import { lockAutopilot, unlockControls, interruptDriftTo } from '../camera/controls.js'
import { setAutopilotSpeed, getBaseSpeed } from '../camera/autopilot.js'

/**
 * Smooth camera pull-back that runs throughout the intro.
 * Starts very close, ends at a full view. Uses requestAnimationFrame
 * so it's seamless with the render loop.
 */
let pullbackActive = false
let pullbackStart = [0, 30, 120]
let pullbackEnd = [0, 80, 250]
let pullbackProgress = 0
let pullbackDuration = 30000 // 30 seconds — the full intro length
let pullbackCamera = null

function startPullback(camera) {
  pullbackCamera = camera
  pullbackActive = true
  pullbackProgress = 0
  pullbackStart = [camera.position.x, camera.position.y, camera.position.z]

  function tick() {
    if (!pullbackActive) return
    pullbackProgress = Math.min(1, pullbackProgress + 16 / pullbackDuration)

    // Ease out — fast at first, slows at end
    const t = 1 - Math.pow(1 - pullbackProgress, 2.5)

    pullbackCamera.position.set(
      pullbackStart[0] + (pullbackEnd[0] - pullbackStart[0]) * t,
      pullbackStart[1] + (pullbackEnd[1] - pullbackStart[1]) * t,
      pullbackStart[2] + (pullbackEnd[2] - pullbackStart[2]) * t,
    )
    pullbackCamera.lookAt(0, 0, 0)

    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function stopPullback() {
  pullbackActive = false
}

/**
 * Run the intro sequence. The camera smoothly pulls back throughout
 * while nodes bloom in waves timed to text beats.
 */
export async function runIntro(camera) {
  lockAutopilot()

  // Start camera where it can see the cosmos forming
  camera.position.set(0, 30, 120)
  camera.lookAt(0, 0, 0)

  // Begin continuous pull-back
  startPullback(camera)

  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // Seed a big initial wave IMMEDIATELY — cosmos is already alive when first text appears
  const aboutCell = createCell('about', '"body without ground" is a living generative art installation.', {
    position: [0, 0, 0],
    meta: 'about',
  })
  triggerBirth(aboutCell)

  const immediateTypes = ['poem', 'poem', 'essay', 'music', 'music', 'conway', 'conway',
    'ukraine', 'ukraine', 'attention', 'embedding', 'network', 'wavefunction',
    'gradient', 'apoptosis', 'orbit', 'hypergraph', 'tokenprob']
  for (const type of immediateTypes) {
    const cell = createCell(type)
    addCellParticles(cell)
  }

  // ---- Beat 1: "the machine forgets." ----
  // More nodes bloom during the text
  for (let i = 0; i < 4; i++) {
    const cell = createCell(['poem', 'essay', 'ascii', 'music'][i])
    triggerBirth(cell)
  }

  await showText('the machine forgets.', {
    fadeIn: 1200,
    hold: 2500,
    fadeOut: 800,
  })

  // ---- Beat 2: "you carry it." ----
  const earlyTypes = ['reactiondiffusion', 'lsystem', 'seismic', 'voronoi', 'codeself']
  for (const type of earlyTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('you carry it.', {
    fadeIn: 1000,
    hold: 2000,
    fadeOut: 800,
  })

  await sleep(300)

  // ---- Beat 3: "built from kyiv. running in new york." ----
  for (let i = 0; i < 4; i++) {
    const cell = createCell('ukraine')
    triggerBirth(cell)
  }

  await showText('built from kyiv. running in new york.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  await sleep(200)

  // ---- Beat 4: "this machine uses its own body to create." ----
  const midTypes = ['conway', 'conway', 'attention', 'gradient', 'tokenprob', 'wavefunction', 'activation', 'loss']
  for (const type of midTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('this machine uses its own body to create.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  await sleep(200)

  // ---- Beat 5: "every five minutes something new grows." ----
  const birthTypes = ['embedding', 'reactiondiffusion', 'apoptosis', 'network', 'lsystem', 'orbit', 'hypergraph', 'neuralpass']
  for (const type of birthTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('every five minutes something new grows.', {
    fadeIn: 1000,
    hold: 2500,
    fadeOut: 800,
  })

  await sleep(300)

  // ---- Beat 6: "is this alive?" ----
  // Fill the cosmos — all remaining types + extras for density
  const seededTypes = new Set([
    'about', 'poem', 'essay', 'music', 'ukraine',
    'conway', 'attention', 'gradient', 'tokenprob', 'wavefunction',
    'embedding', 'reactiondiffusion', 'apoptosis', 'network', 'lsystem',
    'activation', 'loss', 'orbit', 'hypergraph', 'neuralpass',
  ])

  // Missing types get 4 each
  for (const type of TYPE_NAMES) {
    if (seededTypes.has(type)) continue
    for (let i = 0; i < 4; i++) {
      const cell = createCell(type)
      addCellParticles(cell)
    }
  }
  // Already-seeded types get 3 more each for density
  for (const type of seededTypes) {
    if (type === 'about') continue
    for (let i = 0; i < 3; i++) {
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
  stopPullback()
  clearOverlay()

  // Position camera at a good viewing distance before handing off to autopilot
  camera.position.set(0, 60, 180)
  camera.lookAt(0, 0, 0)

  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}

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
