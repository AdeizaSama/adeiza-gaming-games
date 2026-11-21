// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { games } from '../registry'

// What each word's theme is, from Pairs' own Les thèmes pack, to know which tiles are the odd ones out.
const themes = games.find((game) => game.meta.id === 'pairs')!.content.packs.find((pack) => pack.id === 'les-themes')!.items as { front: string; back: string }[]
const themeOf = (front: string) => themes.find((pair) => pair.front === front)!.back

describe('playing Pairs', () => {
  // As in the other screen tests: a fake clock for the countdown, real timeouts for Testing Library.
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  it('plays L’intrus alone: ten sets, picking the three that don’t belong each time, then the score', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/pairs/l-intrus']}>
        <App />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('tab', { name: 'Free Play' }))
    await user.click(screen.getByRole('button', { name: 'Start' }))

    for (let set = 1; set <= 10; set++) {
      expect(screen.getByText(`Set ${set} of 10`)).toBeDefined()
      const group = within(screen.getByRole('list', { name: 'Prompts' })).getByRole('listitem').textContent!
      const tiles = within(screen.getByRole('list', { name: 'Tiles' })).getAllByRole('button')
      for (const tile of tiles.filter((button) => themeOf(button.textContent!) !== group)) await user.click(tile)
      await user.click(screen.getByRole('button', { name: 'Check' }))
      expect(screen.getByText('3 of 3 right')).toBeDefined()
      await user.click(screen.getByRole('button', { name: set < 10 ? 'Next set' : 'End turn' }))
    }

    expect(screen.getByRole('heading', { name: 'Your score' })).toBeDefined()
    expect(screen.getByText('30')).toBeDefined()
  })
})
