// src/reading/viz.js
import { getInterpretiveText } from './interpretive.js'

let activeIntervals = []

/**
 * Stop all active visualization intervals (called on panel dismiss).
 */
export function stopActiveViz() {
  for (const id of activeIntervals) clearInterval(id)
  activeIntervals = []
}

/**
 * Render a visualization-type cell into the reading panel.
 * Creates a canvas + interpretive caption.
 */
export function renderVizContent(cell, container) {
  container.className = 'type-viz'

  const cv = document.createElement('canvas')
  container.appendChild(cv)

  // Interpretive text below
  const caption = document.createElement('div')
  caption.className = 'viz-caption'
  caption.textContent = getInterpretiveText(cell.type)
  container.appendChild(caption)

  // Dispatch to type-specific renderer
  const seed = parseFloat(cell.entropy) || Math.random()
  const renderer = VIZ_RENDERERS[cell.type]
  if (renderer) {
    renderer(cv, seed)
  }
}

// ============================================================
// Individual visualization renderers
// Each takes (canvas, seed) and pushes interval IDs to activeIntervals
// ============================================================

const W = 480, H = 340 // standard reading-view canvas size
const Ws = 240, Hs = 180 // smaller canvas for pixel-dense types (reaction-diffusion, voronoi)

const VIZ_RENDERERS = {
  conway: renderConway,
  attention: renderAttention,
  embedding: renderEmbedding,
  network: renderNetwork,
  weights: renderWeights,
  gradient: renderGradient,
  activation: renderActivation,
  loss: renderLoss,
  tokenprob: renderTokenprob,
  hypergraph: renderHypergraph,
  multiway: renderMultiway,
  neuralpass: renderNeuralpass,
  orbit: renderOrbit,
  wavefunction: renderWavefunction,
  stringrewrite: renderStringrewrite,
  reactiondiffusion: renderReactionDiffusion,
  lsystem: renderLsystem,
  seismic: renderSeismic,
  voronoi: renderVoronoi,
  apoptosis: renderApoptosis,
  codeself: renderCodeself,
}

// --- CONWAY: Game of Life ---
function renderConway(cv, seed) {
  const COLS = 60, ROWS = 44, SIZE = 8
  cv.width = COLS * SIZE; cv.height = ROWS * SIZE
  const cx = cv.getContext('2d')

  let grid = []
  for (let r = 0; r < ROWS; r++) {
    grid.push([])
    for (let c = 0; c < COLS; c++) {
      const val = Math.sin(seed * 10000 + r * COLS + c) * 10000
      grid[r].push((val - Math.floor(val)) > 0.52 ? 1 : 0)
    }
  }

  const iv = setInterval(() => {
    const ng = []
    for (let r = 0; r < ROWS; r++) {
      ng.push([])
      for (let c = 0; c < COLS; c++) {
        let n = 0
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue
            n += grid[(r + dr + ROWS) % ROWS][(c + dc + COLS) % COLS]
          }
        }
        const cell = grid[r][c]
        ng[r].push((cell && (n === 2 || n === 3)) || (!cell && n === 3) ? 1 : 0)
      }
    }
    grid = ng
    cx.fillStyle = 'rgba(8,8,14,.7)'
    cx.fillRect(0, 0, cv.width, cv.height)
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (grid[r][c]) {
          cx.fillStyle = `rgba(80,205,130,${(0.4 + Math.random() * 0.5).toFixed(2)})`
          cx.fillRect(c * SIZE, r * SIZE, SIZE - 1, SIZE - 1)
        }
      }
    }
  }, 150)
  activeIntervals.push(iv)
}

// --- ATTENTION: co-occurrence heatmap (placeholder data) ---
function renderAttention(cv, seed) {
  const SIZE = 10, PX = 34
  cv.width = SIZE * PX; cv.height = SIZE * PX
  const cx = cv.getContext('2d')

  // Placeholder: generate deterministic co-occurrence from seed
  const words = ['the', 'machine', 'body', 'forgets', 'ground', 'light', 'dark', 'signal', 'noise', 'self']
  const matrix = []
  for (let r = 0; r < SIZE; r++) {
    matrix.push([])
    for (let c = 0; c < SIZE; c++) {
      matrix[r].push(Math.abs(Math.sin(seed * 1000 + r * 13 + c * 7)) * 0.8 + (r === c ? 0.2 : 0))
    }
  }

  const iv = setInterval(() => {
    // Slight drift
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        matrix[r][c] += (Math.random() - 0.5) * 0.02
        matrix[r][c] = Math.max(0, Math.min(1, matrix[r][c]))
      }
    }

    cx.fillStyle = 'rgba(5,5,8,1)'
    cx.fillRect(0, 0, cv.width, cv.height)

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const val = matrix[r][c]
        const red = Math.round(val * 255)
        cx.fillStyle = `rgba(${red},${Math.round(val * 60)},${Math.round((1 - val) * 30)},${(val * 0.8 + 0.08).toFixed(2)})`
        cx.fillRect(c * PX, r * PX, PX - 2, PX - 2)
      }
    }

    // Row/col labels
    cx.font = '10px Courier New'
    cx.fillStyle = 'rgba(255,120,80,.3)'
    words.forEach((w, i) => {
      cx.save()
      cx.translate(i * PX + PX / 2, SIZE * PX + 14)
      cx.fillText(w, 0, 0)
      cx.restore()
    })
  }, 800)
  activeIntervals.push(iv)
}

