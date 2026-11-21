// @vitest-environment happy-dom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { send as step, start } from '../../../machine/runner'
import { choiceConfig, type ChoiceConfig } from './config'
import { choiceTurns, type ChoiceItem } from './machine'
import { ChoiceFreePlayView, choiceFreePlay, lengthOf, lengthSettings } from './FreePlayView'
import { ChoiceSettingsView } from './SettingsView'
import { autoNextMs, choiceTurnView, questionCount } from './TurnView'

const machine = choiceTurns<ChoiceItem>()
const TurnView = choiceTurnView<ChoiceItem>()
const Config = choiceConfig()

// One question, so every state below is on it, whatever the seed.
const items: ChoiceItem[] = [{ question: 'What is the capital of Nigeria?', options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], answer: 'Abuja' }]
const configWith = (changes: Partial<ChoiceConfig> = {}) => Config.parse({ teams: ['Lions', 'Eagles'], packs: ['test'], ...changes })

/** A real state from the machine: the first question of the first turn, or its result after picking `option`. */
const atQuestion = (changes: Partial<ChoiceConfig> = {}) => step(machine, start(machine, { input: { config: configWith(changes), items }, seed: 1 }), { type: 'start' }, { now: 0 })
const atResult = (option: string, changes: Partial<ChoiceConfig> = {}) => {
  const state = atQuestion(changes)
  return step(machine, state, { type: 'answer', index: state.context.turn.options.indexOf(option) }, { now: 0 })
}
const options = () => within(screen.getByRole('list', { name: 'Options' }))

describe('choice turn view', () => {
  it('shows the team, the clock and the question with its options in the order dealt, and reports the pick', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const { context } = atQuestion()
    render(<TurnView context={context} send={send} points={machine.points} />)
    expect(screen.getByText('Lions')).toBeDefined()
    expect(screen.getByRole('timer')).toBeDefined()
    expect(screen.getByRole('heading', { name: context.item!.question })).toBeDefined()
    expect(options().getAllByRole('button').map((button) => button.textContent)).toEqual(context.turn.options)
    await user.click(options().getAllByRole('button')[2])
    expect(send).toHaveBeenCalledWith({ type: 'answer', index: 2 })
    // The button is in place but hidden until there's a result.
    expect(screen.getByText(/^(Next question|End turn)$/).closest('button')!.getAttribute('aria-hidden')).toBe('true')
  })

  it('after a pick, shows the result and ends the turn on its last question, without the clock', async () => {
    const user = userEvent.setup()
    const send = vi.fn()
    const state = atResult('Lagos')
    render(<TurnView context={state.context} send={send} points={machine.points} />)
    expect(screen.getByText("Not quite: it's Abuja.")).toBeDefined()
    expect(screen.queryByRole('timer')).toBeNull()
    await user.click(screen.getByRole('button', { name: 'End turn' }))
    expect(send).toHaveBeenCalledWith({ type: 'continue' })
  })

  it('with more to come, keeps the clock and offers the next question', () => {
    const state = atResult('Abuja', { questions: 3 })
    expect(state.phase).toBe('reveal')
    render(<TurnView context={state.context} send={() => {}} points={machine.points} />)
    expect(screen.getByText('Right!')).toBeDefined()
    expect(screen.getByRole('timer')).toBeDefined()
    expect(screen.getByRole('button', { name: 'Next question' })).toBeDefined()
  })

  it('counts questions: of a set, against the clock, and not at all for one', () => {
    const turn = { options: [], picked: null, results: [true] }
    expect(questionCount(turn, configWith({ questions: 5 }))).toBe('Question 2 of 5')
    expect(questionCount({ ...turn, picked: 0 }, configWith({ questions: 5 }))).toBe('Question 1 of 5')
    expect(questionCount(turn, configWith({ mode: 'clock' }))).toBe('Question 2')
    expect(questionCount(turn, configWith())).toBeNull()
  })
})

