import { Server, Socket } from 'socket.io'
import type { Server as HttpServer } from 'node:http'
import type {
  ClientMessage,
  GameState,
  PlayerInfo,
} from '../src/shared/types'
import { isClientMessage } from '../src/shared/types'
import { verifyJwt } from './index'
import type { JwtPayload } from './index'
import { shuffle } from '../src/util/helperFn'
import {
  createInitialState,
  handleClientMessage as engineHandle,
  checkTimeouts,
  setQuestionProvider,
  eligiblePlayers,
} from './gameEngine'

const DECK_MAP: Record<string, Deck> = {
  main, family, couples, honestDating, relationship, innerCircle, ownIt,
  breakup, healing, forgiveness, selfReflection, selfLove,
  exfriend, sneakyLink, quarantine, raceAndPrivilege, voting,
  bumbleDate, bumbleBFF, bumbleBizz, cann, valentino, hbomax,
}
import type { Deck } from '../src/shared/types'
import {
  main, family, couples, honestDating, relationship, innerCircle, ownIt,
  breakup, healing, forgiveness, selfReflection, selfLove,
  exfriend, sneakyLink, quarantine, raceAndPrivilege, voting,
  bumbleDate, bumbleBFF, bumbleBizz, cann, valentino, hbomax,
} from '../src/decks'

// ---------------------------------------------------------------------------
// Question provider — wired once at module load
// ---------------------------------------------------------------------------

