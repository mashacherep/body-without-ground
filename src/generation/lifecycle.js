/**
 * Cosmos life cycle — cells are born and die on their own.
 * This runs independently of Groq generation (Phase 4 will add AI-generated content).
 * For now, new cells are born with placeholder content and die after ~2 hours.
 */

import { createCell, getAliveCells, killCell } from '../state/cells.js'
import { addCellParticles, getCellParticleMap } from '../cosmos/particles.js'
import { triggerBirth } from '../cosmos/birth.js'
import { triggerDeath } from '../cosmos/death.js'
import { TYPE_NAMES } from './types.js'
import { showText } from '../narrative/overlay.js'
import { interruptDriftTo, interruptPullBack } from '../camera/controls.js'
import { playBirthTone, playDeathTone } from '../signals/sound.js'

const BIRTH_INTERVAL = 240_000    // 4 minutes — a new cell is born
const DEATH_CHECK_INTERVAL = 60_000 // check for deaths every minute
const CELL_LIFESPAN = 7_200_000   // 2 hours — then the cell dies

let birthTimer = null
let deathTimer = null
let totalDeaths = 0

/**
 * Start the life cycle. Call after intro completes.
 */
export function startLifeCycle() {
  // Birth: every 4 minutes, a new cell ignites
  birthTimer = setInterval(() => {
    const type = TYPE_NAMES[Math.floor(Math.random() * TYPE_NAMES.length)]
    if (type === 'about') return // about node doesn't replicate

    const cell = createCell(type)
    triggerBirth(cell)
    playBirthTone()

    // Drift camera toward the birth
    interruptDriftTo(cell.position, 0.3)
  }, BIRTH_INTERVAL)

  // Death: check for cells past their lifespan
  deathTimer = setInterval(() => {
    const now = Date.now()
    const alive = getAliveCells()
    const cpm = getCellParticleMap()

    for (const cell of alive) {
      if (cell.type === 'about') continue // about node is immortal
      if (now - cell.createdAt > CELL_LIFESPAN) {
        killCell(cell.id)
        triggerDeath(cell, cpm)
        playDeathTone()
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
              subtitle: 'the machine freed particles. you watched it happen. these are not the same event.',
            },
            {
              text: 'the garden forgets.',
              subtitle: totalDeaths + ' deaths. ' + alive.length + ' living. the ratio shifts.',
            },
          ]
          const stmt = statements[Math.floor(Math.random() * statements.length)]
          showText(stmt.text, { subtitle: stmt.subtitle, hold: 6000 })
        }

        break // one death per check cycle — don't mass-kill
      }
    }
  }, DEATH_CHECK_INTERVAL)
}

/**
 * Stop the life cycle.
 */
export function stopLifeCycle() {
  if (birthTimer) clearInterval(birthTimer)
  if (deathTimer) clearInterval(deathTimer)
}

export function getTotalDeaths() { return totalDeaths }
