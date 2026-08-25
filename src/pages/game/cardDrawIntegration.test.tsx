import { describe, expect, it, vi, afterEach } from 'vitest'
import { act, cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { AnsweringPhase } from './AnsweringPhase'
import { answeringState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'

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

function renderComponent(roundNumber = 1) {
  const sync = makeSync()
  const state = { ...answeringState(), roundNumber }
  const utils = renderWithChakra(
    <AnsweringPhase state={state} sync={sync} amHost={false} isSpectator={false} t={t} />,
  )
  const cardBox = utils.container.querySelector('div[style*="card-in"]') as HTMLElement
  return { ...utils, sync, cardBox }
}

afterEach(() => cleanup())

describe('card draw animation (CSS)', () => {
  it('1. applies the card-in animation when a round enters answering', () => {
    const { cardBox } = renderComponent()
    expect(cardBox).not.toBeNull()
    expect(cardBox.style.animation).toContain('card-in')
  })

  it('2. keeps exactly one animated card on unrelated re-renders within the same round', () => {
    const first = renderComponent()
    const state = { ...answeringState(), round: { ...answeringState().round!, answers: { p1: 'a' } } }
    first.rerender(<AnsweringPhase state={state} sync={makeSync()} amHost={false} isSpectator={false} t={t} />)
    const boxes = first.container.querySelectorAll('div[style*="card-in"]')
    expect(boxes.length).toBe(1)
    expect(screen.getAllByText('What is your favourite colour?').length).toBe(1)
  })

  it('3. replays when roundNumber increments', () => {
    const first = renderComponent()
    first.unmount()
    cleanup()
    const second = renderComponent(2)
    expect(second.cardBox).not.toBeNull()
    expect(second.cardBox.style.animation).toContain('card-in')
  })

  it('4. keeps textarea enabled and submittable while animating', () => {
    const { sync } = renderComponent()
    const textbox = screen.getByRole('textbox')
    expect(textbox).not.toBeDisabled()
    fireEvent.change(textbox, { target: { value: 'My answer' } })
    fireEvent.click(screen.getByRole('button', { name: 'answering.submit' }))
    expect(sync.sendSubmitAnswer).toHaveBeenCalledWith('My answer')
  })

  it('5. keeps host skip clickable while animating', () => {
    const sync = makeSync()
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={sync} amHost={true} isSpectator={false} t={t} />,
    )
    const skip = screen.getByRole('button', { name: 'answering.skipToReveal' })
    fireEvent.click(skip)
    expect(sync.sendRevealNext).toHaveBeenCalled()
  })

  it('6. animation declares its full duration with fill mode', () => {
    const { cardBox } = renderComponent()
    expect(cardBox.style.animation).toContain('700ms')
    expect(cardBox.style.animation).toContain('both')
  })

  it('7. question text renders inside the animated card', () => {
    renderComponent()
    expect(screen.getAllByText('What is your favourite colour?').length).toBe(1)
  })

  it('8. countdown continues ticking while animating', () => {
    vi.useFakeTimers()
    try {
      renderComponent()
      const before = screen.getByText(/^\d+s$/).textContent
      act(() => { vi.advanceTimersByTime(2000) })
      const after = screen.getByText(/^\d+s$/).textContent
      expect(before).not.toBe(after)
    } finally {
      vi.useRealTimers()
    }
  })
})