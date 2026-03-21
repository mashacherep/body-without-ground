import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'

const MAX_CONNECTIONS = 800
let lineSegments = null
let linePositions, lineColors

export function initFilaments(scene) {
  const geometry = new THREE.BufferGeometry()
  linePositions = new Float32Array(MAX_CONNECTIONS * 2 * 3)
  lineColors = new Float32Array(MAX_CONNECTIONS * 2 * 4)

  geometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(lineColors, 4))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  lineSegments = new THREE.LineSegments(geometry, material)
  scene.add(lineSegments)
}

export function updateFilaments(time) {
  const cells = getAliveCells()
  let connIdx = 0
  const maxDist = 60
  const maxCheck = Math.min(cells.length, 100)

  for (let i = 0; i < maxCheck && connIdx < MAX_CONNECTIONS; i++) {
    const a = cells[i]
    for (let j = i + 1; j < Math.min(i + 20, maxCheck) && connIdx < MAX_CONNECTIONS; j++) {
      const b = cells[j]
      const dx = a.position[0] - b.position[0]
      const dy = a.position[1] - b.position[1]
      const dz = a.position[2] - b.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist < maxDist) {
        const sameType = a.type === b.type
        const basePulse = 0.5 + 0.5 * Math.sin(time * 1.5 + i * 0.7 + j * 1.3)
        const alpha = (1 - dist / maxDist) * (sameType ? 0.25 + basePulse * 0.2 : 0.05 + basePulse * 0.05)
        const color = sameType ? CELL_TYPES[a.type].color : [0.6, 0.6, 0.55]

        const base = connIdx * 6
        linePositions[base]     = a.position[0]
        linePositions[base + 1] = a.position[1]
        linePositions[base + 2] = a.position[2]
        linePositions[base + 3] = b.position[0]
        linePositions[base + 4] = b.position[1]
        linePositions[base + 5] = b.position[2]

        const cBase = connIdx * 8
        lineColors[cBase]     = color[0]
        lineColors[cBase + 1] = color[1]
        lineColors[cBase + 2] = color[2]
        lineColors[cBase + 3] = alpha
        lineColors[cBase + 4] = color[0]
        lineColors[cBase + 5] = color[1]
        lineColors[cBase + 6] = color[2]
        lineColors[cBase + 7] = alpha

        connIdx++
      }
    }
  }

  for (let i = connIdx * 6; i < MAX_CONNECTIONS * 6; i++) linePositions[i] = 0
  for (let i = connIdx * 8; i < MAX_CONNECTIONS * 8; i++) lineColors[i] = 0

  const geo = lineSegments.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.color.needsUpdate = true
  geo.setDrawRange(0, connIdx * 2)
}