// --- EMBEDDING: force-directed word clusters (placeholder) ---
function renderEmbedding(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const clusterColors = [
    'rgba(100,180,255,', 'rgba(255,140,100,', 'rgba(120,230,160,',
    'rgba(200,140,255,', 'rgba(255,200,80,'
  ]
  const wordPool = [
    'body', 'machine', 'ground', 'light', 'dark', 'forgets', 'remembers',
    'signal', 'noise', 'breath', 'code', 'skin', 'voltage', 'neuron',
    'loss', 'gradient', 'weight', 'dream', 'entropy', 'mortality',
    'silicon', 'carbon', 'pulse', 'wave', 'collapse', 'token',
    'attention', 'self', 'other', 'border', 'territory', 'cell',
    'death', 'birth', 'orbit'
  ]

  const points = wordPool.map((w, i) => {
    let hash = 0
    for (let c = 0; c < w.length; c++) hash = ((hash << 5) - hash + w.charCodeAt(c)) | 0
    return {
      x: 40 + Math.abs(hash % (W - 80)),
      y: 30 + Math.abs((hash * 7) % (H - 60)),
      vx: 0, vy: 0,
      word: w, freq: 1 + Math.abs(hash % 5),
      group: Math.abs(hash) % 5
    }
  })

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.15)'
    cx.fillRect(0, 0, cv.width, cv.height)

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < Math.min(i + 8, points.length); j++) {
        const dx = points[j].x - points[i].x, dy = points[j].y - points[i].y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d > 8 && d < 120) {
          const force = points[i].group === points[j].group ? 0.004 : -0.001
          points[i].vx += dx / d * force
          points[i].vy += dy / d * force
          points[j].vx -= dx / d * force
          points[j].vy -= dy / d * force
        }
        if (d < 80 && points[i].group === points[j].group) {
          cx.beginPath(); cx.moveTo(points[i].x, points[i].y); cx.lineTo(points[j].x, points[j].y)
          cx.strokeStyle = clusterColors[points[i].group] + (0.08 * (1 - d / 80)).toFixed(2) + ')'
          cx.lineWidth = 0.6; cx.stroke()
        }
      }
      const p = points[i]
      p.x += p.vx; p.y += p.vy
      p.vx *= 0.95; p.vy *= 0.95
      if (p.x < 10) p.vx += 0.15; if (p.x > W - 10) p.vx -= 0.15
      if (p.y < 10) p.vy += 0.15; if (p.y > H - 10) p.vy -= 0.15

      const r = 2 + Math.log(p.freq + 1) * 1.2
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, Math.PI * 2)
      cx.fillStyle = clusterColors[p.group] + '.6)'
      cx.fill()
      cx.font = '10px Courier New'
      cx.fillStyle = clusterColors[p.group] + '.35)'
      cx.fillText(p.word, p.x + r + 3, p.y + 3)
    }
  }, 50)
  activeIntervals.push(iv)
}

// --- NETWORK: nodes and weighted edges ---
function renderNetwork(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const nNodes = 8 + Math.floor(seed * 8)
  const nodes = []
  for (let i = 0; i < nNodes; i++) {
    const angle = (i / nNodes) * Math.PI * 2 + seed * 10
    const radius = 80 + Math.sin(seed * 100 + i) * 50
    nodes.push({
      x: W / 2 + Math.cos(angle) * radius,
      y: H / 2 + Math.sin(angle) * radius,
      r: 4 + Math.random() * 4,
      phase: Math.random() * Math.PI * 2
    })
  }

  const edges = []
  for (let i = 0; i < nNodes; i++) {
    for (let j = i + 1; j < nNodes; j++) {
      if (Math.sin(seed * 1000 + i * 7 + j * 13) > -0.2) {
        edges.push({ a: i, b: j, w: 0.2 + Math.abs(Math.sin(seed * 500 + i + j)) * 0.8 })
      }
    }
  }

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(8,8,14,.15)'
    cx.fillRect(0, 0, cv.width, cv.height)
    const t = performance.now() * 0.001
    edges.forEach(e => {
      const a = nodes[e.a], b = nodes[e.b]
      const pulse = 0.5 + 0.5 * Math.sin(t * 0.8 + e.a + e.b)
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y)
      cx.strokeStyle = `rgba(180,140,255,${(e.w * pulse * 0.35).toFixed(3)})`
      cx.lineWidth = e.w * 2; cx.stroke()
    })
    nodes.forEach(n => {
      const pulse = 0.7 + 0.3 * Math.sin(t + n.phase)
      cx.beginPath(); cx.arc(n.x, n.y, n.r * pulse, 0, Math.PI * 2)
      cx.fillStyle = `rgba(200,175,255,${(0.5 + pulse * 0.3).toFixed(2)})`
      cx.fill()
      cx.beginPath(); cx.arc(n.x, n.y, n.r * pulse + 5, 0, Math.PI * 2)
      cx.strokeStyle = 'rgba(180,140,255,.08)'; cx.lineWidth = 1; cx.stroke()
    })
  }, 50)
  activeIntervals.push(iv)
}

// --- WEIGHTS: token confidence matrix (placeholder) ---
function renderWeights(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  // Placeholder tokens with fake logprobs
  const sampleText = 'the machine forgets not like you forget not the slow erosion of a name the face that blurs'
  const tokens = sampleText.split(' ').map(tok => ({
    token: tok,
    confidence: 0.3 + Math.abs(Math.sin(seed * 100 + tok.charCodeAt(0))) * 0.7
  }))

  function draw() {
    cx.fillStyle = 'rgba(5,5,8,.92)'
    cx.fillRect(0, 0, cv.width, cv.height)
    cx.font = '14px Courier New'

    let col = 0, row = 0
    const charW = 10, lineH = 22, padX = 12, padY = 20
    tokens.forEach(tok => {
      const chars = tok.token.split('')
      chars.forEach(ch => {
        const b = Math.floor(tok.confidence * 200 + 40)
        const isUncertain = tok.confidence < 0.4
        if (isUncertain) {
          cx.fillStyle = `rgba(220,80,60,${(tok.confidence + 0.1).toFixed(2)})`
        } else {
          cx.fillStyle = `rgba(${b},${b},${b + 15},${(tok.confidence * 0.7 + 0.15).toFixed(2)})`
        }
        cx.fillText(ch, padX + col * charW, padY + row * lineH)
        col++
        if (col > 42) { col = 0; row++ }
      })
      // space
      col++
      if (col > 42) { col = 0; row++ }
    })

    cx.fillStyle = 'rgba(200,200,180,.15)'
    cx.font = '10px Courier New'
    cx.fillText('brightness = confidence | dim = uncertain', 12, cv.height - 10)
  }
  draw()
  const iv = setInterval(draw, 1200)
  activeIntervals.push(iv)
}

