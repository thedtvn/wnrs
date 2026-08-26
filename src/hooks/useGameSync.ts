import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import type { ClientMessage, GameSettings, GameState, PlayerInfo } from '@src/shared/types'

export interface GameSync {
  state: GameState | null
  connected: boolean
  error: string | null
  fatalError: boolean
  clockOffset: number
  sendReady: () => void
  sendUnready: () => void
  sendSpectate: () => void
  sendUnspectate: () => void
  sendSetSettings: (settings: GameSettings) => void
  sendTransferHost: (targetId: string) => void
  sendStart: () => void
  sendSubmitAnswer: (answer: string) => void
  sendRevealNext: () => void
  sendRateAnswer: (targetId: string, rating: number) => void
  sendNextQuestion: () => void
  sendEndGame: () => void
}

export function useGameSync(roomId: string, user: PlayerInfo | null, jwt?: string | null): GameSync {
  const [state, setState] = useState<GameState | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fatalError, setFatalError] = useState(false)
  const socketRef = useRef<Socket | null>(null)
  const clockOffsetRef = useRef(0)
  const [clockOffset, setClockOffset] = useState(0)
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const connectErrorsRef = useRef(0)

  useEffect(() => {
    if (!roomId) return
    if (roomId.startsWith('discord:') && !jwt) return

    const isDiscord = roomId.startsWith('discord:')
    const isProxy = typeof window !== 'undefined' && window.location.hostname.endsWith('.discordsays.com')
    const auth: Record<string, unknown> = { room: roomId }
    if (jwt) auth.jwt = jwt
    const socket = io('/', {
      auth,
      path: isProxy ? '/.proxy/socket.io' : '/socket.io',
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      connectErrorsRef.current = 0
    })
    socket.on('reconnect_failed', () => setFatalError(true))
    socket.on('disconnect', () => {
      setConnected(false)
    })
    socket.on('connect_error', (err) => {
      console.error('[Socket.IO] connection error:', err.message)
      connectErrorsRef.current += 1
      if (connectErrorsRef.current >= 5) setFatalError(true)
      setError(`Connection failed: ${err.message}`)
    })
    socket.on('state', (msg: { state: GameState }) => setState(msg.state))
    socket.on('clock', (msg: { now: number }) => {
      const offset = msg.now - Date.now()
      clockOffsetRef.current = offset
      setClockOffset(offset)
    })
    socket.on('error', (msg: { message: string }) => {
      setError(msg.message)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
      errorTimerRef.current = setTimeout(() => setError(null), 5000)
    })

    return () => {
      socket.removeAllListeners()
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
      setState(null)
      setError(null)
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current)
    }
  }, [roomId, jwt])

  useEffect(() => {
    if (!socketRef.current || !connected || !user) return
    socketRef.current.emit('join', { type: 'join', user })
  }, [connected, user])

  const emit = (msg: ClientMessage) => {
    socketRef.current?.emit(msg.type, msg)
  }

  return {
    state,
    connected,
    error,
    fatalError,
    clockOffset,
    sendReady: () => emit({ type: 'ready' }),
    sendUnready: () => emit({ type: 'unready' }),
    sendSpectate: () => emit({ type: 'spectate' }),
    sendUnspectate: () => emit({ type: 'unspectate' }),
    sendSetSettings: (settings) => emit({ type: 'setSettings', settings }),
    sendTransferHost: (targetId) => emit({ type: 'transferHost', targetId }),
    sendStart: () => emit({ type: 'start' }),
    sendSubmitAnswer: (answer) => emit({ type: 'submitAnswer', answer }),
    sendRevealNext: () => emit({ type: 'revealNext' }),
    sendRateAnswer: (targetId, rating) => emit({ type: 'rateAnswer', targetId, rating }),
    sendNextQuestion: () => emit({ type: 'nextQuestion' }),
    sendEndGame: () => emit({ type: 'endGame' }),
  }
}
