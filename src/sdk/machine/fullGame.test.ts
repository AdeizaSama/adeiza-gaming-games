import { describe, expect, it } from 'vitest'
import { defineMachine } from './defineMachine'
import { isFinal, send, start } from './runner'
import type { MachineState } from './types'
import { validateMachine } from './validateMachine'

// Dice Duel: a toy game shaped like the team-turns format (standard §7), played start to finish.
// Teams take timed turns over several rounds. During a turn the team rolls as often as it likes;
// when time is up, the rolls are added to its score. Highest score after the last round wins.

interface DuelContext {
  teams: string[]
  scores: number[]
  current: number
  round: number
  rounds: number
  turnSeconds: number
  turnEndsAt: number | null
  turnRolls: number[]
}

type DuelEvent = { type: 'start' } | { type: 'roll' } | { type: 'time_up' } | { type: 'next' }

interface DuelInput {
  teams: string[]
  rounds: number
  turnSeconds: number
}

const diceDuel = defineMachine<DuelContext, DuelEvent, DuelInput>()({
  initial: 'handoff',
  context: ({ input, rng }) => ({
    teams: rng.shuffle(input.teams), // random turn order
    scores: input.teams.map(() => 0),
    current: 0,
    round: 1,
    rounds: input.rounds,
    turnSeconds: input.turnSeconds,
    turnEndsAt: null,
    turnRolls: [],
  }),
  phases: {
    handoff: {
      interaction: 'handoff',
      on: { start: { to: 'turn', actions: ['startTimer'] } },
    },
    turn: {
      interaction: 'prompt_card',
      on: {
        roll: { actions: ['rollDie'] },
        time_up: { to: 'turn_summary', actions: ['bankRolls'] },
      },
    },
    turn_summary: {
      interaction: 'summary',
      on: {
        next: [{ when: 'turnsRemaining', to: 'handoff', actions: ['advanceTeam'] }, { to: 'results' }],
      },
    },
    results: { interaction: 'leaderboard', final: true },
  },
  guards: {
    turnsRemaining: ({ context }) =>
      context.round < context.rounds || context.current < context.teams.length - 1,
  },
  actions: {
    startTimer: ({ context, now }) => ({ ...context, turnEndsAt: now + context.turnSeconds * 1000, turnRolls: [] }),
    rollDie: ({ context, rng }) => ({ ...context, turnRolls: [...context.turnRolls, rng.int(1, 6)] }),
    bankRolls: ({ context }) => ({
      ...context,
      turnEndsAt: null,
      scores: context.scores.map((score, team) =>
        team === context.current ? score + context.turnRolls.reduce((sum, roll) => sum + roll, 0) : score,
      ),
    }),
    advanceTeam: ({ context }) => {
      const last = context.current === context.teams.length - 1
      return { ...context, current: last ? 0 : context.current + 1, round: last ? context.round + 1 : context.round }
    },
  },
})

type DuelState = MachineState<DuelContext, keyof typeof diceDuel.phases>

const input: DuelInput = { teams: ['Red', 'Blue'], rounds: 2, turnSeconds: 30 }

/** Plays one full turn from the handoff screen: start, roll three times, time up, next. */
function playTurn(state: DuelState, now: number): DuelState {
  const events: DuelEvent[] = [{ type: 'start' }, { type: 'roll' }, { type: 'roll' }, { type: 'roll' }, { type: 'time_up' }, { type: 'next' }]
  return events.reduce((current, event) => send(diceDuel, current, event, { now }), state)
}

/** Plays turns until the game ends, recording every state along the way. */
function playToEnd(first: DuelState): DuelState[] {
  const states = [first]
  let now = 0
  while (!isFinal(diceDuel, states[states.length - 1])) {
    now += 60_000
    states.push(playTurn(states[states.length - 1], now))
    if (states.length > 100) throw new Error('The game never ended')
  }
  return states
}

describe('Dice Duel, a full game', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(diceDuel)).toEqual([])
  })

  it('plays from the first handoff to the results', () => {
    const states = playToEnd(start(diceDuel, { input, seed: 2026 }))
    const end = states[states.length - 1]

    expect(states).toHaveLength(1 + 4) // the start, then 2 teams × 2 rounds
    expect(states.slice(1, -1).map((s) => s.phase)).toEqual(['handoff', 'handoff', 'handoff'])
    expect(end.phase).toBe('results')
    expect(end.context.round).toBe(2)
    expect(end.context.turnEndsAt).toBeNull()
  })

  // Pinned with seed 2026, and checked by hand against one createRng(2026): shuffle the teams, then 12 rolls in
  // turn order. If the runner, the Rng or this game changes, these numbers change: decide whether that's intended.
  it('gives the same result every time for the same seed', () => {
    const end = playToEnd(start(diceDuel, { input, seed: 2026 })).at(-1)!
    expect(end.context.teams).toEqual(['Blue', 'Red'])
    expect(end.context.scores).toEqual([18, 16])
  })

  it('keeps every state plain JSON, so it can be saved', () => {
    for (const state of playToEnd(start(diceDuel, { input, seed: 2026 }))) {
      expect(JSON.parse(JSON.stringify(state))).toEqual(state)
    }
  })

  it('finishes the same way after a save and reload halfway through', () => {
    const first = start(diceDuel, { input, seed: 2026 })
    const halfway = playTurn(playTurn(first, 60_000), 120_000)
    const reloaded: DuelState = JSON.parse(JSON.stringify(halfway))

    expect(playToEnd(reloaded).at(-1)).toEqual(playToEnd(halfway).at(-1))
    expect(playToEnd(reloaded).at(-1)).toEqual(playToEnd(first).at(-1))
  })

  it('sets the turn timer from the time it is given', () => {
    const turn = send(diceDuel, start(diceDuel, { input, seed: 1 }), { type: 'start' }, { now: 5_000 })
    expect(turn.context.turnEndsAt).toBe(5_000 + 30_000)
  })
})
