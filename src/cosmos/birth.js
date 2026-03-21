import { addCellParticles } from './particles.js'

const births = []

export function triggerBirth(cell) {
  const birth = {
    cell,
    startTime: performance.now(),
    duration: 3500, // longer bloom
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
    const cx = b.cell.position[0]
    const cy = b.cell.position[1]
    const cz = b.cell.position[2]

    // Phase 1 (0-800ms): EXPLOSION — bright flash expanding outward
    if (elapsed < 800) {
      const explosionProgress = elapsed / 800
      const flashIntensity = 1 - explosionProgress

      for (let j = mapping.startIdx; j < mapping.startIdx + mapping.count; j++) {
        const localIdx = j - mapping.startIdx

        // First 15 particles are the flash core — very bright, expanding fast
        if (localIdx < 15) {
          particleAlphas[j] = 0.9 + flashIntensity * 0.1
          particleSizes[j] = (2 + Math.random() * 3) * (1 + flashIntensity * 6)

          // Push outward from center
          const dx = particlePositions[j * 3] - cx
          const dy = particlePositions[j * 3 + 1] - cy
          const dz = particlePositions[j * 3 + 2] - cz
          const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.1
          const pushSpeed = flashIntensity * 0.8
          particlePositions[j * 3] += (dx / len) * pushSpeed
          particlePositions[j * 3 + 1] += (dy / len) * pushSpeed
          particlePositions[j * 3 + 2] += (dz / len) * pushSpeed
        }
        // Next 30 particles: shockwave ring — expanding outward fast then fading
        else if (localIdx < 45) {
          const ringProgress = Math.min(1, explosionProgress * 1.5)
          particleAlphas[j] = (1 - ringProgress) * 0.7
          particleSizes[j] = 1 + ringProgress * 4

          const angle = (localIdx / 30) * Math.PI * 2
          const ringR = ringProgress * 12
          particlePositions[j * 3] = cx + Math.cos(angle) * ringR
          particlePositions[j * 3 + 1] = cy + Math.sin(angle * 0.7) * ringR * 0.3
          particlePositions[j * 3 + 2] = cz + Math.sin(angle) * ringR
        }
        // Rest: starting to appear
        else {
          particleAlphas[j] = explosionProgress * 0.3
        }
      }
    }
    // Phase 2 (800ms-3500ms): BLOOM — particles spread to final positions, fading in
    else {
      const bloomProgress = (elapsed - 800) / (b.duration - 800)
      const bloomEase = 1 - Math.pow(1 - bloomProgress, 2.5)

      for (let j = mapping.startIdx; j < mapping.startIdx + mapping.count; j++) {
        const localIdx = j - mapping.startIdx

        // Flash core particles settle down
        if (localIdx < 15) {
          const settle = Math.min(1, bloomProgress * 2)
          particleSizes[j] = particleSizes[j] * (1 - settle) + (1.5 + Math.random() * 3) * settle
          particleAlphas[j] = 0.4 + bloomEase * 0.4
        }
        // Shockwave ring fades completely
        else if (localIdx < 45) {
          particleAlphas[j] = Math.max(0, particleAlphas[j] - 0.02)
          if (bloomProgress > 0.3) {
            // Reposition as normal cluster particles
            particleAlphas[j] = bloomEase * (0.3 + Math.random() * 0.4)
          }
        }
        // Rest of the cluster blooms in
        else {
          particleAlphas[j] = bloomEase * (0.3 + Math.random() * 0.5)
        }
      }
    }

    if (progress >= 1) {
      b.done = true
      births.splice(i, 1)
    }
  }
}

export function getActiveBirths() { return births }
