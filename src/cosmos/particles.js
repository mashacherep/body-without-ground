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

const MAX_PARTICLES = 16000

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

  // Ambient dust — fills the void between clusters
  const DUST_COUNT = 2000
  for (let i = 0; i < DUST_COUNT; i++) {
    const idx = particleCount + i
    if (idx >= MAX_PARTICLES) break

    // Scatter across a large sphere
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    const r = 30 + Math.random() * 200

    positions[idx * 3]     = Math.sin(phi) * Math.cos(theta) * r
    positions[idx * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r * 0.4 // flatten vertically
    positions[idx * 3 + 2] = Math.cos(phi) * r

    // Very dim warm white
    colors[idx * 3]     = 0.7 + Math.random() * 0.2
    colors[idx * 3 + 1] = 0.65 + Math.random() * 0.2
    colors[idx * 3 + 2] = 0.6 + Math.random() * 0.15

    sizes[idx] = 0.8 + Math.random() * 1.5
    alphas[idx] = 0.02 + Math.random() * 0.05 // very subtle
    phases[idx] = Math.random() * Math.PI * 2
  }
  particleCount += Math.min(DUST_COUNT, MAX_PARTICLES - particleCount)

  const geo = points.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.aColor.needsUpdate = true
  geo.attributes.aSize.needsUpdate = true
  geo.attributes.aAlpha.needsUpdate = true
  geo.attributes.aPhase.needsUpdate = true
  geo.setDrawRange(0, particleCount)
}

export function addCellParticles(cell, opts = {}) {
  const typeDef = CELL_TYPES[cell.type]
  const count = typeDef.particleCount
  const startIdx = particleCount

  if (particleCount + count > MAX_PARTICLES) return

  // Each cell type gets a unique cluster shape
  const typeIdx = Object.keys(CELL_TYPES).indexOf(cell.type)
  const shapeType = typeIdx % 5 // 0=sphere, 1=ring, 2=filament/streak, 3=spiral, 4=asymmetric blob

  for (let i = 0; i < count; i++) {
    const idx = particleCount + i
    const t = i / count // normalized position within cluster
    const angle = t * Math.PI * 2 * (1 + typeIdx * 0.3)
    const spread = opts.collapsed ? 0.1 : (5 + Math.random() * 8)

    let dx, dy, dz

    if (shapeType === 0) {
      // Sphere — classic, but with varied density (denser at center)
      const r = Math.pow(Math.random(), 0.6) * spread
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      dx = Math.sin(phi) * Math.cos(theta) * r
      dy = Math.sin(phi) * Math.sin(theta) * r
      dz = Math.cos(phi) * r
    } else if (shapeType === 1) {
      // Ring / torus — particles form a ring with some thickness
      const ringR = spread * 0.7
      const tubeR = spread * 0.25
      const ringAngle = angle
      const tubeAngle = Math.random() * Math.PI * 2
      dx = (ringR + Math.cos(tubeAngle) * tubeR) * Math.cos(ringAngle)
      dy = Math.sin(tubeAngle) * tubeR
      dz = (ringR + Math.cos(tubeAngle) * tubeR) * Math.sin(ringAngle)
    } else if (shapeType === 2) {
      // Filament / streak — elongated along one axis
      const stretchAxis = typeIdx % 3
      const len = spread * 1.5
      const width = spread * 0.3
      dx = stretchAxis === 0 ? (Math.random() - 0.5) * len : (Math.random() - 0.5) * width
      dy = stretchAxis === 1 ? (Math.random() - 0.5) * len : (Math.random() - 0.5) * width
      dz = stretchAxis === 2 ? (Math.random() - 0.5) * len : (Math.random() - 0.5) * width
    } else if (shapeType === 3) {
      // Spiral — particles wind outward
      const spiralR = t * spread
      const spiralAngle = t * Math.PI * 6 + typeIdx
      dx = Math.cos(spiralAngle) * spiralR
      dy = (t - 0.5) * spread * 0.5
      dz = Math.sin(spiralAngle) * spiralR
    } else {
      // Asymmetric blob — lopsided, organic
      const r = Math.pow(Math.random(), 0.4) * spread
      const bias = Math.sin(typeIdx * 1.7) * 0.6
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      dx = Math.sin(phi) * Math.cos(theta) * r + bias * spread * 0.3
      dy = Math.sin(phi) * Math.sin(theta) * r * 0.6
      dz = Math.cos(phi) * r - bias * spread * 0.2
    }

    positions[idx * 3]     = cell.position[0] + dx
    positions[idx * 3 + 1] = cell.position[1] + dy
    positions[idx * 3 + 2] = cell.position[2] + dz

    // Color variation within cluster — slight hue shift per particle
    const colorShift = (Math.random() - 0.5) * 0.12
    colors[idx * 3]     = Math.max(0, Math.min(1, typeDef.color[0] + colorShift))
    colors[idx * 3 + 1] = Math.max(0, Math.min(1, typeDef.color[1] + colorShift * 0.5))
    colors[idx * 3 + 2] = Math.max(0, Math.min(1, typeDef.color[2] - colorShift * 0.3))

    // Dramatic size variation — a few very large "core" particles, many tiny ones
    const sizeRoll = Math.random()
    if (sizeRoll > 0.95) {
      sizes[idx] = 4.0 + Math.random() * 4.0 // rare large particles
    } else if (sizeRoll > 0.7) {
      sizes[idx] = 2.0 + Math.random() * 2.0 // medium
    } else {
      sizes[idx] = 0.5 + Math.random() * 1.5 // many tiny ones
    }

    alphas[idx] = 0.4 + Math.random() * 0.5
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

  // Dust current flow — organized streams, not random
  const dustStart = particleCount - 2000 // approximate dust particle range
  if (dustStart > 0) {
    for (let i = Math.max(0, dustStart); i < particleCount; i++) {
      // Flowing stream pattern based on position
      const px = positions[i * 3]
      const pz = positions[i * 3 + 2]
      const flowAngle = Math.atan2(pz, px) + time * 0.02
      const flowSpeed = 0.008
      positions[i * 3]     += Math.cos(flowAngle) * flowSpeed
      positions[i * 3 + 1] += Math.sin(time * 0.1 + i * 0.01) * 0.003
      positions[i * 3 + 2] += Math.sin(flowAngle) * flowSpeed
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
