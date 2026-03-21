/**
 * Tendrils — short glowing line segments that radiate from each cell cluster.
 * Creates organic, fibrous, non-circular visual forms.
 * Think: neural dendrites, mycelium threads, plasma filaments.
 */

import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'

const MAX_TENDRILS = 6000 // each tendril = 2 vertices = 1 line segment
let mesh = null
let tendrilPositions, tendrilColors
let tendrilCount = 0

export function initTendrils(scene) {
  const geometry = new THREE.BufferGeometry()
  tendrilPositions = new Float32Array(MAX_TENDRILS * 2 * 3) // 2 vertices per tendril
  tendrilColors = new Float32Array(MAX_TENDRILS * 2 * 4)    // RGBA per vertex

  geometry.setAttribute('position', new THREE.BufferAttribute(tendrilPositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(tendrilColors, 4))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  mesh = new THREE.LineSegments(geometry, material)
  scene.add(mesh)
}

export function updateTendrils(time) {
  const cells = getAliveCells()
  tendrilCount = 0

  for (const cell of cells) {
    if (tendrilCount >= MAX_TENDRILS) break

    const typeDef = CELL_TYPES[cell.type]
    if (!typeDef) continue
    const color = typeDef.color
    const cx = cell.position[0]
    const cy = cell.position[1]
    const cz = cell.position[2]

    // Each cell emits 8-15 tendrils — short line segments radiating outward
    const numTendrils = 8 + Math.floor(typeDef.particleCount / 12)

    for (let t = 0; t < numTendrils && tendrilCount < MAX_TENDRILS; t++) {
      const seed = cell.id * 100 + t
      // Direction — pseudo-random but stable per tendril
      const theta = Math.sin(seed * 1.7) * Math.PI * 2
      const phi = Math.cos(seed * 2.3) * Math.PI
      const dirX = Math.sin(phi) * Math.cos(theta)
      const dirY = Math.sin(phi) * Math.sin(theta) * 0.6 // flatten slightly
      const dirZ = Math.cos(phi)

      // Length varies — some short (dendrites), some long (axons)
      const baseLen = 3 + Math.sin(seed * 3.1) * 4
      // Animate: tendrils slowly wave and pulse
      const wave = Math.sin(time * 0.5 + seed * 0.7) * 0.3
      const pulse = 0.8 + Math.sin(time * 1.2 + seed * 1.1) * 0.2
      const len = baseLen * pulse + wave

      // Start point: slightly offset from center
      const startOffset = 1.5 + Math.sin(seed * 4.3) * 1
      const sx = cx + dirX * startOffset
      const sy = cy + dirY * startOffset
      const sz = cz + dirZ * startOffset

      // End point
      const ex = sx + dirX * len
      const ey = sy + dirY * len
      const ez = sz + dirZ * len

      // Slight curve — offset the end point perpendicular to the direction
      const curveSeed = Math.sin(seed * 5.7 + time * 0.3)
      const perpX = -dirZ * curveSeed * 1.5
      const perpZ = dirX * curveSeed * 1.5

      const base = tendrilCount * 6
      tendrilPositions[base]     = sx
      tendrilPositions[base + 1] = sy
      tendrilPositions[base + 2] = sz
      tendrilPositions[base + 3] = ex + perpX
      tendrilPositions[base + 4] = ey
      tendrilPositions[base + 5] = ez + perpZ

      // Color: bright at root, fades at tip
      const alpha = 0.15 + pulse * 0.12
      const mute = 0.75 + Math.random() * 0.25

      const cBase = tendrilCount * 8
      tendrilColors[cBase]     = color[0] * mute
      tendrilColors[cBase + 1] = color[1] * mute
      tendrilColors[cBase + 2] = color[2] * mute
      tendrilColors[cBase + 3] = alpha * 1.2 // brighter at root
      tendrilColors[cBase + 4] = color[0] * mute * 0.5
      tendrilColors[cBase + 5] = color[1] * mute * 0.5
      tendrilColors[cBase + 6] = color[2] * mute * 0.5
      tendrilColors[cBase + 7] = alpha * 0.15 // faint at tip

      tendrilCount++
    }
  }

  // Zero remaining
  for (let i = tendrilCount * 6; i < MAX_TENDRILS * 6; i++) tendrilPositions[i] = 0
  for (let i = tendrilCount * 8; i < MAX_TENDRILS * 8; i++) tendrilColors[i] = 0

  const geo = mesh.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.color.needsUpdate = true
  geo.setDrawRange(0, tendrilCount * 2)
}
