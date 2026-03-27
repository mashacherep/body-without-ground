/**
 * Attractors — Lorenz and Rossler strange attractors as the beating heart
 * of the cosmos. Their mathematics modulate with an asymmetric ECG-shaped
 * envelope, making the butterfly wings physically expand and contract.
 *
 * Beat rate driven by real CPU pressure. Frame drops cause arrhythmia.
 * Each beat sends a pulse through the mycelium nervous system.
 */

import * as THREE from 'three'

// ── Trail config ──────────────────────────────────────────────────
const LORENZ_TRAIL = 2000
const ROSSLER_TRAIL = 1500

// ── Attractor state ───────────────────────────────────────────────
const lorenz = {
  x: 0.1, y: 0, z: 0,
  sigma: 10, rho: 28, beta: 8 / 3,
  dt: 0.003,
}

const rossler = {
  x: 1, y: 1, z: 1,
  a: 0.2, b: 0.2, c: 5.7,
  dt: 0.008,
}

// ── Heart state ───────────────────────────────────────────────────
const heart = {
  phase: 0,          // 0→1 per cardiac cycle
  bpm: 62,           // resting heart rate
  lastBeatTime: 0,   // for HRV tracking
  hrvJitter: 0,      // subtle irregularity
  beatCount: 0,
  // ECG envelope output (0→1, peaks during QRS complex)
  envelope: 0,
  // Brightness pulse traveling the trail (0→1)
  trailPulse: -1,
  trailPulseSpeed: 3.0, // full trail traversal in ~0.33s
}

// ── Three.js objects ──────────────────────────────────────────────
let lorenzLine, rosslerLine
let lorenzPositions, rosslerPositions
let lorenzColors, rosslerColors
let lorenzIdx = 0, rosslerIdx = 0

// ── ECG envelope ──────────────────────────────────────────────────
// Asymmetric: fast systole (~30% of cycle), slow diastole (~70%)
// Shaped like a simplified PQRST waveform
function ecgEnvelope(phase) {
  // P wave: small bump at 0.05-0.12
  // QRS complex: sharp spike at 0.15-0.25 (this is the beat)
  // T wave: gentle hill at 0.35-0.55
  // Rest: diastole 0.55-1.0

  if (phase < 0.05) return 0
  // P wave
  if (phase < 0.12) {
    const t = (phase - 0.05) / 0.07
    return 0.15 * Math.sin(t * Math.PI)
  }
  if (phase < 0.15) return 0
  // QRS complex — the heartbeat
  if (phase < 0.18) {
    const t = (phase - 0.15) / 0.03
    return t * 1.0 // sharp rise
  }
  if (phase < 0.22) {
    const t = (phase - 0.18) / 0.04
    return 1.0 - t * 1.0 // sharp fall
  }
  if (phase < 0.25) return 0
  // T wave
  if (phase < 0.35) {
    const t = (phase - 0.25) / 0.10
    return 0.3 * Math.sin(t * Math.PI)
  }
  if (phase < 0.45) {
    const t = (phase - 0.35) / 0.10
    return 0.3 * Math.sin((1 + t) * Math.PI) * 0.5 // gentle down
  }
  // Diastole — rest
  return 0
}

// ── Heartbeat pulse callback (mycelium listens to this) ───────────
let _onHeartbeat = null
export function onHeartbeat(fn) { _onHeartbeat = fn }

// ── Get heart state for external systems ──────────────────────────
export function getHeartPhase() { return heart.phase }
export function getHeartEnvelope() { return heart.envelope }
export function getHeartBPM() { return heart.bpm }

