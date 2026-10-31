// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { defineMachine } from '../machine/defineMachine'
import { send } from '../machine/runner'
import { newGame, useGameSession } from './useGameSession'

// A tiny machine: a timer starts on `go` (from `now`), `roll` adds a die roll, `stop` ends the game.
const machine = defineMachine<{ total: number; startedAt: number | null }, { type: 'go' } | { type: 'roll' } | { type: 'stop' }, number>()({
  initial: 'ready',
  context: ({ input }) => ({ total: input, startedAt: null }),
  phases: {
    ready: { interaction: 'instruction', on: { go: { to: 'playing', actions: ['startClock'] } } },
    playing: { interaction: 'prompt_card', on: { roll: { actions: ['roll'] }, stop: { to: 'done' } } },
    done: { interaction: 'leaderboard', final: true },
  },
  guards: {},
  actions: {
    startClock: ({ context, now }) => ({ ...context, startedAt: now }),
    roll: ({ context, rng }) => ({ ...context, total: context.total + rng.int(1, 6) }),
  },
})

describe('useGameSession', () => {
  it('starts from the state it is given', () => {
    const { result } = renderHook(() => useGameSession(machine, newGame(machine, 10, 1)))
    expect(result.current.state.phase).toBe('ready')
    expect(result.current.state.context).toEqual({ total: 10, startedAt: null })
    expect(result.current.ended).toBe(false)
  })

  it('sends events with the current time and re-renders with the new state', () => {
    const { result } = renderHook(() => useGameSession(machine, newGame(machine, 0, 1), { now: () => 5_000 }))
    act(() => result.current.send({ type: 'go' }))
    expect(result.current.state.phase).toBe('playing')
    expect(result.current.state.context.startedAt).toBe(5_000)
  })

  it('plays the same way for the same seed', () => {
    const roll = (seed: number) => {
      const { result } = renderHook(() => useGameSession(machine, newGame(machine, 0, seed)))
      act(() => result.current.send({ type: 'go' }))
      act(() => result.current.send({ type: 'roll' }))
      return result.current.state.context.total
    }
    expect(roll(7)).toBe(roll(7))
  })

  it('keeps the same state when an event is ignored', () => {
    const { result } = renderHook(() => useGameSession(machine, newGame(machine, 0, 1)))
    const before = result.current.state
    act(() => result.current.send({ type: 'roll' })) // `ready` doesn't handle `roll`
    expect(result.current.state).toBe(before)
  })

  it('says when the game has ended', () => {
    const { result } = renderHook(() => useGameSession(machine, newGame(machine, 0, 1)))
    act(() => result.current.send({ type: 'go' }))
    act(() => result.current.send({ type: 'stop' }))
    expect(result.current.ended).toBe(true)
  })

  it('newGame picks a random seed, and restart starts over with a new one', () => {
    const random = vi.spyOn(Math, 'random').mockReturnValueOnce(0.25).mockReturnValueOnce(0.5)
    const game = newGame(machine, 3)
    expect(game.rngState).toBe(2 ** 30)
    const { result } = renderHook(() => useGameSession(machine, game))

    act(() => result.current.send({ type: 'go' }))
    act(() => result.current.restart(3))
    expect(result.current.state).toEqual({ phase: 'ready', context: { total: 3, startedAt: null }, rngState: 2 ** 31 })
    random.mockRestore()
  })

  it('carries on a saved game exactly where it was', () => {
    // A game saved mid-play: same phase, total and Rng position as one played to that point.
    const played = send(machine, newGame(machine, 0, 9), { type: 'go' }, { now: 0 })
    const saved = JSON.parse(JSON.stringify(played)) as typeof played
    const { result } = renderHook(() => useGameSession(machine, saved))
    act(() => result.current.send({ type: 'roll' }))
    expect(result.current.state).toEqual(send(machine, played, { type: 'roll' }, { now: 0 }))
  })

  it('reports every change to onChange, but not the starting state or ignored events', () => {
    const onChange = vi.fn()
    const { result } = renderHook(() => useGameSession(machine, newGame(machine, 0, 1), { onChange }))
    expect(onChange).not.toHaveBeenCalled()

    act(() => result.current.send({ type: 'roll' })) // ignored in `ready`
    expect(onChange).not.toHaveBeenCalled()
    act(() => result.current.send({ type: 'go' }))
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenLastCalledWith(result.current.state)
    act(() => result.current.restart(0))
    expect(onChange).toHaveBeenCalledTimes(2)
    expect(onChange.mock.lastCall?.[0].phase).toBe('ready')
  })

  it('keeps playing when the caller passes a new starting state on every render', () => {
    const onChange = vi.fn()
    const { result, rerender } = renderHook(() => useGameSession(machine, newGame(machine, 0), { onChange }))
    act(() => result.current.send({ type: 'go' }))
    rerender()
    expect(result.current.state.phase).toBe('playing')
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})
