// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { backLink } from '../setup/backLink'

function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  )
}

const cards = () => within(screen.getByRole('list', { name: 'Games' })).getAllByRole('link')
const names = () => cards().map((card) => card.querySelector('h3')?.textContent)
const pressed = () => within(screen.getByRole('group', { name: 'Category' })).getByRole('button', { pressed: true }).textContent

describe('Browse', () => {
  beforeEach(() => localStorage.clear())

  it('lists every variant at /games, with a filter of the categories they use', () => {
    renderAt('/games')
    expect(screen.getByRole('heading', { level: 1, name: 'Browse games' })).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Category' })).getAllByRole('button').map((button) => button.textContent)).toEqual([
      'All',
      'Party',
      'Learning',
      'Trivia',
      'Words',
      'Back to School',
      'French',
      'Naija',
    ])
    expect(pressed()).toBe('All')
    expect(names()).toEqual([
      'Naija Charades (Back to School Edition)',
      'Name Ten (Back to School Edition)',
      'Back to School Trivia',
      'Masculin ou féminin ?',
      'French Flash Cards',
      'French Match-Up',
      "L'intrus",
    ])
    expect(cards()[0].getAttribute('href')).toBe('/charades/naija-back-to-school')
    expect(cards()[0].textContent).toContain('Charades · 2–20 players')
  })

  it('filters by category, and a setup’s back link returns to the same filter', async () => {
    const user = userEvent.setup()
    renderAt('/games')
    await user.click(screen.getByRole('button', { name: 'Back to School' }))
    expect(pressed()).toBe('Back to School')
    expect(names()).toEqual(['Naija Charades (Back to School Edition)', 'Name Ten (Back to School Edition)', 'Back to School Trivia'])

    await user.click(screen.getByRole('link', { name: /Back to School Trivia/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Back to School Trivia' })).toBeDefined()
    const back = screen.getByRole('link', { name: 'Games' })
    expect(back.getAttribute('href')).toBe('/games?category=school')
    await user.click(back)
    expect(pressed()).toBe('Back to School')
    expect(names()).toHaveLength(3)

    await user.click(screen.getByRole('button', { name: 'All' }))
    expect(names()).toHaveLength(7)
  })

  it('shows every game for a category it doesn’t offer', () => {
    renderAt('/games?category=chess')
    expect(pressed()).toBe('All')
    expect(names()).toHaveLength(7)
  })

  it('sends a setup opened by its address back to Browse for a variant, Custom game for a game, unless the card said where', () => {
    expect(backLink(undefined, true)).toEqual({ to: '/games', label: 'Games' })
    expect(backLink(null, false)).toEqual({ to: '/custom', label: 'Custom game' })
    expect(backLink({ fromSetup: true }, false)).toEqual({ to: '/custom', label: 'Custom game' })
    expect(backLink({ back: { to: 'https://example.com', label: 'Away' } }, true)).toEqual({ to: '/games', label: 'Games' })
    expect(backLink({ back: { to: '/', label: 'Home' } }, true)).toEqual({ to: '/', label: 'Home' })
  })
})