// ── Init ──────────────────────────────────────────────────────────
export function initAttractors(scene) {
  // Lorenz trail with per-vertex colors for brightness pulse
  const lorenzGeo = new THREE.BufferGeometry()
  lorenzPositions = new Float32Array(LORENZ_TRAIL * 3)
  lorenzColors = new Float32Array(LORENZ_TRAIL * 4) // RGBA
  lorenzGeo.setAttribute('position', new THREE.BufferAttribute(lorenzPositions, 3))
  lorenzGeo.setAttribute('color', new THREE.BufferAttribute(lorenzColors, 4))

  // Pre-fill trail
  for (let i = 0; i < LORENZ_TRAIL; i++) {
    stepLorenz()
    const scale = 1.2
    lorenzPositions[i * 3]     = lorenz.x * scale
    lorenzPositions[i * 3 + 1] = lorenz.z * scale - 30
    lorenzPositions[i * 3 + 2] = lorenz.y * scale
    // Base color: muted blue
    lorenzColors[i * 4]     = 0.42
    lorenzColors[i * 4 + 1] = 0.62
    lorenzColors[i * 4 + 2] = 0.88
    lorenzColors[i * 4 + 3] = 0.35
  }

  lorenzLine = new THREE.Line(
    lorenzGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  scene.add(lorenzLine)

  // Rossler trail with per-vertex colors
  const rosslerGeo = new THREE.BufferGeometry()
  rosslerPositions = new Float32Array(ROSSLER_TRAIL * 3)
  rosslerColors = new Float32Array(ROSSLER_TRAIL * 4)
  rosslerGeo.setAttribute('position', new THREE.BufferAttribute(rosslerPositions, 3))
  rosslerGeo.setAttribute('color', new THREE.BufferAttribute(rosslerColors, 4))

  for (let i = 0; i < ROSSLER_TRAIL; i++) {
    stepRossler()
    const scale = 1.8
    rosslerPositions[i * 3]     = rossler.x * scale - 40
    rosslerPositions[i * 3 + 1] = rossler.z * scale - 20
    rosslerPositions[i * 3 + 2] = rossler.y * scale
    // Base color: muted amber
    rosslerColors[i * 4]     = 0.88
    rosslerColors[i * 4 + 1] = 0.69
    rosslerColors[i * 4 + 2] = 0.38
    rosslerColors[i * 4 + 3] = 0.28
  }

  rosslerLine = new THREE.Line(
    rosslerGeo,
    new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
  )
  scene.add(rosslerLine)
}

// ── ODE steppers ──────────────────────────────────────────────────
function stepLorenz() {
  const L = lorenz
  const dx = L.sigma * (L.y - L.x) * L.dt
  const dy = (L.x * (L.rho - L.z) - L.y) * L.dt
  const dz = (L.x * L.y - L.beta * L.z) * L.dt
  L.x += dx; L.y += dy; L.z += dz
}

function stepRossler() {
  const R = rossler
  const dx = (-R.y - R.z) * R.dt
  const dy = (R.x + R.a * R.y) * R.dt
  const dz = (R.b + R.z * (R.x - R.c)) * R.dt
  R.x += dx; R.y += dy; R.z += dz
}

// ── Main update ───────────────────────────────────────────────────
export function updateAttractors(cpuPressure, batteryLevel, dt) {
  // ── Heart rate from CPU pressure ──
  // Calm: ~62bpm, stressed: ~120bpm
  const targetBPM = 62 + cpuPressure * 58
  heart.bpm += (targetBPM - heart.bpm) * 0.02 // smooth transition

  // HRV: subtle beat-to-beat irregularity (healthy hearts are irregular)
  heart.hrvJitter = (Math.random() - 0.5) * 0.08

  // Advance cardiac phase
  const beatsPerSecond = heart.bpm / 60
  const phaseIncrement = beatsPerSecond * (dt || 1 / 60) * (1 + heart.hrvJitter)
  const prevPhase = heart.phase
  heart.phase = (heart.phase + phaseIncrement) % 1

  // Detect new beat (phase wrapped around)
  if (heart.phase < prevPhase) {
    heart.beatCount++
    heart.trailPulse = 0 // start brightness pulse along trail
    // Notify mycelium
    if (_onHeartbeat) _onHeartbeat(heart.beatCount)
  }

  // Compute ECG envelope
  heart.envelope = ecgEnvelope(heart.phase)

  // ── Modulate attractor parameters with heartbeat ──
  // Rho modulation: wings expand on systole (QRS complex)
  const rhoBase = 28 + cpuPressure * 8
  lorenz.rho = rhoBase + heart.envelope * 4 // wings widen by ~4 on each beat

  // Speed modulation
  const batteryMod = 0.5 + batteryLevel * 0.5
  lorenz.dt = 0.003 * batteryMod
  rossler.dt = 0.008 * batteryMod

  // ── Frame drop arrhythmia ──
  if (dt && dt > 0.025) {
    // Frame dropped: inject perturbation proportional to severity
    const severity = Math.min(1, (dt - 0.025) / 0.05)
    lorenz.x += (Math.random() - 0.5) * severity * 0.5
    lorenz.y += (Math.random() - 0.5) * severity * 0.5
  }

  // ── Step the ODEs ──
  for (let s = 0; s < 4; s++) {
    stepLorenz()
    stepRossler()
  }

  // ── Scale modulation: subtle expand/contract with envelope ──
  const scaleBase = 1.2
  const scalePulse = scaleBase * (1.0 + heart.envelope * 0.12)

  // ── Update Lorenz trail point ──
  const li = lorenzIdx % LORENZ_TRAIL
  lorenzPositions[li * 3]     = lorenz.x * scalePulse
  lorenzPositions[li * 3 + 1] = lorenz.z * scalePulse - 30
  lorenzPositions[li * 3 + 2] = lorenz.y * scalePulse
  lorenzIdx++

  // ── Update Rossler trail point ──
  const ri = rosslerIdx % ROSSLER_TRAIL
  const rscale = 1.8 * (1.0 + heart.envelope * 0.08)
  rosslerPositions[ri * 3]     = rossler.x * rscale - 40
  rosslerPositions[ri * 3 + 1] = rossler.z * rscale - 20
  rosslerPositions[ri * 3 + 2] = rossler.y * rscale
  rosslerIdx++

  // ── Advance trail brightness pulse ──
  if (heart.trailPulse >= 0) {
    heart.trailPulse += (dt || 1 / 60) * heart.trailPulseSpeed
    if (heart.trailPulse > 1) heart.trailPulse = -1
  }

  // ── Update per-vertex colors for both trails ──
  updateTrailColors(
    lorenzColors, LORENZ_TRAIL, lorenzIdx,
    0.42, 0.62, 0.88, // base blue
    heart.trailPulse, heart.envelope
  )
  updateTrailColors(
    rosslerColors, ROSSLER_TRAIL, rosslerIdx,
    0.88, 0.69, 0.38, // base amber
    heart.trailPulse, heart.envelope
  )

  // Mark geometry dirty
  lorenzLine.geometry.attributes.position.needsUpdate = true
  lorenzLine.geometry.attributes.color.needsUpdate = true
  rosslerLine.geometry.attributes.position.needsUpdate = true
  rosslerLine.geometry.attributes.color.needsUpdate = true
}

// ── Per-vertex color update with pulse wave and systole glow ──────
function updateTrailColors(colors, trailLen, writeIdx, baseR, baseG, baseB, pulseFront, envelope) {
  for (let i = 0; i < trailLen; i++) {
    // Trail position: 0 = oldest, 1 = newest
    const age = ((writeIdx - i + trailLen) % trailLen) / trailLen
    const trailT = 1 - age // 0 = newest, 1 = oldest

    // Base alpha: newest points brighter, old points fade
    let alpha = 0.15 + (1 - trailT) * 0.35

    // Systole glow: whole trail brightens on each beat
    alpha += envelope * 0.25

    // Pulse wave: traveling brightness along the trail
    if (pulseFront >= 0) {
      const dist = Math.abs(trailT - pulseFront)
      if (dist < 0.08) {
        const boost = (1 - dist / 0.08) * 0.5
        alpha += boost
        // Warm shift toward white during pulse
        const ci = i * 4
        colors[ci]     = Math.min(1, baseR + boost * 0.4)
        colors[ci + 1] = Math.min(1, baseG + boost * 0.3)
        colors[ci + 2] = Math.min(1, baseB + boost * 0.2)
        colors[ci + 3] = Math.min(1, alpha)
        continue
      }
    }

    // Normal color with systole warmth
    const warmth = envelope * 0.15
    const ci = i * 4
    colors[ci]     = Math.min(1, baseR + warmth)
    colors[ci + 1] = Math.min(1, baseG + warmth * 0.5)
    colors[ci + 2] = baseB
    colors[ci + 3] = Math.min(1, alpha)
  }
}

export function getLorenzState() { return lorenz }
export function getRosslerState() { return rossler }
