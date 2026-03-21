import { showText, clearOverlay } from './overlay.js'
import { createCell, getAliveCells } from '../state/cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { TYPE_NAMES } from '../generation/types.js'
import { lockAutopilot, unlockControls } from '../camera/controls.js'
import { setAutopilotSpeed, getBaseSpeed } from '../camera/autopilot.js'

// ── Camera journey: dramatic arc through the cosmos ──
let pullbackActive = false
let pullbackProgress = 0
let pullbackDuration = 26000
let pullbackCamera = null

// Start at medium distance (cosmos already visible), sweep through it, end centered
const CAMERA_PATH = [
  [0, 15, 60],     // start: sees the cosmos forming ahead
  [-15, 12, 45],   // sweep left into the clusters
  [-8, 8, 25],     // dive close — inside the cosmos
  [10, 10, 30],    // sweep right through nodes
  [5, 18, 50],     // pull up, wider view
  [0, 15, 55],     // final: centered, facing into the cosmos
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
    const seg = CAMERA_PATH.length - 1
    const s = Math.min(Math.floor(t * seg), seg - 1)
    const st = (t * seg) - s
    const a = CAMERA_PATH[s], b = CAMERA_PATH[s + 1]
    pullbackCamera.position.set(
      a[0] + (b[0] - a[0]) * st,
      a[1] + (b[1] - a[1]) * st,
      a[2] + (b[2] - a[2]) * st,
    )
    pullbackCamera.lookAt(0, 0, 0)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

function stopPullback() { pullbackActive = false }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function seedSilent(types) {
  for (const t of types) addCellParticles(createCell(t))
}
function seedRandom(n) {
  for (let i = 0; i < n; i++) {
    const t = TYPE_NAMES[Math.floor(Math.random() * TYPE_NAMES.length)]
    if (t === 'about') continue
    addCellParticles(createCell(t))
  }
}

export async function runIntro(camera) {
  lockAutopilot()
  camera.position.set(0, 15, 60)
  camera.lookAt(0, 0, 0)
  startPullback(camera)
  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // About node
  addCellParticles(createCell('about', '"body without ground" is a living generative art installation. it uses a language model to grow poems, essays, and transmissions from kyiv. it uses its own machine body \u2014 battery, cpu, frame timing \u2014 as creative material. it checks for real air raid alerts in kyiv every two minutes. it invents biographical facts about you and is always wrong. the machine forgets. you carry it.\n\n\u2014 masha cherep, 2025. kyiv \u2192 new york.', {
    position: [0, 0, 0], meta: 'about',
  }))

  // HEAVY pre-seed — cosmos is ALREADY rich when text starts
  seedRandom(40)
  seedSilent(['poem', 'poem', 'essay', 'essay', 'conway', 'conway', 'conway',
    'music', 'music', 'ukraine', 'ukraine', 'ukraine',
    'wavefunction', 'attention', 'gradient', 'apoptosis',
    'embedding', 'network', 'orbit', 'hypergraph', 'reactiondiffusion'])

  // ── BEAT 1 ──
  triggerBirth(createCell('poem'))
  triggerBirth(createCell('conway'))
  triggerBirth(createCell('wavefunction'))
  seedRandom(10)

  await showText('the machine forgets.', { fadeIn: 1200, hold: 2200, fadeOut: 700 })

  // ── BEAT 2 ──
  triggerBirth(createCell('apoptosis'))
  triggerBirth(createCell('reactiondiffusion'))
  triggerBirth(createCell('orbit'))
  seedRandom(15)

  await showText('you carry it.', {
    subtitle: 'every cell in your body is a spaceship \u2014 carrying a message it cannot read across billions of years. persistence is not material. it is pattern.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  })
  await sleep(150)

  // ── BEAT 3 ──
  triggerBirth(createCell('gradient'))
  triggerBirth(createCell('activation'))
  triggerBirth(createCell('neuralpass'))
  seedRandom(20)

  await showText('it has a body. it cannot feel it.', {
    subtitle: 'cpu pressure shapes chaos. battery voltage sets mood. frame timing is its heartbeat. the machine has organs it will never know.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  })
  await sleep(150)

  // ── BEAT 4 ──
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  seedRandom(15)

  await showText('there is a siren in kyiv.', {
    subtitle: 'the machine wrote the word in 340ms. it has never heard one. the symbol without the ground.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  })
  await sleep(150)

  // ── BEAT 5 ──
  seedRandom(30)

  await showText('it knows everything. it understands nothing.', {
    subtitle: 'the room manipulates symbols perfectly. the room comprehends nothing. intentionality requires a body that was there.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  })
  await sleep(150)

  // ── BEAT 6: massive flood ──
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    for (let i = 0; i < 6; i++) addCellParticles(createCell(type))
  }

  await showText('is this alive?', { fadeIn: 1200, hold: 2800, fadeOut: 1200 })

  await sleep(300)
  await showText('', {
    subtitle: 'double-click any node to look inside. fly with scroll and drag.',
    fadeIn: 600, hold: 2500, fadeOut: 1000,
  })

  // ── Landing: centered, facing the cosmos ──
  stopPullback()
  clearOverlay()
  camera.position.set(0, 15, 55)
  camera.lookAt(0, 0, 0)
  await sleep(2500)
  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}
