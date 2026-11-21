// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { TeamTurnsContext } from '../rules'
import { HandoffView } from './HandoffView'
import { ResultsView } from './ResultsView'
import { standingsOf, TurnSummaryView } from './TurnSummaryView'

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

describe('team-turns default views in Free Play', () => {
  const solo = (changes: Partial<Context> = {}) =>
    context({ config: { teams: ['You'], rounds: 1, seconds: 60, packs: ['test'], tags: [], solo: true, timer: false }, scores: [7], current: 0, ...changes })

  it('handoff and turn summary go on by themselves and show nothing; the results show the score', () => {
    const send = vi.fn()
    const handoff = render(<HandoffView context={solo()} send={send} points={points} />)
    expect(send).toHaveBeenCalledWith({ type: 'start' })
    expect(handoff.container.textContent).toBe('')
    handoff.unmount()

    const summary = render(<TurnSummaryView context={solo()} send={send} points={points} />)
    expect(send).toHaveBeenLastCalledWith({ type: 'next' })
    expect(summary.container.textContent).toBe('')
    summary.unmount()

    render(<ResultsView context={solo()} send={send} points={points} />)
    expect(screen.getByRole('heading', { name: 'Your score' })).toBeDefined()
    expect(screen.getByText('7')).toBeDefined()
    expect(screen.queryByText(/won!/)).toBeNull()
  })
})

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

  it('turn summary: every team’s score so far, this turn included, and the rounds each has played', () => {
    const config = { teams: ['Lions', 'Eagles', 'Hawks'], rounds: 3 }
    // Round 2, Eagles just played and scored 4.
    expect(standingsOf({ config, scores: [6, 5, 2], current: 1, round: 2 }, 4)).toEqual([
      { name: 'Lions', score: 6, played: 2, of: 3, current: false },
      { name: 'Eagles', score: 9, played: 2, of: 3, current: true },
      { name: 'Hawks', score: 2, played: 1, of: 3, current: false },
    ])
    // The very first turn.
    expect(standingsOf({ config, scores: [0, 0, 0], current: 0, round: 1 }, 3).map((team) => [team.score, team.played])).toEqual([
      [3, 1],
      [0, 0],
      [0, 0],
    ])
  })

  it('results: names the winner, or says it’s a tie', () => {
    const { unmount } = render(<ResultsView context={context({ scores: [5, 8] })} send={() => {}} points={points} />)
    expect(screen.getByRole('heading', { name: 'Eagles won!' })).toBeDefined()
    unmount()

    render(<ResultsView context={context({ scores: [6, 6] })} send={() => {}} points={points} />)
    expect(screen.getByRole('heading', { name: "It's a tie!" })).toBeDefined()
  })
})
