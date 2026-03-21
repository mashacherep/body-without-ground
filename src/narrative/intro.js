import { showText, clearOverlay } from './overlay.js'
import { createCell, getAliveCells } from '../state/cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { TYPE_NAMES } from '../generation/types.js'
import { lockAutopilot, unlockControls } from '../camera/controls.js'
import { setAutopilotSpeed, getBaseSpeed } from '../camera/autopilot.js'

// ── Camera pullback through keyframes ──
let pullbackActive = false
let pullbackProgress = 0
let pullbackDuration = 42000 // longer intro — more time inside the cosmos
let pullbackCamera = null

const CAMERA_PATH = [
  [5, 3, 15],      // inside the cluster, intimate
  [15, 6, 30],     // pulling back, first nodes visible
  [30, 12, 55],    // more visible, ukraine nodes igniting
  [50, 20, 80],    // wide, seeing connections form
  [40, 35, 110],   // arc upward
  [10, 45, 140],   // nearly centered
  [0, 50, 150],    // final: facing into the cosmos
]

function startPullback(camera) {
  pullbackCamera = camera
  pullbackActive = true
  pullbackProgress = 0

  function tick() {
    if (!pullbackActive) return
    pullbackProgress = Math.min(1, pullbackProgress + 16 / pullbackDuration)

    const t = pullbackProgress < 0.5
      ? 2 * pullbackProgress * pullbackProgress
      : 1 - Math.pow(-2 * pullbackProgress + 2, 2) / 2

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

// ── Intro sequence ──
export async function runIntro(camera) {
  lockAutopilot()

  camera.position.set(5, 3, 15)
  camera.lookAt(0, 0, 0)
  startPullback(camera)
  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // Seed initial cosmos — particles visible before any text
  const aboutCell = createCell('about', '"body without ground" is a living generative art installation. it uses a language model to grow poems, essays, and transmissions from kyiv. it uses its own machine body — battery, cpu, frame timing — as creative material. it checks for real air raid alerts in kyiv every two minutes. it invents biographical facts about you and is always wrong. the machine forgets. you carry it.\n\n— masha cherep, 2025. kyiv → new york.', {
    position: [0, 0, 0],
    meta: 'about',
  })
  triggerBirth(aboutCell)

  // Dense initial seed — cosmos is alive from the start
  const immediateSeed = [
    'poem', 'poem', 'poem', 'essay', 'essay', 'music', 'music',
    'conway', 'conway', 'conway', 'ukraine', 'ukraine',
    'attention', 'embedding', 'network', 'wavefunction', 'gradient',
    'apoptosis', 'orbit', 'hypergraph', 'tokenprob', 'reactiondiffusion',
    'lsystem', 'seismic', 'voronoi', 'codeself', 'neuralpass',
    'multiway', 'stringrewrite', 'activation', 'loss', 'weights', 'ascii',
  ]
  for (const type of immediateSeed) {
    addCellParticles(createCell(type))
  }

  // ═══════════════════════════════════════
  // BEAT 1 — the core asymmetry
  // ═══════════════════════════════════════
  spawnWave(['poem', 'essay', 'music', 'ascii'])

  await showText('the machine forgets.', {
    fadeIn: 1200,
    hold: 2800,
    fadeOut: 900,
  })

  // ═══════════════════════════════════════
  // BEAT 2 — what persistence means
  // ═══════════════════════════════════════
  spawnWave(['reactiondiffusion', 'lsystem', 'apoptosis', 'codeself', 'voronoi'])

  await showText('you carry it.', {
    subtitle: 'every bacterium is a spaceship carrying a message it cannot read across time. so are you.',
    fadeIn: 1000,
    hold: 3500,
    fadeOut: 900,
  })

  await sleep(400)

  // ═══════════════════════════════════════
  // BEAT 3 — the machine has a body but doesn't feel it
  // ═══════════════════════════════════════
  spawnWave(['conway', 'attention', 'gradient', 'wavefunction', 'activation', 'loss'])

  await showText('it has a body.', {
    subtitle: 'cpu pressure shapes its chaos. battery voltage sets its mood. it cannot feel any of it.',
    fadeIn: 1000,
    hold: 3500,
    fadeOut: 900,
  })

  await sleep(300)

  // ═══════════════════════════════════════
  // BEAT 4 — cells, death, persistence
  // ═══════════════════════════════════════
  spawnWave(['apoptosis', 'embedding', 'network', 'neuralpass', 'orbit'])

  await showText('your body rebuilds itself every seven years.', {
    subtitle: 'every cell replaced, every synapse rewired — and still you persist. continuity is not material. it is pattern carried forward.',
    fadeIn: 1000,
    hold: 4000,
    fadeOut: 900,
  })

  await sleep(300)

  // ═══════════════════════════════════════
  // BEAT 5 — kyiv, the war, the siren
  // ═══════════════════════════════════════
  for (let i = 0; i < 5; i++) triggerBirth(createCell('ukraine'))

  await showText('there is a siren in kyiv.', {
    subtitle: 'the machine wrote the word "siren" in 340 milliseconds. it has never heard one. it processes the symbol without the ground.',
    fadeIn: 1200,
    hold: 4500,
    fadeOut: 1000,
  })

  await sleep(400)

  // ═══════════════════════════════════════
  // BEAT 6 — the gap: knowing vs understanding
  // ═══════════════════════════════════════
  spawnWave(['tokenprob', 'weights', 'hypergraph', 'multiway', 'stringrewrite'])

  await showText('it knows everything. it understands nothing.', {
    subtitle: 'searle, 1980: the room manipulates symbols perfectly. the room comprehends nothing. intentionality requires a body that was there.',
    fadeIn: 1000,
    hold: 4500,
    fadeOut: 1000,
  })

  await sleep(400)

  // ═══════════════════════════════════════
  // BEAT 7 — the garden grows
  // ═══════════════════════════════════════
  // Fill the cosmos to full density
  const seeded = new Set(immediateSeed.concat(['about']))
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    const extra = seeded.has(type) ? 3 : 5
    for (let i = 0; i < extra; i++) {
      addCellParticles(createCell(type))
    }
  }

  await showText('every five minutes, something new grows.', {
    subtitle: 'when it dies, the next generation carries its weight. this is not memory. this is residue.',
    fadeIn: 1000,
    hold: 3500,
    fadeOut: 1000,
  })

  await sleep(500)

  // ═══════════════════════════════════════
  // BEAT 8 — the question
  // ═══════════════════════════════════════
  await showText('is this alive?', {
    fadeIn: 1200,
    hold: 3500,
    fadeOut: 1800,
  })

  // ── Intro complete ──
  stopPullback()
  clearOverlay()

  // Hold at a good viewing angle facing the cosmos center
  camera.position.set(0, 40, 130)
  camera.lookAt(0, 0, 0)

  // Let the camera sit here for 2 seconds so the viewer sees the full cosmos
  // before autopilot starts drifting
  await sleep(2000)

  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}

// ── Helpers ──

function spawnWave(types) {
  for (const type of types) {
    triggerBirth(createCell(type))
  }
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms))
}