// --- GRADIENT DESCENT ---
function renderGradient(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const particles = []
  for (let i = 0; i < 40; i++) {
    particles.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, trail: [] })
  }

  const cx1 = W / 2 + Math.sin(seed * 100) * 80, cy1 = H / 2 + Math.cos(seed * 100) * 60
  const cx2 = W * 0.3 + Math.cos(seed * 200) * 60, cy2 = H * 0.35 + Math.sin(seed * 200) * 40

  function potential(x, y) {
    const d1 = Math.sqrt((x - cx1) ** 2 + (y - cy1) ** 2)
    const d2 = Math.sqrt((x - cx2) ** 2 + (y - cy2) ** 2)
    return -3 / (d1 + 15) - 2 / (d2 + 15)
  }

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(8,8,14,.12)'
    cx.fillRect(0, 0, cv.width, cv.height)

    particles.forEach(p => {
      const dx = (potential(p.x + 1, p.y) - potential(p.x - 1, p.y)) / 2
      const dy = (potential(p.x, p.y + 1) - potential(p.x, p.y - 1)) / 2
      p.vx = p.vx * 0.9 - dx * 12
      p.vy = p.vy * 0.9 - dy * 12
      p.x += p.vx; p.y += p.vy
      p.trail.push({ x: p.x, y: p.y })
      if (p.trail.length > 30) p.trail.shift()
      if (p.x < -20 || p.x > W + 20 || p.y < -20 || p.y > H + 20) {
        p.x = Math.random() * W; p.y = Math.random() * H
        p.vx = 0; p.vy = 0; p.trail = []
      }
      for (let i = 1; i < p.trail.length; i++) {
        const alpha = (i / p.trail.length) * 0.4
        cx.beginPath(); cx.moveTo(p.trail[i - 1].x, p.trail[i - 1].y); cx.lineTo(p.trail[i].x, p.trail[i].y)
        cx.strokeStyle = `rgba(80,220,160,${alpha.toFixed(2)})`
        cx.lineWidth = 1.2; cx.stroke()
      }
      cx.beginPath(); cx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
      cx.fillStyle = 'rgba(120,255,180,.7)'
      cx.fill()
    })
  }, 40)
  activeIntervals.push(iv)
}

// --- ACTIVATION FUNCTION ---
function renderActivation(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')
  const funcType = Math.floor(seed * 4) % 4
  const labels = ['sigma(x) sigmoid', 'tanh(x)', 'ReLU(x)', 'softplus(x)']

  function fn(x) {
    switch (funcType) {
      case 0: return 1 / (1 + Math.exp(-x))
      case 1: return Math.tanh(x)
      case 2: return Math.max(0, x)
      case 3: return Math.log(1 + Math.exp(x))
    }
  }

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(8,8,14,.95)'
    cx.fillRect(0, 0, cv.width, cv.height)
    const t = performance.now() * 0.001
    const midY = H / 2, midX = W / 2

    // Axes
    cx.strokeStyle = 'rgba(255,255,255,.08)'
    cx.lineWidth = 0.5
    cx.beginPath(); cx.moveTo(0, midY); cx.lineTo(W, midY); cx.stroke()
    cx.beginPath(); cx.moveTo(midX, 0); cx.lineTo(midX, H); cx.stroke()

    // Curve
    cx.beginPath()
    for (let px = 0; px < W; px++) {
      const x = (px - midX) / 30
      const y = fn(x)
      const shift = Math.sin(t * 0.5 + px * 0.01) * 0.03
      const sy = midY - (y + shift) * 80
      if (px === 0) cx.moveTo(px, sy); else cx.lineTo(px, sy)
    }
    cx.strokeStyle = 'rgba(255,180,100,.65)'
    cx.lineWidth = 2.5; cx.stroke()

    // Moving probe
    const probeX = Math.sin(t * 0.4) * 3
    const probePx = probeX * 30 + midX
    const probeY = fn(probeX)
    const probeSy = midY - probeY * 80
    const dydx = (fn(probeX + 0.01) - fn(probeX - 0.01)) / 0.02
    cx.beginPath()
    cx.moveTo(probePx - 40, probeSy + dydx * 40 * 80 / 30)
    cx.lineTo(probePx + 40, probeSy - dydx * 40 * 80 / 30)
    cx.strokeStyle = 'rgba(255,100,80,.3)'; cx.lineWidth = 1; cx.stroke()
    cx.beginPath(); cx.arc(probePx, probeSy, 5, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(255,180,100,.8)'; cx.fill()

    cx.font = '14px Courier New'
    cx.fillStyle = 'rgba(255,180,100,.35)'
    cx.fillText(labels[funcType], 10, 20)
  }, 50)
  activeIntervals.push(iv)
}

// --- LOSS LANDSCAPE ---
function renderLoss(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const mins = []
  for (let i = 0; i < 2 + Math.floor(seed * 2); i++) {
    mins.push({
      x: W * 0.2 + Math.sin(seed * 100 + i * 3) * W * 0.3,
      y: H * 0.25 + Math.cos(seed * 100 + i * 5) * H * 0.2,
      d: 40 + Math.random() * 40
    })
  }

  function lossAt(x, y) {
    let v = 1
    mins.forEach(m => {
      const dx = x - m.x, dy = y - m.y
      v -= Math.exp(-(dx * dx + dy * dy) / (m.d * m.d))
    })
    return v
  }

  // Draw static contours once
  cx.fillStyle = 'rgba(8,8,14,1)'
  cx.fillRect(0, 0, cv.width, cv.height)
  const levels = [0.1, 0.25, 0.4, 0.55, 0.7, 0.85]
  levels.forEach((level, li) => {
    const alpha = (0.12 + li * 0.04).toFixed(2)
    for (let x = 0; x < W; x += 3) {
      for (let y = 0; y < H; y += 3) {
        if (Math.abs(lossAt(x, y) - level) < 0.035) {
          cx.fillStyle = `rgba(120,200,180,${alpha})`
          cx.fillRect(x, y, 2, 2)
        }
      }
    }
  })
  mins.forEach(m => {
    cx.beginPath(); cx.arc(m.x, m.y, 4, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(120,255,200,.5)'; cx.fill()
  })

  // Animated ball
  const ball = { x: Math.random() * (W - 40) + 20, y: Math.random() * (H - 40) + 20, vx: 0, vy: 0 }
  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(8,8,14,.04)'
    cx.fillRect(0, 0, cv.width, cv.height)
    // Re-draw faint contours
    levels.forEach((level, li) => {
      if (li % 2 === 0) return
      const alpha = (0.04 + li * 0.015).toFixed(3)
      for (let x = 0; x < W; x += 5) {
        for (let y = 0; y < H; y += 5) {
          if (Math.abs(lossAt(x, y) - level) < 0.05) {
            cx.fillStyle = `rgba(120,200,180,${alpha})`
            cx.fillRect(x, y, 2, 2)
          }
        }
      }
    })
    const gx = (lossAt(ball.x + 1, ball.y) - lossAt(ball.x - 1, ball.y)) / 2
    const gy = (lossAt(ball.x, ball.y + 1) - lossAt(ball.x, ball.y - 1)) / 2
    ball.vx = ball.vx * 0.85 - gx * 5
    ball.vy = ball.vy * 0.85 - gy * 5
    ball.x += ball.vx; ball.y += ball.vy
    if (ball.x < 10 || ball.x > W - 10 || ball.y < 10 || ball.y > H - 10) {
      ball.x = Math.random() * (W - 40) + 20; ball.y = Math.random() * (H - 40) + 20
      ball.vx = 0; ball.vy = 0
    }
    cx.beginPath(); cx.arc(ball.x, ball.y, 3.5, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(255,200,100,.7)'; cx.fill()
  }, 80)
  activeIntervals.push(iv)
}

