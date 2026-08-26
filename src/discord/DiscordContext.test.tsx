import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DiscordProvider, useDiscord } from './DiscordContext'

const close = vi.fn()
const ready = vi.fn(() => new Promise<void>(() => {}))

vi.mock('@discord/embedded-app-sdk', () => ({
  DiscordSDK: class {
    close = close
    ready = ready
    commands = { setConfig: vi.fn() }
  },
  RPCCloseCodes: { CLOSE_NORMAL: 1000 },
}))

function CloseProbe() {
  const { closeActivity } = useDiscord()
  return <button onClick={() => closeActivity()}>Close activity</button>
}

describe('DiscordProvider', () => {
  beforeEach(() => close.mockClear())

  it('calls DiscordSDK.close when the close action is pressed', async () => {
    render(
      <DiscordProvider>
        <CloseProbe />
      </DiscordProvider>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close activity' }))

    await waitFor(() => {
      expect(close).toHaveBeenCalledWith(1000, 'You exited from app')
    })
  })
})
