// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest'
import { TeamTurnsConfig } from '../../sdk/formats/team-turns/config'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { newGame } from '../../sdk/game/useGameSession'
import { send } from '../../sdk/machine/runner'
import { games } from '../registry'
import { clearGame, loadGame, saveGame, saveVersion, summarizeSave } from './savedGame'

const charades = games[0]
const config = TeamTurnsConfig.parse({ teams: ['Lions', 'Eagles'], rounds: 1, seconds: 30, packs: ['back-to-school'] })
const fresh = newGame(charades.machine, { config, items: choosePoolItems(charades.content.packs, config, charades.content.itemKey) }, 2026)
const key = 'ku-zo-wasa:game'

/** A save written by hand, to test what the app does with saves it didn't write (or wrote long ago). */
const write = (value: unknown) => localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
const valid = { version: saveVersion, gameId: 'charades', savedAt: 1_000, state: fresh }

describe('saved game', () => {
  beforeEach(() => localStorage.clear())

  it('saves a game and loads it back exactly', () => {
    const mid = send(charades.machine, fresh, { type: 'start' }, { now: 5_000 })
    saveGame(charades, mid, localStorage, 6_000)
    expect(loadGame(charades)).toEqual({ status: 'ok', state: mid, savedAt: 6_000 })
  })

  it('finds nothing when nothing is saved, or after clearGame', () => {
    expect(loadGame(charades)).toEqual({ status: 'none' })
    saveGame(charades, fresh)
    clearGame()
    expect(loadGame(charades)).toEqual({ status: 'none' })
  })

  it.each([
    ['not JSON', '{"version": 1, "gam', 'the save is not readable'],
    ['the wrong shape', { version: saveVersion, gameId: 'charades' }, 'the save is not a saved game'],
    ['an older version', { ...valid, version: saveVersion - 1 }, `the save is from an older version of the app (save version ${saveVersion - 1})`],
    ['a game that was removed', { ...valid, gameId: 'chess' }, 'there\'s no game "chess" any more'],
    ['a phase that was renamed', { ...valid, state: { ...fresh, phase: 'guessing' } }, 'Charades has no "guessing" phase any more'],
    ['a phase name every object has', { ...valid, state: { ...fresh, phase: 'toString' } }, 'Charades has no "toString" phase any more'],
    ['settings that are no longer allowed', { ...valid, state: { ...fresh, context: { ...fresh.context, config: { ...config, rounds: 99 } } } }, "its Charades settings aren't valid any more"],
  ])('throws away a save with %s, and says why', (_, save, reason) => {
    write(save)
    expect(loadGame(charades)).toEqual({ status: 'discarded', reason })
    expect(localStorage.getItem(key)).toBeNull()
  })

  it('reports a save for a different game without deleting it', () => {
    saveGame(charades, fresh)
    const other = { ...charades, meta: { ...charades.meta, id: 'name-ten' } }
    expect(loadGame(other)).toEqual({ status: 'other game', gameId: 'charades' })
    expect(localStorage.getItem(key)).not.toBeNull()
  })

  it('summarizes the save for the library, and says when the game is finished', () => {
    saveGame(charades, fresh, localStorage, 7_000)
    expect(summarizeSave()).toEqual({
      status: 'ok',
      summary: { game: charades, teams: ['Lions', 'Eagles'], round: 1, rounds: 1, finished: false, savedAt: 7_000 },
    })

    // Both teams play their one turn: the game reaches the results.
    let state = fresh
    for (const type of ['start', 'time_up', 'next', 'start', 'time_up', 'next'] as const) {
      state = send(charades.machine, state, { type }, { now: 0 })
    }
    expect(state.phase).toBe('results')
    saveGame(charades, state)
    const summary = summarizeSave()
    expect(summary.status === 'ok' && summary.summary.finished).toBe(true)
  })

  it('keeps playing when storage is switched off', () => {
    const off = {
      getItem: () => {
        throw new Error('SecurityError')
      },
      setItem: () => {
        throw new Error('QuotaExceededError')
      },
      removeItem: () => {
        throw new Error('SecurityError')
      },
    } as unknown as Storage
    expect(() => saveGame(charades, fresh, off)).not.toThrow()
    expect(loadGame(charades, off)).toEqual({ status: 'none' })
    expect(() => clearGame(off)).not.toThrow()
  })
})