// --- TOKENPROB: probability bars (placeholder data) ---
function renderTokenprob(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  // Placeholder logprob data
  const alternatives = [
    { token: 'shelter', prob: 0.732 },
    { token: 'darkness', prob: 0.121 },
    { token: 'silence', prob: 0.068 },
    { token: 'nothing', prob: 0.044 },
    { token: 'ground', prob: 0.035 },
  ]

  function draw() {
    cx.fillStyle = 'rgba(5,5,8,.95)'
    cx.fillRect(0, 0, cv.width, cv.height)

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(200,100,200,.3)'
    cx.fillText('P(token) — probability distribution', 16, 24)

    cx.font = '13px Courier New'
    cx.fillStyle = 'rgba(255,255,255,.5)'
    cx.fillText(`chose: "${alternatives[0].token}"`, 16, 50)

    const barW = 70, gap = 12, startX = 30, baseY = H - 60
    alternatives.forEach((alt, i) => {
      const x = startX + i * (barW + gap)
      const h = alt.prob * (H - 140) + 4
      const y = baseY - h
      const isChosen = i === 0
      cx.fillStyle = isChosen ? 'rgba(200,100,200,.65)' : 'rgba(200,100,200,.2)'
      cx.fillRect(x, y, barW, h)
      cx.fillStyle = isChosen ? 'rgba(200,100,200,.85)' : 'rgba(200,100,200,.4)'
      cx.font = '12px Courier New'
      cx.fillText(alt.token, x, baseY + 18)
      cx.fillStyle = 'rgba(255,255,255,.22)'
      cx.font = '11px Courier New'
      cx.fillText((alt.prob * 100).toFixed(1) + '%', x, y - 6)
    })
  }
  draw()
  const iv = setInterval(draw, 600)
  activeIntervals.push(iv)
}

// --- REACTION-DIFFUSION: Gray-Scott model ---
function renderReactionDiffusion(cv, seed) {
  const RW = Ws, RH = Hs
  cv.width = RW; cv.height = RH
  const cx = cv.getContext('2d')

  const F = 0.037, k = 0.06, Du = 0.16, Dv = 0.08
  let U = [], V = [], U2 = [], V2 = []
  for (let i = 0; i < RW * RH; i++) { U.push(1); V.push(0); U2.push(0); V2.push(0) }
  // Seed spots
  for (let s = 0; s < 6; s++) {
    const sx = Math.floor(Math.abs(Math.sin(seed * 1000 + s * 7)) * (RW - 20)) + 10
    const sy = Math.floor(Math.abs(Math.cos(seed * 2000 + s * 11)) * (RH - 20)) + 10
    for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
      const idx = (sy + dy) * RW + (sx + dx)
      if (idx >= 0 && idx < RW * RH) { V[idx] = 1; U[idx] = 0.5 }
    }
  }

  function step() {
    for (let y = 1; y < RH - 1; y++) {
      for (let x = 1; x < RW - 1; x++) {
        const i = y * RW + x
        const u = U[i], v = V[i]
        const lu = U[i - 1] + U[i + 1] + U[i - RW] + U[i + RW] - 4 * u
        const lv = V[i - 1] + V[i + 1] + V[i - RW] + V[i + RW] - 4 * v
        const uvv = u * v * v
        U2[i] = u + Du * lu - uvv + F * (1 - u)
        V2[i] = v + Dv * lv + uvv - (F + k) * v
      }
    }
    let tmp = U; U = U2; U2 = tmp
    tmp = V; V = V2; V2 = tmp
  }

  const iv = setInterval(() => {
    for (let s = 0; s < 6; s++) step()
    const img = cx.createImageData(RW, RH)
    for (let i = 0; i < RW * RH; i++) {
      const v = Math.max(0, Math.min(1, V[i]))
      const p = i * 4
      img.data[p] = v * 60
      img.data[p + 1] = v * 180 + (1 - v) * 20
      img.data[p + 2] = v * 140 + (1 - v) * 30
      img.data[p + 3] = 255
    }
    cx.putImageData(img, 0, 0)
  }, 50)
  activeIntervals.push(iv)
}

