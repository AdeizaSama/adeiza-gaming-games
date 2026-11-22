// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { featured, featuredIds } from './library/featured'
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

/** Custom game's list: each game, opening its own setup. */
const makeYourOwn = () => within(screen.getByRole('list', { name: 'Games' }))

describe('App', () => {
  it('shows two featured variants at /, then Browse games and Custom game', async () => {
    const user = userEvent.setup()
    renderAt('/')
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
    const featured = within(screen.getByRole('list', { name: 'Featured' })).getAllByRole('link')
    expect(featured.map((link) => [link.querySelector('h3')?.textContent, link.getAttribute('href')])).toEqual([
      ['Naija Charades (Back to School Edition)', '/charades/naija-back-to-school'],
      ['Back to School Trivia', '/trivia-night/back-to-school'],
    ])
    expect(featured[0].textContent).toContain('Charades · 2–20 players')
    const more = within(screen.getByRole('navigation', { name: 'More games' })).getAllByRole('link')
    expect(more.map((link) => link.getAttribute('href'))).toEqual(['/games', '/custom'])

    await user.click(featured[1])
    expect(screen.getByRole('heading', { level: 1, name: 'Back to School Trivia' })).toBeDefined()
    await user.click(screen.getByRole('link', { name: 'Home' })) // a featured game goes back home, not to Browse
    await user.click(screen.getByRole('link', { name: /Browse games/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Browse games' })).toBeDefined()
  })

  it('opens a variant’s setup: Masculin ou féminin ? asks for teams, rounds, turn length and words a turn, nothing else', async () => {
    const user = userEvent.setup()
    renderAt('/games')
    await user.click(screen.getByRole('link', { name: /Masculin ou féminin/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Masculin ou féminin ?' })).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Questions per turn' })).getByText('10')).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('60 seconds')).toBeDefined()
    expect(screen.queryByRole('radio')).toBeNull() // no mode, no option order
    expect(screen.queryByRole('heading', { name: 'Packs' })).toBeNull()
    expect(screen.getByText('282 items to play')).toBeDefined()
  })

  it('shows a game at its own address, from Custom game', async () => {
    const user = userEvent.setup()
    renderAt('/custom')
    const charades = makeYourOwn().getByRole('link', { name: /Charades/ })
    expect(charades.getAttribute('href')).toBe('/charades')
    expect(charades.textContent).toContain('2–20 players')

    await user.click(charades)
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
    expect(screen.getByRole('button', { name: 'Start' })).toBeDefined()
  })

  it('lists Name Ten too, with its own icon, players and setup', async () => {
    const user = userEvent.setup()
    renderAt('/custom')
    const nameTen = makeYourOwn().getByRole('link', { name: /Name Ten/ })
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
    renderAt('/custom')
    const trivia = makeYourOwn().getByRole('link', { name: /Trivia Night/ })
    expect(trivia.getAttribute('href')).toBe('/trivia-night')
    expect(trivia.querySelector('.lucide-lightbulb')).not.toBeNull()

    await user.click(trivia)
    expect(screen.getByRole('heading', { level: 1, name: 'Trivia Night' })).toBeDefined()
    expect(screen.getByRole('radio', { name: /Against the clock/ })).toBeDefined()
    expect(screen.getByRole('group', { name: 'Questions per turn' })).toBeDefined()
    expect(within(screen.getByRole('group', { name: 'Turn length' })).getByText('30 seconds')).toBeDefined()
    expect(screen.getByText('430 items to play')).toBeDefined() // every pack, Masculin ou féminin ? included
  })

  it.each(['/chess', '/charades/nope', '/charades/nope/extra'])('says "Page not found" at %s, with a way back', async (address) => {
    const user = userEvent.setup()
    renderAt(address)

    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeDefined()
    await user.click(screen.getByRole('link', { name: 'Back to games' }))
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
  })

  it('starts each new page at the top, but leaves the first page and going back alone', async () => {
    const user = userEvent.setup()
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    renderAt('/')
    expect(scrollTo).not.toHaveBeenCalled()
    await user.click(screen.getByRole('link', { name: /Browse games/ }))
    expect(scrollTo).toHaveBeenCalledWith(0, 0)
    scrollTo.mockRestore()
  })

  it('features two variants that exist', () => {
    expect(featuredIds).toHaveLength(2)
    expect(featured.map(({ game, variant }) => ({ game: game.meta.id, variant: variant.id }))).toEqual(featuredIds)
  })

  it('has an icon for every game in the registry', () => {
    for (const { meta } of games) expect(Object.keys(gameIcons), meta.id).toContain(meta.icon)
  })
})
