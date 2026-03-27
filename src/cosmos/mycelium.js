/**
 * Mycelium — organic curved connections between cells that grow, pulse,
 * and breathe like a neural network / fungal mycelium.
 * Replaces filaments.js and tendrils.js with a single unified system.
 */

import * as THREE from 'three'
import { getAliveCells } from '../state/cells.js'
import { CELL_TYPES } from '../generation/types.js'

// ── constants ──────────────────────────────────────────────────────
const MAX_CONNECTIONS = 600
const SEGMENTS_PER_CURVE = 8
const MAX_VERTICES = MAX_CONNECTIONS * SEGMENTS_PER_CURVE * 2 // LineSegments: 2 verts per segment
const MAX_DIST = 45
const CLOSE_DIST = 25
const RECALC_INTERVAL = 500 // ms
const GROWTH_RATE = 0.5     // 0→1 in ~2s
const SHRINK_RATE = 0.8     // shrink faster than grow
const PULSE_DURATION = 2.0  // seconds for pulse to travel the curve
const PULSE_DELAY_MIN = 3.0
const PULSE_DELAY_MAX = 8.0

// ── state ──────────────────────────────────────────────────────────
let lineSegments = null
let positions, colors
let connections = []        // active connection objects
let lastRecalcTime = 0

// ── heartbeat sync ────────────────────────────────────────────────
// When the attractor heart beats, all connections receive a synchronized
// pulse that propagates outward, delayed by distance from the attractor center.
let heartbeatPulseTime = -1 // -1 = no active heartbeat pulse

/**
 * Called by the attractor heart on each beat.
 * Triggers a synchronized pulse across all mycelium connections.
 */
export function triggerHeartbeatPulse() {
  heartbeatPulseTime = 0
}

// ── helpers ────────────────────────────────────────────────────────

/** Deterministic hash from two cell IDs → stable float in [0,1) */
function pairSeed(idA, idB) {
  const lo = Math.min(idA, idB)
  const hi = Math.max(idA, idB)
  let h = lo * 2654435761 ^ hi * 2246822519
  h = ((h >>> 16) ^ h) * 0x45d9f3b
  h = ((h >>> 16) ^ h) * 0x45d9f3b
  h = (h >>> 16) ^ h
  return (h & 0x7fffffff) / 0x7fffffff
}

/** Quadratic bezier: P = (1-t)²A + 2(1-t)tC + t²B */
function bezierPoint(ax, ay, az, cx, cy, cz, bx, by, bz, t, out, offset) {
  const u = 1 - t
  const uu = u * u
  const tt = t * t
  const ut2 = 2 * u * t
  out[offset]     = uu * ax + ut2 * cx + tt * bx
  out[offset + 1] = uu * ay + ut2 * cy + tt * by
  out[offset + 2] = uu * az + ut2 * cz + tt * bz
}

// ── init ───────────────────────────────────────────────────────────

export function initMycelium(scene) {
  const geometry = new THREE.BufferGeometry()
  positions = new Float32Array(MAX_VERTICES * 3)
  colors = new Float32Array(MAX_VERTICES * 4)

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4))

  const material = new THREE.LineBasicMaterial({
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })

  lineSegments = new THREE.LineSegments(geometry, material)
  scene.add(lineSegments)
}

// ── connection recalculation (every 500ms) ─────────────────────────

function recalcConnections(cells, now) {
  // Build a map of existing connections by key for continuity
  const existingMap = new Map()
  for (const conn of connections) {
    existingMap.set(conn.key, conn)
  }

  const newKeys = new Set()
  const nextConnections = []

  // Build cell lookup by id
  const cellById = new Map()
  for (const c of cells) cellById.set(c.id, c)

  const maxCheck = Math.min(cells.length, 150)

  for (let i = 0; i < maxCheck && nextConnections.length < MAX_CONNECTIONS; i++) {
    const a = cells[i]
    // Check nearest neighbors — scan a window, not all pairs
    for (let j = i + 1; j < Math.min(i + 40, maxCheck) && nextConnections.length < MAX_CONNECTIONS; j++) {
      const b = cells[j]
      const dx = a.position[0] - b.position[0]
      const dy = a.position[1] - b.position[1]
      const dz = a.position[2] - b.position[2]
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)

      if (dist > MAX_DIST) continue

      const key = Math.min(a.id, b.id) + ':' + Math.max(a.id, b.id)
      if (newKeys.has(key)) continue
      newKeys.add(key)

      const existing = existingMap.get(key)
      if (existing) {
        existing.valid = true
        existing.dist = dist
        nextConnections.push(existing)
      } else {
        const seed = pairSeed(a.id, b.id)
        nextConnections.push({
          key,
          idA: a.id,
          idB: b.id,
          dist,
          seed,
          growthProgress: 0,
          valid: true,
          // Pulse state
          pulseT: -1,                // -1 = waiting
          pulseDelay: PULSE_DELAY_MIN + seed * (PULSE_DELAY_MAX - PULSE_DELAY_MIN),
          pulseTimer: seed * PULSE_DELAY_MAX, // stagger initial pulse
        })
      }
    }
  }

  // Keep dying connections (valid=false) so they can shrink
  for (const conn of connections) {
    if (!newKeys.has(conn.key) && conn.growthProgress > 0.001) {
      conn.valid = false
      nextConnections.push(conn)
    }
  }

  connections = nextConnections
}