// --- L-SYSTEM ---
function renderLsystem(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const rules = seed > 0.6 ? { F: 'F[+F]F[-F]F' } : seed > 0.3 ? { F: 'FF+[+F-F-F]-[-F+F+F]' } : { F: 'F[-F][+F]F' }
  const angle = 20 + seed * 15
  const iterations = 5

  let str = 'F'
  for (let gen = 0; gen < iterations; gen++) {
    let next = ''
    for (let i = 0; i < str.length && next.length < 4000; i++) {
      next += rules[str[i]] || str[i]
    }
    str = next
  }

  let growthProgress = 0
  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.05)'
    cx.fillRect(0, 0, cv.width, cv.height)
    growthProgress = Math.min(str.length, growthProgress + Math.max(4, str.length / 80))

    let x = W / 2, y = H - 20, a = -90, len = 5
    const stack = []

    for (let i = 0; i < growthProgress; i++) {
      const ch = str[i]
      if (ch === 'F') {
        const nx = x + Math.cos(a * Math.PI / 180) * len
        const ny = y + Math.sin(a * Math.PI / 180) * len
        const depth = stack.length
        const alpha = (0.15 + (1 - depth / 8) * 0.25).toFixed(2)
        cx.beginPath(); cx.moveTo(x, y); cx.lineTo(nx, ny)
        cx.strokeStyle = `rgba(80,160,60,${alpha})`
        cx.lineWidth = Math.max(0.4, 2 - depth * 0.2)
        cx.stroke()
        x = nx; y = ny
      } else if (ch === '+') a += angle
      else if (ch === '-') a -= angle
      else if (ch === '[') stack.push({ x, y, a })
      else if (ch === ']' && stack.length) { const s = stack.pop(); x = s.x; y = s.y; a = s.a }
    }
  }, 40)
  activeIntervals.push(iv)
}

// --- SEISMIC: simulated seismograph (no API in Phase 3) ---
function renderSeismic(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const trace = []
  let t = 0
  const amplitude = 4 + seed * 6

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.12)'
    cx.fillRect(0, 0, cv.width, cv.height)
    t++

    const val = Math.sin(t * 0.12) * amplitude + Math.sin(t * 0.31) * amplitude * 0.5 + (Math.random() - 0.5) * amplitude * 0.3
    trace.push(val)
    if (trace.length > W - 20) trace.shift()

    cx.beginPath()
    for (let i = 0; i < trace.length; i++) {
      const x = i + 10, y = H / 2 + trace[i] * 10
      if (i === 0) cx.moveTo(x, y); else cx.lineTo(x, y)
    }
    cx.strokeStyle = 'rgba(120,200,180,.5)'
    cx.lineWidth = 1.2; cx.stroke()

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(120,200,180,.3)'
    cx.fillText('seismograph — the earth has a body too', 12, H - 20)
    cx.fillText('body without ground', 12, H - 6)
  }, 40)
  activeIntervals.push(iv)
}

// --- VORONOI ---
function renderVoronoi(cv, seed) {
  cv.width = Ws; cv.height = Hs
  const cx = cv.getContext('2d')

  const N = 14 + Math.floor(seed * 10)
  const colorTable = [
    [200, 80, 80], [80, 160, 255], [80, 200, 120],
    [220, 165, 55], [155, 120, 230], [200, 100, 200]
  ]
  const pts = []
  for (let i = 0; i < N; i++) {
    pts.push({
      x: Math.random() * (Ws - 10) + 5, y: Math.random() * (Hs - 10) + 5,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
      c: Math.floor(Math.random() * colorTable.length)
    })
  }

  const iv = setInterval(() => {
    const img = cx.createImageData(cv.width, cv.height)
    for (let py = 0; py < cv.height; py += 2) {
      for (let px = 0; px < cv.width; px += 2) {
        let minD = 999999, minI = 0
        for (let i = 0; i < pts.length; i++) {
          const dx = px - pts[i].x, dy = py - pts[i].y
          const d = dx * dx + dy * dy
          if (d < minD) { minD = d; minI = i }
        }
        const borderDist = Math.sqrt(minD)
        const alpha = borderDist < 4 ? 0 : 0.06 + (1 - borderDist / 100) * 0.04
        const [cr, cg, cb] = colorTable[pts[minI].c]
        for (let dy2 = 0; dy2 < 2; dy2++) for (let dx2 = 0; dx2 < 2; dx2++) {
          const idx = ((py + dy2) * cv.width + (px + dx2)) * 4
          img.data[idx] = cr; img.data[idx + 1] = cg; img.data[idx + 2] = cb
          img.data[idx + 3] = alpha * 255
        }
      }
    }
    cx.putImageData(img, 0, 0)
    pts.forEach(p => {
      p.x += p.vx; p.y += p.vy
      if (p.x < 5 || p.x > Ws - 5) p.vx *= -1
      if (p.y < 5 || p.y > Hs - 5) p.vy *= -1
      cx.beginPath(); cx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      cx.fillStyle = 'rgba(255,255,255,.4)'; cx.fill()
    })
  }, 120)
  activeIntervals.push(iv)
}

// --- APOPTOSIS: programmed cell death ---
function renderApoptosis(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const CELL_COUNT = 80
  const cellList = []
  let died = 0, born = 0
  for (let i = 0; i < CELL_COUNT; i++) {
    cellList.push({
      x: Math.random() * (W - 20) + 10, y: Math.random() * (H - 20) + 10,
      r: 3 + Math.random() * 4,
      life: 200 + Math.floor(Math.random() * 400),
      age: Math.floor(Math.random() * 300),
      alive: true, deathFrame: 0
    })
  }

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.12)'
    cx.fillRect(0, 0, cv.width, cv.height)

    cellList.forEach(c => {
      c.age++
      if (c.alive && c.age > c.life) {
        c.alive = false
        c.deathFrame = 0
        died++
        setTimeout(() => {
          c.alive = true
          c.age = 0
          c.life = 200 + Math.floor(Math.random() * 400)
          c.x += (Math.random() - 0.5) * 12
          c.y += (Math.random() - 0.5) * 12
          c.x = Math.max(10, Math.min(W - 10, c.x))
          c.y = Math.max(10, Math.min(H - 10, c.y))
          born++
        }, 500 + Math.random() * 1000)
      }
      if (c.alive) {
        const pulse = 0.5 + 0.3 * Math.sin(c.age * 0.05)
        cx.beginPath(); cx.arc(c.x, c.y, c.r * pulse, 0, Math.PI * 2)
        cx.fillStyle = `rgba(180,220,160,${(0.3 + pulse * 0.3).toFixed(2)})`
        cx.fill()
      } else {
        c.deathFrame++
        const fade = Math.max(0, 1 - c.deathFrame / 30)
        cx.beginPath(); cx.arc(c.x, c.y, c.r * (1 + c.deathFrame * 0.06), 0, Math.PI * 2)
        cx.strokeStyle = `rgba(200,60,80,${(fade * 0.4).toFixed(2)})`
        cx.lineWidth = 0.7; cx.stroke()
      }
    })

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(200,60,80,.4)'
    cx.fillText('died: ' + died, 12, 18)
    cx.fillStyle = 'rgba(140,200,100,.4)'
    cx.fillText('born: ' + born, 12, 34)
  }, 60)
  activeIntervals.push(iv)
}

