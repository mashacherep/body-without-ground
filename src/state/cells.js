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
  const homeRadius = 30 + (idx % 5) * 12

  // Tighter cosmos — always surrounded by activity
  const angle = homeAngle + (Math.random() - 0.5) * 2.0
  const radius = homeRadius * (0.3 + Math.random() * 1.2)
  const verticalSpread = 50

  return [
    Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
    (Math.random() - 0.5) * verticalSpread,
    Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
  ]
}
