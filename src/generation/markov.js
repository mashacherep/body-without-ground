/**
 * Markov corpus accumulator — collects words from generated content
 * and provides recurring seed words for prompts.
 */

let worldWords = []
let worldRecent = []

/**
 * Extract words from text and add to the corpus.
 * Keeps Cyrillic (Ukrainian) and Latin characters.
 */
export function extractWords(text) {
  if (!text || typeof text !== 'string') return
  const words = text
    .toLowerCase()
    .replace(/[^a-zа-яіїєґ\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 3)
  worldWords = worldWords.concat(words.slice(0, 12))
  if (worldWords.length > 400) worldWords = worldWords.slice(-400)
  worldRecent.push(text.slice(0, 90))
  if (worldRecent.length > 8) worldRecent.shift()
}

/**
 * Return the top 8 recurring words as a prompt seed string.
 */
export function markovSeed() {
  if (worldWords.length < 5) return ''
  const freq = {}
  worldWords.forEach(w => { freq[w] = (freq[w] || 0) + 1 })
  const top = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(e => e[0])
  return ' Universe recurring words: ' + top.join(', ') + '.'
}

/**
 * Return the last recent fragment for context.
 */
export function recentContext() {
  return worldRecent.length
    ? ' Recent fragment: "' + worldRecent.slice(-1)[0].slice(0, 60) + '".'
    : ''
}

/**
 * Return total word count in corpus.
 */
export function getCorpusSize() {
  return worldWords.length
}

/**
 * Return the full word array.
 */
export function getCorpus() {
  return worldWords
}
