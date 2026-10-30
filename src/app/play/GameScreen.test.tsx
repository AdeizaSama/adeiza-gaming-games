// @vitest-environment happy-dom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { games } from '../registry'
import { GameScreen } from './GameScreen'

const charades = games[0]
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 1, seconds: 30, packs: ['back-to-school'] })
const input = { config, items: choosePoolItems(charades.content.packs, config, charades.content.itemKey) }

/** The game screen inside a router: its "Back to games" link needs one. */
function renderGame() {
  return render(
    <MemoryRouter>
      <GameScreen game={charades} initial={newGame(charades.machine, input, 2026)} input={input} />
    </MemoryRouter>,
  )
}

describe('GameScreen', () => {
  // Fake clock and intervals, so the 30-second turns pass instantly. Only what the countdown uses is faked:
  // Testing Library waits on a real `setTimeout` between taps, which a fake one would never fire.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  it('plays a whole game of Charades by tapping, from the first handoff to the results', async () => {
    const user = userEvent.setup()
    renderGame()

    // Lions' turn: got, got, skip, then time runs out.
    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('timer').textContent).toBe('30')
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    act(() => vi.advanceTimersByTime(30_000))

    expect(screen.getByText(/scored/).textContent).toBe('scored 2 points')
    expect(within(screen.getByRole('list', { name: 'Got it' })).getAllByRole('listitem')).toHaveLength(2)
    expect(within(screen.getByRole('list', { name: 'Skipped' })).getAllByRole('listitem')).toHaveLength(1)
    await user.click(screen.getByRole('button', { name: 'Next' }))

    // Eagles' turn: one got, then time runs out. It's the last turn.
    expect(screen.getByRole('heading', { name: 'Eagles' })).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    act(() => vi.advanceTimersByTime(30_000))
    expect(screen.getByText(/scored/).textContent).toBe('scored 1 point')
    await user.click(screen.getByRole('button', { name: 'See results' }))

    expect(screen.getByRole('heading', { name: 'Lions won!' })).toBeDefined()
    const standings = within(screen.getByRole('list', { name: 'Standings' })).getAllByRole('listitem')
    expect(standings.map((row) => row.textContent)).toEqual(['1Lions2', '2Eagles1'])
  })

  it('after the game, Play again starts over with the same teams, and Back to games leads to the library', async () => {
    const user = userEvent.setup()
    renderGame()
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull()

    // Two turns with nothing guessed: Lions, then Eagles.
    for (const next of ['Next', 'See results']) {
      await user.click(screen.getByRole('button', { name: 'Start' }))
      act(() => vi.advanceTimersByTime(30_000))
      await user.click(screen.getByRole('button', { name: next }))
    }
    expect(screen.getByRole('heading', { name: "It's a tie!" })).toBeDefined()
    expect(screen.getByRole('link', { name: 'Back to games' }).getAttribute('href')).toBe('/')

    await user.click(screen.getByRole('button', { name: 'Play again' }))
    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    expect(screen.getByText('Round 1 of 1')).toBeDefined()
    expect(screen.queryByRole('button', { name: 'Play again' })).toBeNull()
  })
})
