import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { Button } from './button'

afterEach(() => cleanup())

describe('Button', () => {
  it('renders children and fires onClick', () => {
    const onClick = vi.fn()
    renderWithChakra(<Button onClick={onClick}>Go</Button>)
    fireEvent.click(screen.getByText('Go'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies the solid variant by default', () => {
    const { container } = renderWithChakra(<Button>Go</Button>)
    expect(container.querySelector('button')).toBeInTheDocument()
  })

  it('accepts every legacy variant name without type error', () => {
    for (const v of ['default', 'secondary', 'ghost', 'destructive', 'accent', 'outline'] as const) {
      renderWithChakra(<Button variant={v}>X</Button>)
      cleanup()
    }
  })

  it('accepts every legacy size name', () => {
    for (const s of ['default', 'sm', 'lg', 'icon'] as const) {
      renderWithChakra(<Button size={s}>X</Button>)
      cleanup()
    }
  })

  it('does not fire onClick when disabled', () => {
    const onClick = vi.fn()
    renderWithChakra(<Button disabled onClick={onClick}>No</Button>)
    fireEvent.click(screen.getByText('No'))
    expect(onClick).not.toHaveBeenCalled()
  })
})
