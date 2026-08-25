import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderWithChakra, screen, cleanup, fireEvent, waitFor } from '@src/test/utils'
import App from './App'
import { useDiscord } from '@src/discord/DiscordContext'

vi.mock('@src/discord/DiscordContext', () => ({
  useDiscord: vi.fn(),
  DiscordProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@src/pages/Home', () => ({
  default: () => <div data-testid="stub-home">Home Stub</div>
}))

vi.mock('@src/pages/Game', () => ({
  default: ({ onExit }: { onExit: () => void }) => (
    <div data-testid="stub-game">
      <div>Game Stub</div>
      <button onClick={onExit}>Exit Game</button>
    </div>
  )
}))

afterEach(() => cleanup())

describe('App', () => {
  it('mode=connecting renders Connecting to Discord and Spinner', () => {
    vi.mocked(useDiscord).mockReturnValue({
      mode: 'connecting',
      error: null,
      closeActivity: vi.fn(),
    } as any)
    const { container } = renderWithChakra(<App />)
    expect(screen.getByText('Connecting to Discord…')).toBeInTheDocument()
    
    // Check for spinner class or just assume it renders based on Chakra UI classes
    expect(container.querySelector('.chakra-spinner')).toBeInTheDocument()
    
    expect(screen.queryByTestId('stub-home')).not.toBeInTheDocument()
  })

  it('mode=discord and error shows Authentication Failed and Close performs closeActivity', () => {
    const closeActivityMock = vi.fn()
    vi.mocked(useDiscord).mockReturnValue({
      mode: 'discord',
      error: 'Invalid token',
      closeActivity: closeActivityMock,
    } as any)
    renderWithChakra(<App />)
    
    expect(screen.getByText('Authentication Failed')).toBeInTheDocument()
    expect(screen.getByText('Invalid token')).toBeInTheDocument()
    
    const closeBtn = screen.getByRole('button', { name: /close/i })
    fireEvent.click(closeBtn)
    expect(closeActivityMock).toHaveBeenCalledTimes(1)
  })

  it('onExit in Game calls navigate and updates hash to #/', async () => {
    vi.mocked(useDiscord).mockReturnValue({
      mode: 'discord',
      error: null,
      closeActivity: vi.fn(),
    } as any)
    
    window.location.hash = '#/game?seed=test123'
    renderWithChakra(<App />)
    
    expect(screen.getByTestId('stub-game')).toBeInTheDocument()
    expect(screen.queryByTestId('stub-home')).not.toBeInTheDocument()
    
    const exitBtn = screen.getByRole('button', { name: /exit game/i })
    fireEvent.click(exitBtn)
    
    // Manually trigger hashchange event since jsdom doesn't do it automatically
    window.dispatchEvent(new Event('hashchange'))
    
    expect(window.location.hash).toBe('#/')
    await waitFor(() => {
      expect(screen.getByTestId('stub-home')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('stub-game')).not.toBeInTheDocument()
  })
})
