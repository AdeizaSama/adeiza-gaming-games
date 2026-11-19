// @vitest-environment happy-dom
import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { send as step, start } from '../../../sdk/machine/runner'
import { TriviaConfig } from '../config'
import { machine } from '../machine'
import type { TriviaItem } from '../schema'
import { SettingsView } from './SettingsView'
import { autoNextMs, questionCount, TurnView } from './TurnView'

// One question, so every state below is on it, whatever the seed.
const items: TriviaItem[] = [{ question: 'What is the capital of Nigeria?', options: ['Lagos', 'Abuja', 'Kano', 'Ibadan'], answer: 'Abuja', tags: [] }]
const configWith = (changes: Partial<TriviaConfig> = {}) => TriviaConfig.parse({ teams: ['Lions', 'Eagles'], packs: ['back-to-school'], ...changes })

/** A real state from the machine: the first question of the first turn, or its result after picking `option`. */
const atQuestion = (changes: Partial<TriviaConfig> = {}) => step(machine, start(machine, { input: { config: configWith(changes), items }, seed: 1 }), { type: 'start' }, { now: 0 })
const atResult = (option: string, changes: Partial<TriviaConfig> = {}) => {
  const state = atQuestion(changes)
  return step(machine, state, { type: 'answer', index: state.context.turn.options.indexOf(option) }, { now: 0 })
}
const options = () => within(screen.getByRole('list', { name: 'Options' }))

describe('Trivia Night turn', () => {
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

describe('Trivia Night against the clock', () => {
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

describe('Trivia Night settings', () => {
  function Settings() {
    const [settings, setSettings] = useState(configWith())
    return <SettingsView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
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
