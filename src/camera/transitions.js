import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { getBuffers, getCellParticleMap } from '../cosmos/particles.js'
import { lockAutopilot, unlockControls } from './controls.js'

let transitioning = false
let transitionProgress = 0
let targetCell = null
let startPosition = new THREE.Vector3()
let targetPosition = new THREE.Vector3()
let savedAlphas = null // Float32Array snapshot to restore on exit

const TRANSITION_DURATION = 1.5 // seconds
const DIM_OPACITY = 0.15
const CAMERA_OFFSET = new THREE.Vector3(0, 5, 20) // offset from node center

/**
 * Start a reading view transition toward a cell.
 * @param {object} cell — a cell from the state store
 * @param {THREE.PerspectiveCamera} camera
 */
export function enterReadingView(cell, camera) {
  if (transitioning) return

  lockAutopilot()
  transitioning = true
  transitionProgress = 0
  targetCell = cell

  startPosition.copy(camera.position)
  targetPosition.set(
    cell.position[0] + CAMERA_OFFSET.x,
    cell.position[1] + CAMERA_OFFSET.y,
    cell.position[2] + CAMERA_OFFSET.z,
  )

  // Snapshot current alphas so we can restore them
  const { alphas } = getBuffers()
  savedAlphas = new Float32Array(alphas)

  // Dim all particles except the selected cell
  const cpm = getCellParticleMap()
  const targetMapping = cpm.get(cell.id)

  for (const [cellId, mapping] of cpm.entries()) {
    if (cellId === cell.id) continue
    for (let i = mapping.startIdx; i < mapping.startIdx + mapping.count; i++) {
      alphas[i] *= DIM_OPACITY
    }
  }
}

/**
 * Exit reading view — restore alphas and unlock controls.
 */
export function exitReadingView() {
  if (!transitioning && !targetCell) return

  // Restore original alphas
  if (savedAlphas) {
    const { alphas } = getBuffers()
    alphas.set(savedAlphas)
    savedAlphas = null
  }

  transitioning = false
  targetCell = null
  transitionProgress = 0
  unlockControls()
}

/**
 * Update the reading view transition. Call once per frame.
 * @param {number} dt — delta time in seconds
 * @param {THREE.PerspectiveCamera} camera
 * @returns {boolean} true if currently in reading view (transitioning or arrived)
 */
export function updateReadingView(dt, camera) {
  if (!targetCell) return false

  if (transitioning) {
    transitionProgress += dt / TRANSITION_DURATION
    if (transitionProgress >= 1) {
      transitionProgress = 1
      transitioning = false // arrived, but still in reading view
    }

    const alpha = smoothstep(transitionProgress)
    camera.position.lerpVectors(startPosition, targetPosition, alpha)
    camera.lookAt(
      targetCell.position[0],
      targetCell.position[1],
      targetCell.position[2],
    )
  } else {
    // Parked in reading view — just keep looking at the cell
    camera.lookAt(
      targetCell.position[0],
      targetCell.position[1],
      targetCell.position[2],
    )
  }

  return true
}

function smoothstep(t) {
  const x = Math.max(0, Math.min(1, t))
  return x * x * (3 - 2 * x)
}

export function isInReadingView() { return targetCell !== null }
