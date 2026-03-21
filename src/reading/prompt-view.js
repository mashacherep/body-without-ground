/**
 * Prompt transparency panel — shows what went into the generation.
 * Appears below #gen-feed-text in #gen-feed-prompt.
 * Monospace, tiny, dim amber — raw machine context made visible.
 */

let promptEl = null

/**
 * Show the prompt context that shaped a generation.
 * @param {object} ctx — the context object passed to Groq
 * @param {number} totalAssumptions — running count of all assumptions
 */
export function showPromptContext(ctx, totalAssumptions) {
  if (!promptEl) {
    promptEl = document.getElementById('gen-feed-prompt')
  }
  if (!promptEl) return

  const lines = []

  // Machine signals
  if (ctx.device) {
    // Parse battery, uptime from the device string
    const batteryMatch = ctx.device.match(/battery (\d+)%/)
    const uptimeMatch = ctx.device.match(/uptime (\d+)ms/)
    const memMatch = ctx.device.match(/memory (\S+)GB/)

    const parts = []
    if (batteryMatch) parts.push('battery ' + batteryMatch[1] + '%')
    if (uptimeMatch) {
      const mins = Math.round(parseInt(uptimeMatch[1]) / 60000)
      parts.push('uptime ' + mins + 'm')
    }
    if (memMatch) parts.push('mem ' + memMatch[1] + 'GB')
    if (parts.length) lines.push('machine: ' + parts.join(' / '))
  }

  // Time of day
  if (ctx.tod) {
    lines.push('time: ' + ctx.tod)
  }

  // Markov seeds
  if (ctx.markov && ctx.markov.trim()) {
    const seeds = ctx.markov.trim().slice(0, 60)
    lines.push('markov seeds: ' + seeds)
  }

  // Mourning context — deaths
  if (ctx.mourning && ctx.mourning.trim()) {
    const deathMatch = ctx.mourning.match(/mourned (\d+) deaths/)
    if (deathMatch) {
      lines.push('deaths informing this: ' + deathMatch[1])
    }
  }

  // Assumptions count
  lines.push('assumptions so far: ' + totalAssumptions)

  // Entropy
  if (ctx.entropy) {
    lines.push('entropy: ' + ctx.entropy)
  }

  promptEl.textContent = lines.join('  \u00b7  ')
}
