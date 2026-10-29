import { describe, expect, it } from 'vitest'
import { createRng } from '../../rng'
import type { TeamTurnsConfig } from './config'
import { teamTurnsActions, teamTurnsGuards, type TeamTurnsContext } from './rules'

// A made-up game's turn record: the words guessed this turn, one point each.
interface Turn {
  got: string[]
}
type Context = TeamTurnsContext<string, Turn>

const actions = teamTurnsActions<string, Turn, TeamTurnsConfig>({
  newTurn: () => ({ got: [] }),
  points: (turn) => turn.got.length,
})

const config: TeamTurnsConfig = { teams: ['Lions', 'Eagles', 'Sharks'], rounds: 2, seconds: 60, packs: ['test'], tags: [] }

/** Three teams, two rounds, Lions to play in round 1, nothing drawn yet. */
function context(changes: Partial<Context> = {}): Context {
  return {
    config,
    scores: [0, 0, 0],
    current: 0,
    round: 1,
    turnEndsAt: null,
    pool: { remaining: ['a', 'b'], drawn: [] },
    item: null,
    turn: { got: [] },
    ...changes,
  }
}

const event = { type: 'test' }
const rng = () => createRng(1)

describe('turnsRemaining', () => {
  it('is true while teams are still to play this round, or rounds are left', () => {
    expect(teamTurnsGuards.turnsRemaining({ context: context({ current: 0, round: 1 }), event })).toBe(true)
    expect(teamTurnsGuards.turnsRemaining({ context: context({ current: 2, round: 1 }), event })).toBe(true)
    expect(teamTurnsGuards.turnsRemaining({ context: context({ current: 1, round: 2 }), event })).toBe(true)
  })

  it('is false once the last team has played in the last round', () => {
    expect(teamTurnsGuards.turnsRemaining({ context: context({ current: 2, round: 2 }), event })).toBe(false)
  })
})

describe('startTurn', () => {
  it('starts a fresh turn record and sets the timer from now', () => {
    const before = context({ turn: { got: ['old'] } })
    const after = actions.startTurn({ context: before, event, rng: rng(), now: 1_000 })
    expect(after.turn).toEqual({ got: [] })
    expect(after.turnEndsAt).toBe(61_000)
    expect(before.turn).toEqual({ got: ['old'] })
  })
})

describe('drawItem', () => {
  it('puts the next item from the pool on screen', () => {
    const before = context()
    const after = actions.drawItem({ context: before, event, rng: rng(), now: 0 })
    expect(after.item).toBe('a')
    expect(after.pool).toEqual({ remaining: ['b'], drawn: ['a'] })
    expect(before.pool).toEqual({ remaining: ['a', 'b'], drawn: [] })
  })
})

describe('bankPoints', () => {
  it('adds the turn’s points to the current team only', () => {
    const before = context({ current: 1, scores: [4, 2, 7], turn: { got: ['x', 'y', 'z'] } })
    const after = actions.bankPoints({ context: before, event, rng: rng(), now: 0 })
    expect(after.scores).toEqual([4, 5, 7])
    expect(before.scores).toEqual([4, 2, 7])
  })

  it('leaves scores as they are for a turn worth nothing', () => {
    const after = actions.bankPoints({ context: context({ scores: [3, 1, 0] }), event, rng: rng(), now: 0 })
    expect(after.scores).toEqual([3, 1, 0])
  })
})

describe('advanceTeam', () => {
  it('passes play to the next team in the same round', () => {
    const after = actions.advanceTeam({ context: context({ current: 0, round: 1 }), event, rng: rng(), now: 0 })
    expect([after.current, after.round]).toEqual([1, 1])
  })

  it('after the last team, goes back to the first team in the next round', () => {
    const before = context({ current: 2, round: 1 })
    const after = actions.advanceTeam({ context: before, event, rng: rng(), now: 0 })
    expect([after.current, after.round]).toEqual([0, 2])
    expect([before.current, before.round]).toEqual([2, 1])
  })
})
