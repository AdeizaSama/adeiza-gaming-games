// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { send } from '../../sdk/machine/runner'
import { describeSave, saveGame, summarizeSave } from '../play/savedGame'
import { games } from '../registry'

const charades = games[0]
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 2, seconds: 30, packs: ['back-to-school'] })
const fresh = newGame(charades.machine, { config, items: choosePoolItems(charades.content.packs, config, charades.content.itemKey) }, 2026)

/** The game after every team has played `turns` turns with nothing guessed. */
function played(turns: number) {
  let state = fresh
  for (let n = 0; n < turns; n++) {
    for (const type of ['start', 'time_up', 'next'] as const) state = send(charades.machine, state, { type }, { now: 0 })
  }
  return state
}

function renderAt(address: string) {
  return render(
    <MemoryRouter initialEntries={[address]}>
      <App />
    </MemoryRouter>,
  )
}

describe('continuing a saved game', () => {
  beforeEach(() => localStorage.clear())

  it('describes a save by its teams and round', () => {
    expect(describeSave({ teams: ['Lions', 'Eagles'], round: 2, rounds: 3 })).toBe('Lions vs Eagles · Round 2 of 3')
    expect(describeSave({ teams: ['Lions', 'Eagles', 'Hawks'], round: 1, rounds: 1 })).toBe('Lions, Eagles and Hawks · Round 1 of 1')
  })

  it('offers the unfinished game first in the library, and Continue carries on with it', async () => {
    saveGame(charades, played(2)) // both teams have played round 1: round 2, Lions next
    const user = userEvent.setup()
    renderAt('/')

    const card = screen.getByRole('link', { name: /Continue Charades/ })
    expect(card.textContent).toContain('Lions vs Eagles · Round 2 of 2')
    await user.click(card)
    expect(screen.getByText('Pass the phone to')).toBeDefined()
    expect(screen.getByText('Round 2 of 2')).toBeDefined()
  })

  it('offers nothing to continue for a finished game', () => {
    saveGame(charades, played(4))
    renderAt('/')
    expect(screen.queryByRole('link', { name: /Continue/ })).toBeNull()
  })

  it('says when a save couldn’t be restored, found by the library or by the play page', () => {
    localStorage.setItem('ku-zo-wasa:game', JSON.stringify({ version: 0, gameId: 'charades', savedAt: 0, state: fresh }))
    const { unmount } = renderAt('/')
    expect(screen.getByRole('status').textContent).toContain("Your last game couldn't be restored.")
    expect(screen.getByRole('status').textContent).toContain('older version of the app')
    unmount()

    localStorage.setItem('ku-zo-wasa:game', JSON.stringify({ version: 1, gameId: 'charades', savedAt: 0, state: { ...fresh, phase: 'guessing' } }))
    renderAt('/charades/play')
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
    expect(screen.getByRole('status').textContent).toContain('Charades has no "guessing" phase any more')
  })

  it('asks before Start replaces an unfinished game: Continue saved game keeps it, Start new game replaces it', async () => {
    saveGame(charades, played(2))
    const user = userEvent.setup()
    renderAt('/charades')

    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.getByRole('dialog', { name: 'Replace your saved game?' }).textContent).toContain('Lions vs Eagles · Round 2 of 2')
    await user.click(screen.getByRole('button', { name: 'Continue saved game' }))
    expect(screen.getByText('Round 2 of 2')).toBeDefined()
  })

  it('replaces the saved game after Start new game, and without asking when the saved game is finished', async () => {
    saveGame(charades, played(2))
    const user = userEvent.setup()
    const { unmount } = renderAt('/charades')
    await user.click(screen.getByRole('button', { name: 'Start' }))
    await user.click(screen.getByRole('button', { name: 'Start new game' }))
    expect(screen.getByText(/Round 1 of/)).toBeDefined()
    let saved = summarizeSave()
    expect(saved.status === 'ok' && saved.summary.round).toBe(1)
    unmount()

    saveGame(charades, played(4))
    renderAt('/charades')
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(screen.queryByRole('dialog')).toBeNull()
    saved = summarizeSave()
    expect(saved.status === 'ok' && saved.summary.finished).toBe(false)
  })
})
