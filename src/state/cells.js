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
  const radius = 80 + Math.random() * 60
  const spread = 30

  return [
    Math.cos(angle) * radius + (Math.random() - 0.5) * spread,
    (Math.random() - 0.5) * spread * 1.5,
    Math.sin(angle) * radius + (Math.random() - 0.5) * spread,
  ]
}
