import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { Avatar } from './avatar'

describe('Avatar', () => {
  afterEach(cleanup)

  it('renders the uppercased first initial when no avatar url is given', () => {
    renderWithChakra(<Avatar name="alice" />)
    expect(screen.getByText('A')).toBeInTheDocument()
  })

  it('renders "?" for an empty name', () => {
    renderWithChakra(<Avatar name="" />)
    expect(screen.getByText('?')).toBeInTheDocument()
  })

  it('renders an img when avatar url is provided', () => {
    renderWithChakra(<Avatar name="a" avatar="https://x/y.png" />)
    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://x/y.png')
  })

  it('falls back to initials after img error', () => {
    renderWithChakra(<Avatar name="bob" avatar="https://x/y.png" />)
    fireEvent.error(screen.getByRole('img'))
    expect(screen.getByText('B')).toBeInTheDocument()
  })

  it('derives a stable hue from the name', () => {
    const { container: c1 } = renderWithChakra(<Avatar name="same" />)
    const el1 = c1.querySelector('div[style]') as HTMLElement
    cleanup()
    const { container: c2 } = renderWithChakra(<Avatar name="same" />)
    const el2 = c2.querySelector('div[style]') as HTMLElement
    expect(el1.style.backgroundColor).toBe(el2.style.backgroundColor)
  })

  it('shows the online dot only when online is defined', () => {
    const { container: c1 } = renderWithChakra(
      <Avatar name="a" online={true} />,
    )
    const dot1 = c1.querySelector('[data-part="status-dot"]')
    expect(dot1).toBeInTheDocument()

    cleanup()
    const { container: c2 } = renderWithChakra(<Avatar name="a" />)
    const dot2 = c2.querySelector('[data-part="status-dot"]')
    expect(dot2).not.toBeInTheDocument()
  })
})
