// src/interaction/raycast.js
import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'

const raycaster = new THREE.Raycaster()
const mouse = new THREE.Vector2()
const _cellPos = new THREE.Vector3()
const _closestPoint = new THREE.Vector3()

const HIT_RADIUS = 20 // world units — how close the ray must pass to a cell center

/**
 * Given a click event and camera, find the nearest cell to the click ray.
 * Returns the cell object or null.
 */
export function findClickedCell(event, camera, canvas) {
  // Normalized device coordinates
  const rect = canvas.getBoundingClientRect()
  mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1

  raycaster.setFromCamera(mouse, camera)
  const ray = raycaster.ray

  let closest = null
  let closestDist = HIT_RADIUS

  for (const cell of getAliveCells()) {
    _cellPos.set(cell.position[0], cell.position[1], cell.position[2])
    // Distance from ray to point
    ray.closestPointToPoint(_cellPos, _closestPoint)
    const dist = _closestPoint.distanceTo(_cellPos)

    if (dist < closestDist) {
      closestDist = dist
      closest = cell
    }
  }

  return closest
}
