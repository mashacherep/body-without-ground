import * as THREE from 'three'
import { getCells, getAliveCells, killCell } from './state/cells.js'
import { initParticles, updateParticles, getBuffers, getCellParticleMap } from './cosmos/particles.js'
import { triggerBirth, updateBirths } from './cosmos/birth.js'
import { triggerDeath, updateDeaths } from './cosmos/death.js'
import { initAttractors, updateAttractors } from './cosmos/attractors.js'
import { initFilaments, updateFilaments } from './cosmos/filaments.js'
import { updateBreathing } from './cosmos/breathing.js'
import { initCameraSystem, updateCameraSystem } from './camera/controls.js'
import { updateReadingView, isInReadingView } from './camera/transitions.js'
import { runIntro } from './narrative/intro.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050508)

// Camera
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(0, 2, 8) // Start close for intro

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
  updateFilaments()

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
