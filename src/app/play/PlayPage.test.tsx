// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from '../App'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { send } from '../../sdk/machine/runner'
import { games } from '../registry'
import { loadGame, saveGame } from './savedGame'

const charades = games[0]
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 1, seconds: 30, packs: ['back-to-school'] })
const fresh = newGame(charades.machine, { config, items: choosePoolItems(charades.content.packs, config, charades.content.itemKey) }, 2026)

/** Lions' turn started at 0 ms (so it ends at 30 000) and they got one item: the game as it was before a refresh. */
const midTurn = [{ type: 'start' }, { type: 'got' }].reduce(
  (state, event) => send(charades.machine, state, event as { type: 'start' } | { type: 'got' }, { now: 0 }),
  fresh,
)

/** Opening the play page, as a refresh does. */
function openPlayPage() {
  return render(
    <MemoryRouter initialEntries={['/charades/play']}>
      <App />
    </MemoryRouter>,
  )
}

describe('play page', () => {
  // Fake clock: the test decides how long the refresh took. Only what the countdown uses is faked (chapter 04, step 9).
  beforeEach(() => {
    localStorage.clear()
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] })
  })
  afterEach(() => vi.useRealTimers())

  it('carries on a saved turn after a refresh, with the clock still running, and saves every move', async () => {
    saveGame(charades, midTurn)
    vi.setSystemTime(10_000) // the refresh happened 10 seconds into the turn
    const user = userEvent.setup()
    openPlayPage()

    expect(screen.getByText('Lions')).toBeDefined()
    expect(screen.getByRole('timer').textContent).toBe('20')

    await user.click(screen.getByRole('button', { name: 'Got it' }))
    const saved = loadGame(charades)
    expect(saved.status === 'ok' && saved.state.context.turn.got).toHaveLength(2)
  })

  it('ends the turn at once if its time ran out during the refresh', () => {
    saveGame(charades, midTurn)
    vi.setSystemTime(45_000) // 15 seconds after the turn should have ended
    openPlayPage()

    expect(screen.getByText(/scored/).textContent).toBe('scored 1 point')
    const saved = loadGame(charades)
    expect(saved.status === 'ok' && saved.state.phase).toBe('turn_summary')
  })
})
