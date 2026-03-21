import * as THREE from 'three'
import vertexShader from '../shaders/particle.vert?raw'
import fragmentShader from '../shaders/particle.frag?raw'
import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'
import {
  behaviorConway, behaviorUkraine, behaviorTokenprob, behaviorAttention,
  behaviorGradient, behaviorApoptosis, behaviorWavefunction, behaviorSeismic,
  behaviorEmbedding, behaviorReactionDiffusion
} from './behaviors.js'

const MAX_PARTICLES = 5000

let points = null
let positions, colors, sizes, alphas, phases
let particleCount = 0

// Map: cellId -> { startIdx, count }
const cellParticleMap = new Map()

const uniforms = {
  uTime: { value: 0 },
  uBreathPhase: { value: 0 },
}

export function initParticles(scene) {
  const geometry = new THREE.BufferGeometry()

  positions = new Float32Array(MAX_PARTICLES * 3)
  colors = new Float32Array(MAX_PARTICLES * 3)
  sizes = new Float32Array(MAX_PARTICLES)
  alphas = new Float32Array(MAX_PARTICLES)
  phases = new Float32Array(MAX_PARTICLES)

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aAlpha', new THREE.BufferAttribute(alphas, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))

  const material = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  points = new THREE.Points(geometry, material)
  scene.add(points)
}

export function addCellParticles(cell, opts = {}) {
  const typeDef = CELL_TYPES[cell.type]
  const count = typeDef.particleCount
  const startIdx = particleCount

  if (particleCount + count > MAX_PARTICLES) return

  for (let i = 0; i < count; i++) {
    const idx = particleCount + i

    const spread = opts.collapsed ? 0.1 : (3 + Math.random() * 4)
    positions[idx * 3]     = cell.position[0] + (Math.random() - 0.5) * spread
    positions[idx * 3 + 1] = cell.position[1] + (Math.random() - 0.5) * spread
    positions[idx * 3 + 2] = cell.position[2] + (Math.random() - 0.5) * spread

    colors[idx * 3]     = typeDef.color[0]
    colors[idx * 3 + 1] = typeDef.color[1]
    colors[idx * 3 + 2] = typeDef.color[2]

    sizes[idx] = 2.0 + Math.random() * 3.0
    alphas[idx] = 0.3 + Math.random() * 0.5
    phases[idx] = Math.random() * Math.PI * 2
  }

  particleCount += count
  cellParticleMap.set(cell.id, { startIdx, count })

  const geo = points.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.aColor.needsUpdate = true
  geo.attributes.aSize.needsUpdate = true
  geo.attributes.aAlpha.needsUpdate = true
  geo.attributes.aPhase.needsUpdate = true
  geo.setDrawRange(0, particleCount)
}

export function updateParticles(time, breathPhase) {
  uniforms.uTime.value = time
  uniforms.uBreathPhase.value = breathPhase

  const cells = getAliveCells()
  for (const cell of cells) {
    const mapping = cellParticleMap.get(cell.id)
    if (!mapping) continue
    const typeDef = CELL_TYPES[cell.type]
    const speed = typeDef.speed * 0.02

    for (let i = mapping.startIdx; i < mapping.startIdx + mapping.count; i++) {
      const phase = phases[i] + time * speed
      const cx = cell.position[0]
      const cy = cell.position[1]
      const cz = cell.position[2]
      const orbitR = 2 + Math.sin(phase * 0.7) * 2
      positions[i * 3]     += (cx + Math.cos(phase) * orbitR - positions[i * 3]) * 0.01
      positions[i * 3 + 1] += (cy + Math.sin(phase * 1.3) * orbitR - positions[i * 3 + 1]) * 0.01
      positions[i * 3 + 2] += (cz + Math.sin(phase * 0.9) * orbitR - positions[i * 3 + 2]) * 0.01
    }
  }

  // Per-type behaviors
  for (const cell of cells) {
    const mapping = cellParticleMap.get(cell.id)
    if (!mapping) continue

    switch (cell.type) {
      case 'conway':
        behaviorConway(positions, sizes, mapping.startIdx, mapping.count, time)
        break
      case 'ukraine':
        behaviorUkraine(positions, sizes, alphas, mapping.startIdx, mapping.count, time, false)
        break
      case 'tokenprob':
        behaviorTokenprob(positions, sizes, mapping.startIdx, mapping.count, time)
        break
      case 'attention':
        behaviorAttention(positions, sizes, mapping.startIdx, mapping.count, time, cell.position)
        break
      case 'gradient':
        behaviorGradient(positions, mapping.startIdx, mapping.count, time, cell.position)
        break
      case 'apoptosis':
        behaviorApoptosis(positions, sizes, alphas, mapping.startIdx, mapping.count, time)
        break
      case 'wavefunction':
        behaviorWavefunction(positions, mapping.startIdx, mapping.count, time, cell.position)
        break
      case 'seismic':
        behaviorSeismic(positions, mapping.startIdx, mapping.count, 0.5)
        break
      case 'embedding':
        behaviorEmbedding(positions, mapping.startIdx, mapping.count, time, cell.position)
        break
      case 'reactiondiffusion':
        behaviorReactionDiffusion(positions, sizes, mapping.startIdx, mapping.count, time, cell.position)
        break
    }
  }

  // Flag additional buffers
  if (points) {
    points.geometry.attributes.position.needsUpdate = true
    points.geometry.attributes.aSize.needsUpdate = true
    points.geometry.attributes.aAlpha.needsUpdate = true
    points.geometry.attributes.aColor.needsUpdate = true
  }
}

export function getBuffers() {
  return { positions, colors, sizes, alphas, phases }
}

export function getCellParticleMap() { return cellParticleMap }
export function getParticleSystem() { return points }
