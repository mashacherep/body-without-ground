import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { createCell, getCells, getAliveCells, killCell } from './state/cells.js'
import { initParticles, addCellParticles, updateParticles, getBuffers, getCellParticleMap } from './cosmos/particles.js'
import { triggerBirth, updateBirths } from './cosmos/birth.js'
import { triggerDeath, updateDeaths } from './cosmos/death.js'
import { initAttractors, updateAttractors } from './cosmos/attractors.js'
import { initFilaments, updateFilaments } from './cosmos/filaments.js'
import { updateBreathing } from './cosmos/breathing.js'
import { TYPE_NAMES } from './generation/types.js'

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x050508)

// Camera
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000)
camera.position.set(0, 80, 200)

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// Controls
const controls = new OrbitControls(camera, renderer.domElement)
controls.enableDamping = true
controls.dampingFactor = 0.05
controls.maxDistance = 800
controls.minDistance = 10

// Init particles
initParticles(scene)
initAttractors(scene)
initFilaments(scene)

// Seed cells
seedCosmos()

function seedCosmos() {
  // About node at center
  const aboutCell = createCell('about', '"body without ground" is a living generative art installation.', {
    position: [0, 0, 0],
    meta: 'about',
  })
  addCellParticles(aboutCell)

  // Create 3 of each type for initial density
  for (const type of TYPE_NAMES) {
    if (type === 'about') continue
    for (let i = 0; i < 3; i++) {
      const cell = createCell(type)
      addCellParticles(cell)
    }
  }
  console.log(`Seeded ${getCells().length} cells`)
}

// Animation
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
  controls.update()
  renderer.render(scene, camera)
}
animate()

// Resize
window.addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(innerWidth, innerHeight)
})
