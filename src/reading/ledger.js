/**
 * Assumptions ledger — persistent scrollable log of invented facts.
 * Bottom-right, above vitals. Shows last 5 assumptions with fade-in.
 * Count line: "12 invented facts. none true."
 */

let ledgerEl = null
const MAX_VISIBLE = 5

/**
 * Initialize the ledger panel. Call once from main.js.
 */
export function initLedger() {
  ledgerEl = document.getElementById('assumptions-ledger')
}

/**
 * Add new assumptions to the ledger and update display.
 * @param {string[]} newAssumptions — the new assumptions from this generation
 * @param {number} totalCount — total assumptions across all generations
 */
export function addAssumptions(newAssumptions, totalCount) {
  if (!ledgerEl) {
    ledgerEl = document.getElementById('assumptions-ledger')
  }
  if (!ledgerEl) return

  // Rebuild the ledger content
  ledgerEl.innerHTML = ''

  // Count line
  const countDiv = document.createElement('div')
  countDiv.className = 'ledger-count'
  countDiv.textContent = totalCount + ' invented facts. none true.'
  ledgerEl.appendChild(countDiv)

  // Show last MAX_VISIBLE assumptions (most recent at bottom)
  // We need to gather from the DOM or keep an internal buffer
  if (!ledgerEl._buffer) ledgerEl._buffer = []
  for (const a of newAssumptions) {
    ledgerEl._buffer.push(a)
  }

  const visible = ledgerEl._buffer.slice(-MAX_VISIBLE)
  for (const text of visible) {
    const item = document.createElement('div')
    item.className = 'ledger-item'
    item.textContent = '"' + text + '"'
    ledgerEl.appendChild(item)

    // Trigger fade-in on next frame
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        item.classList.add('visible')
      })
    })
  }
}
