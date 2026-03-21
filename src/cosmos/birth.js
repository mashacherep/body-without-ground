import { addCellParticles } from './particles.js'

const births = []

export function triggerBirth(cell) {
  const birth = {
    cell,
    startTime: performance.now(),
    duration: 2500,
    done: false,
  }
  births.push(birth)
  addCellParticles(cell, { collapsed: true })
  return birth
}

export function updateBirths(particlePositions, particleAlphas, cellParticleMap) {
  const now = performance.now()

  for (let i = births.length - 1; i >= 0; i--) {
    const b = births[i]
    const progress = Math.min(1, (now - b.startTime) / b.duration)
    const mapping = cellParticleMap.get(b.cell.id)
    if (!mapping) continue

    const ease = 1 - Math.pow(1 - progress, 3)

    for (let j = mapping.startIdx; j < mapping.startIdx + mapping.count; j++) {
      particleAlphas[j] = ease * (0.3 + Math.random() * 0.5)
    }

    if (progress >= 1) {
      b.done = true
      births.splice(i, 1)
    }
  }
}

export function getActiveBirths() { return births }
