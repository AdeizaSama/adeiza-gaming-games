// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TeamTurnsContext } from '../rules'
import { HandoffView } from './HandoffView'
import { ResultsView } from './ResultsView'
import { TurnSummaryView } from './TurnSummaryView'

// The format's default views, with a made-up game whose turn record is a count of words guessed.
type Context = TeamTurnsContext<string, { got: number }>

function context(changes: Partial<Context> = {}): Context {
  return {
    config: { teams: ['Lions', 'Eagles'], rounds: 2, seconds: 60, packs: ['test'], tags: [] },
    scores: [0, 0],
    current: 1,
    round: 1,
    turnEndsAt: null,
    pool: { remaining: [], drawn: [] },
    item: null,
    turn: { got: 3 },
    ...changes,
  }
}

const points = (turn: { got: number }) => turn.got

describe('team-turns default views', () => {
  it('handoff: names the team and the round, and Start sends start', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    render(<HandoffView context={context()} send={send} points={points} />)

    expect(screen.getByRole('heading', { name: 'Eagles' })).toBeDefined()
    expect(screen.getByText('Round 1 of 2')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(send).toHaveBeenCalledWith({ type: 'start' })
  })

  it('turn summary: shows the turn’s points, and Next, or See results after the last turn', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const { unmount } = render(<TurnSummaryView context={context()} send={send} points={points} />)
    expect(screen.getByText(/scored/).textContent).toBe('scored 3 points')
    await user.click(screen.getByRole('button', { name: 'Next' }))
    expect(send).toHaveBeenCalledWith({ type: 'next' })
    unmount()

    render(<TurnSummaryView context={context({ round: 2 })} send={send} points={points} />)
    expect(screen.getByRole('button', { name: 'See results' })).toBeDefined()
  })

  it('results: names the winner, or says it’s a tie', () => {
    const { unmount } = render(<ResultsView context={context({ scores: [5, 8] })} send={() => {}} points={points} />)
    expect(screen.getByRole('heading', { name: 'Eagles won!' })).toBeDefined()
    unmount()

    render(<ResultsView context={context({ scores: [6, 6] })} send={() => {}} points={points} />)
    expect(screen.getByRole('heading', { name: "It's a tie!" })).toBeDefined()
  })
})
