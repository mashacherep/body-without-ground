/**
 * Reusable cinematic text overlay.
 * Renders heading + optional subtitle over the WebGL canvas.
 */

let headingEl = null
let subtitleEl = null
let currentTimeout = null

function ensureElements() {
  if (!headingEl) headingEl = document.getElementById('narrative-heading')
  if (!subtitleEl) subtitleEl = document.getElementById('narrative-subtitle')
}

export function showText(heading, opts = {}) {
  ensureElements()
  const { subtitle = '', fadeIn = 800, hold = 2000, fadeOut = 800 } = opts

  if (currentTimeout) {
    clearTimeout(currentTimeout)
    currentTimeout = null
  }

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
