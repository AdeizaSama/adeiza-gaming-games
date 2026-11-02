// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { start } from '../../../sdk/machine/runner'
import { CharadesConfig } from '../config'
import { machine, type CharadesEntry } from '../machine'
import { reviewRow } from './ReviewView'
import { TurnView } from './TurnView'

const config = CharadesConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['back-to-school'] })
const gala = { text: 'Gala', tags: [], modes: ['describe', 'act'] as CharadesEntry['mode'][] }

describe('Charades TurnView', () => {
  const show = (mode: 'describe' | 'mix') => {
    const context = {
      ...start(machine, { input: { config: { ...config, mode }, items: [gala] }, seed: 1 }).context,
      item: gala,
      turn: { entries: [], mode: 'act' as const },
    }
    return render(<TurnView context={context} send={() => {}} points={machine.points} />)
  }

  it('says how to clue the card in Mix it up, and nothing in Describe mode', () => {
    const { unmount } = show('mix')
    expect(screen.getByText('Act it out')).toBeDefined()
    unmount()

    show('describe')
    expect(screen.getByText('Gala')).toBeDefined()
    expect(screen.queryByText(/describe it|act it out|sing or hum it/i)).toBeNull()
  })
})

describe('Charades review rows', () => {
  const entry = (played: CharadesEntry['played'], changed = false): CharadesEntry => ({ item: gala, mode: 'act', played, changed })

  it('names each result, and marks a corrected card', () => {
    expect(reviewRow(entry('got'), config)).toEqual({ text: 'Gala', detail: undefined, result: 'Got it', tone: 'good', changed: false })
    expect(reviewRow(entry('time_up'), config)).toMatchObject({ result: 'Not counted', tone: 'none' })
    expect(reviewRow(entry('got', true), config)).toMatchObject({ result: 'Skipped', tone: 'bad', changed: true })
  })

  it('shows how the card was clued only in Mix it up, and a free skip as neutral', () => {
    expect(reviewRow(entry('got'), { ...config, mode: 'mix' }).detail).toBe('Acted')
    const freeSkips = { ...config, points: { ...config.points, skip: 0 } }
    expect(reviewRow(entry('skipped'), freeSkips)).toMatchObject({ result: 'Skipped', tone: 'none' })
  })
})
