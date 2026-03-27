import * as THREE from 'three'
import {
  initAutopilot, updateAutopilot, pauseAutopilot, resumeAutopilot,
  isAutopilotActive, interruptDriftTo, interruptPullBack,
} from './autopilot.js'

const IDLE_TIMEOUT = 30_000
const MOVE_SPEED = 40       // units per second
const LOOK_SPEED = 0.002    // radians per pixel (reduced from 0.003)
const SCROLL_SPEED = 8      // units per scroll tick
const DAMPING = 0.96         // velocity decay (smoother from 0.92)

// Zoom constraints
const ZOOM_MIN = 15
const ZOOM_MAX = 120
const SOFT_BOUNDARY = 100

let camera = null
let domEl = null
let mode = 'autopilot'
let idleTimer = null

// Fly state
let velocity = new THREE.Vector3()
let euler = new THREE.Euler(0, 0, 0, 'YXZ')
let isDragging = false
let lastMouse = { x: 0, y: 0 }
let keys = {}

// Blend
let blendProgress = 0
const BLEND_DURATION = 5.0   // slower autopilot blend (from 3.0)

// Logarithmic zoom — target distance lerp
let zoomTargetDistance = null

// Home transition state
let homeTransition = null // { start, startPos, startQuat, progress }
const HOME_POSITION = new THREE.Vector3(0, 15, 55)
const HOME_DURATION = 2.0

export function initCameraSystem(cam, domElement) {
  camera = cam
  domEl = domElement

  // Mouse look (drag with dead zone to allow double-click)
  let dragStart = null
  let dragActive = false

  domElement.addEventListener('pointerdown', (e) => {
    if (e.button === 0 || e.button === 2) {
      dragStart = { x: e.clientX, y: e.clientY }
      dragActive = false
      lastMouse = { x: e.clientX, y: e.clientY }
    }
  })

  window.addEventListener('pointermove', (e) => {
    if (!dragStart) return

    // Dead zone: only start looking after 4px of movement
    if (!dragActive) {
      const dx = e.clientX - dragStart.x
      const dy = e.clientY - dragStart.y
      if (Math.sqrt(dx * dx + dy * dy) < 4) return
      dragActive = true
      onUserInteraction()
    }

    if (mode === 'autopilot') return
    const dx = e.clientX - lastMouse.x
    const dy = e.clientY - lastMouse.y
    lastMouse = { x: e.clientX, y: e.clientY }

    euler.setFromQuaternion(camera.quaternion)
    euler.y -= dx * LOOK_SPEED
    euler.x -= dy * LOOK_SPEED
    euler.x = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, euler.x))
    camera.quaternion.setFromEuler(euler)
  })

  window.addEventListener('pointerup', () => { dragStart = null; dragActive = false })

  // Scroll = logarithmic zoom toward/away from origin
  domElement.addEventListener('wheel', (e) => {
    e.preventDefault()
    onUserInteraction()
    if (mode !== 'viewer') return

    const currentDistance = camera.position.length()
    const baseSpeed = 0.15
    const zoomSpeed = baseSpeed * (currentDistance / 40)

    // Compute target distance along camera-to-origin axis
    const scrollDelta = Math.sign(e.deltaY) * zoomSpeed * currentDistance
    const newDistance = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, currentDistance + scrollDelta))
    zoomTargetDistance = newDistance
  }, { passive: false })

  // WASD + QE for full movement
  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase()
    keys[key] = true
    if ('wasdqe'.includes(key)) onUserInteraction()

    // Home key: 'h' triggers smooth transition back to home position
    if (key === 'h') {
      onUserInteraction()
      homeTransition = {
        startPos: camera.position.clone(),
        startQuat: camera.quaternion.clone(),
        progress: 0,
      }
    }
  })
  window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false })

  // Prevent right-click context menu
  domElement.addEventListener('contextmenu', (e) => e.preventDefault())

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
  euler.setFromQuaternion(camera.quaternion)
  velocity.set(0, 0, 0)
  zoomTargetDistance = null
}

function switchToAutopilot() {
  mode = 'transition'
  blendProgress = 0
  resumeAutopilot(camera.position.clone())
}

