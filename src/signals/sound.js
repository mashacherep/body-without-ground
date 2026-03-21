/**
 * Sound system — heartbeat + birth/death tones.
 * The heartbeat syncs to the breathing rhythm.
 */

let audioCtx = null
let masterGain = null
let heartbeatTimer = null
let initialized = false
let heartbeatRate = 1200
let heartbeatActive = false

export function initSound() {
  if (initialized) return
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.08
    masterGain.connect(audioCtx.destination)
    initialized = true
  } catch {}
}

function playHeartbeat() {
  if (!audioCtx || !masterGain || !heartbeatActive) return
  try {
    const lub = audioCtx.createOscillator()
    const lubGain = audioCtx.createGain()
    lub.type = 'sine'
    lub.frequency.value = 40
    lubGain.gain.setValueAtTime(0.3, audioCtx.currentTime)
    lubGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15)
    lub.connect(lubGain)
    lubGain.connect(masterGain)
    lub.start(audioCtx.currentTime)
    lub.stop(audioCtx.currentTime + 0.15)

    const dub = audioCtx.createOscillator()
    const dubGain = audioCtx.createGain()
    dub.type = 'sine'
    dub.frequency.value = 55
    dubGain.gain.setValueAtTime(0.2, audioCtx.currentTime + 0.12)
    dubGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25)
    dub.connect(dubGain)
    dubGain.connect(masterGain)
    dub.start(audioCtx.currentTime + 0.12)
    dub.stop(audioCtx.currentTime + 0.25)
  } catch {}
}

export function startDrone() {
  heartbeatActive = true
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(playHeartbeat, heartbeatRate)
}

export function fadeDrone(targetVolume = 0, duration = 2) {
  if (!masterGain || !audioCtx) return
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
  masterGain.gain.setValueAtTime(masterGain.gain.value, audioCtx.currentTime)
  masterGain.gain.linearRampToValueAtTime(targetVolume * 0.08, audioCtx.currentTime + duration)
}

export function silenceDrone() {
  heartbeatActive = false
  if (heartbeatTimer) clearInterval(heartbeatTimer)
}

export function restoreDrone() {
  heartbeatActive = true
  if (!masterGain || !audioCtx) return
  masterGain.gain.cancelScheduledValues(audioCtx.currentTime)
  masterGain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 3)
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  heartbeatTimer = setInterval(playHeartbeat, heartbeatRate)
}

export function updateDroneBreathing(breathPhase) {
  const newRate = 1000 + Math.sin(breathPhase) * 200
  if (Math.abs(newRate - heartbeatRate) > 50) {
    heartbeatRate = newRate
    if (heartbeatActive && heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = setInterval(playHeartbeat, heartbeatRate)
    }
  }
}

export function playBirthTone() {
  if (!audioCtx || !masterGain) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 440 + Math.random() * 220
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start()
    osc.stop(audioCtx.currentTime + 1.2)
  } catch {}
}

export function playDeathTone() {
  if (!audioCtx || !masterGain) return
  heartbeatActive = false
  if (heartbeatTimer) clearInterval(heartbeatTimer)
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 30
    gain.gain.setValueAtTime(0.25, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start()
    osc.stop(audioCtx.currentTime + 0.8)
  } catch {}
  setTimeout(() => {
    heartbeatActive = true
    heartbeatTimer = setInterval(playHeartbeat, heartbeatRate)
  }, 2000)
}

export function isInitialized() { return initialized }
