import { describe, expect, it } from 'vitest'
import { validateMachine } from './validateMachine'

describe('validateMachine', () => {
  it('finds nothing wrong with the fallback last', () => {
    const machine = {
      phases: {
        summary: { on: { next: [{ when: 'roundsRemaining', to: 'handoff' }, { to: 'results' }] } },
        results: {},
      },
    }
    expect(validateMachine(machine)).toEqual([])
  })

  it('ignores single transitions and lists with no fallback', () => {
    const machine = {
      phases: {
        turn: { on: { got: { actions: ['scorePoint'] }, next: [{ when: 'a' }, { when: 'b' }] } },
      },
    }
    expect(validateMachine(machine)).toEqual([])
  })

  it('reports a guarded transition placed after the fallback', () => {
    const machine = {
      phases: {
        summary: { on: { next: [{ to: 'results' }, { when: 'roundsRemaining', to: 'handoff' }] } },
      },
    }
    expect(validateMachine(machine)).toEqual([
      'Phase "summary", event "next": transition 2 (when "roundsRemaining") can never run, ' +
        'because transition 1 has no `when` and always matches. Move the transition without `when` last.',
    ])
  })

  it('reports every unreachable transition, including a second fallback', () => {
    const machine = {
      phases: {
        summary: { on: { next: [{ when: 'a' }, {}, { when: 'b' }, {}] } },
      },
    }
    const problems = validateMachine(machine)
    expect(problems).toHaveLength(2)
    expect(problems[0]).toContain('transition 3 (when "b")')
    expect(problems[1]).toContain('transition 4 with no `when`')
  })
})