describe('choice turn view against the clock', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0) // the turn ends at 30 s, so the clock doesn't run out first
  })
  afterEach(() => vi.useRealTimers())

  it('shows the result for 0.75 seconds, then goes on by itself, with no button to tap', () => {
    const send = vi.fn()
    render(<TurnView context={atResult('Lagos', { mode: 'clock' }).context} send={send} points={machine.points} />)
    expect(screen.getByText("Not quite: it's Abuja.")).toBeDefined()
    expect(screen.getByText('Next question').closest('button')!.getAttribute('aria-hidden')).toBe('true')
    act(() => vi.advanceTimersByTime(autoNextMs - 1))
    expect(send).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(1))
    expect(send).toHaveBeenCalledExactlyOnceWith({ type: 'continue' })
  })

  it('waits for a tap in a set of questions, and fades each new question in', () => {
    const send = vi.fn()
    render(<TurnView context={atResult('Abuja', { questions: 3 }).context} send={send} points={machine.points} />)
    act(() => vi.advanceTimersByTime(5000))
    expect(send).not.toHaveBeenCalledWith({ type: 'continue' })
    expect(screen.getByRole('heading', { name: 'What is the capital of Nigeria?' }).closest('.animate-fade-in')).not.toBeNull()
  })
})

describe('choice settings view', () => {
  function Settings() {
    const [settings, setSettings] = useState(configWith())
    return <ChoiceSettingsView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
  }

  it('picks the mode, with questions per turn only for a set number, 1 to 10', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const stepper = () => within(screen.getByRole('group', { name: 'Questions per turn' }))
    expect(stepper().getByText('1')).toBeDefined()
    for (let i = 0; i < 12; i++) await user.click(stepper().getByRole('button', { name: 'More: Questions per turn' }))
    expect(stepper().getByText('10')).toBeDefined()
    await user.click(screen.getByRole('radio', { name: /Against the clock/ }))
    expect(screen.queryByRole('group', { name: 'Questions per turn' })).toBeNull()
  })

  it('sets points from 1 to 5, and the order of the options', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const points = within(screen.getByRole('group', { name: 'Points for a right answer' }))
    expect(points.getByText('1 point')).toBeDefined()
    for (let i = 0; i < 6; i++) await user.click(points.getByRole('button', { name: 'More: Points for a right answer' }))
    expect(points.getByText('5 points')).toBeDefined()
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Shuffled/ }).checked).toBe(true)
    await user.click(screen.getByRole('radio', { name: /A to Z/ }))
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /A to Z/ }).checked).toBe(true)
  })
})

describe('choice settings view on a variant', () => {
  it('shows only the open settings, with questions per turn on its own when the mode is closed', () => {
    const view = (open: string[], changes: Partial<ChoiceConfig> = {}) =>
      render(<ChoiceSettingsView settings={configWith(changes)} onChange={() => {}} open={open} />)
    const { unmount } = view(['questions'])
    expect(screen.queryByRole('radio', { name: /Against the clock/ })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Questions per turn' })).toBeDefined()
    expect(screen.queryByRole('group', { name: 'Points for a right answer' })).toBeNull()
    expect(screen.queryByRole('radio', { name: /A to Z/ })).toBeNull()
    unmount()
    const clock = view(['mode', 'questions', 'order'], { mode: 'clock' })
    expect(screen.getByRole('radio', { name: /Against the clock/ })).toBeDefined()
    expect(screen.queryByRole('group', { name: 'Questions per turn' })).toBeNull()
    expect(screen.getByRole('radio', { name: /A to Z/ })).toBeDefined()
    clock.unmount()
    expect(view(['rounds']).container.textContent).toBe('')
  })
})

describe('choice Free Play settings', () => {
  it('reads and sets the length: 10, 20 or 50 questions with no clock, or against the clock', () => {
    expect([lengthOf({ mode: 'questions', questions: 20 }), lengthOf({ mode: 'clock', questions: 20 }), lengthOf({ mode: 'questions', questions: 7 })]).toEqual(['20', 'clock', undefined])
    expect(lengthSettings('50')).toEqual({ mode: 'questions', questions: 50, timer: false })
    expect(lengthSettings('clock')).toEqual({ mode: 'clock', timer: true })
    expect(lengthOf({ ...configWith(), ...choiceFreePlay.settings })).toBe('10')
  })

  it('offers the lengths, and the clock’s time only against the clock', async () => {
    const user = userEvent.setup()
    function Settings() {
      const [settings, setSettings] = useState({ ...configWith(), ...choiceFreePlay.settings })
      return <ChoiceFreePlayView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
    }
    render(<Settings />)
    expect(screen.getByRole<HTMLInputElement>('radio', { name: /10 questions/ }).checked).toBe(true)
    expect(screen.queryByRole('group', { name: 'Time' })).toBeNull()
    await user.click(screen.getByRole('radio', { name: /Against the clock/ }))
    expect(within(screen.getByRole('group', { name: 'Time' })).getByText('30 seconds')).toBeDefined()
  })
})
