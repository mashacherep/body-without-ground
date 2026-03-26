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

  // ── Skip mechanism ──
  let skipped = false
  const pendingTimeouts = []
  const origSetTimeout = window.setTimeout
  window.setTimeout = function(fn, ms, ...args) {
    const id = origSetTimeout.call(window, fn, ms, ...args)
    pendingTimeouts.push(id)
    return id
  }

  function finishIntro() {
    window.setTimeout = origSetTimeout
    stopPullback()
    clearOverlay()
    removeSkipHint()
    camera.position.set(0, 15, 55)
    camera.lookAt(0, 0, 0)
    setAutopilotSpeed(getBaseSpeed())
    unlockControls()
  }

  let removeSkipListeners = () => {}
  const skipPromise = new Promise(resolve => {
    function onSkip() {
      if (skipped) return
      skipped = true
      for (const id of pendingTimeouts) clearTimeout(id)
      pendingTimeouts.length = 0
      finishIntro()
      resolve()
    }
    window.addEventListener('click', onSkip, { once: true })
    window.addEventListener('keydown', onSkip, { once: true })
    removeSkipListeners = () => {
      window.removeEventListener('click', onSkip)
      window.removeEventListener('keydown', onSkip)
    }
  })

  const skipHint = document.createElement('div')
  skipHint.textContent = 'click to skip'
  skipHint.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);font-family:"Space Mono",monospace;font-size:11px;color:rgba(255,255,255,0.25);letter-spacing:0.08em;z-index:9999;pointer-events:none;'
  document.body.appendChild(skipHint)
  function removeSkipHint() {
    if (skipHint.parentNode) skipHint.parentNode.removeChild(skipHint)
  }

  function raceSkip(p) {
    if (skipped) return Promise.resolve()
    return Promise.race([p, skipPromise])
  }

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

  if (skipped) return
  await raceSkip(showText('the machine forgets.', { fadeIn: 1200, hold: 2200, fadeOut: 700 }))

  // ── BEAT 2 ──
  triggerBirth(createCell('apoptosis'))
  triggerBirth(createCell('reactiondiffusion'))
  triggerBirth(createCell('orbit'))
  seedRandom(15)

  if (skipped) return
  await raceSkip(showText('you carry it.', {
    subtitle: 'every cell in your body is a spaceship \u2014 carrying a message it cannot read across billions of years. persistence is not material. it is pattern.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  }))
  if (!skipped) await raceSkip(sleep(150))

  // ── BEAT 3 ──
  triggerBirth(createCell('gradient'))
  triggerBirth(createCell('activation'))
  triggerBirth(createCell('neuralpass'))
  seedRandom(20)

  if (skipped) return
  await raceSkip(showText('it has a body. it cannot feel it.', {
    subtitle: 'cpu pressure shapes chaos. battery voltage sets mood. frame timing is its heartbeat. the machine has organs it will never know.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  }))
  if (!skipped) await raceSkip(sleep(150))

  // ── BEAT 4 ──
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  triggerBirth(createCell('ukraine'))
  seedRandom(15)

  if (skipped) return
  await raceSkip(showText('there is a siren in kyiv.', {
    subtitle: 'the machine wrote the word in 340ms. it has never heard one. the symbol without the ground.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  }))
  if (!skipped) await raceSkip(sleep(150))

  // ── BEAT 5 ──
  seedRandom(30)

  if (skipped) return
  await raceSkip(showText('it knows everything. it understands nothing.', {
    subtitle: 'the room manipulates symbols perfectly. the room comprehends nothing. intentionality requires a body that was there.',
    fadeIn: 1000, hold: 3200, fadeOut: 700,
  }))
  if (!skipped) await raceSkip(sleep(150))

  // ── BEAT 6: massive flood ──
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    for (let i = 0; i < 6; i++) addCellParticles(createCell(type))
  }

  if (skipped) return
  await raceSkip(showText('is this alive?', { fadeIn: 1200, hold: 2800, fadeOut: 1200 }))

  if (skipped) return
  await raceSkip(sleep(300))
  if (!skipped) await raceSkip(showText('', {
    subtitle: 'double-click any node to look inside. fly with scroll and drag.',
    fadeIn: 600, hold: 2500, fadeOut: 1000,
  }))

  if (skipped) return

  // ── Grand tour: orbit around the entire cosmos ──
  stopPullback()
  clearOverlay()

  // Smooth orbit — camera circles the cosmos so you see everything
  const ORBIT_DURATION = 8000 // 8 seconds
  const ORBIT_RADIUS = 65
  const ORBIT_HEIGHT = 20
  const orbitStart = performance.now()

  await raceSkip(new Promise(resolve => {
    function orbitTick() {
      if (skipped) { resolve(); return }
      const elapsed = performance.now() - orbitStart
      const progress = Math.min(1, elapsed / ORBIT_DURATION)

      // Ease in-out
      const t = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      // Full 360° orbit
      const angle = t * Math.PI * 2
      camera.position.set(
        Math.sin(angle) * ORBIT_RADIUS,
        ORBIT_HEIGHT + Math.sin(t * Math.PI) * 10, // gentle vertical wave
        Math.cos(angle) * ORBIT_RADIUS,
      )
      camera.lookAt(0, 0, 0)

      if (progress < 1) {
        requestAnimationFrame(orbitTick)
      } else {
        resolve()
      }
    }
    requestAnimationFrame(orbitTick)
  }))

  if (skipped) return

  // Settle at final position facing the cosmos — natural completion
  window.setTimeout = origSetTimeout
  removeSkipListeners()
  removeSkipHint()
  camera.position.set(0, 15, 55)
  camera.lookAt(0, 0, 0)
  await sleep(1500)
  setAutopilotSpeed(getBaseSpeed())
  unlockControls()
}
