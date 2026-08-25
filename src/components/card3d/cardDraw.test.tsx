import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, renderWithChakra } from '@src/test/utils'
import { CardDraw } from './index'

afterEach(() => cleanup())

describe('CardDraw', () => {
  it('renders the CSS fallback when WebGL is unavailable', () => {
    // Given
    const question = 'What makes you feel understood?'

    // When
    const { getByText } = renderWithChakra(<CardDraw question={question} onDone={vi.fn()} />)

    // Then
    expect(getByText(question)).toBeVisible()
  })

  it('renders the question text in the fallback', () => {
    // Given
    const question = 'What would you like to learn together?'

    // When
    const { getByText } = renderWithChakra(<CardDraw question={question} onDone={vi.fn()} />)

    // Then
    expect(getByText(question)).toHaveTextContent(question)
  })

  it('calls onDone after durationMs', () => {
    // Given
    vi.useFakeTimers()
    const onDone = vi.fn()

    try {
      renderWithChakra(<CardDraw question="Question" onDone={onDone} durationMs={2000} />)

      // When
      vi.advanceTimersByTime(2000)

      // Then
      expect(onDone).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  })

  it('clears the timer on unmount without calling onDone', () => {
    // Given
    vi.useFakeTimers()
    const onDone = vi.fn()

    try {
      const { unmount } = renderWithChakra(<CardDraw question="Question" onDone={onDone} />)

      // When
      unmount()
      vi.advanceTimersByTime(2000)

      // Then
      expect(onDone).not.toHaveBeenCalled()
    } finally {
      vi.useRealTimers()
    }
  })

  it('mounts in jsdom through only the fallback path', () => {
    // Given
    const question = 'What are you proud of?'

    // When
    const renderCardDraw = () => renderWithChakra(<CardDraw question={question} onDone={vi.fn()} />)

    // Then
    expect(renderCardDraw).not.toThrow()
  })
})
