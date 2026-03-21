import * as THREE from 'three'
import { getCells, getAliveCells, killCell } from './state/cells.js'
import { initParticles, updateParticles, getBuffers, getCellParticleMap } from './cosmos/particles.js'
import { triggerBirth, updateBirths } from './cosmos/birth.js'
import { triggerDeath, updateDeaths } from './cosmos/death.js'
import { initAttractors, updateAttractors } from './cosmos/attractors.js'
import { initFilaments, updateFilaments } from './cosmos/filaments.js'
import { updateBreathing } from './cosmos/breathing.js'
import { initCameraSystem, updateCameraSystem } from './camera/controls.js'
import { updateReadingView, isInReadingView, enterReadingView, exitReadingView } from './camera/transitions.js'
import { runIntro } from './narrative/intro.js'
import { findClickedCell } from './interaction/raycast.js'
import { showReadingPanel, hideReadingPanel, isReadingPanelVisible } from './reading/panel.js'
import { stopActiveViz } from './reading/viz.js'
import { startAlertChecking, onAlertChange, isAlertActive } from './signals/alerts.js'
import { holdBreath, releaseBreath } from './cosmos/breathing.js'
import { showText } from './narrative/overlay.js'
import { startLifeCycle } from './generation/lifecycle.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050508)
scene.fog = new THREE.FogExp2(0x050508, 0.002)

// Camera
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(5, 3, 15) // Start inside the cosmos for intro

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Camera system (replaces raw OrbitControls)
initCameraSystem(camera, renderer.domElement)

// Init cosmos subsystems
initParticles(scene)
initAttractors(scene)
initFilaments(scene)

// Run intro — seeds cosmos gradually during the text beats
// After intro completes, start the life cycle
runIntro(camera).then(() => {
  startLifeCycle()
})

// Air raid alerts — cosmos responds to real alerts in Kyiv
startAlertChecking()
let raidActive = false

onAlertChange((active) => {
  raidActive = active
  if (active) {
    holdBreath()
    showText('air raid alert — kyiv.', {
      subtitle: 'the garden dims. the machine keeps running. it does not know.',
      fadeIn: 1500,
      hold: 8000,
      fadeOut: 2000,
    })
  } else {
    releaseBreath()
    showText('all clear. kyiv.', {
      subtitle: 'the city exhales. the garden brightens. the machine noticed nothing.',
      fadeIn: 1200,
      hold: 5000,
      fadeOut: 1500,
    })
  }
})

// Double-click to enter reading view — single click = navigate freely
renderer.domElement.addEventListener('dblclick', (e) => {
  if (isReadingPanelVisible()) return

  const cell = findClickedCell(e, camera, renderer.domElement)
  if (cell) {
    enterReadingView(cell, camera)
    setTimeout(() => showReadingPanel(cell), 600)
  }
})

// ESC or click overlay background to dismiss
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
}

// Animation loop
const clock = new THREE.Clock()

function animate() {
  requestAnimationFrame(animate)
  const dt = clock.getDelta()
  const elapsed = clock.getElapsedTime()
  const breathPhase = updateBreathing(dt, 0, 1)

  updateParticles(elapsed, breathPhase)
  const bufs = getBuffers()
  const cpm = getCellParticleMap()
  updateBirths(bufs.positions, bufs.alphas, cpm)
  updateDeaths(bufs.positions, bufs.alphas, bufs.colors, cpm)
  updateAttractors(0, 1)
  updateFilaments(elapsed)

  // Camera: reading view takes priority, then the camera system handles autopilot/viewer
  if (!updateReadingView(dt, camera)) {
    updateCameraSystem(dt)
  }

  renderer.render(scene, camera)
}
animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})

// Prevent WebGL context loss on focus change (Cmd+4 screenshot, tab switch)
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
