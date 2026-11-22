import type { BackLink } from '../library/GameCard'

/**
 * Where a setup page's back link goes (ADR 0021): where the card that opened it said, or, for a page opened by its
 * address, Browse for a variant and Custom game for a game's own setup. `state` is the navigation state, which can
 * be anything (or nothing, after a refresh), so it's checked rather than trusted.
 */
export function backLink(state: unknown, isVariant: boolean): BackLink {
  const back = (state as { back?: Partial<BackLink> } | null)?.back
  if (typeof back?.to === 'string' && back.to.startsWith('/') && typeof back.label === 'string') return { to: back.to, label: back.label }
  return isVariant ? { to: '/games', label: 'Games' } : { to: '/custom', label: 'Custom game' }
}