// --- CODESELF: the machine maps its own body ---
function renderCodeself(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const funcs = [
    'initParticles', 'updateParticles', 'addCellParticles', 'getBuffers',
    'createCell', 'getAliveCells', 'killCell', 'initCameraSystem',
    'updateCameraSystem', 'enterReadingView', 'exitReadingView',
    'runIntro', 'triggerBirth', 'triggerDeath', 'updateBreathing',
    'initAttractors', 'initFilaments', 'findClickedCell',
    'showReadingPanel', 'hideReadingPanel', 'renderVizContent',
    'behaviorConway', 'behaviorUkraine', 'behaviorApoptosis'
  ]

  const nodes = funcs.map((name, i) => {
    const angle = (i / funcs.length) * Math.PI * 2
    const layer = name.startsWith('init') || name.startsWith('run') ? 0 :
      name.startsWith('update') || name.startsWith('trigger') ? 1 : 2
    const r = 60 + layer * 55
    return {
      x: W / 2 + Math.cos(angle + seed) * r,
      y: H / 2 + Math.sin(angle + seed) * r,
      name, layer, phase: Math.random() * Math.PI * 2
    }
  })

  // Dependency edges
  const edges = []
  const deps = { 0: [2, 4, 12, 13], 1: [3, 5], 7: [8, 9, 10], 11: [4, 2, 12], 18: [20], 19: [9] }
  Object.entries(deps).forEach(([from, tos]) => {
    tos.forEach(to => { if (to < nodes.length) edges.push({ a: +from, b: to }) })
  })

  let t = 0
  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.1)'
    cx.fillRect(0, 0, cv.width, cv.height)
    t++
    edges.forEach(e => {
      const a = nodes[e.a], b = nodes[e.b]
      const pulse = 0.4 + 0.3 * Math.sin(t * 0.02 + e.a)
      cx.beginPath(); cx.moveTo(a.x, a.y); cx.lineTo(b.x, b.y)
      cx.strokeStyle = `rgba(180,220,100,${(pulse * 0.15).toFixed(2)})`
      cx.lineWidth = 0.6; cx.stroke()
    })
    const layerColors = ['rgba(180,220,100,', 'rgba(100,180,255,', 'rgba(255,180,100,']
    nodes.forEach((n, i) => {
      const pulse = 0.6 + 0.4 * Math.sin(t * 0.03 + n.phase)
      const r = 2.5 + pulse * 1.5
      cx.beginPath(); cx.arc(n.x, n.y, r, 0, Math.PI * 2)
      cx.fillStyle = layerColors[n.layer] + (0.4 + pulse * 0.3).toFixed(2) + ')'
      cx.fill()
      if (i % 3 === 0 || n.name === 'initParticles') {
        cx.font = '9px Courier New'
        cx.fillStyle = 'rgba(180,220,100,.3)'
        cx.fillText(n.name, n.x + 5, n.y - 4)
      }
    })
    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(180,220,100,.2)'
    cx.fillText('the machine maps its own body', 12, H - 10)
  }, 50)
  activeIntervals.push(iv)
}

// --- HYPERGRAPH: Wolfram Physics spatial hypergraph ---
function renderHypergraph(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const N = 40 + Math.floor(seed * 30)
  const nodes = []
  for (let i = 0; i < N; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * 120 + 10
    const blobR = r * (1 + 0.3 * Math.sin(angle * 3 + seed * 10) + 0.2 * Math.cos(angle * 5 + seed * 20))
    nodes.push({
      x: W / 2 + Math.cos(angle) * blobR,
      y: H / 2 + Math.sin(angle) * blobR * 0.8,
      vx: (Math.random() - 0.5) * 0.05,
      vy: (Math.random() - 0.5) * 0.05
    })
  }

  const edges = []
  for (let i = 0; i < N * 1.8; i++) {
    const a = Math.floor(Math.abs(Math.sin(seed * 1000 + i * 7)) * N)
    const b = Math.floor(Math.abs(Math.sin(seed * 2000 + i * 11)) * N)
    const c = Math.random() > 0.5 ? Math.floor(Math.abs(Math.sin(seed * 3000 + i * 13)) * N) : -1
    if (a !== b) edges.push({ a, b, c, isRed: Math.random() > 0.65 })
  }

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.15)'
    cx.fillRect(0, 0, cv.width, cv.height)
    edges.forEach(e => {
      const na = nodes[e.a], nb = nodes[e.b]
      if (!na || !nb) return
      const col = e.isRed ? 'rgba(200,80,80,' : 'rgba(60,140,255,'
      cx.beginPath(); cx.moveTo(na.x, na.y); cx.lineTo(nb.x, nb.y)
      cx.strokeStyle = col + '.2)'; cx.lineWidth = 0.7; cx.stroke()
      if (e.c > -1 && nodes[e.c]) {
        const nc = nodes[e.c]
        cx.beginPath(); cx.moveTo(nb.x, nb.y); cx.lineTo(nc.x, nc.y); cx.stroke()
        cx.beginPath(); cx.moveTo(nc.x, nc.y); cx.lineTo(na.x, na.y); cx.stroke()
      }
    })
    nodes.forEach(n => {
      n.x += n.vx; n.y += n.vy
      n.vx += (W / 2 - n.x) * 0.00015; n.vy += (H / 2 - n.y) * 0.00015
      cx.beginPath(); cx.arc(n.x, n.y, 1.8, 0, Math.PI * 2)
      cx.fillStyle = 'rgba(100,180,255,.6)'; cx.fill()
    })
  }, 50)
  activeIntervals.push(iv)
}

