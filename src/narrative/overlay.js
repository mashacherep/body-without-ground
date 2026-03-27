/**
 * Text overlay with priority system.
 * Only one center-area text layer visible at a time.
 * Priority: narrative > generation > whisper (whisper is corner, not center).
 *
 * Cross-system coordination: higher-priority layers dismiss lower ones.
 */

let headingEl = null
let subtitleEl = null
let currentTimeout = null

// Priority tracking
let activeLayer = 'none' // 'none' | 'narrative' | 'generation'

// Cross-system coordination
let _dismissGenFeed = null
let _dismissWhisper = null
export function registerGenFeedDismiss(fn) { _dismissGenFeed = fn }
export function registerWhisperDismiss(fn) { _dismissWhisper = fn }

function ensureElements() {
  if (!headingEl) headingEl = document.getElementById('narrative-heading')
  if (!subtitleEl) subtitleEl = document.getElementById('narrative-subtitle')
}

export function isOverlayVisible() {
  ensureElements()
  return headingEl && headingEl.classList.contains('visible')
}

export function getActiveLayer() { return activeLayer }

/**
 * Check if a layer can show based on priority.
 * @param {'narrative'|'generation'} layer
 * @returns {boolean}
 */
export function canShow(layer) {
  if (activeLayer === 'none') return true
  if (layer === 'narrative') return true // narrative always wins
  if (layer === 'generation' && activeLayer !== 'narrative') return true
  return false
}

export function showText(heading, opts = {}) {
  ensureElements()
  const { subtitle = '', fadeIn = 800, hold = 2000, fadeOut = 800, layer = 'narrative' } = opts

  // Priority check — narrative always wins, generation only if narrative isn't active
  if (!canShow(layer)) return Promise.resolve()

  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }

  activeLayer = layer

  // Dismiss lower-priority layers
  if (_dismissGenFeed && layer === 'narrative') _dismissGenFeed()
  if (_dismissWhisper) _dismissWhisper()

  return new Promise((resolve) => {
    headingEl.textContent = heading
    subtitleEl.textContent = subtitle

    headingEl.style.transition = `opacity ${fadeIn}ms ease-in-out`
    subtitleEl.style.transition = `opacity ${fadeIn}ms ease-in-out`

    headingEl.classList.add('visible')
    if (subtitle) subtitleEl.classList.add('visible')

    currentTimeout = setTimeout(() => {
      headingEl.style.transition = `opacity ${fadeOut}ms ease-in-out`
      subtitleEl.style.transition = `opacity ${fadeOut}ms ease-in-out`
      headingEl.classList.remove('visible')
      subtitleEl.classList.remove('visible')

      currentTimeout = setTimeout(() => {
        headingEl.textContent = ''
        subtitleEl.textContent = ''
        currentTimeout = null
        activeLayer = 'none'
        resolve()
      }, fadeOut)
    }, fadeIn + hold)
  })
}

export function clearOverlay() {
  ensureElements()
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  headingEl.classList.remove('visible')
  subtitleEl.classList.remove('visible')
  headingEl.textContent = ''
  subtitleEl.textContent = ''
  activeLayer = 'none'
}

export async function showSequence(beats) {
  for (const beat of beats) {
    await showText(beat.text, {
      subtitle: beat.subtitle,
      fadeIn: beat.fadeIn,
      hold: beat.hold,
      fadeOut: beat.fadeOut,
    })
    if (beat.pause) {
      await new Promise(r => setTimeout(r, beat.pause))
    }
  }
}
