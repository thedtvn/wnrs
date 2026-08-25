import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, renderWithChakra, screen } from '@src/test/utils'
import { lobbyState, answeringState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'
import Game from '@src/pages/Game'

const mockedSync = vi.hoisted(() => ({
  state: null as GameState | null,
  connected: true,
  error: null as string | null,
  clockOffset: 0,
  sendReady: vi.fn(),
  sendUnready: vi.fn(),
  sendStart: vi.fn(),
  sendSetSettings: vi.fn(),
  sendSubmitAnswer: vi.fn(),
  sendRevealNext: vi.fn(),
  sendRateAnswer: vi.fn(),
  sendNextQuestion: vi.fn(),
  sendTransferHost: vi.fn(),
  sendSpectate: vi.fn(),
  sendUnspectate: vi.fn(),
}))

vi.mock('@src/hooks/useGameSync', () => ({
  useGameSync: () => mockedSync,
}))
vi.mock('@src/discord/DiscordContext', () => ({
  useDiscord: () => ({ user: { id: 'p1', name: 'P1' }, instanceId: null, jwt: null, mode: 'web' }),
}))

const route = { view: 'game' as const, seed: 'test-seed' }
const onExit = vi.fn()

describe('Game smoke tests (pre-split baseline)', () => {
  afterEach(() => {
    cleanup()
    mockedSync.state = null
    mockedSync.connected = true
    mockedSync.error = null
  })

  it('renders loading spinner when sync.state is null', () => {
    mockedSync.state = null
    mockedSync.connected = true
    renderWithChakra(<Game route={route} onExit={onExit} />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders midgame gate when first state is non-lobby', () => {
    mockedSync.state = answeringState() as unknown as GameState
    renderWithChakra(<Game route={route} onExit={onExit} />)
    expect(screen.getByText('Game in Progress')).toBeInTheDocument()
    expect(screen.getByText('Watch as Spectator')).toBeInTheDocument()
  })

  it('renders LobbyPhase when phase is lobby', () => {
    mockedSync.state = lobbyState() as unknown as GameState
    renderWithChakra(<Game route={route} onExit={onExit} />)
    expect(screen.getByText('Lobby')).toBeInTheDocument()
  })

  it('renders AnsweringPhase question when phase is answering', () => {
    const state = answeringState() as unknown as GameState
    mockedSync.state = lobbyState() as unknown as GameState
    const { rerender } = renderWithChakra(<Game route={route} onExit={onExit} />)
    mockedSync.state = state
    rerender(<Game route={route} onExit={onExit} />)
    expect(screen.getAllByText('What is your favourite colour?').length).toBeGreaterThan(0)
  })

  it('renders host label and lobby title in lobby', () => {
    mockedSync.state = lobbyState() as unknown as GameState
    renderWithChakra(<Game route={route} onExit={onExit} />)
    expect(screen.getByText('Lobby')).toBeInTheDocument()
    expect(screen.getByText('HOST')).toBeInTheDocument()
  })

  it('renders loading with error message when sync.error is set', () => {
    mockedSync.state = null
    mockedSync.error = 'Connection failed: test error'
    renderWithChakra(<Game route={route} onExit={onExit} />)
    expect(screen.getByText('Connection failed: test error')).toBeInTheDocument()
  })
})
