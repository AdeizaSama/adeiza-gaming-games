// @vitest-environment happy-dom
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Countdown } from './Countdown'
import { FlashCard } from './FlashCard'
import { Handoff } from './Handoff'

describe('Handoff', () => {
  it('names who gets the phone, and calls onReady when they tap Start', async () => {
    const user = userEvent.setup()
    const onReady = vi.fn()
    render(<Handoff to="Lions" detail="Round 2 of 3" onReady={onReady} />)

    expect(screen.getByRole('heading', { name: 'Lions' })).toBeDefined()
    expect(screen.getByText('Round 2 of 3')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Start' }))
    expect(onReady).toHaveBeenCalledTimes(1)
  })
})

describe('FlashCard', () => {
  it('shows the item and reports Got it and Skip', async () => {
    const user = userEvent.setup()
    const onGot = vi.fn()
    const onSkip = vi.fn()
    render(<FlashCard text="Puff puff" hint="Describe it" onGot={onGot} onSkip={onSkip} />)

    expect(screen.getByText('Puff puff')).toBeDefined()
    expect(screen.getByText('Describe it')).toBeDefined()
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    await user.click(screen.getByRole('button', { name: 'Skip' }))
    expect(onGot).toHaveBeenCalledTimes(1)
    expect(onSkip).toHaveBeenCalledTimes(2)
  })
})

describe('Countdown', () => {
  // Fake timers: the test moves time forward by hand, so a 60-second countdown takes no real time.
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })
  afterEach(() => vi.useRealTimers())

  const timer = () => screen.getByRole('timer')

  it('shows whole seconds left, rounded up, and counts down', () => {
    render(<Countdown endsAt={60_000} onTimeUp={() => {}} />)
    expect(timer().textContent).toBe('60')
    act(() => vi.advanceTimersByTime(1_000))
    expect(timer().textContent).toBe('59')
    act(() => vi.advanceTimersByTime(58_500))
    expect(timer().textContent).toBe('1')
  })

  it('calls onTimeUp once, when time runs out', () => {
    const onTimeUp = vi.fn()
    render(<Countdown endsAt={3_000} onTimeUp={onTimeUp} />)
    act(() => vi.advanceTimersByTime(2_900))
    expect(onTimeUp).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(5_000))
    expect(onTimeUp).toHaveBeenCalledTimes(1)
    expect(timer().textContent).toBe('0')
  })

  it('calls onTimeUp straight away if the time has already passed', () => {
    const onTimeUp = vi.fn()
    vi.setSystemTime(10_000)
    render(<Countdown endsAt={5_000} onTimeUp={onTimeUp} />)
    expect(onTimeUp).toHaveBeenCalledTimes(1)
  })

  it('turns to the warning color from warnAt seconds left', () => {
    render(<Countdown endsAt={15_000} warnAt={10} onTimeUp={() => {}} />)
    expect(timer().className).not.toContain('text-warning')
    act(() => vi.advanceTimersByTime(5_000))
    expect(timer().className).toContain('text-warning')
  })

  it('vibrates when time runs out, on phones that can', () => {
    const vibrate = vi.fn(() => true)
    vi.stubGlobal('navigator', { ...navigator, vibrate })
    render(<Countdown endsAt={1_000} onTimeUp={() => {}} />)
    act(() => vi.advanceTimersByTime(1_000))
    expect(vibrate).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