// ── per-frame update ───────────────────────────────────────────────

export function updateMycelium(time) {
  const cells = getAliveCells()
  const now = performance.now()
  const dt = 1 / 60 // approximate — good enough for animation

  // Advance heartbeat pulse (propagates over ~0.8s then fades)
  if (heartbeatPulseTime >= 0) {
    heartbeatPulseTime += dt * 1.2
    if (heartbeatPulseTime > 1) heartbeatPulseTime = -1
  }

  // Recalculate connections periodically
  if (now - lastRecalcTime > RECALC_INTERVAL) {
    recalcConnections(cells, now)
    lastRecalcTime = now
  }

  // Build cell lookup
  const cellById = new Map()
  for (const c of cells) cellById.set(c.id, c)

  let vertIdx = 0

  for (let ci = 0; ci < connections.length; ci++) {
    const conn = connections[ci]
    const cellA = cellById.get(conn.idA)
    const cellB = cellById.get(conn.idB)

    // If either cell is gone, mark invalid
    if (!cellA || !cellB) {
      conn.valid = false
    }

    // Growth / shrink
    if (conn.valid) {
      conn.growthProgress = Math.min(1, conn.growthProgress + dt * GROWTH_RATE)
    } else {
      conn.growthProgress = Math.max(0, conn.growthProgress - dt * SHRINK_RATE)
      if (conn.growthProgress <= 0) continue // fully dead, skip rendering
    }

    if (!cellA || !cellB) continue

    // ── Pulse wave ──
    conn.pulseTimer -= dt
    if (conn.pulseTimer <= 0 && conn.pulseT < 0) {
      conn.pulseT = 0
    }
    if (conn.pulseT >= 0) {
      conn.pulseT += dt / PULSE_DURATION
      if (conn.pulseT > 1) {
        conn.pulseT = -1
        conn.pulseTimer = PULSE_DELAY_MIN + conn.seed * (PULSE_DELAY_MAX - PULSE_DELAY_MIN)
      }
    }

    // ── Positions ──
    const ax = cellA.position[0], ay = cellA.position[1], az = cellA.position[2]
    const bx = cellB.position[0], by = cellB.position[1], bz = cellB.position[2]

    // Midpoint
    const mx = (ax + bx) * 0.5
    const my = (ay + by) * 0.5
    const mz = (az + bz) * 0.5

    // Perpendicular offset for control point — seeded by pair
    const dx = bx - ax, dy = by - ay, dz = bz - az
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1

    // Build a perpendicular vector via cross product with an arbitrary axis
    // Choose axis least aligned with the connection direction
    let crossX, crossY, crossZ
    if (Math.abs(dy / len) < 0.9) {
      // cross with Y-up
      crossX = dz
      crossY = 0
      crossZ = -dx
    } else {
      // cross with X-right
      crossX = 0
      crossY = -dz
      crossZ = dy
    }
    const crossLen = Math.sqrt(crossX * crossX + crossY * crossY + crossZ * crossZ) || 1
    crossX /= crossLen
    crossY /= crossLen
    crossZ /= crossLen

    // Offset magnitude: proportional to distance, varied by seed
    const offsetMag = len * (0.15 + conn.seed * 0.25)
    // Also add a second perpendicular for 3D curve variety
    const seed2 = pairSeed(conn.idA + 1000, conn.idB + 1000)
    const angle = seed2 * Math.PI * 2
    const cos_a = Math.cos(angle)
    const sin_a = Math.sin(angle)

    // Second perpendicular via cross of direction and first perp
    const p2x = dy * crossZ - dz * crossY
    const p2y = dz * crossX - dx * crossZ
    const p2z = dx * crossY - dy * crossX
    const p2len = Math.sqrt(p2x * p2x + p2y * p2y + p2z * p2z) || 1

    const cpx = mx + (crossX * cos_a + p2x / p2len * sin_a) * offsetMag
    const cpy = my + (crossY * cos_a + p2y / p2len * sin_a) * offsetMag
    const cpz = mz + (crossZ * cos_a + p2z / p2len * sin_a) * offsetMag

    // ── Colors ──
    const colorA = CELL_TYPES[cellA.type]?.color || [0.5, 0.5, 0.5]
    const colorB = CELL_TYPES[cellB.type]?.color || [0.5, 0.5, 0.5]
    const sameType = cellA.type === cellB.type

    // Breathing: per-connection oscillation
    const breathe = 0.06 + 0.05 * Math.sin(time * 0.4 + conn.seed * 6.2831)

    // Distance-based alpha range
    let alphaMin, alphaMax
    if (conn.dist < CLOSE_DIST) {
      alphaMin = 0.12
      alphaMax = 0.20
    } else {
      alphaMin = 0.04
      alphaMax = 0.10
    }

    // Same-type boost
    const typeBoost = sameType ? 1.4 : 1.0
    const baseAlpha = (breathe + alphaMin + (alphaMax - alphaMin) * (1 - conn.dist / MAX_DIST)) * typeBoost

    // How many segments to render based on growth
    const visibleSegments = Math.floor(conn.growthProgress * SEGMENTS_PER_CURVE)
    if (visibleSegments < 1) continue

    // Mute factor
    const mute = 0.65

    // Generate bezier samples (we need visibleSegments + 1 points)
    for (let s = 0; s < visibleSegments; s++) {
      if (vertIdx >= MAX_VERTICES) break

      const t0 = s / SEGMENTS_PER_CURVE
      const t1 = (s + 1) / SEGMENTS_PER_CURVE

      // Interpolated color at each endpoint
      const blend0 = t0
      const blend1 = t1
      const r0 = (colorA[0] * (1 - blend0) + colorB[0] * blend0) * mute
      const g0 = (colorA[1] * (1 - blend0) + colorB[1] * blend0) * mute
      const b0 = (colorA[2] * (1 - blend0) + colorB[2] * blend0) * mute
      const r1 = (colorA[0] * (1 - blend1) + colorB[0] * blend1) * mute
      const g1 = (colorA[1] * (1 - blend1) + colorB[1] * blend1) * mute
      const b1 = (colorA[2] * (1 - blend1) + colorB[2] * blend1) * mute

      // Pulse boost: segments near pulseT get extra alpha
      let pulseBoost0 = 0, pulseBoost1 = 0
      if (conn.pulseT >= 0) {
        const pd0 = Math.abs(t0 - conn.pulseT)
        const pd1 = Math.abs(t1 - conn.pulseT)
        if (pd0 < 0.15) pulseBoost0 = 0.2 * (1 - pd0 / 0.15)
        if (pd1 < 0.15) pulseBoost1 = 0.2 * (1 - pd1 / 0.15)
      }

      // Heartbeat pulse: synchronized flash from the attractor heart
      // All connections flash together, creating a visible "pump" through the network
      if (heartbeatPulseTime >= 0) {
        // Quick bright flash that fades: peaks at 0.1, gone by 0.6
        const hbFade = heartbeatPulseTime < 0.1
          ? heartbeatPulseTime / 0.1
          : Math.max(0, 1 - (heartbeatPulseTime - 0.1) / 0.5)
        pulseBoost0 += hbFade * 0.15
        pulseBoost1 += hbFade * 0.15
      }

      // Fade at the growth edge
      const edgeFade0 = s < visibleSegments - 1 ? 1 : conn.growthProgress * SEGMENTS_PER_CURVE - visibleSegments + 1
      const edgeFade1 = edgeFade0

      const alpha0 = Math.min(1, (baseAlpha + pulseBoost0) * edgeFade0)
      const alpha1 = Math.min(1, (baseAlpha + pulseBoost1) * edgeFade1)

      // Positions
      const pBase = vertIdx * 3
      bezierPoint(ax, ay, az, cpx, cpy, cpz, bx, by, bz, t0, positions, pBase)
      bezierPoint(ax, ay, az, cpx, cpy, cpz, bx, by, bz, t1, positions, pBase + 3)

      // Colors (RGBA)
      const cBase = vertIdx * 4
      colors[cBase]     = r0
      colors[cBase + 1] = g0
      colors[cBase + 2] = b0
      colors[cBase + 3] = alpha0
      colors[cBase + 4] = r1
      colors[cBase + 5] = g1
      colors[cBase + 6] = b1
      colors[cBase + 7] = alpha1

      vertIdx += 2
    }
  }

  // Zero remaining buffer
  for (let i = vertIdx * 3; i < MAX_VERTICES * 3; i++) positions[i] = 0
  for (let i = vertIdx * 4; i < MAX_VERTICES * 4; i++) colors[i] = 0

  const geo = lineSegments.geometry
  geo.attributes.position.needsUpdate = true
  geo.attributes.color.needsUpdate = true
  geo.setDrawRange(0, vertIdx)
}
