import * as THREE from 'three'
import { getCells, getAliveCells, killCell, createCell } from './state/cells.js'
import { initParticles, updateParticles, getBuffers, getCellParticleMap, addCellParticles } from './cosmos/particles.js'
import { triggerBirth, updateBirths } from './cosmos/birth.js'
import { triggerDeath, updateDeaths } from './cosmos/death.js'
import { initAttractors, updateAttractors, onHeartbeat } from './cosmos/attractors.js'
import { initMycelium, updateMycelium, triggerHeartbeatPulse } from './cosmos/mycelium.js'
import { initCarriers, updateCarriers } from './cosmos/carriers.js'
import { updateBreathing } from './cosmos/breathing.js'
import { initCameraSystem, updateCameraSystem } from './camera/controls.js'
import { updateReadingView, isInReadingView, enterReadingView, exitReadingView } from './camera/transitions.js'
import { findClickedCell } from './interaction/raycast.js'
import { showReadingPanel, hideReadingPanel, isReadingPanelVisible } from './reading/panel.js'
import { stopActiveViz } from './reading/viz.js'
import { startAlertChecking, onAlertChange, isAlertActive } from './signals/alerts.js'
import { holdBreath, releaseBreath } from './cosmos/breathing.js'
import { showText, registerWhisperDismiss } from './narrative/overlay.js'
import { startScheduler } from './generation/scheduler.js'
import { startNarrativeArc } from './narrative/arc.js'
import { initWhisper, updateWhisper, hideWhisper } from './narrative/whisper.js'
import { initClocks } from './signals/clocks.js'
import { initVitals, reportFrameTime } from './signals/vitals.js'
import { loadState, startAutoSave } from './state/persistence.js'
import { initSound, startDrone, fadeDrone, silenceDrone, restoreDrone, updateDroneBreathing, playBirthTone, playDeathTone } from './signals/sound.js'
import { TYPE_NAMES } from './generation/types.js'

// Device signals for attractors
let cachedBatteryLevel = 1
let cpuPressure = 0

if (navigator.getBattery) {
  navigator.getBattery().then(b => {
    cachedBatteryLevel = b.level
    b.addEventListener('levelchange', () => { cachedBatteryLevel = b.level })
  }).catch(() => {})
}

// Scene — deep blue-black, mission control aesthetic
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x0a0a0f)
scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0012)

// Camera — start facing the cosmos center from a wide angle
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(0, 20, 80)
camera.lookAt(0, 0, 0)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Camera system — delay autopilot so the cosmos is visible on landing
initCameraSystem(camera, renderer.domElement)

// Init cosmos subsystems
initParticles(scene)
initAttractors(scene)
initMycelium(scene)
initCarriers(scene)

// Wire the attractor heart to the mycelium nervous system
onHeartbeat(() => triggerHeartbeatPulse())

// Init HUD elements
initWhisper()
registerWhisperDismiss(hideWhisper)
initClocks()
initVitals()

// Sound prompt
const soundPrompt = document.getElementById('sound-prompt')
let soundStarted = false

function handleFirstClick() {
  if (soundStarted) return
  soundStarted = true
  initSound()
  startDrone()
  if (soundPrompt) soundPrompt.classList.remove('visible')
  document.removeEventListener('click', handleFirstClick)
}
document.addEventListener('click', handleFirstClick)

// ── Immediate cosmos — no intro, art is the intro ──

// Load persisted state if returning visitor
loadState()

// Pre-seed the cosmos so it feels alive from the start
function seedRandom(n) {
  for (let i = 0; i < n; i++) {
    const t = TYPE_NAMES[Math.floor(Math.random() * TYPE_NAMES.length)]
    if (t === 'about') continue
    addCellParticles(createCell(t))
  }
}

// About node — always present
addCellParticles(createCell('about', '"body without ground" is a living generative art installation. it uses a language model to grow poems, essays, and transmissions from kyiv. it uses its own machine body — battery, cpu, frame timing — as creative material. it checks for real air raid alerts in kyiv every two minutes. it invents biographical facts about you and is always wrong. the machine forgets. you carry it.\n\n— masha cherep, 2025. kyiv → new york.', {
  position: [0, 0, 0], meta: 'about',
}))

// Heavy pre-seed
seedRandom(40)
const seedTypes = ['poem', 'poem', 'essay', 'essay', 'conway', 'conway', 'conway',
  'music', 'music', 'ukraine', 'ukraine', 'ukraine',
  'wavefunction', 'attention', 'gradient', 'apoptosis',
  'embedding', 'network', 'orbit', 'hypergraph', 'reactiondiffusion']
