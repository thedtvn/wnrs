import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { AnsweringPhase } from './AnsweringPhase'
import { RevealingPhase } from './RevealingPhase'
import { answeringState, revealingState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'

vi.mock('@src/components/card3d', () => ({ CardDraw: () => null }))
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

afterEach(() => cleanup())

describe('AnsweringPhase', () => {
  it('renders the question text', () => {
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={makeSync()} amHost={false} isSpectator={false} t={t} />,
    )
    expect(screen.getAllByText('What is your favourite colour?').length).toBeGreaterThan(0)
  })

  it('disables Submit for empty or whitespace answer', () => {
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={makeSync()} amHost={false} isSpectator={false} t={t} />,
    )
    const submit = screen.getByRole('button', { name: 'answering.submit' })
    expect(submit).toBeDisabled()
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    expect(submit).toBeDisabled()
  })

  it('calls sendSubmitAnswer with the trimmed answer', () => {
    const sync = makeSync()
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={sync} amHost={false} isSpectator={false} t={t} />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  hi there  ' } })
    fireEvent.click(screen.getByRole('button', { name: 'answering.submit' }))
    expect(sync.sendSubmitAnswer).toHaveBeenCalledWith('hi there')
  })

  it('shows submitted state and hides the textarea after submitting', () => {
    const s = answeringState()
    s.round!.answers['p1'] = 'Blue'
    renderWithChakra(<AnsweringPhase state={s} sync={makeSync()} amHost={false} isSpectator={false} t={t} />)
    expect(screen.getByText(/answering.submitted/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.getByText(/1 of 2 answered/)).toBeInTheDocument()
  })

  it('shows the spectator notice for spectators', () => {
    const s = answeringState()
    s.spectatorIds = ['p1']
    renderWithChakra(<AnsweringPhase state={s} sync={makeSync()} amHost={false} isSpectator={true} t={t} />)
    expect(screen.getByText('common.spectator')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('does not show a manual reveal control while answers auto-transition', () => {
    renderWithChakra(
      <AnsweringPhase state={answeringState()} sync={makeSync()} amHost={true} isSpectator={false} t={t} />,
    )
    expect(screen.queryByRole('button', { name: 'answering.skipToReveal' })).not.toBeInTheDocument()
  })
})

describe('RevealingPhase', () => {
  it('shows submitted player circles and host reveal button', () => {
    renderWithChakra(<RevealingPhase state={revealingState()} sync={makeSync()} amHost={true} t={t} />)
    expect(screen.getByText(/revealing.submittedPlayers/)).toBeInTheDocument()
    expect(screen.getAllByText('P1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('P2').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'revealing.revealNext' })).toBeInTheDocument()
  })

  it('shows waiting notice for non-hosts', () => {
    renderWithChakra(<RevealingPhase state={revealingState()} sync={makeSync()} amHost={false} t={t} />)
    expect(screen.getByText(/revealing.waitingForHost/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'revealing.revealNext' })).not.toBeInTheDocument()
  })
})
