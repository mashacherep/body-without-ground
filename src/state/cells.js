import { CELL_TYPES } from '../generation/types.js'

let nextId = 0
const cells = []

export function createCell(type, content = '', opts = {}) {
  const typeDef = CELL_TYPES[type]
  if (!typeDef) throw new Error(`Unknown cell type: ${type}`)

  const cell = {
    id: nextId++,
    type,
    content,
    assumptions: opts.assumptions || [],
    entropy: opts.entropy || (Math.random() * 0.9998 + 0.0001).toFixed(9),
    createdAt: Date.now(),
    alive: true,
    position: opts.position || randomPosition(type),
    particleCount: typeDef.particleCount,
    color: typeDef.color,
    speed: typeDef.speed,
    meta: opts.meta || '',
  }

  cells.push(cell)
  return cell
}

export function killCell(id) {
  const cell = cells.find(c => c.id === id)
  if (cell) cell.alive = false
  return cell
}

export function getCells() { return cells }
export function getAliveCells() { return cells.filter(c => c.alive) }

function randomPosition(type) {
  const types = Object.keys(CELL_TYPES)
  const idx = types.indexOf(type)

  // Each type has a loose "home" direction but nodes scatter widely
  // This creates organic clustering without a rigid ring
  const homeAngle = (idx / types.length) * Math.PI * 2
  const homeRadius = 40 + (idx % 4) * 15

  // Scatter significantly from home — nodes overlap between types
  const angle = homeAngle + (Math.random() - 0.5) * 1.8 // wide angular spread
  const radius = homeRadius * (0.3 + Math.random() * 1.2) // 30% to 150% of home radius
  const verticalSpread = 60 // tall, not flat

  return [
    Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
    (Math.random() - 0.5) * verticalSpread, // full 3D volume
    Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
  ]
}
