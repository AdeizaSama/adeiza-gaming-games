import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { isFinal, send, start } from '../../sdk/machine/runner'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { TriviaConfig } from './config'
import { machine } from './machine'
import { itemKey, itemSchema } from './schema'

// The choice turn itself is tested in the SDK (src/sdk/formats/team-turns/choice/). This is Trivia Night on it: the
// real settings and the real Back to School pack.
const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
const config = TriviaConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['back-to-school'] })
const items = choosePoolItems(packs, config, itemKey)

describe('Trivia Night machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('plays a full game on the Back to School pack, one question a turn, from the first handoff to the results', () => {
    let state = start(machine, { input: { config, items }, seed: 2026 })
    for (let turn = 0; turn < 6; turn++) {
      state = send(machine, state, { type: 'start' }, { now: 0 })
      const right = state.context.turn.options.indexOf(state.context.item!.answer)
      state = [{ type: 'answer', index: right } as const, { type: 'continue' } as const, { type: 'next' } as const].reduce((current, event) => send(machine, current, event, { now: 0 }), state)
    }
    expect(isFinal(machine, state)).toBe(true)
    expect(state.context.scores).toEqual([3, 3])
  })
})
