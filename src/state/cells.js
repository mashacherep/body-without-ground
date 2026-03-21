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
  const angle = (idx / types.length) * Math.PI * 2
  // Vary radius more — clusters at different distances
  const baseRadius = 50 + (idx % 5) * 20
  const radius = baseRadius + Math.random() * 40
  const spread = 25

  return [
    Math.cos(angle + (Math.random() - 0.5) * 0.4) * radius + (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread * 2.0,  // more vertical spread
    Math.sin(angle + (Math.random() - 0.5) * 0.4) * radius + (Math.random() - 0.5) * spread,
  ]
}