function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (mode === 'viewer') switchToAutopilot()
  }, IDLE_TIMEOUT)
}

// Ease in-out for home transition
function easeInOut(t) {
  const x = Math.max(0, Math.min(1, t))
  return x < 0.5
    ? 4 * x * x * x
    : 1 - Math.pow(-2 * x + 2, 3) / 2
}

export function updateCameraSystem(dt) {
  // Home transition overrides everything
  if (homeTransition) {
    homeTransition.progress += dt / HOME_DURATION
    const alpha = easeInOut(homeTransition.progress)

    // Lerp position
    camera.position.lerpVectors(homeTransition.startPos, HOME_POSITION, alpha)

    // Slerp orientation to look at origin
    const targetQuat = new THREE.Quaternion()
    const tempCam = new THREE.Object3D()
    tempCam.position.copy(HOME_POSITION)
    tempCam.lookAt(0, 0, 0)
    targetQuat.copy(tempCam.quaternion)
    camera.quaternion.slerpQuaternions(homeTransition.startQuat, targetQuat, alpha)

    if (homeTransition.progress >= 1) {
      homeTransition = null
      euler.setFromQuaternion(camera.quaternion)
      velocity.set(0, 0, 0)
      zoomTargetDistance = null
    }
    return
  }

  if (mode === 'autopilot') {
    const result = updateAutopilot(dt)
    if (result) {
      camera.position.lerp(result.position, 0.12)
      camera.lookAt(result.lookAt)
    }
  } else if (mode === 'viewer') {
    // WASD movement
    const forward = new THREE.Vector3()
    const right = new THREE.Vector3()
    camera.getWorldDirection(forward)
    right.crossVectors(forward, camera.up).normalize()

    const speed = MOVE_SPEED * dt
    if (keys['w']) velocity.addScaledVector(forward, speed)
    if (keys['s']) velocity.addScaledVector(forward, -speed)
    if (keys['a']) velocity.addScaledVector(right, -speed)
    if (keys['d']) velocity.addScaledVector(right, speed)
    if (keys['q'] || keys[' ']) velocity.y += speed   // up
    if (keys['e'] || keys['shift']) velocity.y -= speed // down

    // Apply velocity with damping
    camera.position.add(velocity.clone().multiplyScalar(dt * 60))
    velocity.multiplyScalar(DAMPING)

    // Logarithmic zoom: lerp toward target distance along camera-to-origin axis
    if (zoomTargetDistance !== null) {
      const currentDistance = camera.position.length()
      const newDistance = THREE.MathUtils.lerp(currentDistance, zoomTargetDistance, 0.1)
      if (Math.abs(newDistance - zoomTargetDistance) < 0.01) {
        zoomTargetDistance = null
      }
      // Move camera along its direction from origin
      const dir = camera.position.clone().normalize()
      camera.position.copy(dir.multiplyScalar(newDistance))
    }

    // Soft boundary: gentle pull back toward origin when far away
    const distance = camera.position.length()
    if (distance > SOFT_BOUNDARY) {
      const pullStrength = (distance - SOFT_BOUNDARY) * 0.002
      const pullDir = camera.position.clone().normalize().negate()
      camera.position.addScaledVector(pullDir, pullStrength)
    }
    // Hard clamp at max distance
    if (distance > ZOOM_MAX) {
      camera.position.normalize().multiplyScalar(ZOOM_MAX)
    }
  } else if (mode === 'transition') {
    blendProgress += dt / BLEND_DURATION
    const result = updateAutopilot(dt)
    if (result) {
      const alpha = smoothstep(blendProgress)
      camera.position.lerp(result.position, alpha * 0.03)
      camera.lookAt(result.lookAt)
    }
    if (blendProgress >= 1) {
      mode = 'autopilot'
    }
  }
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export function getCameraMode() { return mode }

export function lockAutopilot() {
  mode = 'autopilot'
  if (idleTimer) clearTimeout(idleTimer)
}

export function unlockControls() {
  mode = 'autopilot'
  resumeAutopilot(camera.position.clone())
}

export { interruptDriftTo, interruptPullBack }