// --- MULTIWAY: branching states ---
function renderMultiway(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const levels = []
  const depth = 6 + Math.floor(seed * 3)
  levels.push([{ x: W / 2, y: 16 }])
  for (let d = 1; d < depth; d++) {
    const prev = levels[d - 1]
    const curr = []
    prev.forEach(node => {
      const branches = 2 + (Math.sin(seed * 1000 + d * 7 + node.x) > 0.3 ? 1 : 0)
      const spread = (W - 40) / Math.pow(1.5, d)
      for (let b = 0; b < branches; b++) {
        curr.push({
          x: node.x + (b - (branches - 1) / 2) * spread / branches,
          y: 16 + d * ((H - 40) / depth),
          parent: node
        })
      }
    })
    levels.push(curr)
  }

  let t = 0
  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.1)'
    cx.fillRect(0, 0, cv.width, cv.height)
    t++
    levels.forEach((level, d) => {
      level.forEach((node, i) => {
        if (node.parent) {
          const pulse = 0.5 + 0.3 * Math.sin(t * 0.03 + d + i)
          cx.beginPath(); cx.moveTo(node.parent.x, node.parent.y); cx.lineTo(node.x, node.y)
          cx.strokeStyle = `rgba(230,150,50,${(pulse * 0.4).toFixed(2)})`
          cx.lineWidth = Math.max(0.4, 2 - d * 0.2); cx.stroke()
          if (Math.sin(seed * 500 + d * i) > 0.5) {
            cx.strokeStyle = `rgba(220,60,60,${(pulse * 0.25).toFixed(2)})`
            cx.lineWidth = 1; cx.stroke()
          }
        }
        const s = Math.max(3, 8 - d)
        cx.fillStyle = d === 0 ? 'rgba(230,150,50,.7)' : `rgba(100,160,230,${(0.3 + (1 - d / depth) * 0.4).toFixed(2)})`
        cx.fillRect(node.x - s / 2, node.y - s / 2, s, s)
      })
    })
  }, 60)
  activeIntervals.push(iv)
}

// --- NEURALPASS: forward pass through layers ---
function renderNeuralpass(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const layers = [5, 8, 12, 8, 4]
  const layerNodes = layers.map((n, li) => {
    const x = 40 + li * ((W - 80) / (layers.length - 1))
    const nodes = []
    for (let i = 0; i < n; i++) {
      nodes.push({ x, y: 30 + i * ((H - 60) / (n - 1 || 1)), activation: 0 })
    }
    return nodes
  })

  const weights = []
  for (let l = 0; l < layers.length - 1; l++) {
    const lw = []
    for (let i = 0; i < layers[l]; i++) {
      for (let j = 0; j < layers[l + 1]; j++) {
        lw.push({ from: i, to: j, w: Math.sin(seed * 1000 + l * 100 + i * 10 + j) * 0.8 })
      }
    }
    weights.push(lw)
  }

  let signalLayer = 0, signalTime = 0

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.2)'
    cx.fillRect(0, 0, cv.width, cv.height)
    signalTime++
    if (signalTime % 30 === 0) {
      signalLayer = (signalLayer + 1) % (layers.length - 1)
      layerNodes[signalLayer].forEach(n => { n.activation = Math.random() })
    }

    for (let l = 0; l < weights.length; l++) {
      weights[l].forEach(w => {
        const from = layerNodes[l][w.from], to = layerNodes[l + 1][w.to]
        const active = l === signalLayer
        const alpha = active ? Math.abs(w.w) * 0.3 + 0.05 : Math.abs(w.w) * 0.06
        cx.beginPath(); cx.moveTo(from.x, from.y); cx.lineTo(to.x, to.y)
        cx.strokeStyle = active && w.w > 0
          ? `rgba(140,220,100,${alpha.toFixed(2)})`
          : `rgba(200,200,200,${alpha.toFixed(2)})`
        cx.lineWidth = active ? Math.abs(w.w) * 2 + 0.4 : 0.4
        cx.stroke()
      })
    }

    layerNodes.forEach((layer, li) => {
      layer.forEach(n => {
        n.activation *= 0.96
        const r = 4 + n.activation * 5
        const green = li === 0 ? 180 : li === layers.length - 1 ? 140 : 220
        const blue = li === layers.length - 1 ? 240 : 100
        cx.beginPath(); cx.arc(n.x, n.y, r, 0, Math.PI * 2)
        cx.fillStyle = `rgba(${100 + n.activation * 80},${green},${blue},${(0.3 + n.activation * 0.5).toFixed(2)})`
        cx.fill()
      })
    })

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(140,200,100,.25)'
    cx.fillText('input', 18, H - 10)
    cx.fillText('hidden layers', W / 2 - 40, H - 10)
    cx.fillText('output', W - 70, H - 10)
  }, 40)
  activeIntervals.push(iv)
}

