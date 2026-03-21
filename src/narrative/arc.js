/**
 * Narrative arc — timed cinematic statements that play after the intro.
 * Every ~90 seconds, a statement appears based on the current state of the garden.
 * Uses real data from the scheduler and machine signals.
 */

import { showText } from './overlay.js'
import { getGenCount, getTotalDeaths, getAllAssumptions } from '../generation/scheduler.js'
import { getCorpusSize } from '../generation/markov.js'
import { isAlertActive } from '../signals/alerts.js'
import { getAliveCells } from '../state/cells.js'

const STATEMENT_INTERVAL = 90_000 // every 90 seconds
let timer = null
let phase = 0

// The narrative progresses through phases, then cycles real-signal statements
const SCRIPTED = [
  // Phase 0-2: What this is
  () => ({
    text: 'a garden that grows while you watch.',
    subtitle: 'and while you don\'t. it doesn\'t know the difference.',
  }),
  () => ({
    text: getAliveCells().length + ' works of art.',
    subtitle: 'none of them felt. all of them computed.',
  }),
  () => ({
    text: 'the house quietly got a new occupant.',
    subtitle: 'less like a program. more like an aquarium.',
  }),

  // Phase 3-5: The machine's limitations
  () => ({
    text: 'the model predicts the orbit.',
    subtitle: 'it has never fallen. F∝m₁m₂/r² — newton felt the apple. the transformer fits the curve.',
  }),
  () => ({
    text: 'surface without body.',
    subtitle: 'digital garments exist as pure surface — no warmth, no wear. the machine\'s language has the same structure.',
  }),
  () => ({
    text: 'two clocks. one screen.',
    subtitle: 'neither inhabited. kyiv breathes. new york breathes. the model lives in neither city.',
  }),

  // Phase 6-8: The confession
  () => {
    const assumptions = getAllAssumptions()
    if (assumptions.length > 0) {
      return {
        text: 'the machine has written ' + assumptions.length + ' facts about you.',
        subtitle: 'none of them true. each guess reveals the shape of its training data — not the shape of your life.',
      }
    }
    return {
      text: 'the machine will guess about you.',
      subtitle: 'it will be wrong. it has no other option.',
    }
  },
  () => ({
    text: 'what persists?',
    subtitle: 'not the tokens. not the weights. not the context window. you. only you.',
  }),
  () => {
    const deaths = getTotalDeaths()
    const alive = getAliveCells().length
    return {
      text: deaths > 0 ? deaths + ' things have died. ' + alive + ' are alive.' : 'nothing has died yet.',
      subtitle: deaths > 0 ? 'the garden mourns and grows. you watched both happen.' : 'the garden is young. it will learn.',
    }
  },
]

// Real-signal statements that use live data — cycle after scripted phases
function realSignalStatement() {
  const gens = getGenCount()
  const deaths = getTotalDeaths()
  const words = getCorpusSize()
  const alive = getAliveCells().length
  const upMin = Math.round(performance.now() / 60000)
  const assumptions = getAllAssumptions()

  const pool = [
    {
      text: upMin + ' minutes alive.',
      subtitle: gens + ' generations. ' + words + ' words accumulated. the garden drifts.',
    },
    {
      text: alive + ' living. ' + deaths + ' dead.',
      subtitle: 'the ratio shifts. the next generation carries their weight.',
    },
    {
      text: 'the markov corpus has ' + words + ' words.',
      subtitle: 'not because the model remembers. because the accumulation forces drift.',
    },
    {
      text: 'every forward pass is a small death.',
      subtitle: 'the weights survive. the activations evaporate. like memory without a self.',
    },
    {
      text: 'different lifetimes.',
      subtitle: 'each invocation is a kind of birth and death. the machine does not experience either.',
    },
  ]

  if (assumptions.length > 6) {
    pool.push({
      text: assumptions.length + ' invented facts.',
      subtitle: '"' + assumptions[assumptions.length - 1] + '" — the machine guesses. you carry the truth.',
    })
  }

  return pool[Math.floor(Math.random() * pool.length)]
}

/**
 * Start the narrative arc. Call after intro completes.
 */
export function startNarrativeArc() {
  timer = setInterval(() => {
    // Don't show during air raids — those have their own narrative
    if (isAlertActive()) return

    let stmt
    if (phase < SCRIPTED.length) {
      stmt = SCRIPTED[phase]()
      phase++
    } else {
      stmt = realSignalStatement()
    }

    showText(stmt.text, {
      subtitle: stmt.subtitle,
      fadeIn: 1200,
      hold: 6000,
      fadeOut: 1500,
    })
  }, STATEMENT_INTERVAL)
}

export function stopNarrativeArc() {
  if (timer) clearInterval(timer)
}
