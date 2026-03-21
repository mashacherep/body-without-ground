export function behaviorConway(positions, sizes, startIdx, count, time) {
  for (let i = startIdx; i < startIdx + count; i++) {
    const flicker = Math.sin(time * 3 + i * 1.7) > 0.2 ? 1 : 0.3
    sizes[i] = (2.0 + Math.random() * 2.0) * flicker
  }
}

export function behaviorUkraine(positions, sizes, alphas, startIdx, count, time, raidActive) {
  const pulseSpeed = raidActive ? 4 : 1.5
  for (let i = startIdx; i < startIdx + count; i++) {
    const pulse = 0.5 + 0.5 * Math.sin(time * pulseSpeed + i * 0.3)
    alphas[i] = raidActive ? pulse * 0.3 : 0.3 + pulse * 0.4
    sizes[i] = raidActive ? 1.5 : 2.5 + pulse * 2
  }
}

export function behaviorTokenprob(positions, sizes, startIdx, count, time) {
  for (let i = startIdx; i < startIdx + count; i++) {
    if (i === startIdx) {
      sizes[i] = 5 + Math.sin(time) * 1
    } else {
      sizes[i] = 1.5 + Math.sin(time * 2 + i) * 0.5
    }
  }
}

export function behaviorAttention(positions, sizes, startIdx, count, time, cellPos) {
  const gridPhase = (time * 0.3) % (Math.PI * 2)
  const gridStrength = Math.max(0, Math.sin(gridPhase))
  const cols = Math.ceil(Math.sqrt(count))
  for (let i = startIdx; i < startIdx + count; i++) {
    const li = i - startIdx
    const gridX = (li % cols - cols / 2) * 1.2
    const gridY = (Math.floor(li / cols) - cols / 2) * 1.2
    positions[i * 3]     += (cellPos[0] + gridX - positions[i * 3]) * gridStrength * 0.05
    positions[i * 3 + 1] += (cellPos[1] + gridY - positions[i * 3 + 1]) * gridStrength * 0.05
  }
}

export function behaviorGradient(positions, startIdx, count, time, cellPos) {
  const cycle = (time * 0.5) % 4
  for (let i = startIdx; i < startIdx + count; i++) {
    if (cycle < 2) {
      positions[i * 3]     += (cellPos[0] - positions[i * 3]) * 0.01
      positions[i * 3 + 1] += (cellPos[1] - 2 - positions[i * 3 + 1]) * 0.01
      positions[i * 3 + 2] += (cellPos[2] - positions[i * 3 + 2]) * 0.01
    }
  }
}

export function behaviorApoptosis(positions, sizes, alphas, startIdx, count, time) {
  for (let i = startIdx; i < startIdx + count; i++) {
    const deathCycle = Math.sin(time * 0.8 + i * 2.3)
    if (deathCycle > 0.92) {
      alphas[i] *= 0.95
      sizes[i] *= 1.05
    }
    if (deathCycle < -0.95 && alphas[i] < 0.1) {
      alphas[i] = 0.4 + Math.random() * 0.3
      sizes[i] = 2.0 + Math.random() * 2.0
    }
  }
}

export function behaviorWavefunction(positions, startIdx, count, time, cellPos) {
  for (let i = startIdx; i < startIdx + count; i++) {
    const offset = Math.sin(time * 2 + (i - startIdx) * 0.5) * 2
    positions[i * 3 + 1] += (cellPos[1] + offset - positions[i * 3 + 1]) * 0.02
  }
}

export function behaviorSeismic(positions, startIdx, count, quakeAmplitude) {
  for (let i = startIdx; i < startIdx + count; i++) {
    positions[i * 3]     += (Math.random() - 0.5) * quakeAmplitude * 0.3
    positions[i * 3 + 1] += (Math.random() - 0.5) * quakeAmplitude * 0.3
    positions[i * 3 + 2] += (Math.random() - 0.5) * quakeAmplitude * 0.3
  }
}

export function behaviorEmbedding(positions, startIdx, count, time, cellPos) {
  const clusterPhase = (time * 0.2) % (Math.PI * 2)
  const clusterStrength = 0.5 + 0.5 * Math.sin(clusterPhase)
  const groups = 4
  for (let i = startIdx; i < startIdx + count; i++) {
    const group = (i - startIdx) % groups
    const angle = (group / groups) * Math.PI * 2
    const targetX = cellPos[0] + Math.cos(angle) * 3 * clusterStrength
    const targetZ = cellPos[2] + Math.sin(angle) * 3 * clusterStrength
    positions[i * 3]     += (targetX - positions[i * 3]) * 0.005
    positions[i * 3 + 2] += (targetZ - positions[i * 3 + 2]) * 0.005
  }
}

export function behaviorReactionDiffusion(positions, sizes, startIdx, count, time, cellPos) {
  for (let i = startIdx; i < startIdx + count; i++) {
    const li = i - startIdx
    const spotAngle = (li / count) * Math.PI * 2
    const spotR = 2 + Math.sin(time * 0.5 + li * 0.8) * 1.5
    const targetX = cellPos[0] + Math.cos(spotAngle + time * 0.1) * spotR
    const targetZ = cellPos[2] + Math.sin(spotAngle + time * 0.1) * spotR
    positions[i * 3]     += (targetX - positions[i * 3]) * 0.02
    positions[i * 3 + 2] += (targetZ - positions[i * 3 + 2]) * 0.02
    sizes[i] = 2.5 + Math.sin(time * 0.3 + li * 1.5) * 1.5
  }
}
