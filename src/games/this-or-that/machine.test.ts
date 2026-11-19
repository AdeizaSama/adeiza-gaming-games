import { describe, expect, it } from 'vitest'
import { loadPacks } from '../../sdk/content/loadPacks'
import { choosePoolItems } from '../../sdk/formats/team-turns/pool'
import { isFinal, send, start } from '../../sdk/machine/runner'
import { validateMachine } from '../../sdk/machine/validateMachine'
import { ThisOrThatConfig } from './config'
import { machine } from './machine'
import { itemKey, itemSchema } from './schema'

// The choice turn itself is tested in the SDK (src/sdk/formats/team-turns/choice/). This is This or That on it: the
// real settings and the real Masculin ou féminin ? pack.
const packs = loadPacks(import.meta.glob('./content/*.json', { eager: true, import: 'default' }), itemSchema, itemKey)
const config = ThisOrThatConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['masculin-feminin'] })
const items = choosePoolItems(packs, config, itemKey)

describe('This or That machine', () => {
  it('has no mistakes validateMachine can find', () => {
    expect(validateMachine(machine)).toEqual([])
  })

  it('plays a full game of ten words a turn, Féminin always on the left, from the first handoff to the results', () => {
    let state = start(machine, { input: { config, items }, seed: 2026 })
    for (let turn = 0; turn < 6; turn++) {
      state = send(machine, state, { type: 'start' }, { now: 0 })
      for (let word = 0; word < 10; word++) {
        expect(state.context.turn.options).toEqual(['Féminin', 'Masculin']) // A to Z
        const right = state.context.turn.options.indexOf(state.context.item!.answer)
        state = send(machine, state, { type: 'answer', index: right }, { now: 0 })
        state = send(machine, state, { type: 'continue' }, { now: 0 })
      }
      expect(state.phase).toBe('turn_summary')
      state = send(machine, state, { type: 'next' }, { now: 0 })
    }
    expect(isFinal(machine, state)).toBe(true)
    expect(state.context.scores).toEqual([30, 30])
  })
})
