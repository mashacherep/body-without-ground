import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'

/**
 * Camera autopilot — drifts along a CatmullRomCurve3 through the cosmos.
 * Regenerates the spline periodically so it visits new regions.
 */

const SPLINE_POINTS = 12
const SPLINE_REGEN_INTERVAL = 60 // seconds before generating a new path
const BASE_SPEED = 0.008 // fraction of spline per second — very slow

let spline = null
let t = 0 // 0..1 progress along spline
let speed = BASE_SPEED
let timeSinceRegen = 0
let lookTarget = new THREE.Vector3(0, 0, 0)
let lookTargetSmoothed = new THREE.Vector3(0, 0, 0)
let active = true

// Interrupt state
let interruptTarget = null // THREE.Vector3 to drift toward
let interruptStrength = 0
let interruptDecay = 0.005

/**
 * Generate a spline that visits clusters of alive cells,
 * with some random scenic waypoints mixed in.
 */
function generateSpline() {
  const cells = getAliveCells()
  const points = []

  if (cells.length === 0) {
    // Fallback: circle around origin
    for (let i = 0; i < SPLINE_POINTS; i++) {
      const angle = (i / SPLINE_POINTS) * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * 150,
        30 + Math.sin(angle * 2) * 20,
        Math.sin(angle) * 150,
      ))
    }
  } else {
    // Pick a subset of cells as waypoints, add altitude variation
    const shuffled = [...cells].sort(() => Math.random() - 0.5)
    const picks = shuffled.slice(0, Math.min(SPLINE_POINTS - 2, shuffled.length))

    for (const cell of picks) {
      const [cx, cy, cz] = cell.position
      // Offset from the cell: we observe from a distance, not inside the cluster
      const offsetAngle = Math.random() * Math.PI * 2
      const offsetDist = 40 + Math.random() * 60
      const offsetY = 20 + Math.random() * 40
      points.push(new THREE.Vector3(
        cx + Math.cos(offsetAngle) * offsetDist,
        cy + offsetY,
        cz + Math.sin(offsetAngle) * offsetDist,
      ))
    }

    // Add wide-orbit scenic points at varying altitudes
    for (let i = 0; i < 3; i++) {
      const angle = Math.random() * Math.PI * 2
      points.push(new THREE.Vector3(
        Math.cos(angle) * 180,
        40 + Math.random() * 50,
        Math.sin(angle) * 180,
      ))
    }
  }

  spline = new THREE.CatmullRomCurve3(points, true, 'centripetal', 0.5)
  t = 0
  timeSinceRegen = 0
}

/**
 * Initialize the autopilot. Call once.
 * @param {THREE.Vector3} initialPosition — camera's current position to start from
 */
export function initAutopilot(initialPosition) {
  generateSpline()
  // Find the closest t on the spline to the initial position
  // so the camera doesn't jump
  let bestT = 0
  let bestDist = Infinity
  for (let i = 0; i <= 100; i++) {
    const sample = i / 100
    const pt = spline.getPointAt(sample)
    const dist = pt.distanceTo(initialPosition)
    if (dist < bestDist) {
      bestDist = dist
      bestT = sample
    }
  }
  t = bestT
  lookTargetSmoothed.copy(spline.getPointAt((t + 0.05) % 1))
}

/**
 * Update the autopilot. Returns { position, lookAt } for the camera.
 * @param {number} dt — delta time in seconds
 * @returns {{ position: THREE.Vector3, lookAt: THREE.Vector3 }}
 */
export function updateAutopilot(dt) {
  if (!spline || !active) return null

  timeSinceRegen += dt
  if (timeSinceRegen > SPLINE_REGEN_INTERVAL) {
    generateSpline()
  }

  // Advance along spline
  t = (t + speed * dt) % 1

  const position = spline.getPointAt(t)

  // Look slightly ahead on the spline
  const lookAheadT = (t + 0.05) % 1
  lookTarget.copy(spline.getPointAt(lookAheadT))

  // If we have an interrupt target, blend the look toward it
  if (interruptTarget && interruptStrength > 0.01) {
    lookTarget.lerp(interruptTarget, interruptStrength * 0.3)
    // Also gently nudge position toward the interrupt
    position.lerp(interruptTarget, interruptStrength * 0.05)
    interruptStrength -= interruptDecay * dt * 60
    if (interruptStrength <= 0.01) {
      interruptTarget = null
      interruptStrength = 0
    }
  }

  // Smooth the look target to avoid jitter
  lookTargetSmoothed.lerp(lookTarget, 0.02)

  return { position, lookAt: lookTargetSmoothed.clone() }
}

/**
 * Drift the camera toward a point of interest (e.g., a new birth).
 * @param {number[]} pos — [x, y, z] world position
 * @param {number} [strength=0.5] — how strongly to drift (0..1)
 */
export function interruptDriftTo(pos, strength = 0.5) {
  interruptTarget = new THREE.Vector3(pos[0], pos[1], pos[2])
  interruptStrength = Math.min(1, strength)
}

/**
 * Pull the camera back (e.g., on death — widen the view).
 * Implemented by temporarily boosting speed so the camera moves on.
 */
export function interruptPullBack() {
  speed = BASE_SPEED * 3
  setTimeout(() => { speed = BASE_SPEED }, 4000)
}

/**
 * Pause autopilot (for viewer control mode).
 */
export function pauseAutopilot() {
  active = false
}

/**
 * Resume autopilot from a given camera position (no snap).
 * @param {THREE.Vector3} currentPosition
 */
export function resumeAutopilot(currentPosition) {
  active = true
  // Regenerate spline from current cells and re-anchor
  generateSpline()
  let bestT = 0
  let bestDist = Infinity
  for (let i = 0; i <= 200; i++) {
    const sample = i / 200
    const pt = spline.getPointAt(sample)
    const dist = pt.distanceTo(currentPosition)
    if (dist < bestDist) {
      bestDist = dist
      bestT = sample
    }
  }
  t = bestT
  // Start look target toward origin so camera faces the cosmos
  lookTargetSmoothed.set(0, 0, 0)
}

export function isAutopilotActive() { return active }
export function setAutopilotSpeed(s) { speed = s }
export function getBaseSpeed() { return BASE_SPEED }
