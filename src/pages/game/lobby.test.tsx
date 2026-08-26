import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { TimerBar } from './TimerBar'
import { LobbyPhase } from './LobbyPhase'
import { lobbyState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'

vi.mock('@src/discord/DiscordContext', () => ({
  useDiscord: () => ({ user: { id: 'p1', name: 'P1' }, instanceId: null, jwt: null, mode: 'web' }),
}))

const t = (k: string) => k

const makeSync = () =>
  ({
    clockOffset: 0,
    sendStart: vi.fn(),
    sendReady: vi.fn(),
    sendUnready: vi.fn(),
    sendSpectate: vi.fn(),
    sendUnspectate: vi.fn(),
    sendSetSettings: vi.fn(),
    sendTransferHost: vi.fn(),
  }) as unknown as ReturnType<typeof useGameSync>

afterEach(() => cleanup())

describe('TimerBar', () => {
  it('shows "{n}s" label', () => {
    renderWithChakra(<TimerBar timeLeft={30} total={60} />)
    expect(screen.getByText('30s')).toBeInTheDocument()
  })

  it('clamps negative timeLeft to 0% width', () => {
    const { container } = renderWithChakra(<TimerBar timeLeft={-10} total={60} />)
    const fill = container.querySelector('[data-timer-fill]') as HTMLElement
    expect(fill.style.width).toBe('0%')
  })

  it('clamps overflow timeLeft to 100% width', () => {
    const { container } = renderWithChakra(<TimerBar timeLeft={120} total={60} />)
    const fill = container.querySelector('[data-timer-fill]') as HTMLElement
    expect(fill.style.width).toBe('100%')
  })
})

describe('LobbyPhase', () => {
  it('lists all players with a host badge on the host', () => {
    const s = lobbyState()
    renderWithChakra(<LobbyPhase state={s} sync={makeSync()} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />)
    expect(screen.getAllByText('P1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('P2').length).toBeGreaterThan(0)
    expect(screen.getAllByText('common.host').length).toBeGreaterThan(0)
  })

  it('shows ready badge for ready players', () => {
    const s = lobbyState()
    renderWithChakra(<LobbyPhase state={s} sync={makeSync()} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />)
    expect(screen.getByText('✓')).toBeInTheDocument()
  })

  it('renders host-only controls when amHost and hides them otherwise', () => {
    const s = lobbyState()
    const { unmount } = renderWithChakra(
      <LobbyPhase state={s} sync={makeSync()} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />,
    )
    expect(screen.getByRole('button', { name: 'lobby.startGame' })).toBeInTheDocument()
    unmount()
    cleanup()
    const s2 = lobbyState()
    s2.readyIds = ['p1']
    renderWithChakra(
      <LobbyPhase state={s2} sync={makeSync()} amHost={false} isSpectator={false} userId="p1" t={t} locale="en" />,
    )
    expect(screen.queryByRole('button', { name: 'lobby.startGame' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /lobby\.(readyUp|unready)/ })).toBeInTheDocument()
  })

  it('disables Start until every non-host player is ready', () => {
    const s = lobbyState()
    s.players.push({ id: 'p3', name: 'P3' })
    renderWithChakra(<LobbyPhase state={s} sync={makeSync()} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />)
    expect(screen.getByRole('button', { name: 'lobby.startGame' })).toBeDisabled()
  })

  it('sends settings on Save with edited values', () => {
    const sync = makeSync()
    const s = lobbyState()
    renderWithChakra(<LobbyPhase state={s} sync={sync} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />)
    fireEvent.click(screen.getByRole('button', { name: 'lobby.hostSettings' }))
    const roundsInput = screen.getByDisplayValue('0') as HTMLInputElement
    fireEvent.change(roundsInput, { target: { value: '5' } })
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }))
    expect(sync.sendSetSettings).toHaveBeenCalledTimes(1)
    const arg = (sync.sendSetSettings as ReturnType<typeof vi.fn>).mock.calls[0][0]
    expect(arg.totalRounds).toBe(5)
    expect(arg.answerSeconds).toBe(60)
    expect(arg.ratingSeconds).toBe(30)
    expect(screen.queryByRole('button', { name: 'common.save' })).not.toBeInTheDocument()
  })

  it('renders readOnly DeckSelector for non-hosts', () => {
    const s = lobbyState()
    s.readyIds = ['p1']
    renderWithChakra(<LobbyPhase state={s} sync={makeSync()} amHost={false} isSpectator={false} userId="p1" t={t} locale="en" />)
    expect(screen.getAllByText(/main/i).length).toBeGreaterThan(0)
    expect(screen.queryByRole('button', { name: 'lobby.hostSettings' })).not.toBeInTheDocument()
  })

  it('binds slider values through settings state', () => {
    const s = lobbyState()
    s.settings.answerSeconds = 45
    s.settings.ratingSeconds = 20
    renderWithChakra(<LobbyPhase state={s} sync={makeSync()} amHost={true} isSpectator={false} userId="p1" t={t} locale="en" />)
    fireEvent.click(screen.getByRole('button', { name: 'lobby.hostSettings' }))
    expect(screen.getByText('45s')).toBeInTheDocument()
    expect(screen.getByText('20s')).toBeInTheDocument()
  })
})
