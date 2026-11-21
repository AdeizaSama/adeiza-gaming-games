// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { send as step, start } from '../../../sdk/machine/runner'
import { PairsConfig } from '../config'
import { machine } from '../machine'
import type { PairsItem } from '../schema'
import { FreePlayView, pairsFreePlay, SettingsView } from './SettingsView'
import { pickLabel, roundCount, TurnView } from './TurnView'

// A small two-way pack, enough for a set of ten tiles.
const items: PairsItem[] = ['cat', 'dog', 'house', 'car', 'tree', 'book', 'pen', 'door', 'bread', 'milk', 'water', 'sun'].map((back, index) => ({
  front: `mot ${index + 1}`,
  back,
  tags: [],
}))
const configWith = (changes: Partial<PairsConfig> = {}) => PairsConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['test'], twoWay: false, ...changes })
const atTurn = (changes: Partial<PairsConfig> = {}) => step(machine, start(machine, { input: { config: configWith(changes), items }, seed: 1 }), { type: 'start' }, { now: 0 })

describe('Pairs turn', () => {
  it('flip: the card’s front and Show the answer; once flipped, its back, Not yet and Knew it', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const turn = atTurn()
    const { rerender } = render(<TurnView context={turn.context} send={send} points={machine.points} />)
    expect(screen.getByText('Card 1 of 10')).toBeDefined()
    expect(screen.getByRole('timer')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Show the answer' }))
    expect(send).toHaveBeenCalledWith({ type: 'flip' })

    const flipped = step(machine, turn, { type: 'flip' }, { now: 0 })
    rerender(<TurnView context={flipped.context} send={send} points={machine.points} />)
    const card = flipped.context.turn.round as { back: string }
    expect(screen.getByText(card.back)).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Knew it' }))
    expect(send).toHaveBeenCalledWith({ type: 'knew' })
  })

  it('match: the tiles and their prompts, picks and Check sent; after Check, Next set, or End turn after the last', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const turn = atTurn({ play: 'match', cards: 1 })
    const { rerender } = render(<TurnView context={turn.context} send={send} points={machine.points} />)
    expect(screen.getByText('Find their partners')).toBeDefined()
    expect(within(screen.getByRole('list', { name: 'Tiles' })).getAllByRole('button')).toHaveLength(10)
    await user.click(within(screen.getByRole('list', { name: 'Tiles' })).getAllByRole('button')[0])
    expect(send).toHaveBeenCalledWith({ type: 'pick', index: 0 })

    const round = turn.context.turn.round as { answers: number[] }
    const checked = [...round.answers.map((index) => ({ type: 'pick' as const, index })), { type: 'check' as const }].reduce(
      (state, event) => step(machine, state, event, { now: 0 }),
      turn,
    )
    rerender(<TurnView context={checked.context} send={send} points={machine.points} />)
    expect(screen.getByText('3 of 3 right')).toBeDefined()
    expect(screen.queryByRole('timer')).toBeNull() // the last set's result: the clock is hidden
    await user.click(screen.getByRole('button', { name: 'End turn' }))
    expect(send).toHaveBeenCalledWith({ type: 'continue' })
  })

  it('counts cards and sets, and says what to find', () => {
    const fresh = { round: null, picked: [], revealed: false, results: [] }
    expect(roundCount(fresh, configWith())).toBe('Card 1 of 10')
    const checkedSet = { ...fresh, round: { kind: 'pick' as const, prompts: [], options: [], answers: [] }, results: [1], revealed: true }
    expect(roundCount(checkedSet, configWith({ play: 'match' }))).toBe('Set 1 of 10') // still the first set, scored
    expect([pickLabel(configWith({ play: 'match' })), pickLabel(configWith({ play: 'odd' }))]).toEqual(['Find their partners', "Find the 3 that don't belong"])
  })
})

describe('Pairs settings', () => {
  function Settings({ open }: { open?: string[] }) {
    const [settings, setSettings] = useState(configWith())
    return <SettingsView settings={settings} open={open} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
  }

  it('picks the way to play, both ways, and cards a turn, and shows only open ones on a variant', async () => {
    const user = userEvent.setup()
    const { unmount } = render(<Settings />)
    await user.click(screen.getByRole('radio', { name: /Odd one out/ }))
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Odd one out/ }).checked).toBe(true)
    await user.click(screen.getByRole('checkbox', { name: 'Either side first' }))
    expect(screen.getByRole<HTMLInputElement>('checkbox', { name: 'Either side first' }).checked).toBe(true)
    expect(within(screen.getByRole('group', { name: 'Cards per turn' })).getByText('10')).toBeDefined()
    unmount()
    render(<Settings open={['cards']} />)
    expect(screen.queryByRole('radio')).toBeNull()
    expect(screen.queryByRole('checkbox')).toBeNull()
    expect(screen.getByRole('group', { name: 'Cards per turn' })).toBeDefined()
  })

  it('Free Play: 10, 20 or 50 cards, starting at 10 with no clock', async () => {
    const user = userEvent.setup()
    expect(pairsFreePlay.settings).toEqual({ cards: 10, timer: false })
    function Free() {
      const [settings, setSettings] = useState({ ...configWith(), ...pairsFreePlay.settings })
      return <FreePlayView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
    }
    render(<Free />)
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /10 cards/ }).checked).toBe(true)
    await user.click(screen.getByRole('radio', { name: /50 cards/ }))
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /50 cards/ }).checked).toBe(true)
  })
})
