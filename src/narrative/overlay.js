/**
 * Reusable cinematic text overlay.
 * Renders heading + optional subtitle over the WebGL canvas.
 * Used by intro, death narration, air raid narration, narrative arc.
 */

const headingEl = document.getElementById('narrative-heading')
const subtitleEl = document.getElementById('narrative-subtitle')

let currentTimeout = null

/**
 * Show text on the overlay.
 * @param {string} heading   — main text line
 * @param {object} opts
 * @param {string}  [opts.subtitle]   — smaller text below heading
 * @param {number}  [opts.fadeIn=800]  — ms for fade-in (matches CSS transition)
 * @param {number}  [opts.hold=2000]   — ms to hold at full opacity
 * @param {number}  [opts.fadeOut=800]  — ms for fade-out
 * @returns {Promise} resolves when the full show+hold+hide cycle completes
 */
export function showText(heading, opts = {}) {
  const { subtitle = '', fadeIn = 800, hold = 2000, fadeOut = 800 } = opts

  // Cancel any pending cycle
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }

  return new Promise((resolve) => {
    // Set content
    headingEl.textContent = heading
    subtitleEl.textContent = subtitle

    // Ensure fade-in/out durations match the CSS transition
    headingEl.style.transition = `opacity ${fadeIn}ms ease-in-out`
    subtitleEl.style.transition = `opacity ${fadeIn}ms ease-in-out`

    // Trigger fade-in
    headingEl.classList.add('visible')
    if (subtitle) subtitleEl.classList.add('visible')

    // After fade-in + hold, fade out
    currentTimeout = setTimeout(() => {
      headingEl.style.transition = `opacity ${fadeOut}ms ease-in-out`
      subtitleEl.style.transition = `opacity ${fadeOut}ms ease-in-out`
      headingEl.classList.remove('visible')
      subtitleEl.classList.remove('visible')

      // Resolve after fade-out completes
      currentTimeout = setTimeout(() => {
        headingEl.textContent = ''
        subtitleEl.textContent = ''
        currentTimeout = null
        resolve()
      }, fadeOut)
    }, fadeIn + hold)
  })
}

/**
 * Immediately clear the overlay (no animation).
 */
export function clearOverlay() {
  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }
  headingEl.classList.remove('visible')
  subtitleEl.classList.remove('visible')
  headingEl.textContent = ''
  subtitleEl.textContent = ''
}

/**
 * Show a sequence of text beats. Each beat plays after the previous completes.
 * @param {Array<{text: string, subtitle?: string, fadeIn?: number, hold?: number, fadeOut?: number, pause?: number}>} beats
 * @returns {Promise} resolves when all beats have finished
 */
export async function showSequence(beats) {
  for (const beat of beats) {
    await showText(beat.text, {
      subtitle: beat.subtitle,
      fadeIn: beat.fadeIn,
      hold: beat.hold,
      fadeOut: beat.fadeOut,
    })
    // Optional pause between beats (silence gap)
    if (beat.pause) {
      await new Promise(r => setTimeout(r, beat.pause))
    }
  }
}
