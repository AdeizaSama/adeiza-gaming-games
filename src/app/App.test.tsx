// @vitest-environment happy-dom
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('shows the name and subtitle', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: 'Ku Zo Wasa' })).toBeDefined()
    expect(screen.getByText('Party games for one phone.')).toBeDefined()
  })
})
