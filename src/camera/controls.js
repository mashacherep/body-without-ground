import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import {
  initAutopilot, updateAutopilot, pauseAutopilot, resumeAutopilot,
  isAutopilotActive, interruptDriftTo, interruptPullBack,
} from './autopilot.js'

const IDLE_TIMEOUT = 30_000 // 30 seconds before autopilot resumes

let camera = null
let orbit = null
let idleTimer = null
let mode = 'autopilot' // 'autopilot' | 'viewer' | 'transition'

// Smooth blend from viewer back to autopilot
let blendProgress = 0
const BLEND_DURATION = 3.0 // seconds to blend back

/**
 * Initialize the camera system.
 * @param {THREE.PerspectiveCamera} cam
 * @param {HTMLCanvasElement} domElement
 */
export function initCameraSystem(cam, domElement) {
  camera = cam

  // Set up OrbitControls (disabled initially — autopilot drives)
  orbit = new OrbitControls(camera, domElement)
  orbit.enableDamping = true
  orbit.dampingFactor = 0.05
  orbit.maxDistance = 800
  orbit.minDistance = 10
  orbit.enabled = false // autopilot is in charge at start

  // Detect user interaction to switch to viewer mode
  const interactionEvents = ['pointerdown', 'wheel']
  for (const evt of interactionEvents) {
    domElement.addEventListener(evt, onUserInteraction, { passive: true })
  }

  initAutopilot(camera.position.clone())
  mode = 'autopilot'
}

function onUserInteraction() {
  if (mode === 'autopilot' || mode === 'transition') {
    switchToViewer()
  }
  resetIdleTimer()
}

function switchToViewer() {
  mode = 'viewer'
  pauseAutopilot()
  orbit.enabled = true
  // Set orbit target to where the camera is currently looking
  const forward = camera.getWorldDirection(new THREE.Vector3())
  orbit.target.copy(camera.position).addScaledVector(forward, 50)
}

function switchToAutopilot() {
  mode = 'transition'
  blendProgress = 0
  resumeAutopilot(camera.position.clone())
  // OrbitControls stay enabled briefly during blend so there's no jerk
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (mode === 'viewer') {
      switchToAutopilot()
    }
  }, IDLE_TIMEOUT)
}

/**
 * Update the camera system. Call once per frame.
 * @param {number} dt — delta time in seconds
 */
export function updateCameraSystem(dt) {
  if (mode === 'autopilot') {
    const result = updateAutopilot(dt)
    if (result) {
      camera.position.lerp(result.position, 0.02)
      camera.lookAt(result.lookAt)
    }
  } else if (mode === 'viewer') {
    orbit.update()
  } else if (mode === 'transition') {
    // Blend from current orbit position back to autopilot
    blendProgress += dt / BLEND_DURATION
    const result = updateAutopilot(dt)
    if (result) {
      const alpha = smoothstep(blendProgress)
      camera.position.lerp(result.position, alpha * 0.03)
      camera.lookAt(result.lookAt)
    }
    if (blendProgress >= 1) {
      orbit.enabled = false
      mode = 'autopilot'
    }
  }
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

/**
 * Get the current camera mode.
 * @returns {'autopilot' | 'viewer' | 'transition'}
 */
export function getCameraMode() { return mode }

/**
 * Force autopilot mode (used by intro sequence to prevent user interruption).
 */
export function lockAutopilot() {
  mode = 'autopilot'
  orbit.enabled = false
  if (idleTimer) clearTimeout(idleTimer)
}

/**
 * Unlock — allow user interaction to switch to viewer mode again.
 */
export function unlockControls() {
  // Just re-enables the interaction listeners' effect — they always fire,
  // but switchToViewer only triggers if mode === 'autopilot'
  orbit.enabled = false // autopilot still driving, orbit re-enables on interaction
}

// Re-export interrupt methods for convenience
export { interruptDriftTo, interruptPullBack }
