import { describe, expect, it } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithChakra } from '@src/test/utils'
import { ThemeProvider } from './ThemeContext'

describe('ThemeProvider', () => {
  it('renders children inside a Chakra system and forces dark mode', () => {
    renderWithChakra(
      <ThemeProvider>
        <div data-testid="child">hi</div>
      </ThemeProvider>,
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
  })
})
