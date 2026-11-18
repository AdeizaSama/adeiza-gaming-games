import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'
import { settleDelay } from './sdk/interactions/useSettled'

// Removes whatever a test rendered, so the next test starts with an empty page. Testing Library does this by itself
// only when test functions are global; ours are imported from vitest, so it's done here.
afterEach(() => cleanup())

// Screens keep their buttons off for a moment after time runs out (ADR 0016). Tests tap through at once, so the
// delay is off; the tests of the delay itself turn it back on.
settleDelay.ms = 0
