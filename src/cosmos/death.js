import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'

const deaths = []

export function triggerDeath(cell, cellParticleMap) {
  const mapping = cellParticleMap.get(cell.id)
  if (!mapping) return null

  const alive = getAliveCells().filter(c => c.id !== cell.id)
  let nearest = null, nearestDist = Infinity
  for (const other of alive) {
    const dx = other.position[0] - cell.position[0]
    const dy = other.position[1] - cell.position[1]
    const dz = other.position[2] - cell.position[2]
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
    if (dist < nearestDist) { nearest = other; nearestDist = dist }
  }

  const death = {
    cell,
    mapping,
    startTime: performance.now(),
    scatterDuration: 3000,
    absorbDuration: 5000,
    totalDuration: 8000,
    nearestCell: nearest,
    done: false,
    originalColor: [...CELL_TYPES[cell.type].color],
  }
  deaths.push(death)
  return death
}

export function updateDeaths(positions, alphas, colors, cellParticleMap) {
  const now = performance.now()

  for (let i = deaths.length - 1; i >= 0; i--) {
    const d = deaths[i]
    const elapsed = now - d.startTime
    const progress = Math.min(1, elapsed / d.totalDuration)
    const { startIdx, count } = d.mapping

    if (elapsed < d.scatterDuration) {
      const scatter = elapsed / d.scatterDuration
      for (let j = startIdx; j < startIdx + count; j++) {
        const cx = d.cell.position[0]
        const cy = d.cell.position[1]
        const cz = d.cell.position[2]
        const dx = positions[j * 3] - cx
        const dy = positions[j * 3 + 1] - cy
        const dz = positions[j * 3 + 2] - cz
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1
        positions[j * 3]     += (dx / len) * scatter * 0.3
        positions[j * 3 + 1] += (dy / len) * scatter * 0.3
        positions[j * 3 + 2] += (dz / len) * scatter * 0.3
        alphas[j] *= 0.995
      }
    } else if (d.nearestCell) {
      const target = d.nearestCell.position
      const targetColor = CELL_TYPES[d.nearestCell.type].color

      for (let j = startIdx; j < startIdx + count; j++) {
        positions[j * 3]     += (target[0] - positions[j * 3]) * 0.008
        positions[j * 3 + 1] += (target[1] - positions[j * 3 + 1]) * 0.008
        positions[j * 3 + 2] += (target[2] - positions[j * 3 + 2]) * 0.008
        colors[j * 3]     += (targetColor[0] - colors[j * 3]) * 0.01
        colors[j * 3 + 1] += (targetColor[1] - colors[j * 3 + 1]) * 0.01
        colors[j * 3 + 2] += (targetColor[2] - colors[j * 3 + 2]) * 0.01
        alphas[j] *= 0.99
      }
    } else {
      for (let j = startIdx; j < startIdx + count; j++) {
        alphas[j] *= 0.98
      }
    }

    if (progress >= 1) {
      d.done = true
      for (let j = startIdx; j < startIdx + count; j++) {
        alphas[j] = 0
      }
      deaths.splice(i, 1)
    }
  }
}

export function getActiveDeaths() { return deaths }
