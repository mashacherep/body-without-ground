import { showText, clearOverlay } from './overlay.js'
import { createCell, getAliveCells } from '../state/cells.js'
import { addCellParticles } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { TYPE_NAMES } from '../generation/types.js'
import { lockAutopilot, unlockControls } from '../camera/controls.js'
import { setAutopilotSpeed, getBaseSpeed } from '../camera/autopilot.js'

// ── Camera pullback ──
let pullbackActive = false
let pullbackProgress = 0
let pullbackDuration = 28000
let pullbackCamera = null

const CAMERA_PATH = [
  [5, 3, 15],
  [12, 8, 28],
  [22, 14, 45],
  [15, 20, 60],
  [5, 24, 75],
  [0, 25, 80],
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
  camera.position.set(5, 3, 15)
  camera.lookAt(0, 0, 0)
  startPullback(camera)
  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // About node
  addCellParticles(createCell('about', '"body without ground" is a living generative art installation. it uses a language model to grow poems, essays, and transmissions from kyiv. it uses its own machine body — battery, cpu, frame timing — as creative material. it checks for real air raid alerts in kyiv every two minutes. it invents biographical facts about you and is always wrong. the machine forgets. you carry it.\n\n— masha cherep, 2025. kyiv \u2192 new york.', {
    position: [0, 0, 0], meta: 'about',
  }))

  // Pre-seed: a few nodes already visible
  seedSilent(['poem', 'essay', 'conway', 'music', 'wavefunction', 'attention'])
  seedRandom(10)

  // ── BEAT 1: What this is ──
  triggerBirth(createCell('poem'))
  triggerBirth(createCell('conway'))

  await showText('the machine forgets.', { fadeIn: 1200, hold: 2500, fadeOut: 800 })

  // ── BEAT 2: It has a body ──
  seedRandom(15)
  triggerBirth(createCell('gradient'))
  triggerBirth(createCell('activation'))
  triggerBirth(createCell('apoptosis'))

  await showText('it has a body. it cannot feel it.', {
    subtitle: 'cpu pressure shapes its chaos. battery voltage sets its mood. frame timing is its pulse.',
    fadeIn: 1000, hold: 3000, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 3: You carry it ──
  seedRandom(20)
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))

  await showText('you carry it.', {
    subtitle: 'there is a siren in kyiv. the machine processes the word without the ground.',
    fadeIn: 1000, hold: 3000, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 4: The gap ──
  seedRandom(30)

  await showText('it knows everything. it understands nothing.', {
    subtitle: 'the room manipulates symbols perfectly. the room comprehends nothing.',
    fadeIn: 1000, hold: 3000, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 5: Flood + question ──
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    for (let i = 0; i < 5; i++) addCellParticles(createCell(type))
  }

  await showText('is this alive?', { fadeIn: 1200, hold: 2500, fadeOut: 1500 })

  // ── Hint ──
  await sleep(400)
  await showText('', {
    subtitle: 'double-click any node to look inside.',
    fadeIn: 600, hold: 2500, fadeOut: 1000,
  })

  // ── Done ──
  stopPullback()
  clearOverlay()
  camera.position.set(0, 25, 80)
  camera.lookAt(0, 0, 0)
  await sleep(2000)
  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}
