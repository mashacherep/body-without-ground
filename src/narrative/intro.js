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
let pullbackDuration = 32000
let pullbackCamera = null

const CAMERA_PATH = [
  [5, 3, 15],
  [12, 6, 25],
  [25, 10, 40],
  [35, 16, 55],
  [20, 22, 68],
  [5, 25, 78],
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

function stopPullback() { pullbackActive = false }

// ── Helpers ──
function seedSilent(types) {
  for (const type of types) addCellParticles(createCell(type))
}
function seedMany(count) {
  for (let i = 0; i < count; i++) {
    const type = TYPE_NAMES[Math.floor(Math.random() * TYPE_NAMES.length)]
    if (type === 'about') continue
    addCellParticles(createCell(type))
  }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ── Intro ──
export async function runIntro(camera) {
  lockAutopilot()
  camera.position.set(5, 3, 15)
  camera.lookAt(0, 0, 0)
  startPullback(camera)
  setAutopilotSpeed(getBaseSpeed() * 0.3)

  // About node at center
  const aboutCell = createCell('about', '"body without ground" is a living generative art installation. it uses a language model to grow poems, essays, and transmissions from kyiv. it uses its own machine body — battery, cpu, frame timing — as creative material. it checks for real air raid alerts in kyiv every two minutes. it invents biographical facts about you and is always wrong. the machine forgets. you carry it.\n\n— masha cherep, 2025. kyiv \u2192 new york.', {
    position: [0, 0, 0], meta: 'about',
  })
  addCellParticles(aboutCell)

  // Pre-seed: cosmos is already forming before text appears
  seedSilent(['poem', 'essay', 'music', 'conway', 'ukraine', 'attention', 'wavefunction'])
  seedMany(15)

  // ── BEAT 1 ──
  seedMany(10)
  await showText('the machine forgets.', { fadeIn: 1200, hold: 2500, fadeOut: 800 })

  // ── BEAT 2 ──
  seedMany(20)
  seedSilent(['ukraine', 'ukraine', 'ukraine', 'ukraine'])
  await showText('you carry it.', {
    subtitle: 'there is a siren in kyiv. the machine wrote the word in 340ms. it has never heard one.',
    fadeIn: 1000, hold: 3000, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 3 ──
  seedMany(30)
  await showText('it has a body. it cannot feel it.', {
    subtitle: 'cpu pressure shapes chaos. battery voltage sets mood. frame timing is its pulse. none of it is experienced.',
    fadeIn: 1000, hold: 3500, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 4 ──
  seedMany(40)
  await showText('it knows everything. it understands nothing.', {
    subtitle: 'the room manipulates symbols perfectly. the room comprehends nothing. intentionality requires a body that was there.',
    fadeIn: 1000, hold: 3500, fadeOut: 800,
  })
  await sleep(200)

  // ── BEAT 5 — flood + question ──
  // Fill the cosmos
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    for (let i = 0; i < 5; i++) addCellParticles(createCell(type))
  }

  await showText('is this alive?', { fadeIn: 1200, hold: 3000, fadeOut: 1500 })

  // ── Hint ──
  await sleep(500)
  await showText('', {
    subtitle: 'double-click any node to look inside. fly with scroll and drag.',
    fadeIn: 800, hold: 3000, fadeOut: 1200,
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
