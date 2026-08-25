import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderWithChakra, screen, cleanup, fireEvent } from '@src/test/utils'
import Home from './Home'
import { useDiscord } from '@src/discord/DiscordContext'
import { setLocale, LOCALE_EVENT } from '@src/i18n'
import * as router from '@src/client/router'

vi.mock('@src/discord/DiscordContext', () => ({
  useDiscord: vi.fn(),
}))

vi.mock('@src/client/router', () => ({
  navigate: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  setLocale('en') // reset to default locale
})

describe('Home', () => {
  beforeEach(() => {
    vi.mocked(useDiscord).mockReturnValue({
      user: { name: 'TestUser' },
      instanceId: null,
      mode: 'web',
    } as any)
  })

  it('renders title and tagline with default EN strings', () => {
    renderWithChakra(<Home />)
    expect(screen.getByText("Let Talk")).toBeInTheDocument()
    expect(screen.getByText("Online")).toBeInTheDocument()
    expect(screen.getByText('New Game')).toBeInTheDocument()
  })

  it('toggles EN to VI', () => {
    renderWithChakra(<Home />)
    expect(screen.getByText('New Game')).toBeInTheDocument()
    const toggleBtn = screen.getByRole('button', { name: /VI|EN/ })
    fireEvent.click(toggleBtn)
    
    // should appear after locale change
    expect(screen.getByText('Tạo Phòng')).toBeInTheDocument()
  })

  it('Join disabled when input empty', () => {
    renderWithChakra(<Home />)
    const joinBtn = screen.getByRole('button', { name: 'Join' })
    expect(joinBtn).toBeDisabled()
  })

  it('fireEvent.change input with abc then fireEvent.keyDown Enter calls navigate with abc format', () => {
    renderWithChakra(<Home />)
    const input = screen.getByPlaceholderText('Room code')
    fireEvent.change(input, { target: { value: 'abc' } })
    
    const joinBtn = screen.getByRole('button', { name: 'Join' })
    expect(joinBtn).not.toBeDisabled()
    
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })
    
    expect(router.navigate).toHaveBeenCalledWith({ view: 'game', seed: 'abc', names: ['TestUser'] })
  })
})