setQuestionProvider((settings, roundNumber) => {
  const locale = settings.locale === 'vi' ? 'vi' : 'en'
  const allQuestions: string[][] = []
  for (const slug of settings.selectedDecks) {
    const deck = DECK_MAP[slug]
    if (!deck) continue
    const q = deck.questions
    for (let lvl = 0; lvl < q.length; lvl++) {
      if (!allQuestions[lvl]) allQuestions[lvl] = []
      allQuestions[lvl].push(...q[lvl])
    }
  }
  const flat = allQuestions.flat()
  if (flat.length === 0) return locale === 'vi' ? 'Hết câu hỏi!' : 'No more questions!'
  const shuffled = shuffle(flat, `${settings.seed}-r${roundNumber}`)
  return shuffled[(roundNumber - 1) % shuffled.length] ?? shuffled[0]!
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SocketData {
  room: string
  userId: string | null
  jwtPayload: JwtPayload | null
}

interface Room {
  state: GameState
  joinOrder: string[]
  socketsByUser: Map<string, PlayerInfo>
  readyUsers: Set<string>
  spectatorUsers: Set<string>
  timer: ReturnType<typeof setInterval> | null
}

// ---------------------------------------------------------------------------
// Room registry
// ---------------------------------------------------------------------------

const rooms = new Map<string, Room>()

const getRoom = (roomId: string): Room => {
  let room = rooms.get(roomId)
  if (!room) {
    room = {
      state: createInitialState(),
      joinOrder: [],
      socketsByUser: new Map(),
      readyUsers: new Set(),
      spectatorUsers: new Set(),
      timer: null,
    }
    rooms.set(roomId, room)
  }
  return room
}

// ---------------------------------------------------------------------------
// State filtering — redact answers during answering phase
// ---------------------------------------------------------------------------

function filterStateForBroadcast(state: GameState, socketUserId: string | null): GameState {
  if (state.phase !== 'answering' || !state.round) return state
  const filtered: Record<string, string> = {}
  for (const [pid, ans] of Object.entries(state.round.answers)) {
    if (pid === socketUserId) {
      filtered[pid] = ans
    } else {
      filtered[pid] = '•••'
    }
  }
  return { ...state, round: { ...state.round, answers: filtered } }
}

// ---------------------------------------------------------------------------
// Broadcast helpers
// ---------------------------------------------------------------------------

function broadcastFiltered(io: Server, roomId: string, room: Room): void {
  const sockets = io.sockets.adapter.rooms.get(roomId)
  if (!sockets) return
  for (const socketId of sockets) {
    const socket = io.sockets.sockets.get(socketId)
    if (!socket) continue
    const userId = (socket.data as SocketData).userId ?? null
    const filtered = filterStateForBroadcast(room.state, userId)
    socket.emit('state', { type: 'state', state: filtered })
  }
}

function broadcastClock(io: Server, roomId: string): void {
  io.in(roomId).emit('clock', { type: 'clock', now: Date.now() })
}

// ---------------------------------------------------------------------------
// Timer management
// ---------------------------------------------------------------------------

function armTimer(io: Server, roomId: string, room: Room): void {
  clearTimer(room)
  room.timer = setInterval(() => {
    const now = Date.now()
    const result = checkTimeouts(room.state, now)
    if (result.state.version !== room.state.version) {
      const prevPhase = room.state.phase
      room.state = result.state
      manageTimerTransition(io, roomId, room, prevPhase)
      broadcastFiltered(io, roomId, room)
    }
  }, 1000)
}

function clearTimer(room: Room): void {
  if (room.timer !== null) {
    clearInterval(room.timer)
    room.timer = null
  }
}

function manageTimerTransition(io: Server, roomId: string, room: Room, prevPhase: string): void {
  const phase = room.state.phase
  if (phase === 'answering' || phase === 'rating') {
    if (!room.timer) armTimer(io, roomId, room)
  } else {
    clearTimer(room)
  }
}

// ---------------------------------------------------------------------------
// Host promotion
// ---------------------------------------------------------------------------

function promoteHostIfNeeded(room: Room): void {
  const activePlayers = room.state.players.filter(
    p => !room.state.disconnectedIds.includes(p.id)
  )
  const hostAlive = activePlayers.some(p => p.id === room.state.hostId)
  if (!hostAlive && activePlayers.length > 0) {
    room.state = { ...room.state, hostId: activePlayers[0].id, version: room.state.version + 1 }
  }
}

// ---------------------------------------------------------------------------
// Known message types for socket.onAny validation
// ---------------------------------------------------------------------------

const KNOWN_TYPES = new Set([
  'join', 'start', 'setSettings', 'ready', 'unready',
  'spectate', 'unspectate', 'transferHost',
  'submitAnswer', 'revealNext', 'rateAnswer',
  'nextQuestion', 'endGame',
])

const isKnownMessage = (payload: unknown): payload is ClientMessage =>
  typeof payload === 'object' &&
  payload !== null &&
  KNOWN_TYPES.has((payload as { type?: string }).type ?? '') &&
  isClientMessage(payload)

// ---------------------------------------------------------------------------
// Clock sync interval per room
// ---------------------------------------------------------------------------

const clockIntervals = new Map<string, ReturnType<typeof setInterval>>()

function ensureClockSync(io: Server, roomId: string): void {
  if (clockIntervals.has(roomId)) return
  const interval = setInterval(() => {
    const sockets = io.sockets.adapter.rooms.get(roomId)
    if (!sockets || sockets.size === 0) {
      clearInterval(interval)
      clockIntervals.delete(roomId)
      return
    }
    broadcastClock(io, roomId)
  }, 30_000)
  clockIntervals.set(roomId, interval)
}

function cleanupClockSync(roomId: string): void {
  const interval = clockIntervals.get(roomId)
  if (interval) {
    clearInterval(interval)
    clockIntervals.delete(roomId)
  }
}

// ---------------------------------------------------------------------------
// Room cleanup when empty
// ---------------------------------------------------------------------------

function cleanupIfEmpty(io: Server, roomId: string, room: Room): void {
  const sockets = io.sockets.adapter.rooms.get(roomId)
  if (!sockets || sockets.size === 0) {
    clearTimer(room)
    cleanupClockSync(roomId)
    rooms.delete(roomId)
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface GameRoomOptions {
  verifyJoin?: (roomId: string) => Promise<boolean>
}

export const attachGameRooms = (
  httpServer: HttpServer,
  options: GameRoomOptions = {}
): Server => {
  const io = new Server(httpServer, {
    cors: { origin: true },
  })

  io.on('connection', socket => {
    const roomId =
      typeof socket.handshake.auth?.room === 'string'
        ? socket.handshake.auth.room
        : null

    if (!roomId) {
      console.error('[GameRoom] connection without room ID')
      socket.disconnect(true)
      return
    }

    const admit = async (): Promise<boolean> => {
      if (!options.verifyJoin) return true
      try {
        return await options.verifyJoin(roomId)
      } catch (err) {
        console.error('[GameRoom] verifyJoin failed:', err)
        return false
      }
    }

    void admit().then(async allowed => {
      if (!allowed) {
        console.error('[GameRoom] admission rejected for room:', roomId)
        socket.disconnect(true)
        return
      }

      const rawJwt = typeof socket.handshake.auth?.jwt === 'string' ? socket.handshake.auth.jwt : null
      if (roomId.startsWith('discord:') && !rawJwt) {
        console.error('[GameRoom] discord room missing JWT:', roomId)
        socket.disconnect(true)
        return
      }
      let jwtPayload: JwtPayload | null = null
      if (rawJwt) {
        try {
          jwtPayload = await verifyJwt(rawJwt)
        } catch (err) {
          console.error('[GameRoom] JWT verification failed:', err)
          socket.disconnect(true)
          return
        }
        if (
          roomId.startsWith('discord:') &&
          jwtPayload.instance &&
          jwtPayload.instance !== roomId.slice('discord:'.length)
        ) {
          console.error(
            '[GameRoom] instance mismatch: jwt =', jwtPayload.instance,
            'room =', roomId,
          )
          socket.emit('error', { message: 'Room does not match your activity instance' })
          socket.disconnect(true)
          return
        }
      }

      ;(socket.data as SocketData).room = roomId
      ;(socket.data as SocketData).userId = null
      ;(socket.data as SocketData).jwtPayload = jwtPayload
      socket.join(roomId)

      socket.emit('clock', { type: 'clock', now: Date.now() })
      ensureClockSync(io, roomId)

      const room = getRoom(roomId)
      const userId = (socket.data as SocketData).userId
      broadcastFilteredToSocket(socket, room, userId)

      socket.onAny((_event: string, payload: unknown) => {
        if (!isKnownMessage(payload)) return
        processMessage(io, socket, roomId, payload)
      })

      socket.on('disconnect', () => {
        handleDisconnect(io, socket, roomId)
      })
    })
    .catch((err) => {
      console.error('[GameRoom] connection handler error:', err)
      socket.disconnect(true)
    })
  })

  return io
}

// ---------------------------------------------------------------------------
// Send current state to a single socket
// ---------------------------------------------------------------------------

function broadcastFilteredToSocket(socket: Socket, room: Room, userId: string | null): void {
  const filtered = filterStateForBroadcast(room.state, userId)
  socket.emit('state', { type: 'state', state: filtered })
}

// ---------------------------------------------------------------------------
// Process a client message through the engine
// ---------------------------------------------------------------------------

function processMessage(io: Server, socket: Socket, roomId: string, msg: ClientMessage): void {
  const room = getRoom(roomId)
  const data = socket.data as SocketData

  if (msg.type === 'join') {
    data.userId = msg.user.id
    room.socketsByUser.set(msg.user.id, msg.user)
    if (!room.joinOrder.includes(msg.user.id)) {
      room.joinOrder.push(msg.user.id)
    }
  }

  const senderId = data.userId
  if (!senderId) {
    socket.emit('error', { type: 'error', message: 'must join first' })
    return
  }

  const prevPhase = room.state.phase
  const now = Date.now()
  const result = engineHandle(room.state, msg, senderId, now)

  if (result.error) {
    socket.emit('error', { type: 'error', message: result.error })
  }

  if (result.state !== room.state) {
    room.state = result.state
    manageTimerTransition(io, roomId, room, prevPhase)
    broadcastFiltered(io, roomId, room)
  }
}

// ---------------------------------------------------------------------------
// Disconnect handling with grace
// ---------------------------------------------------------------------------

function handleDisconnect(io: Server, socket: Socket, roomId: string): void {
  const room = rooms.get(roomId)
  if (!room) return

  const data = socket.data as SocketData
  const userId = data.userId
  if (!userId) {
    cleanupIfEmpty(io, roomId, room)
    return
  }

  const hasOtherSocket = hasAnotherSocketForUser(io, roomId, socket.id, userId)
  if (hasOtherSocket) {
    cleanupIfEmpty(io, roomId, room)
    return
  }

  const inGame = room.state.phase !== 'lobby'

  if (inGame) {
    if (!room.state.disconnectedIds.includes(userId)) {
      room.state = {
        ...room.state,
        disconnectedIds: [...room.state.disconnectedIds, userId],
        version: room.state.version + 1,
      }
    }
    promoteHostIfNeeded(room)
    broadcastFiltered(io, roomId, room)
  } else {
    room.socketsByUser.delete(userId)
    room.joinOrder = room.joinOrder.filter(id => id !== userId)
    room.state = {
      ...room.state,
      players: room.state.players.filter(p => p.id !== userId),
      readyIds: room.state.readyIds.filter(id => id !== userId),
      spectatorIds: room.state.spectatorIds.filter(id => id !== userId),
      version: room.state.version + 1,
    }
    promoteHostIfNeeded(room)
    broadcastFiltered(io, roomId, room)
  }

  cleanupIfEmpty(io, roomId, room)
}

function hasAnotherSocketForUser(
  io: Server,
  roomId: string,
  excludeSocketId: string,
  userId: string,
): boolean {
  const sockets = io.sockets.adapter.rooms.get(roomId)
  if (!sockets) return false
  for (const socketId of sockets) {
    if (socketId === excludeSocketId) continue
    const s = io.sockets.sockets.get(socketId)
    if (s && (s.data as SocketData).userId === userId) return true
  }
  return false
}
