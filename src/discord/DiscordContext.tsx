import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { DiscordSDK, RPCCloseCodes } from '@discord/embedded-app-sdk'
import type { PlayerInfo } from '@src/shared/types'

export type DiscordMode = 'connecting' | 'discord' | 'error'

interface DiscordContextValue {
  mode: DiscordMode
  user: PlayerInfo | null
  instanceId: string | null
  channelId: string | null
  error: string | null
  jwt: string | null
  closeActivity: (reason?: string, code?: number) => void
}

const DiscordContext = createContext<DiscordContextValue>({
  mode: 'connecting',
  user: null,
  instanceId: null,
  channelId: null,
  error: null,
  jwt: null,
  closeActivity: () => {},
})

export const useDiscord = () => useContext(DiscordContext)

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('timeout')), ms)),
  ])

const CLIENT_ID = import.meta.env.VITE_DISCORD_CLIENT_ID as string | undefined

export function DiscordProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DiscordMode>('connecting')
  const [user, setUser] = useState<PlayerInfo | null>(null)
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [channelId, setChannelId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [jwt, setJwt] = useState<string | null>(null)
  const sdkRef = useRef<DiscordSDK | null>(null)
  const setupStarted = useRef(false)

  const closeActivity = useCallback((reason?: string, code?: number) => {
    const discordSdk = sdkRef.current
    if (!discordSdk) {
      window.close()
      return
    }

    try {
      discordSdk.close(
        (code ?? RPCCloseCodes.CLOSE_NORMAL) as RPCCloseCodes,
        reason ?? 'You exited from app',
      )
    } catch {
      window.close()
    }
  }, [])

  useEffect(() => {
    if (setupStarted.current) return
    setupStarted.current = true

    if (!CLIENT_ID) {
      setError('VITE_DISCORD_CLIENT_ID is not configured')
      setMode('error')
      return
    }

    const setup = async () => {
      const discordSdk = new DiscordSDK(CLIENT_ID)
      sdkRef.current = discordSdk
      discordSdk.commands.setConfig({
        use_interactive_pip: false
      })
      await withTimeout(discordSdk.ready(), 15000)

      const { code } = await discordSdk.commands.authorize({
        client_id: CLIENT_ID,
        response_type: 'code',
        state: '',
        prompt: 'none',
        scope: ['identify'],
      })

      const isProxy = window.location.hostname.endsWith('.discordsays.com')
      const tokenRes = await fetch(isProxy ? '/.proxy/api/token' : '/api/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, instance_id: discordSdk.instanceId }),
      })
      if (!tokenRes.ok) throw new Error(`token exchange failed (${tokenRes.status})`)
      const { access_token, jwt: token } = (await tokenRes.json()) as { access_token?: string; jwt?: string }
      if (!access_token) throw new Error('no access_token')
      if (token) setJwt(token)

      const auth = await discordSdk.commands.authenticate({ access_token })
      const name =
        auth.user?.global_name ?? auth.user?.username ?? 'Player'

      let avatarUrl: string | undefined
      if (auth.user?.avatar) {
        avatarUrl = `https://cdn.discordapp.com/avatars/${auth.user.id}/${auth.user.avatar}.png?size=256`
      } else if (auth.user?.id) {
        const idx = (BigInt(auth.user.id) >> 22n) % 6n
        avatarUrl = `https://cdn.discordapp.com/embed/avatars/${idx}.png`
      }

      setInstanceId(discordSdk.instanceId ?? null)
      setChannelId(discordSdk.channelId ?? null)
      setUser({ id: auth.user?.id ?? 'unknown', name, avatar: avatarUrl })
      setMode('discord')
    }

    setup().catch((err) => {
      console.error('[Discord Auth]', err)
      setError(err instanceof Error ? err.message : 'Discord authentication failed')
      setMode('error')
    })
  }, [])

  return (
    <DiscordContext.Provider value={{ mode, user, instanceId, channelId, error, jwt, closeActivity }}>
      {children}
    </DiscordContext.Provider>
  )
}
