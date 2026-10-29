import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Removes whatever a test rendered, so the next test starts with an empty page. Testing Library does this by itself
// only when test functions are global; ours are imported from vitest, so it's done here.
afterEach(() => cleanup())