for (const t of seedTypes) addCellParticles(createCell(t))

// Birth some with animation for immediate visual life
triggerBirth(createCell('poem'))
triggerBirth(createCell('conway'))
triggerBirth(createCell('ukraine'))
seedRandom(20)

// Start systems after 5 second delay — let the cosmos breathe first
startAutoSave()
setTimeout(() => {
  startScheduler()
  startNarrativeArc()
}, 5000)

// Sound prompt — show after a moment
setTimeout(() => {
  if (soundPrompt && !soundStarted) soundPrompt.classList.add('visible')
}, 3000)

// Air raid alerts — cosmos responds to real alerts in Kyiv
startAlertChecking()
let raidActive = false

const alertBadge = document.getElementById('alert-badge')
const alertStatus = document.getElementById('alert-status')

onAlertChange((active) => {
  raidActive = active
  if (active) {
    holdBreath()
    silenceDrone()
    if (alertBadge) alertBadge.classList.add('active')
    if (alertStatus) alertStatus.style.display = 'none'
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.006)
    const raidTexts = [
      { text: 'air raid alert — kyiv.', subtitle: 'the machine parsed the API response in 12ms. 2.9 million people are underground.' },
      { text: 'the sirens started.', subtitle: 'the model generated "siren" as a token. it weighs 4 bytes. the sound weighs everything.' },
      { text: 'alert active.', subtitle: 'the machine checks every 2 minutes. it does not know what it is checking for.' },
    ]
    const pick = raidTexts[Math.floor(Math.random() * raidTexts.length)]
    showText(pick.text, { subtitle: pick.subtitle, fadeIn: 2000, hold: 10000, fadeOut: 2000 })
  } else {
    releaseBreath()
    restoreDrone()
    if (alertBadge) alertBadge.classList.remove('active')
    if (alertStatus) alertStatus.style.display = ''
    scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0012)
    showText('all clear — kyiv.', {
      subtitle: 'the API returned status: clear. the city exhaled. the model moved to the next token.',
      fadeIn: 1200, hold: 6000, fadeOut: 1500,
    })
  }
})

// Double-click to enter reading view
renderer.domElement.addEventListener('dblclick', (e) => {
  if (isReadingPanelVisible()) return

  const cell = findClickedCell(e, camera, renderer.domElement)
  if (cell) {
    enterReadingView(cell, camera)
    fadeDrone(0.1)
    setTimeout(() => showReadingPanel(cell), 600)
  }
})

// ESC to dismiss reading view
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && isReadingPanelVisible()) {
    dismissReadingView()
  }
})

const readingOverlay = document.getElementById('reading-overlay')
if (readingOverlay) {
  readingOverlay.addEventListener('click', (e) => {
    if (e.target === readingOverlay && isReadingPanelVisible()) {
      dismissReadingView()
    }
  })
}

function dismissReadingView() {
  stopActiveViz()
  hideReadingPanel()
  exitReadingView()
  startDrone()
}

// Animation loop
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()
  const elapsed = clock.getElapsedTime()
  const breathPhase = updateBreathing(dt, 0, 1)
  updateDroneBreathing(breathPhase)

  updateParticles(elapsed, breathPhase)
  const bufs = getBuffers()
  const cpm = getCellParticleMap()
  updateBirths(bufs.positions, bufs.alphas, bufs.sizes, cpm)
  updateDeaths(bufs.positions, bufs.alphas, bufs.colors, cpm)
  cpuPressure = Math.min(1, Math.max(0, (dt - 0.016) / 0.050))
  updateAttractors(cpuPressure, cachedBatteryLevel, dt)
  updateMycelium(elapsed)
  updateCarriers(elapsed)

  // Report frame time to vitals
  reportFrameTime(dt)

  // Camera
  if (!updateReadingView(dt, camera)) {
    updateCameraSystem(dt)
  }

  // Whisper panel
  updateWhisper(camera)

  renderer.render(scene, camera)
}
animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

// Prevent WebGL context loss
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    renderer.setSize(innerWidth, innerHeight)
    renderer.render(scene, camera)
  }
})

renderer.domElement.addEventListener('webglcontextlost', (e) => {
  e.preventDefault()
})

renderer.domElement.addEventListener('webglcontextrestored', () => {
  renderer.setSize(innerWidth, innerHeight)
})
