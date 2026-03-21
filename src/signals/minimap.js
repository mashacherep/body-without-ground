/**
 * Ukraine minimap — SVG outline with regions colored by alert status.
 * Uses real alerts.in.ua API data.
 */

import { getActiveRegions, isAlertActive } from './alerts.js'

// Ukraine region UIDs mapped to approximate SVG positions (normalized 0-1)
// These are the 25 oblasts + Kyiv city
const REGIONS = {
  '1':  { name: 'Vinnytsia',       x: 0.35, y: 0.55 },
  '2':  { name: 'Volyn',           x: 0.15, y: 0.20 },
  '3':  { name: 'Dnipro',          x: 0.60, y: 0.55 },
  '4':  { name: 'Donetsk',         x: 0.75, y: 0.50 },
  '5':  { name: 'Zhytomyr',        x: 0.30, y: 0.30 },
  '6':  { name: 'Zakarpattia',     x: 0.05, y: 0.55 },
  '7':  { name: 'Zaporizhzhia',    x: 0.65, y: 0.65 },
  '8':  { name: 'Ivano-Frankivsk', x: 0.12, y: 0.50 },
  '9':  { name: 'Kyiv Oblast',     x: 0.40, y: 0.30 },
  '10': { name: 'Kirovohrad',      x: 0.48, y: 0.58 },
  '11': { name: 'Luhansk',         x: 0.85, y: 0.40 },
  '12': { name: 'Lviv',            x: 0.10, y: 0.38 },
  '13': { name: 'Mykolaiv',        x: 0.50, y: 0.72 },
  '14': { name: 'Odesa',           x: 0.38, y: 0.78 },
  '15': { name: 'Poltava',         x: 0.55, y: 0.40 },
  '16': { name: 'Rivne',           x: 0.20, y: 0.22 },
  '17': { name: 'Sumy',            x: 0.60, y: 0.22 },
  '18': { name: 'Ternopil',        x: 0.15, y: 0.42 },
  '19': { name: 'Kharkiv',         x: 0.72, y: 0.30 },
  '20': { name: 'Kherson',         x: 0.55, y: 0.75 },
  '21': { name: 'Khmelnytskyi',    x: 0.22, y: 0.42 },
  '22': { name: 'Cherkasy',        x: 0.45, y: 0.48 },
  '23': { name: 'Chernivtsi',      x: 0.15, y: 0.58 },
  '24': { name: 'Chernihiv',       x: 0.45, y: 0.18 },
  '25': { name: 'Crimea',          x: 0.55, y: 0.88 },
  '31': { name: 'Kyiv City',       x: 0.42, y: 0.28 },
}

let canvas = null
let ctx = null
let updateTimer = null

export function initMinimap() {
  canvas = document.getElementById('ukraine-minimap')
  if (!canvas) return
  ctx = canvas.getContext('2d')
  canvas.width = 160
  canvas.height = 100
  drawMap()
  updateTimer = setInterval(drawMap, 5000) // refresh every 5s
}

function drawMap() {
  if (!ctx) return
  const w = canvas.width, h = canvas.height

  ctx.clearRect(0, 0, w, h)

  // Draw Ukraine outline (simplified polygon)
  ctx.beginPath()
  ctx.moveTo(w * 0.05, h * 0.35)
  ctx.lineTo(w * 0.10, h * 0.15)
  ctx.lineTo(w * 0.25, h * 0.10)
  ctx.lineTo(w * 0.45, h * 0.08)
  ctx.lineTo(w * 0.60, h * 0.12)
  ctx.lineTo(w * 0.75, h * 0.15)
  ctx.lineTo(w * 0.90, h * 0.25)
  ctx.lineTo(w * 0.95, h * 0.40)
  ctx.lineTo(w * 0.85, h * 0.55)
  ctx.lineTo(w * 0.70, h * 0.60)
  ctx.lineTo(w * 0.65, h * 0.70)
  ctx.lineTo(w * 0.55, h * 0.80)
  ctx.lineTo(w * 0.48, h * 0.92)
  ctx.lineTo(w * 0.40, h * 0.85)
  ctx.lineTo(w * 0.30, h * 0.75)
  ctx.lineTo(w * 0.20, h * 0.65)
  ctx.lineTo(w * 0.08, h * 0.55)
  ctx.lineTo(w * 0.03, h * 0.45)
  ctx.closePath()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 0.5
  ctx.stroke()

  // Get active alert regions
  const active = getActiveRegions()
  const activeUIDs = new Set(active.map(a => a.uid))

  // Draw region dots
  for (const [uid, region] of Object.entries(REGIONS)) {
    const x = region.x * w
    const y = region.y * h
    const isActive = activeUIDs.has(uid)

    if (isActive) {
      // Alert active — pulsing red
      const pulse = 0.5 + Math.sin(Date.now() * 0.004 + parseInt(uid)) * 0.3
      ctx.beginPath()
      ctx.arc(x, y, 3.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 60, 40, ${pulse})`
      ctx.fill()

      // Glow ring
      ctx.beginPath()
      ctx.arc(x, y, 6, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(255, 60, 40, ${pulse * 0.3})`
      ctx.lineWidth = 0.5
      ctx.stroke()
    } else {
      // Quiet — dim dot
      ctx.beginPath()
      ctx.arc(x, y, 1.5, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fill()
    }
  }

  // Kyiv label if active
  if (activeUIDs.has('31') || activeUIDs.has('9')) {
    ctx.font = '6px Courier New'
    ctx.fillStyle = 'rgba(255, 80, 60, 0.6)'
    ctx.fillText('KYIV', w * 0.42 + 8, h * 0.28 + 2)
  }

  // Alert count
  if (active.length > 0) {
    ctx.font = '7px Courier New'
    ctx.fillStyle = 'rgba(255, 80, 60, 0.5)'
    ctx.fillText(`${active.length} region${active.length > 1 ? 's' : ''} under alert`, 4, h - 4)
  }
}

export function stopMinimap() {
  if (updateTimer) clearInterval(updateTimer)
}
