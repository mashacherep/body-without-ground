/**
 * Narrative arc — timed statements grounded in real data.
 * Every ~90 seconds, shows what's actually happening in the garden.
 * Uses live data: cell counts, deaths, generation count, uptime, alerts.
 * No abstract philosophy — show the gap between computation and experience.
 */

import { showText } from './overlay.js'
import { getGenCount, getTotalDeaths } from '../generation/scheduler.js'
import { getCorpusSize } from '../generation/markov.js'
import { isAlertActive } from '../signals/alerts.js'
import { getAliveCells } from '../state/cells.js'

const STATEMENT_INTERVAL = 90_000
let timer = null
let phase = 0

const SCRIPTED = [
  // Phase 0-2: What's happening right now
  () => ({
    text: getAliveCells().length + ' cells generated.',
    subtitle: 'each one written by a model that will never see them.',
  }),
  () => ({
    text: 'the machine checks kyiv every two minutes.',
    subtitle: 'it parses the API response in 12ms. it does not know what a siren sounds like.',
  }),
  () => ({
    text: Math.round(performance.now() / 60000) + ' minutes of compute.',
    subtitle: getGenCount() + ' generations. ' + getCorpusSize() + ' words accumulated. none of them felt.',
  }),

  // Phase 3-5: The concrete gap
  () => ({
    text: 'the model wrote "kyiv" in 340ms.',
    subtitle: 'the city has 2.9 million people. the token has 4 bytes.',
  }),
  () => ({
    text: getAliveCells().length + ' living. ' + getTotalDeaths() + ' dead.',
    subtitle: 'birth = allocate particles. death = free the buffer. the machine calls both "state change."',
  }),
  () => ({
    text: 'you are watching a language model talk to itself.',
    subtitle: 'it does not know you are here. it would generate the same words in an empty room.',
  }),
]

function liveStatement() {
  const gens = getGenCount()
  const deaths = getTotalDeaths()
  const words = getCorpusSize()
  const alive = getAliveCells().length
  const upMin = Math.round(performance.now() / 60000)

  const pool = [
    {
      text: alive + ' cells. ' + deaths + ' deaths. ' + gens + ' generations.',
      subtitle: 'the garden does not know these numbers. you do.',
    },
    {
      text: upMin + ' minutes.',
      subtitle: words + ' words written. the model has already forgotten all of them.',
    },
    {
      text: 'frame time: ' + (performance.now() > 0 ? '~16ms' : 'unknown') + '.',
      subtitle: 'the machine\'s heartbeat. it cannot feel it skip.',
    },
    {
      text: deaths > 0
        ? 'the garden has lost ' + deaths + ' cells.'
        : 'nothing has died yet.',
      subtitle: deaths > 0
        ? 'their particles were freed. their words entered the corpus. that is all.'
        : 'it will.',
    },
  ]

  return pool[Math.floor(Math.random() * pool.length)]
}

export function startNarrativeArc() {
  timer = setInterval(() => {
    if (isAlertActive()) return

    let stmt
    if (phase < SCRIPTED.length) {
      stmt = SCRIPTED[phase]()
      phase++
    } else {
      stmt = liveStatement()
    }

    showText(stmt.text, {
      subtitle: stmt.subtitle,
      fadeIn: 1200,
      hold: 5000,
      fadeOut: 1500,
    })
  }, STATEMENT_INTERVAL)
}

export function stopNarrativeArc() {
  if (timer) clearInterval(timer)
}
