import './env'
import express from 'express'
import { createServer } from 'node:http'
import path from 'node:path'
import { SignJWT, jwtVerify } from 'jose'
import { attachGameRooms } from './gameRoom'
import type { PlayerInfo } from '../src/shared/types'

const CLIENT_DIST = path.resolve(process.cwd(), 'dist')

const PORT = Number(process.env.PORT ?? 3000)
const DISCORD_CLIENT_ID = process.env.VITE_DISCORD_CLIENT_ID
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET ?? 'wnrs-dev-secret-change-in-prod')

export interface JwtPayload {
  sub: string
  name: string
  instance: string | null
}

const signJwt = (payload: JwtPayload): Promise<string> =>
  new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)

export const verifyJwt = (token: string): Promise<JwtPayload> =>
  jwtVerify(token, JWT_SECRET).then(r => r.payload as unknown as JwtPayload)

const verifyJoin = async (_roomId: string): Promise<boolean> => {
  return true
}

const app = express()
app.use(express.json())

app.post('/api/token', async (req, res) => {
  if (!DISCORD_CLIENT_ID || !DISCORD_CLIENT_SECRET) {
    res.status(500).json({ error: 'Discord OAuth is not configured' })
    return
  }

  const code = req.body?.code
  if (typeof code !== 'string' || !code.length) {
    res.status(400).json({ error: 'Missing authorization code' })
    return
  }

  try {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: DISCORD_CLIENT_ID,
        client_secret: DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
      }),
    })

    if (!response.ok) {
      res.status(502).json({ error: `Discord token exchange failed (${response.status})` })
      return
    }

    const { access_token } = (await response.json()) as { access_token?: string }
    if (!access_token) {
      res.status(502).json({ error: 'Discord returned no access_token' })
      return
    }

    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    if (!userRes.ok) {
      res.status(502).json({ error: 'Failed to fetch Discord user' })
      return
    }
    const discordUser = await userRes.json() as { id: string; global_name?: string; username?: string }

    const jwt = await signJwt({
      sub: discordUser.id,
      name: discordUser.global_name ?? discordUser.username ?? 'Player',
      instance: null,
    })
    res.json({ access_token, jwt })
  } catch (err) {
    console.error('[token]', err)
    res.status(502).json({ error: 'Discord token exchange failed' })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

if (!process.env.VITE_DEV) {
  app.use(express.static(CLIENT_DIST))
  app.use((_req, res) => {
    res.sendFile(path.join(CLIENT_DIST, 'index.html'))
  })
}

const httpServer = createServer(app)
attachGameRooms(httpServer, { verifyJoin })

httpServer.listen(PORT, () => {
  console.log(`wnrs server listening on :${PORT}`)
})
