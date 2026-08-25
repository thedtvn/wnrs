import { describe, expect, it, vi, afterEach, beforeEach } from 'vitest'
import { cleanup, renderWithChakra, screen } from '@src/test/utils'
import { TimerBar } from './TimerBar'
import { useCountdown } from './useCountdown'
import { renderHook, act } from '@testing-library/react'

describe('TimerBar', () => {
  afterEach(cleanup)

  it('clamps pct to 0 when timeLeft is negative (-10)', () => {
    renderWithChakra(<TimerBar timeLeft={-10} total={60} />)
    const bar = document.querySelector('[data-timer-fill]') as HTMLElement
    expect(bar.style.width).toBe('0%')
  })

  it('clamps pct to 100 when timeLeft exceeds total (150 > 60)', () => {
    renderWithChakra(<TimerBar timeLeft={150} total={60} />)
    const bar = document.querySelector('[data-timer-fill]') as HTMLElement
    expect(bar.style.width).toBe('100%')
  })

  it('renders label with seconds suffix', () => {
    renderWithChakra(<TimerBar timeLeft={30} total={60} />)
    expect(screen.getByText('30s')).toBeInTheDocument()
  })
})

describe('useCountdown', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers(); cleanup() })

  it('returns 0 for null deadline', () => {
    const { result } = renderHook(() => useCountdown(null, 0))
    expect(result.current).toBe(0)
  })

  it('counts down from a valid deadline', () => {
    const deadline = Date.now() + 5000
    const { result } = renderHook(() => useCountdown(deadline, 0))
    expect(result.current).toBeGreaterThan(0)
    act(() => { vi.advanceTimersByTime(3000) })
    expect(result.current).toBeLessThanOrEqual(3)
  })
})
