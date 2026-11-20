// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import App from './App'
import { gameIcons } from './library/gameIcon'
import { games } from './registry'

/** The app at an address. MemoryRouter keeps the address in memory instead of the browser's address bar. */
function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('shows the library at /, and a game opens at its own address', async () => {
    const user = userEvent.setup()
    renderAt('/')

    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
    const charades = screen.getByRole('link', { name: /Charades/ })
    expect(charades.getAttribute('href')).toBe('/charades')
    expect(charades.textContent).toContain('2–20 players')

    await user.click(charades)
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
  })

  it('lists Name Ten too, with its own icon, players and setup', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const nameTen = screen.getByRole('link', { name: /Name Ten/ })
    expect(nameTen.getAttribute('href')).toBe('/name-ten')
    expect(nameTen.textContent).toContain('Name ten before the clock runs out.')
    expect(nameTen.querySelector('.lucide-list-checks')).not.toBeNull()

    await user.click(nameTen)
    expect(screen.getByRole('heading', { level: 1, name: 'Name Ten' })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Answers on the board' })).toBeDefined()
    expect(screen.getByText('38 items to play')).toBeDefined()
  })

  it('lists Trivia Night too, with its own icon and setup', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const trivia = screen.getByRole('link', { name: /Trivia Night/ })
    expect(trivia.getAttribute('href')).toBe('/trivia-night')
    expect(trivia.querySelector('.lucide-lightbulb')).not.toBeNull()

    await user.click(trivia)
    expect(screen.getByRole('heading', { level: 1, name: 'Trivia Night' })).toBeDefined()
    expect(screen.getByRole('radio', { name: /Against the clock/ })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Questions per turn' })).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('30 seconds')).toBeDefined()
    expect(screen.getByText('148 items to play')).toBeDefined()
  })

  it('lists This or That too, with its own icon, defaults and pack', async () => {
    const user = userEvent.setup()
    renderAt('/')
    const game = screen.getByRole('link', { name: /This or That/ })
    expect(game.getAttribute('href')).toBe('/this-or-that')
    expect(game.querySelector('.lucide-arrow-left-right')).not.toBeNull()

    await user.click(game)
    expect(screen.getByRole('heading', { level: 1, name: 'This or That' })).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Questions per turn' })).getByText('10')).toBeDefined()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /A to Z/ }).checked).toBe(true)
    expect(screen.getByText('282 items to play')).toBeDefined()
  })

  it.each(['/chess', '/charades/nope', '/charades/nope/extra'])('says "Page not found" at %s, with a way back', async (address) => {
    const user = userEvent.setup()
    renderAt(address)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeDefined()
    await user.click(screen.getByRole('link', { name: 'Back to games' }))
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
  })

  it('has an icon for every game in the registry', () => {
    for (const { meta } of games) expect(Object.keys(gameIcons), meta.id).toContain(meta.icon)
  })
})
