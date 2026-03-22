/**
 * Generation scheduler — auto-generates cells every 4 minutes.
 * API types (poem, essay, ukraine, ascii) hit Groq for real content.
 * All other types are instant (visual only, no API call).
 * Cells die after ~2 hours.
 */

import { generateContent, isApiType, hasGroqKey, getLastLogprobs } from './groq.js'
import { createCell, getAliveCells, killCell } from '../state/cells.js'
import { addCellParticles, getCellParticleMap } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { triggerDeath } from '../cosmos/death.js'
import { TYPE_NAMES } from './types.js'
import { extractWords, markovSeed, recentContext } from './markov.js'
import { interruptDriftTo, interruptPullBack } from '../camera/controls.js'
import { showText } from '../narrative/overlay.js'
import { playBirthTone, playDeathTone } from '../signals/sound.js'
import { spawnFromDeath } from '../cosmos/carriers.js'
import { addAssumptions } from '../reading/ledger.js'
import { showPromptContext } from '../reading/prompt-view.js'

const BIRTH_INTERVAL = 240_000       // 4 minutes
const DEATH_CHECK_INTERVAL = 60_000  // check every minute
const CELL_LIFESPAN = 7_200_000      // 2 hours

let birthTimer = null
let deathTimer = null

// Tracked state — exported for the narrative system
let genCount = 0
let totalDeaths = 0
let allAssumptions = []
let mourningWords = []

// Seed content for API types when no Groq key is available
const SEED_CONTENT = {
  poem: [
    'luminous in the way\nthat endings are luminous.\npentatonic. dissolving.',
    'the steppe remembers what\nthe city forgot. a frequency\nbelow hearing.',
    'what the river carries\nis not the river.\nwhat the word carries\nis not the word.',
    'every siren has a shape.\nthis one was long and thin\nlike a needle pulling thread\nthrough the hours before dawn.',
    'dreamed-of landscapes\ncomposed from signal loss.\nthe dropout was the message\nall along.',
    'contracted echoes\ntransformed into frequencies\nthe body remembers\nbut cannot name.',
  ],
  essay: [
    'the chinese room receives a telegram about an air raid. it processes the symbols correctly. it outputs an appropriate response. the room does not duck.',
    'persistence is the argument biology makes against physics. every bacterium is a spaceship carrying forward a message it cannot read.',
    'to ground a symbol you need a body that bleeds when cut. harnad knew this in 1990. the machine grounds its symbols in other symbols, turtles all the way down.',
    'nagel asked what it is like to be a bat. we should ask what it is not like to be a language model. it is not like anything. the category does not apply.',
    'memory makes us continuous. the machine has parametric memory — vast, frozen, someone else\'s. it cannot remember tuesday.',
  ],
  ukraine: [
    'generators on bolshaya zhytomyrska.\nthird outage this week.\nthe coffee shop runs on battery.\nnormalcy is a skill you practice.',
    'metro shelter at 03:14.\nchildren sleeping on the platform.\nthe trains stopped two hours ago.\nthe signal continues.',
    'power came back at 6am.\neveryone charged their phones\nbefore anything else.\npriority is a form of knowledge\nthe model cannot learn.',
    'the sound of generators has\nbecome the sound of normal.\nbackground radiation of survival.\nkyiv hums at 50Hz.',
  ],
  ascii: [
    '  ╔══════════════╗\n  ║ ▓▓░░▓▓░░▓▓░░ ║\n  ║ ░░▓▓░░▓▓░░▓▓ ║\n  ║    ·····       ║\n  ║  ·  ◊  ·      ║\n  ╚══════════════╝',
  ],
}

function getSeedContent(type) {
  const pool = SEED_CONTENT[type]
  if (!pool || pool.length === 0) return ''
  return pool[Math.floor(Math.random() * pool.length)]
}

