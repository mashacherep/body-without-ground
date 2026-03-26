/**
 * Seed content — fallback text for API types when no Groq key is available
 * or when rate-limited. Shared by scheduler and whisper panel.
 */

export const SEED_CONTENT = {
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

export function getSeedContent(type) {
  const pool = SEED_CONTENT[type]
  if (!pool || pool.length === 0) return ''
  return pool[Math.floor(Math.random() * pool.length)]
}
