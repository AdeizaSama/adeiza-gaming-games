// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { send as step, start } from '../../../sdk/machine/runner'
import { NameTenConfig } from '../config'
import { machine } from '../machine'
import type { NameTenItem } from '../schema'
import { CategoryView, skipsLeftText } from './CategoryView'
import { HandoffView, judgeOf } from './HandoffView'
import { ReviewView, reviewRows } from './ReviewView'
import { SettingsView } from './SettingsView'
import { TurnView } from './TurnView'

const category: NameTenItem = { category: 'Numbers', answers: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'], tags: [] }
const config = NameTenConfig.parse({ teams: ['Lions', 'Eagles', 'Hawks'], packs: ['back-to-school'] })

/** A real context from the machine: the handoff, or a turn on the Numbers board. */
const handoff = () => start(machine, { input: { config, items: [category] }, seed: 1 }).context
const atCategory = () => step(machine, start(machine, { input: { config, items: [category] }, seed: 1 }), { type: 'start' }, { now: 0 })
const turn = () => step(machine, atCategory(), { type: 'play' }, { now: 0 }).context

describe('Name Ten handoff', () => {
  it('names the next team as the judge, the first judging the last', () => {
    expect(judgeOf(['Lions', 'Eagles', 'Hawks'], 0)).toBe('Eagles')
    expect(judgeOf(['Lions', 'Eagles', 'Hawks'], 2)).toBe('Lions')
  })

  it('asks for the phone to go to a judge from the next team, and says who is up', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    render(<HandoffView context={handoff()} send={send} points={machine.points} />)
    expect(screen.getByText('Hand the phone to a judge from')).toBeDefined()
    expect(screen.getByRole('heading', { name: 'Eagles' })).toBeDefined()
    expect(screen.getByText('Lions are up · Round 1 of 3')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(send).toHaveBeenCalledWith({ type: 'start' })
  })
})

describe('Name Ten category', () => {
  it('shows the team its category, never the answers, and plays it or skips it', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const { context } = atCategory()
    render(<CategoryView context={context} send={send} points={machine.points} />)
    expect(screen.getByText("Lions, here's your category")).toBeDefined()
    expect(screen.getByText('Numbers')).toBeDefined()
    expect(screen.queryByText(context.turn.board[0])).toBeNull()
    expect(screen.getByText("3 skips left. A skipped category doesn't come back.")).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(send).toHaveBeenCalledWith({ type: 'skip' })
    await user.click(screen.getByRole('button', { name: 'Play this' }))
    expect(send).toHaveBeenCalledWith({ type: 'play' })
  })

  it('counts skips down, and turns Skip off when none are left', () => {
    expect([0, 2, 3].map(skipsLeftText)).toEqual([
      "3 skips left. A skipped category doesn't come back.",
      "1 skip left. A skipped category doesn't come back.",
      'No skips left: play this one.',
    ])
    const { context } = atCategory()
    render(<CategoryView context={{ ...context, turn: { ...context.turn, skips: 3 } }} send={() => {}} points={machine.points} />)
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Skip' }).disabled).toBe(true)
  })
})

describe('Name Ten turn', () => {
  it('shows the category and its board, reports taps by position, and can end early', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const context = turn()
    render(<TurnView context={context} send={send} points={machine.points} />)

    expect(screen.getByRole('heading', { name: 'Numbers' })).toBeDefined()
    const answers = within(screen.getByRole('list', { name: 'Answers' })).getAllByRole('button')
    expect(answers.map((answer) => answer.textContent)).toEqual(context.turn.board)
    await user.click(answers[4])
    expect(send).toHaveBeenCalledWith({ type: 'toggle', index: 4 })
    await user.click(screen.getByRole('button', { name: 'End turn early' }))
    expect(send).toHaveBeenCalledWith({ type: 'lock_in' })
  })
})

describe('Name Ten review', () => {
  it('lists the board as got or missed, and talks about answers, not cards', () => {
    expect(reviewRows({ board: ['Biro', 'Ruler'], got: [true, false], skips: 0 })).toEqual([
      { text: 'Biro', result: 'Got it', tone: 'good' },
      { text: 'Ruler', result: 'Missed', tone: 'none' },
    ])
    render(<ReviewView context={turn()} send={() => {}} points={machine.points} />)
    expect(screen.getByText('Check the answers before they count.')).toBeDefined()
    expect(screen.getByRole('list', { name: 'Answers this turn' })).toBeDefined()
  })
})

describe('Name Ten settings', () => {
  it('sets the answers on the board from 10 to 15', async () => {
    const user = userEvent.setup()
    function Settings() {
      const [settings, setSettings] = useState(config)
      return <SettingsView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
    }
    render(<Settings />)
    const stepper = within(screen.getByRole('group', { name: 'Answers on the board' }))
    expect(stepper.getByRole<HTMLButtonElement>('button', { name: 'Less: Answers on the board' }).disabled).toBe(true)
    for (let i = 0; i < 6; i++) await user.click(stepper.getByRole('button', { name: 'More: Answers on the board' }))
    expect(stepper.getByText('15')).toBeDefined()
    expect(stepper.getByRole<HTMLButtonElement>('button', { name: 'More: Answers on the board' }).disabled).toBe(true)
  })
})

describe('Name Ten settings on a variant', () => {
  it('shows answers on the board only when the variant opens it', () => {
    const { unmount } = render(<SettingsView settings={config} onChange={() => {}} open={['rounds']} />)
    expect(screen.queryByRole('group', { name: 'Answers on the board' })).toBeNull()
    unmount()
    render(<SettingsView settings={config} onChange={() => {}} open={['shown']} />)
    expect(screen.getByRole('group', { name: 'Answers on the board' })).toBeDefined()
  })
})
