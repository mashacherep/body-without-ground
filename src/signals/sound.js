let audioCtx = null
let droneOsc1 = null
let droneOsc2 = null
let droneGain = null
let masterGain = null
let initialized = false

// Initialize on first user interaction (browsers require user gesture)
export function initSound() {
  if (initialized) return
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)()
    masterGain = audioCtx.createGain()
    masterGain.gain.value = 0.12
    masterGain.connect(audioCtx.destination)

    // Drone: two slightly detuned sine waves = warm beating tone
    droneGain = audioCtx.createGain()
    droneGain.gain.value = 0
    droneGain.connect(masterGain)

    droneOsc1 = audioCtx.createOscillator()
    droneOsc1.type = 'sine'
    droneOsc1.frequency.value = 55 // A1
    droneOsc1.connect(droneGain)
    droneOsc1.start()

    droneOsc2 = audioCtx.createOscillator()
    droneOsc2.type = 'sine'
    droneOsc2.frequency.value = 55.5 // slightly detuned — creates slow beating
    droneOsc2.connect(droneGain)
    droneOsc2.start()

    initialized = true
  } catch(e) {}
}

// Fade drone in over 3 seconds
export function startDrone() {
  if (!droneGain || !audioCtx) return
  droneGain.gain.cancelScheduledValues(audioCtx.currentTime)
  droneGain.gain.setValueAtTime(droneGain.gain.value, audioCtx.currentTime)
  droneGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 3)
}

// Fade drone out (for reading view or air raid silence)
export function fadeDrone(targetVolume = 0, duration = 2) {
  if (!droneGain || !audioCtx) return
  droneGain.gain.cancelScheduledValues(audioCtx.currentTime)
  droneGain.gain.setValueAtTime(droneGain.gain.value, audioCtx.currentTime)
  droneGain.gain.linearRampToValueAtTime(targetVolume, audioCtx.currentTime + duration)
}

// Birth tone — brief high sine ping
export function playBirthTone() {
  if (!audioCtx || !masterGain) return
  try {
    const osc = audioCtx.createOscillator()
    const gain = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 440 + Math.random() * 220 // A4-ish, varied
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5)
    osc.connect(gain)
    gain.connect(masterGain)
    osc.start()
    osc.stop(audioCtx.currentTime + 1.5)
  } catch(e) {}
}

// Death tone — drone briefly drops in pitch
export function playDeathTone() {
  if (!droneOsc1 || !audioCtx) return
  try {
    const currentFreq = droneOsc1.frequency.value
    droneOsc1.frequency.cancelScheduledValues(audioCtx.currentTime)
    droneOsc1.frequency.setValueAtTime(currentFreq, audioCtx.currentTime)
    droneOsc1.frequency.linearRampToValueAtTime(currentFreq * 0.85, audioCtx.currentTime + 0.5)
    droneOsc1.frequency.linearRampToValueAtTime(currentFreq, audioCtx.currentTime + 3)
  } catch(e) {}
}

// Air raid: drone cuts to silence
export function silenceDrone() {
  fadeDrone(0, 1)
}

// Air raid clear: drone returns slowly
export function restoreDrone() {
  if (!droneGain || !audioCtx) return
  droneGain.gain.cancelScheduledValues(audioCtx.currentTime)
  droneGain.gain.setValueAtTime(droneGain.gain.value, audioCtx.currentTime)
  droneGain.gain.linearRampToValueAtTime(0.6, audioCtx.currentTime + 5) // slow return
}

// Update drone volume with breathing (call every frame)
export function updateDroneBreathing(breathPhase) {
  if (!droneGain || !audioCtx) return
  // Subtle volume modulation synced to breathing
  const breathMod = 0.5 + Math.sin(breathPhase) * 0.1
  // Don't override fade-in/out — only modulate if drone is playing
  if (droneGain.gain.value > 0.1) {
    droneGain.gain.value = breathMod
  }
}

export function isInitialized() { return initialized }
