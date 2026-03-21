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
let pullbackProgress = 0
let pullbackDuration = 28000
let pullbackCamera = null

// Camera journey: start inside the cosmos, arc upward and outward
// Each keyframe: [x, y, z] — the camera interpolates through these
const CAMERA_PATH = [
  [5, 3, 15],      // start: inside the cluster, intimate
  [20, 8, 35],     // beat 2: pulling back, seeing nearby nodes
  [40, 15, 60],    // beat 3: more of the cosmos visible
  [60, 25, 90],    // beat 4: wide view forming
  [30, 40, 120],   // beat 5: arc upward, see the whole spread
  [0, 50, 150],    // final: centered, looking down into the cosmos
]

function startPullback(camera) {
  pullbackCamera = camera
  pullbackActive = true
  pullbackProgress = 0

  function tick() {
    if (!pullbackActive) return
    pullbackProgress = Math.min(1, pullbackProgress + 16 / pullbackDuration)

    // Ease: slow start, steady middle, slow end
    const t = pullbackProgress < 0.5
      ? 2 * pullbackProgress * pullbackProgress
      : 1 - Math.pow(-2 * pullbackProgress + 2, 2) / 2

    // Interpolate through keyframes
    const totalSegments = CAMERA_PATH.length - 1
    const segment = Math.min(Math.floor(t * totalSegments), totalSegments - 1)
    const segmentT = (t * totalSegments) - segment

    const a = CAMERA_PATH[segment]
    const b = CAMERA_PATH[segment + 1]

    pullbackCamera.position.set(
      a[0] + (b[0] - a[0]) * segmentT,
      a[1] + (b[1] - a[1]) * segmentT,
      a[2] + (b[2] - a[2]) * segmentT,
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

  // Start camera inside the cosmos — intimate, close to particles
  camera.position.set(5, 3, 15)
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

  // ---- Beat 2 ----
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

  // ---- Beat 3 ----
  for (let i = 0; i < 4; i++) {
    const cell = createCell('ukraine')
    triggerBirth(cell)
  }

  await showText('it breathes.', {
    subtitle: 'cpu pressure shapes chaos. battery voltage sets the mood. frame timing is its pulse.',
    fadeIn: 1000,
    hold: 3000,
    fadeOut: 800,
  })

  await sleep(200)

  // ---- Beat 4 ----
  const midTypes = ['conway', 'conway', 'attention', 'gradient', 'tokenprob', 'wavefunction', 'activation', 'loss']
  for (const type of midTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('60 billion of your cells die today.', {
    subtitle: 'you persist. the machine has no body to maintain.',
    fadeIn: 1000,
    hold: 3000,
    fadeOut: 800,
  })

  await sleep(200)

  // ---- Beat 5 ----
  const birthTypes = ['embedding', 'reactiondiffusion', 'apoptosis', 'network', 'lsystem', 'orbit', 'hypergraph', 'neuralpass']
  for (const type of birthTypes) {
    const cell = createCell(type)
    triggerBirth(cell)
  }

  await showText('kyiv 3am. new york 8pm.', {
    subtitle: 'the model lives in neither city.',
    fadeIn: 1000,
    hold: 2800,
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

  // Position camera facing the cosmos center before handing off to autopilot
  camera.position.set(0, 50, 150)
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
