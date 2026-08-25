import type { GameState, RoundState } from '@src/shared/types'

const defaultSettings = {
  selectedDecks: ['main'],
  seed: 's',
  answerSeconds: 60,
  ratingSeconds: 30,
  totalRounds: 0,
  locale: 'en' as const,
}

const p1 = { id: 'p1', name: 'P1' }
const p2 = { id: 'p2', name: 'P2' }

const lobbyBase: GameState = {
  version: 1,
  hostId: 'p1',
  players: [p1, p2],
  readyIds: ['p2'],
  spectatorIds: [],
  disconnectedIds: [],
  settings: defaultSettings,
  phase: 'lobby',
  round: null,
  roundHistory: [],
  roundNumber: 0,
}

const answeringRound: RoundState = {
  question: 'What is your favourite colour?',
  deadline: Date.now() + 60_000,
  answers: {},
  ratings: {},
  revealedAnswerIds: [],
  currentRevealId: null,
}

const revealingRound: RoundState = {
  question: 'What is your favourite colour?',
  deadline: null,
  answers: { p1: 'Blue', p2: 'Red' },
  ratings: {},
  revealedAnswerIds: ['p1'],
  currentRevealId: null,
}

/** Lobby state: host=p1, p2 is ready */
export function lobbyState(): GameState {
  return { ...lobbyBase }
}

/** Answering phase state */
export function answeringState(): GameState {
  return {
    ...lobbyBase,
    phase: 'answering',
    round: {
      ...answeringRound,
      answers: { ...answeringRound.answers },
      ratings: { ...answeringRound.ratings },
      revealedAnswerIds: [...answeringRound.revealedAnswerIds],
    },
  }
}

/** Revealing phase state */
export function revealingState(): GameState {
  return {
    ...lobbyBase,
    phase: 'revealing',
    round: {
      ...revealingRound,
      answers: { ...revealingRound.answers },
      ratings: { ...revealingRound.ratings },
      revealedAnswerIds: [...revealingRound.revealedAnswerIds],
    },
  }
}
