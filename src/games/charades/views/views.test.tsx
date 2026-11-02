// @vitest-environment happy-dom
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'
import { start } from '../../../sdk/machine/runner'
import { CharadesConfig } from '../config'
import { machine, type CharadesEntry } from '../machine'
import { reviewRow } from './ReviewView'
import { SettingsView } from './SettingsView'
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

describe('Charades settings', () => {
  /** The settings view with the setup screen's part played by a bit of state. */
  function Settings({ mode = 'describe' }: { mode?: 'describe' | 'mix' }) {
    const [settings, setSettings] = useState({ ...config, mode })
    return <SettingsView settings={settings} onChange={(changes) => setSettings((current) => ({ ...current, ...changes }))} />
  }
  const stepper = (label: string) => within(screen.getByRole('group', { name: label }))

  it('picks the mode, Describe to start with', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    const mix = screen.getByRole<HTMLInputElement>('radio', { name: /Mix it up/ })

    expect(screen.getByRole<HTMLInputElement>('radio', { name: /Describe/ }).checked).toBe(true)
    await user.click(mix)
    expect(mix.checked).toBe(true)
  })

  it('changes points in Advanced settings within their limits, and resets them', async () => {
    const user = userEvent.setup()
    render(<Settings mode="mix" />)
    expect(screen.getByText('Describe 2 · Act 3 · Sing 3 · Skip −1')).toBeDefined()

    await user.click(screen.getByRole('button', { name: 'Advanced settings' }))
    const dialog = within(screen.getByRole('dialog', { name: 'Advanced settings' }))
    const reset = dialog.getByRole<HTMLButtonElement>('button', { name: 'Reset to defaults' })
    expect(reset.disabled).toBe(true)

    await user.click(stepper('Acted').getByRole('button', { name: 'More: Acted' }))
    await user.click(stepper('Acted').getByRole('button', { name: 'More: Acted' }))
    expect(stepper('Acted').getByText('5 points')).toBeDefined()
    expect(stepper('Acted').getByRole<HTMLButtonElement>('button', { name: 'More: Acted' }).disabled).toBe(true)
    await user.click(stepper('Skipped').getByRole('button', { name: 'Less: Skipped' }))
    expect(stepper('Skipped').getByText('No penalty')).toBeDefined()
    expect(stepper('Skipped').getByRole<HTMLButtonElement>('button', { name: 'Less: Skipped' }).disabled).toBe(true)
    expect(screen.getByText('Describe 2 · Act 5 · Sing 3 · Skip 0')).toBeDefined()

    await user.click(reset)
    expect(screen.getByText('Describe 2 · Act 3 · Sing 3 · Skip −1')).toBeDefined()
    await user.click(dialog.getByRole('button', { name: 'Done' }))
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('says acted and sung points only count in Mix it up, when Describe is picked', async () => {
    const user = userEvent.setup()
    render(<Settings />)
    await user.click(screen.getByRole('button', { name: 'Advanced settings' }))
    expect(screen.getByText('Acted and sung cards only come up in Mix it up.')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Done' }))

    await user.click(screen.getByRole('radio', { name: /Mix it up/ }))
    await user.click(screen.getByRole('button', { name: 'Advanced settings' }))
    expect(screen.queryByText('Acted and sung cards only come up in Mix it up.')).toBeNull()
  })
})
