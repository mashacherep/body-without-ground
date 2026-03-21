/**
 * Carriers — small glowing elongated shapes drifting through the cosmos.
 * They represent persistence: carrying messages forward without reading them.
 * Born from dying cells, absorbed by living ones.
 * Visually: bioluminescent organisms / meteors / seeds.
 */

import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'

const MAX_CARRIERS = 60
let mesh = null
let carrierPositions, carrierColors
let carriers = [] // { position, velocity, color, word, age, maxAge }

export function initCarriers(scene) {
  const geometry = new THREE.BufferGeometry()
  // Each carrier = 3 line segments (head + 2 trail segments) = 6 vertices
  carrierPositions = new Float32Array(MAX_CARRIERS * 6 * 3)
  carrierColors = new Float32Array(MAX_CARRIERS * 6 * 4)

  geometry.setAttribute('position', new THREE.BufferAttribute(carrierPositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(carrierColors, 4))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  mesh = new THREE.LineSegments(geometry, material)
  scene.add(mesh)

  // Seed a few initial carriers
  for (let i = 0; i < 12; i++) {
    spawnCarrier(
      [(Math.random() - 0.5) * 80, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 80],
      [0.5 + Math.random() * 0.3, 0.5 + Math.random() * 0.3, 0.6 + Math.random() * 0.3],
      ''
    )
  }
}

/**
 * Spawn a carrier from a position with a color and optional word.
 */
export function spawnCarrier(position, color, word) {
  if (carriers.length >= MAX_CARRIERS) return

  // Random direction with slight bias upward
  const theta = Math.random() * Math.PI * 2
  const phi = Math.acos(2 * Math.random() - 1)
  const speed = 0.15 + Math.random() * 0.2

  carriers.push({
    x: position[0], y: position[1], z: position[2],
    vx: Math.sin(phi) * Math.cos(theta) * speed,
    vy: Math.sin(phi) * Math.sin(theta) * speed * 0.5 + 0.02, // slight upward drift
    vz: Math.cos(phi) * speed,
    color: [...color],
    word: word || '',
    age: 0,
    maxAge: 800 + Math.random() * 600, // frames alive
    absorbed: false,
  })
}

/**
 * Spawn carriers from a dying cell — carries fragments forward.
 */
export function spawnFromDeath(cell) {
  const typeDef = CELL_TYPES[cell.type]
  if (!typeDef) return
  const words = (cell.content || cell.type).split(/\s+/).filter(w => w.length > 2)

  for (let i = 0; i < Math.min(3, MAX_CARRIERS - carriers.length); i++) {
    const word = words[i] || cell.type
    spawnCarrier(
      cell.position,
      typeDef.color,
      word
    )
  }
}

export function updateCarriers(time) {
  const alive = getAliveCells()

  for (let i = carriers.length - 1; i >= 0; i--) {
    const c = carriers[i]
    c.age++

    // Move
    c.x += c.vx
    c.y += c.vy
    c.z += c.vz

    // Gentle curve — not straight lines
    c.vx += Math.sin(time * 0.5 + i * 2.1) * 0.001
    c.vy += Math.cos(time * 0.3 + i * 1.7) * 0.0005
    c.vz += Math.sin(time * 0.4 + i * 3.3) * 0.001

    // Check if near a living cell — get absorbed
    if (c.age > 100) { // don't absorb immediately
      for (const cell of alive) {
        const dx = cell.position[0] - c.x
        const dy = cell.position[1] - c.y
        const dz = cell.position[2] - c.z
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
        if (dist < 8) {
          // Absorbed — drift toward the cell
          c.vx += dx * 0.005
          c.vy += dy * 0.005
          c.vz += dz * 0.005
          if (dist < 2) {
            c.absorbed = true
          }
        }
      }
    }

    // Remove if too old or absorbed or too far
    const tooFar = Math.abs(c.x) > 200 || Math.abs(c.y) > 120 || Math.abs(c.z) > 200
    if (c.age > c.maxAge || c.absorbed || tooFar) {
      carriers.splice(i, 1)
    }
  }

  // Render
  let idx = 0
  for (let i = 0; i < carriers.length && idx < MAX_CARRIERS; i++) {
    const c = carriers[i]
    const fade = Math.min(1, c.age / 30) * Math.max(0, 1 - c.age / c.maxAge)
    const trailLen = 2.5
    const trailLen2 = 5

    // Direction vector (normalized velocity)
    const speed = Math.sqrt(c.vx * c.vx + c.vy * c.vy + c.vz * c.vz) || 0.01
    const dx = c.vx / speed
    const dy = c.vy / speed
    const dz = c.vz / speed

    const base = idx * 18 // 6 vertices * 3 components
    const cBase = idx * 24 // 6 vertices * 4 components

    // Segment 1: bright head
    carrierPositions[base] = c.x
    carrierPositions[base + 1] = c.y
    carrierPositions[base + 2] = c.z
    carrierPositions[base + 3] = c.x - dx * trailLen
    carrierPositions[base + 4] = c.y - dy * trailLen
    carrierPositions[base + 5] = c.z - dz * trailLen

    // Segment 2: mid trail
    carrierPositions[base + 6] = c.x - dx * trailLen
    carrierPositions[base + 7] = c.y - dy * trailLen
    carrierPositions[base + 8] = c.z - dz * trailLen
    carrierPositions[base + 9] = c.x - dx * trailLen2
    carrierPositions[base + 10] = c.y - dy * trailLen2
    carrierPositions[base + 11] = c.z - dz * trailLen2

    // Segment 3: faint tail
    carrierPositions[base + 12] = c.x - dx * trailLen2
    carrierPositions[base + 13] = c.y - dy * trailLen2
    carrierPositions[base + 14] = c.z - dz * trailLen2
    carrierPositions[base + 15] = c.x - dx * trailLen2 * 1.5
    carrierPositions[base + 16] = c.y - dy * trailLen2 * 1.5
    carrierPositions[base + 17] = c.z - dz * trailLen2 * 1.5

    // Colors: bright head fading to nothing
    const alpha = fade * 0.6

    // Head: bright, slightly white
    carrierColors[cBase] = Math.min(1, c.color[0] * 1.3)
    carrierColors[cBase + 1] = Math.min(1, c.color[1] * 1.3)
    carrierColors[cBase + 2] = Math.min(1, c.color[2] * 1.3)
    carrierColors[cBase + 3] = alpha

    carrierColors[cBase + 4] = c.color[0]
    carrierColors[cBase + 5] = c.color[1]
    carrierColors[cBase + 6] = c.color[2]
    carrierColors[cBase + 7] = alpha * 0.5

    // Mid
    carrierColors[cBase + 8] = c.color[0]
    carrierColors[cBase + 9] = c.color[1]
    carrierColors[cBase + 10] = c.color[2]
    carrierColors[cBase + 11] = alpha * 0.5

    carrierColors[cBase + 12] = c.color[0] * 0.6
    carrierColors[cBase + 13] = c.color[1] * 0.6
    carrierColors[cBase + 14] = c.color[2] * 0.6
    carrierColors[cBase + 15] = alpha * 0.2

    // Tail
    carrierColors[cBase + 16] = c.color[0] * 0.4
    carrierColors[cBase + 17] = c.color[1] * 0.4
    carrierColors[cBase + 18] = c.color[2] * 0.4
    carrierColors[cBase + 19] = alpha * 0.1

    carrierColors[cBase + 20] = c.color[0] * 0.2
    carrierColors[cBase + 21] = c.color[1] * 0.2
    carrierColors[cBase + 22] = c.color[2] * 0.2
    carrierColors[cBase + 23] = 0

    idx++
  }

  // Zero remaining
  for (let i = idx * 18; i < MAX_CARRIERS * 18; i++) carrierPositions[i] = 0
  for (let i = idx * 24; i < MAX_CARRIERS * 24; i++) carrierColors[i] = 0

  const geo = mesh.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.color.needsUpdate = true
  geo.setDrawRange(0, idx * 6)
}

export function getCarrierCount() { return carriers.length }
