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

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050508)
scene.fog = new THREE.FogExp2(0x050508, 0.003)

// Camera
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(0, 30, 120) // Start where intro begins

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
runIntro(camera)

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
