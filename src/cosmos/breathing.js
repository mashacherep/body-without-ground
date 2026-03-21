const state = {
  phase: 0,
  rate: Math.PI * 2 / 4, // 4-second cycle
  amplitude: 0.04,
  holding: false,
  targetRate: Math.PI * 2 / 4,
  targetAmplitude: 0.04,
}

export function updateBreathing(dt, cpuPressure, batteryLevel) {
  state.targetRate = (Math.PI * 2 / 4) * (1 + cpuPressure * 0.5)
  state.targetAmplitude = 0.04 * (0.5 + batteryLevel * 0.5)

  state.rate += (state.targetRate - state.rate) * 0.02
  state.amplitude += (state.targetAmplitude - state.amplitude) * 0.02

  if (state.holding) {
    state.amplitude *= 0.98
  } else {
    state.phase += state.rate * dt
  }

  return state.phase
}

export function holdBreath() {
  state.holding = true
}

export function releaseBreath() {
  state.holding = false
  state.rate *= 0.5
}

export function getBreathState() { return state }
