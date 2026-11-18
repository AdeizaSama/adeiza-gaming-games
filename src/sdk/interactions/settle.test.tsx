// @vitest-environment happy-dom
import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Review } from './Review'
import { Summary } from './Summary'
import { settleDelay, useSettled } from './useSettled'

// The delay is off in every other test (src/testSetup.ts); here it's on, with a fake clock.
beforeEach(() => {
  settleDelay.ms = 2000
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  settleDelay.ms = 0
})

const button = (name: string) => screen.getByRole<HTMLButtonElement>('button', { name })
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms))

describe('useSettled', () => {
  it('is false for the delay after the component first shows, then true; with no delay, true at once', () => {
    const { result } = renderHook(() => useSettled())
    expect(result.current).toBe(false)
    wait(1999)
    expect(result.current).toBe(false)
    wait(1)
    expect(result.current).toBe(true)
    expect(renderHook(() => useSettled(0)).result.current).toBe(true)
  })
})

describe('buttons after time runs out', () => {
  it('keeps the turn summary’s Next off for 2 seconds', () => {
    render(<Summary title="Lions" points={2} onNext={() => {}} />)
    expect(button('Next').disabled).toBe(true)
    wait(2000)
    expect(button('Next').disabled).toBe(false)
  })

  it('keeps review’s Adjust and Done off for 2 seconds', () => {
    render(<Review title="Lions" rows={[{ text: 'Gala', result: 'Got it', tone: 'good' }]} onToggle={() => {}} onDone={() => {}} />)
    expect([button('Adjust').disabled, button('Done').disabled]).toEqual([true, true])
    wait(2000)
    expect([button('Adjust').disabled, button('Done').disabled]).toEqual([false, false])
  })
})
