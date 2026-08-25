import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { AnsweringPhase } from './AnsweringPhase'
import { answeringState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'

vi.mock('@src/components/card3d/CardDrawCanvas', () => ({ default: () => null }))
vi.mock('@src/discord/DiscordContext', () => ({
  useDiscord: () => ({ user: { id: 'p1', name: 'P1' }, instanceId: null, jwt: null, mode: 'web' }),
}))

const t = (k: string) => k

const makeSync = () =>
  ({
    clockOffset: 0,
    sendSubmitAnswer: vi.fn(),
    sendRevealNext: vi.fn(),
  }) as unknown as ReturnType<typeof useGameSync>

function renderComponent(stateOverrides?: { roundNumber?: number }) {
  const sync = makeSync()
  let state = answeringState()
  if (stateOverrides?.roundNumber !== undefined) {
    state = { ...state, roundNumber: stateOverrides.roundNumber }
    state.round = { ...state.round!, question: 'New Question' }
  }
  const utils = renderWithChakra(
    <AnsweringPhase state={state} sync={sync} amHost={false} isSpectator={false} t={t} />,
  )
  return { ...utils, sync }
}

const overlays = () => document.querySelectorAll('[data-testid="card-draw-overlay"]')

afterEach(() => cleanup())

describe('cardDrawIntegration', () => {
  it('1. mounts CardDraw when a new roundNumber enters answering phase', () => {
    renderComponent()
    expect(overlays().length).toBeGreaterThan(0)
    const overlay = overlays()[0] as HTMLElement
    expect(getComputedStyle(overlay).pointerEvents).toBe('none')
    expect(screen.getAllByText('What is your favourite colour?').length).toBeGreaterThan(1)
  })

  it('2. does NOT remount/retrigger on unrelated re-render within same round', () => {
    const first = renderComponent()
    const state = { ...answeringState(), round: { ...answeringState().round!, answers: { p1: 'a', p2: 'b' } } }
    first.rerender(<AnsweringPhase state={state} sync={makeSync()} amHost={false} isSpectator={false} t={t} />)
    expect(overlays().length).toBe(1)
  })

  it('3. replays when roundNumber increments', () => {
    const first = renderComponent()
    first.unmount()
    cleanup()
    renderComponent({ roundNumber: 2 })
    expect(overlays().length).toBeGreaterThan(0)
    expect(screen.getAllByText('New Question').length).toBeGreaterThan(1)
  })

  it('4. keeps textarea enabled and submittable while overlay mounted', () => {
    const { sync } = renderComponent()
    const textbox = screen.getByRole('textbox')
    expect(textbox).not.toBeDisabled()
    fireEvent.change(textbox, { target: { value: 'My answer' } })
    fireEvent.click(screen.getByRole('button', { name: 'answering.submit' }))
    expect(sync.sendSubmitAnswer).toHaveBeenCalledWith('My answer')
  })

  it('5. keeps host skip clickable while overlay mounted', () => {
    const sync = makeSync()
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={sync} amHost={true} isSpectator={false} t={t} />,
    )
    const skip = screen.getByRole('button', { name: 'answering.skipToReveal' })
    expect(skip).not.toBeDisabled()
    fireEvent.click(skip)
    expect(sync.sendRevealNext).toHaveBeenCalled()
  })

  it('6. unmounts overlay after onDone fires', () => {
    vi.useFakeTimers()
    try {
      renderComponent()
      expect(overlays().length).toBe(1)
      act(() => { vi.advanceTimersByTime(2800) })
      expect(overlays().length).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('7. overlay container has pointer-events none and aria-hidden', () => {
    renderComponent()
    const overlay = overlays()[0] as HTMLElement
    expect(overlay).not.toBeNull()
    expect(getComputedStyle(overlay).pointerEvents).toBe('none')
    expect(overlay.getAttribute('aria-hidden')).toBe('true')
  })

  it('8. countdown continues ticking while overlay mounted', () => {
    vi.useFakeTimers()
    try {
      renderComponent()
      const before = screen.getByText(/^\d+s$/).textContent
      act(() => { vi.advanceTimersByTime(2800) })
      const after = screen.getByText(/^\d+s$/).textContent
      expect(before).not.toBe(after)
    } finally {
      vi.useRealTimers()
    }
  })
})
