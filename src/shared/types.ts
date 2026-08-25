// Shared types used by both the client bundle and the Cloudflare Worker (if applicable) and Server.

export interface Deck {
  name: string
  short_name: string
  players: string
  theme: string
  levels: string[]
  questions: string[][]
  isExpansion?: boolean
  backDesc?: string[]
  preview?: string[]
  instruction?: string[]
  crossover?: string
  edition?: string
  noWNRS?: boolean
}

export interface PlayerInfo {
  id: string
  name: string
  avatar?: string // Optional avatar URL 
}

export interface GameSettings {
  selectedDecks: string[]
  seed: string
  answerSeconds: number
  ratingSeconds: number
  totalRounds: number
  locale: 'en' | 'vi'
}

export type GamePhase = 'lobby' | 'answering' | 'revealing' | 'rating' | 'scoring' | 'finished'

export interface RoundState {
  question: string
  deadline: number | null
  answers: Record<string, string>
  ratings: Record<string, Record<string, number>>
  revealedAnswerIds: string[]
  currentRevealId: string | null
}

export interface GameState {
  version: number
  hostId: string | null
  players: PlayerInfo[]
  readyIds: string[]
  spectatorIds: string[]
  spectatorInfos: PlayerInfo[]
  disconnectedIds: string[]
  settings: GameSettings
  phase: GamePhase
  round: RoundState | null
  roundHistory: RoundState[]
  roundNumber: number
}

// ---- WebSocket protocol ----------------------------------------------------

export type ClientMessage =
  | { type: 'join'; user: PlayerInfo }
  | { type: 'start' }                   // no config here; lobby settings rule
  | { type: 'setSettings'; settings: GameSettings }
  | { type: 'ready' }
  | { type: 'unready' }
  | { type: 'spectate' }
  | { type: 'unspectate' }
  | { type: 'transferHost'; targetId: string }
  | { type: 'submitAnswer'; answer: string }
  | { type: 'revealNext' }
  | { type: 'rateAnswer'; targetId: string; rating: number }
  | { type: 'nextQuestion' }
  | { type: 'endGame' }

export type ServerMessage =
  | { type: 'state'; state: GameState }
  | { type: 'clock'; now: number }
  | { type: 'error'; message: string }

export function isClientMessage(data: unknown): data is ClientMessage {
  if (typeof data !== 'object' || data === null) return false
  const msg = data as Record<string, unknown>
  switch (msg.type) {
    case 'join':
      return (
        typeof (msg.user as PlayerInfo | undefined)?.id === 'string' &&
        typeof (msg.user as PlayerInfo | undefined)?.name === 'string'
      )
    case 'setSettings': {
      const s = msg.settings as GameSettings | undefined
      return (
        Array.isArray(s?.selectedDecks) &&
        typeof s?.seed === 'string' &&
        typeof s?.answerSeconds === 'number' &&
        typeof s?.ratingSeconds === 'number' &&
        typeof s?.totalRounds === 'number'
      )
    }
    case 'transferHost':
      return typeof msg.targetId === 'string'
    case 'submitAnswer':
      return typeof msg.answer === 'string'
    case 'rateAnswer':
      return (
        typeof msg.targetId === 'string' &&
        typeof msg.rating === 'number' &&
        Number.isInteger(msg.rating) &&
        msg.rating >= 1 &&
        msg.rating <= 10
      )
    case 'start':
    case 'ready':
    case 'unready':
    case 'spectate':
    case 'unspectate':
    case 'revealNext':
    case 'nextQuestion':
      return true
    default:
      return false
  }
}
