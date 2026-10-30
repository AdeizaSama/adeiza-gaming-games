// @vitest-environment happy-dom
import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useWakeLock } from './useWakeLock'

/** A phone that grants wake locks: each request returns a lock that can be released. */
function phoneWithWakeLock(request = vi.fn(async () => ({ release: vi.fn(async () => {}) }))) {
  vi.stubGlobal('navigator', { ...navigator, wakeLock: { request } })
  return request
}

/** Lets the browser's promised answer arrive. */
const settle = () => act(async () => {})

function setVisibility(state: 'visible' | 'hidden') {
  Object.defineProperty(document, 'visibilityState', { value: state, configurable: true })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useWakeLock', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('keeps the screen on while shown, and lets it go when the page closes', async () => {
    const request = phoneWithWakeLock()
    const { unmount } = renderHook(() => useWakeLock())
    await settle()
    expect(request).toHaveBeenCalledWith('screen')

    const lock = await request.mock.results[0].value
    unmount()
    expect(lock.release).toHaveBeenCalledTimes(1)
  })

  it('asks again when the page comes back after being hidden', async () => {
    const request = phoneWithWakeLock()
    renderHook(() => useWakeLock())
    await settle()

    setVisibility('hidden') // the browser has dropped the lock
    await settle()
    expect(request).toHaveBeenCalledTimes(1)
    setVisibility('visible')
    await settle()
    expect(request).toHaveBeenCalledTimes(2)
  })

  it('carries on without it where it is missing or refused', async () => {
    expect(() => renderHook(() => useWakeLock())).not.toThrow() // happy-dom has no wake lock

    phoneWithWakeLock(vi.fn(async () => Promise.reject(new Error('NotAllowedError'))))
    const { unmount } = renderHook(() => useWakeLock())
    await settle()
    expect(() => unmount()).not.toThrow()
  })
})