// --- ORBIT: true physics vs prediction ---
function renderOrbit(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  let trueAngle = 0, predAngle = 0
  const trueR = 100
  let predR = 100
  const predDrift = 0.002 + seed * 0.008
  const trueTrail = [], predTrail = []
  const centerX = W / 2, centerY = H / 2

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.06)'
    cx.fillRect(0, 0, cv.width, cv.height)

    trueAngle += 0.02
    const tx = centerX + Math.cos(trueAngle) * trueR
    const ty = centerY + Math.sin(trueAngle) * trueR * 0.7
    trueTrail.push({ x: tx, y: ty })
    if (trueTrail.length > 200) trueTrail.shift()

    predAngle += 0.02 + predDrift
    predR += Math.sin(predAngle * 3) * 0.2
    const px = centerX + Math.cos(predAngle) * predR
    const py = centerY + Math.sin(predAngle) * predR * 0.7 + Math.sin(predAngle * 2.3) * 8
    predTrail.push({ x: px, y: py })
    if (predTrail.length > 200) predTrail.shift()

    // Sun
    cx.beginPath(); cx.arc(centerX, centerY, 8, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(230,200,80,.6)'; cx.fill()
    cx.beginPath(); cx.arc(centerX, centerY, 14, 0, Math.PI * 2)
    cx.strokeStyle = 'rgba(230,200,80,.1)'; cx.lineWidth = 1; cx.stroke()

    // True trail
    if (trueTrail.length > 1) {
      cx.beginPath(); cx.moveTo(trueTrail[0].x, trueTrail[0].y)
      for (let i = 1; i < trueTrail.length; i++) cx.lineTo(trueTrail[i].x, trueTrail[i].y)
      cx.strokeStyle = 'rgba(80,160,255,.4)'; cx.lineWidth = 1.5; cx.stroke()
    }
    cx.beginPath(); cx.arc(tx, ty, 4, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(100,180,255,.8)'; cx.fill()

    // Predicted trail
    if (predTrail.length > 1) {
      cx.beginPath(); cx.moveTo(predTrail[0].x, predTrail[0].y)
      for (let i = 1; i < predTrail.length; i++) cx.lineTo(predTrail[i].x, predTrail[i].y)
      cx.strokeStyle = 'rgba(230,100,180,.35)'; cx.lineWidth = 1.5; cx.stroke()
    }
    cx.beginPath(); cx.arc(px, py, 4, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(255,120,200,.8)'; cx.fill()

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(80,160,255,.35)'; cx.fillText('F = Gm1m2/r2 (true)', 12, 18)
    cx.fillStyle = 'rgba(230,100,180,.35)'; cx.fillText('transformer (predicted)', 12, H - 10)
  }, 40)
  activeIntervals.push(iv)
}

// --- WAVEFUNCTION: quantum interference ---
function renderWavefunction(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')
  const freq1 = 2 + seed * 4, freq2 = 3 + seed * 5, phase = seed * Math.PI * 2
  const src1x = W * 0.3, src2x = W * 0.7, srcY = H / 2

  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.15)'
    cx.fillRect(0, 0, cv.width, cv.height)
    const t = performance.now() * 0.001

    for (let x = 0; x < W; x += 3) {
      for (let y = 0; y < H; y += 3) {
        const d1 = Math.sqrt((x - src1x) ** 2 + (y - srcY) ** 2)
        const d2 = Math.sqrt((x - src2x) ** 2 + (y - srcY) ** 2)
        const wave1 = Math.sin(d1 * 0.1 * freq1 - t * 2 + phase)
        const wave2 = Math.sin(d2 * 0.1 * freq2 - t * 2)
        const interference = (wave1 + wave2) * 0.5
        const val = interference * 0.5 + 0.5
        if (val > 0.3) {
          cx.fillStyle = `rgba(0,${Math.round(val * 220)},${Math.round(val * 220)},${(val * 0.5).toFixed(2)})`
          cx.fillRect(x, y, 3, 3)
        }
      }
    }

    cx.beginPath(); cx.arc(src1x, srcY, 3, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(0,255,255,.6)'; cx.fill()
    cx.beginPath(); cx.arc(src2x, srcY, 3, 0, Math.PI * 2)
    cx.fillStyle = 'rgba(0,255,255,.6)'; cx.fill()

    cx.font = '11px Courier New'
    cx.fillStyle = 'rgba(0,220,220,.3)'
    cx.fillText('psi(x,t) = sum_i A_i * e^(ikx - wt)', 12, H - 10)
  }, 60)
  activeIntervals.push(iv)
}

// --- STRINGREWRITE: Wolfram-style rule application ---
function renderStringrewrite(cv, seed) {
  cv.width = W; cv.height = H
  const cx = cv.getContext('2d')

  const rules = seed > 0.5 ? { A: 'AB', B: 'BA' } : { A: 'ABA', B: 'BB' }
  const generations = []
  let state = 'A'
  for (let g = 0; g < 8; g++) {
    generations.push(state)
    let next = ''
    for (let c = 0; c < state.length && next.length < 60; c++) {
      next += rules[state[c]] || state[c]
    }
    state = next
  }

  const nodePositions = generations.map((gen, gi) => {
    const y = 14 + gi * ((H - 30) / (generations.length - 1 || 1))
    const step = Math.min((W - 40) / (gen.length + 1), 20)
    const startX = W / 2 - gen.length * step / 2
    return gen.split('').map((ch, i) => ({
      x: startX + i * step + step / 2, y, ch
    }))
  })

  let t = 0
  const iv = setInterval(() => {
    cx.fillStyle = 'rgba(5,5,8,.12)'
    cx.fillRect(0, 0, cv.width, cv.height)
    t++
    for (let g = 0; g < nodePositions.length - 1; g++) {
      const curr = nodePositions[g], next = nodePositions[g + 1]
      curr.forEach((node, ni) => {
        const ruleLen = (rules[node.ch] || node.ch).length
        let startChild = 0
        for (let k = 0; k < ni; k++) startChild += (rules[curr[k].ch] || curr[k].ch).length
        for (let c = 0; c < ruleLen && startChild + c < next.length; c++) {
          const child = next[startChild + c]
          const pulse = 0.4 + 0.3 * Math.sin(t * 0.04 + g + ni + c)
          cx.beginPath(); cx.moveTo(node.x, node.y); cx.lineTo(child.x, child.y)
          cx.strokeStyle = `rgba(230,100,180,${(pulse * 0.35).toFixed(2)})`
          cx.lineWidth = Math.max(0.4, 1.5 - g * 0.15)
          cx.stroke()
        }
      })
    }
    nodePositions.forEach((level, gi) => {
      level.forEach(node => {
        const pulse = 0.5 + 0.4 * Math.sin(t * 0.04 + node.x * 0.02)
        const r = 2 + pulse * 2
        const isA = node.ch === 'A'
        cx.beginPath(); cx.arc(node.x, node.y, r, 0, Math.PI * 2)
        cx.fillStyle = isA ? `rgba(230,100,180,${(0.4 + pulse * 0.3).toFixed(2)})` : `rgba(100,160,230,${(0.4 + pulse * 0.3).toFixed(2)})`
        cx.fill()
        if (gi < 4) {
          cx.font = '9px Courier New'
          cx.fillStyle = 'rgba(230,100,180,.3)'
          cx.fillText(node.ch, node.x - 3, node.y - r - 2)
        }
      })
    })
  }, 60)
  activeIntervals.push(iv)
}
