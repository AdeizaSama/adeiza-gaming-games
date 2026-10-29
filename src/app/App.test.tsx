// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
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

  it.each(['/chess', '/charades/nope/extra'])('says "Page not found" at %s, with a way back', async (address) => {
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
