// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'

describe('Custom game', () => {
  beforeEach(() => localStorage.clear())

  it('lists every game at /custom, each opening its own setup, which leads back here', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/custom']}>
        <App />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Custom game' })).toBeDefined()
    const cards = within(screen.getByRole('list', { name: 'Games' })).getAllByRole('link')
    expect(cards.map((card) => [card.querySelector('h3')?.textContent, card.getAttribute('href')])).toEqual([
      ['Charades', '/charades'],
      ['Name Ten', '/name-ten'],
      ['Trivia Night', '/trivia-night'],
      ['Pairs', '/pairs'],
    ])
    expect(cards[1].textContent).toContain('2–20 players')

    await user.click(cards[0])
    expect(screen.getByRole('heading', { level: 1, name: 'Charades' })).toBeDefined()
    await user.click(screen.getByRole('link', { name: 'Custom game' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Custom game' })).toBeDefined()
    await user.click(screen.getByRole('link', { name: 'Home' }))
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
  })
})
