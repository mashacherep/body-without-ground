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

export function updateBirths(particlePositions, particleAlphas, particleSizes, cellParticleMap) {
  const now = performance.now()

  for (let i = births.length - 1; i >= 0; i--) {
    const b = births[i]
    const elapsed = now - b.startTime
    const progress = Math.min(1, elapsed / b.duration)
    const mapping = cellParticleMap.get(b.cell.id)
    if (!mapping) continue

    const ease = 1 - Math.pow(1 - progress, 3)

    for (let j = mapping.startIdx; j < mapping.startIdx + mapping.count; j++) {
      const isFlash = (j - mapping.startIdx) < 5

      if (isFlash && elapsed < 500) {
        // Bright flash core
        const flashDecay = 1 - (elapsed / 500)
        particleAlphas[j] = 0.8 + flashDecay * 0.2
        particleSizes[j] = (1.5 + Math.random() * 3.0) * (1 + flashDecay * 4)
      } else {
        particleAlphas[j] = ease * (0.3 + Math.random() * 0.5)
      }
    }

    if (progress >= 1) {
      b.done = true
      births.splice(i, 1)
    }
  }
}

export function getActiveBirths() { return births }