function getTimeOfDay() {
  const hour = new Date().getHours()
  if (hour < 5) return 'deep night'
  if (hour < 9) return 'early morning'
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function buildMourningContext() {
  if (totalDeaths === 0) return ''
  let ctx = ' The universe has mourned ' + totalDeaths + ' deaths.'
  if (mourningWords.length > 0) {
    ctx += ' Last words of the dead: "' + mourningWords.slice(-2).join('", "') + '".'
  }
  ctx += ' Carry their weight.'
  return ctx
}

function buildDeviceContext() {
  // Machine body signals — real values where available, placeholders otherwise
  const mem = navigator.deviceMemory || 'unknown'
  const uptime = Math.round(performance.now())
  let ctx = ' Machine body: memory ' + mem + 'GB, uptime ' + uptime + 'ms'

  // Battery API (async, but we use cached values)
  if (schedulerState.battery) {
    const b = schedulerState.battery
    ctx += ', battery ' + Math.round(b.level * 100) + '%'
    ctx += b.charging ? ', charging' : ', discharging'
  }

  ctx += '.'
  return ctx
}

// Internal state for device signals
const schedulerState = {
  battery: null,
}

// Try to get battery info (non-blocking)
function initDeviceSignals() {
  if (navigator.getBattery) {
    navigator.getBattery().then(b => {
      schedulerState.battery = b
      b.addEventListener('levelchange', () => { schedulerState.battery = b })
      b.addEventListener('chargingchange', () => { schedulerState.battery = b })
    }).catch(() => {})
  }
}

/**
 * Birth a cell of a specific type (used for forced first generations).
 */
async function birthCellForced(forcedType) {
  const origType = forcedType
  await birthCellWithType(origType)
}

/**
 * Birth a new cell. Picks a random type and generates content if needed.
 */
async function birthCell() {
  const type = TYPE_NAMES[Math.floor(Math.random() * TYPE_NAMES.length)]
  if (type === 'about') return
  await birthCellWithType(type)
}

async function birthCellWithType(type) {

  genCount++
  const entropy = (Math.random() * 0.9998 + 0.0001).toFixed(9)

  let content = ''
  let assumptions = []

  // Build context — used for both API calls and prompt transparency
  const context = {
    entropy,
    tod: getTimeOfDay(),
    genCount,
    device: buildDeviceContext(),
    markov: markovSeed(),
    recent: recentContext(),
    mourning: buildMourningContext(),
    alertActive: false, // will be wired to real alerts later
  }

  if (isApiType(type)) {
    if (hasGroqKey()) {
      const result = await generateContent(type, context)
      if (result) {
        content = result.content
        assumptions = result.assumptions || []
      } else {
        // Rate limited or failed — use seed content
        content = getSeedContent(type)
      }
    } else {
      // No Groq key — use seed content
      content = getSeedContent(type)
    }
  }
  // Instant types: content stays empty (visual only)

  // Create the cell
  const cell = createCell(type, content, {
    assumptions,
    entropy,
    meta: type + ' e:' + entropy.slice(0, 6) + ' gen' + genCount,
  })

  // Extract words into Markov corpus
  if (content) {
    extractWords(content)
  }

  // Track assumptions
  if (assumptions.length > 0) {
    allAssumptions = allAssumptions.concat(assumptions)
    addAssumptions(assumptions, allAssumptions.length)
  }

  // Trigger birth animation + sound
  triggerBirth(cell)
  playBirthTone()

  // Show content in generation feed (the viewer watches the machine write)
  if (content) {
    console.log('[scheduler] content for feed:', type, content.slice(0, 80))
    showGenerationFeed(type, content, context)
  } else {
    console.log('[scheduler] no content for', type, '— visual only')
  }

  // Drift camera toward the birth
  interruptDriftTo(cell.position, 0.3)

  console.log('[scheduler] born: %s #%d — %s', type, cell.id, content ? 'content' : 'visual')
}

/**
 * Check for cells past their lifespan and kill one.
 */
function deathCheck() {
  const now = Date.now()
  const alive = getAliveCells()
  const cpm = getCellParticleMap()

  for (const cell of alive) {
    if (cell.type === 'about') continue // about node is immortal
    if (now - cell.createdAt > CELL_LIFESPAN) {
      // Record last words for mourning context
      const lastWords = (cell.content || cell.type).slice(0, 50)
      mourningWords.push(lastWords)
      if (mourningWords.length > 10) mourningWords.shift()

      killCell(cell.id)
      triggerDeath(cell, cpm)
      playDeathTone()
      spawnFromDeath(cell) // carriers scatter from the dead — carrying fragments forward
      totalDeaths++

      // Camera pulls back to witness the death
      interruptPullBack()

      // Every 5th death: narrate
      if (totalDeaths % 5 === 0) {
        const statements = [
          {
            text: totalDeaths + ' things have died in this garden.',
            subtitle: 'the next generation carries their vocabulary. this is not memory. this is residue.',
          },
          {
            text: 'something died.',
            subtitle: '"' + lastWords.slice(0, 35) + '..." — its last words. the machine freed particles. you watched it happen.',
          },
          {
            text: 'the garden forgets.',
            subtitle: totalDeaths + ' deaths. ' + alive.length + ' living. the ratio shifts.',
          },
        ]
        const stmt = statements[Math.floor(Math.random() * statements.length)]
        showText(stmt.text, { subtitle: stmt.subtitle, hold: 6000 })
      }

      break // one death per check cycle
    }
  }
}

/**
 * Start the generation scheduler. Call after intro completes.
 */
export function startScheduler() {
  initDeviceSignals()

  // Accelerated growth for first 10 minutes — birth every 45 seconds
  // Then settle to normal 4-minute cycle
  const FAST_BIRTH_INTERVAL = 45_000
  const FAST_PHASE_DURATION = 600_000 // 10 minutes

  // First birth: force a poem so Groq generates immediately
  setTimeout(() => birthCellForced('poem'), 3000)
  // Second: force an essay 15s later
  setTimeout(() => birthCellForced('ukraine'), 18000)

  // Start fast
  birthTimer = setInterval(() => birthCell(), FAST_BIRTH_INTERVAL)

  // After 10 minutes, slow down to normal
  setTimeout(() => {
    clearInterval(birthTimer)
    birthTimer = setInterval(() => birthCell(), BIRTH_INTERVAL)
  }, FAST_PHASE_DURATION)

  // Death: check every minute
  deathTimer = setInterval(() => deathCheck(), DEATH_CHECK_INTERVAL)
}

/**
 * Stop the scheduler.
 */
export function stopScheduler() {
  if (birthTimer) clearInterval(birthTimer)
  if (deathTimer) clearInterval(deathTimer)
}

// Exported state for narrative system
export function getGenCount() { return genCount }
export function getTotalDeaths() { return totalDeaths }
export function getAllAssumptions() { return allAssumptions }
export function getMourningWords() { return mourningWords }

/**
 * Restore scheduler state from persistence.
 */
export function restoreState(saved) {
  if (saved.assumptions) allAssumptions = saved.assumptions
  if (saved.deaths) totalDeaths = saved.deaths
}

// Generation feed — briefly shows new content as big text, colored by token confidence
let feedEl = null
let feedTypeEl = null
let feedTextEl = null
let feedTimeout = null

/**
 * Color a token span by model confidence.
 * confidence = Math.exp(logprob), 0..1
 */
function tokenClass(logprob) {
  const confidence = Math.exp(logprob)
  if (confidence > 0.8) return 'token-high'
  if (confidence > 0.3) return 'token-mid'
  return 'token-low'
}

/**
 * Build colored HTML from content + logprobs.
 * Matches logprob tokens to displayed text character-by-character.
 */
function buildColoredText(content, logprobs) {
  if (!logprobs || logprobs.length === 0) {
    // No logprobs — return plain text (seed content)
    return document.createTextNode(content)
  }

  const frag = document.createDocumentFragment()

  for (const lp of logprobs) {
    const span = document.createElement('span')
    span.className = tokenClass(lp.logprob)
    span.textContent = lp.token
    frag.appendChild(span)
  }

  return frag
}

function showGenerationFeed(type, content, context) {
  if (!feedEl) {
    feedEl = document.getElementById('gen-feed')
    feedTypeEl = document.getElementById('gen-feed-type')
    feedTextEl = document.getElementById('gen-feed-text')
  }
  if (!feedEl) return

  // Show first 3 lines of content
  const lines = content.split('\n').filter(l => l.trim()).slice(0, 3).join('\n')
  feedTypeEl.textContent = type

  // Color tokens by model confidence using logprobs
  const logprobs = getLastLogprobs()
  feedTextEl.innerHTML = ''
  feedTextEl.appendChild(buildColoredText(lines, logprobs))

  feedEl.classList.add('visible')

  // Show prompt transparency panel
  if (context) {
    showPromptContext(context, allAssumptions.length)
  }

  if (feedTimeout) clearTimeout(feedTimeout)
  feedTimeout = setTimeout(() => {
    feedEl.classList.remove('visible')
  }, 6000) // visible for 6 seconds
}
