/**
 * Finds mistakes in a machine that TypeScript can't catch. Returns a list of problems; empty means none found.
 * Meant for tests, so mistakes are caught in CI and never reach players:
 *
 *   expect(validateMachine(machine)).toEqual([])
 *
 * Checks for: a transition that can never run because an earlier transition in the same list has no `when`
 * (a transition without `when` always matches, and the first match wins).
 */
export function validateMachine(machine: {
  phases: Record<string, { on?: Record<string, unknown> }>
}): string[] {
  const problems: string[] = []

  for (const [phaseName, phase] of Object.entries(machine.phases)) {
    for (const [eventType, found] of Object.entries(phase.on ?? {})) {
      if (!Array.isArray(found)) continue

      const transitions = found as readonly { when?: string }[]
      const fallback = transitions.findIndex((transition) => transition.when === undefined)
      if (fallback === -1) continue

      transitions.slice(fallback + 1).forEach((transition, offset) => {
        const position = fallback + 2 + offset // 1-based, as a reader counts them
        const label = transition.when === undefined ? 'with no `when`' : `(when "${transition.when}")`
        problems.push(
          `Phase "${phaseName}", event "${eventType}": transition ${position} ${label} can never run, ` +
            `because transition ${fallback + 1} has no \`when\` and always matches. Move the transition without \`when\` last.`,
        )
      })
    }
  }

  return problems
}
