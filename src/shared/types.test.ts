import { describe, it, expect } from 'vitest'
import { isClientMessage } from './types'
import type { GameState, GamePhase, ServerMessage } from './types'

describe('isClientMessage', () => {
  it('validates join', () => {
    expect(isClientMessage({ type: 'join', user: { id: '1', name: 'A' } })).toBe(true)
    expect(isClientMessage({ type: 'join', user: { id: '1' } })).toBe(false)
    expect(isClientMessage({ type: 'join' })).toBe(false)
  })

  it('validates ready/unready with no payload', () => {
    expect(isClientMessage({ type: 'ready' })).toBe(true)
    expect(isClientMessage({ type: 'unready' })).toBe(true)
  })

  it('validates spectate/unspectate with no payload', () => {
    expect(isClientMessage({ type: 'spectate' })).toBe(true)
    expect(isClientMessage({ type: 'unspectate' })).toBe(true)
  })

  it('validates setSettings', () => {
    expect(isClientMessage({ type: 'setSettings', settings: { selectedDecks: ['main'], seed: 'x', answerSeconds: 60, ratingSeconds: 30, totalRounds: 10 } })).toBe(true)
    expect(isClientMessage({ type: 'setSettings', settings: { selectedDecks: ['main'], seed: 'x', answerSeconds: 60, ratingSeconds: 30 } })).toBe(false)
    expect(isClientMessage({ type: 'setSettings' })).toBe(false)
  })

  it('validates transferHost', () => {
    expect(isClientMessage({ type: 'transferHost', targetId: 'p2' })).toBe(true)
    expect(isClientMessage({ type: 'transferHost' })).toBe(false)
  })

  it('validates start with no payload', () => {
    expect(isClientMessage({ type: 'start' })).toBe(true)
  })

  it('validates submitAnswer', () => {
    expect(isClientMessage({ type: 'submitAnswer', answer: 'hello' })).toBe(true)
    expect(isClientMessage({ type: 'submitAnswer', answer: '' })).toBe(true)
    expect(isClientMessage({ type: 'submitAnswer' })).toBe(false)
    expect(isClientMessage({ type: 'submitAnswer', answer: 123 })).toBe(false)
  })

  it('validates revealNext with no payload (host)', () => {
    expect(isClientMessage({ type: 'revealNext' })).toBe(true)
  })

  it('validates rateAnswer with rating 1-10', () => {
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2', rating: 1 })).toBe(true)
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2', rating: 10 })).toBe(true)
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2', rating: 0 })).toBe(false)
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2', rating: 11 })).toBe(false)
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2', rating: 5.5 })).toBe(false)
    expect(isClientMessage({ type: 'rateAnswer', targetId: 'p2' })).toBe(false)
    expect(isClientMessage({ type: 'rateAnswer', rating: 5 })).toBe(false)
  })

  it('validates nextQuestion with no payload', () => {
    expect(isClientMessage({ type: 'nextQuestion' })).toBe(true)
  })

  it('rejects unknown and malformed', () => {
    expect(isClientMessage({ type: 'bogus' })).toBe(false)
    expect(isClientMessage(null)).toBe(false)
    expect(isClientMessage(undefined)).toBe(false)
    expect(isClientMessage('string')).toBe(false)
    expect(isClientMessage(42)).toBe(false)
  })
})

describe('type surface', () => {
  it('GamePhase covers all phases', () => {
    const phases: GamePhase[] = ['lobby', 'answering', 'revealing', 'rating', 'scoring', 'finished']
    expect(phases).toHaveLength(6)
  })

  it('GameState has the phase-protocol shape', () => {
    const state: GameState = {
      version: 0,
      phase: 'lobby',
      hostId: null,
      players: [],
      readyIds: [],
      spectatorIds: [],
    spectatorInfos: [],
      disconnectedIds: [],
      settings: { selectedDecks: ['main'], seed: 's', answerSeconds: 60, ratingSeconds: 30, totalRounds: 10, locale: 'en' },
      round: null,
      roundHistory: [],
      roundNumber: 0,
    }
    expect(state.phase).toBe('lobby')
  })

  it('ServerMessage state carries GameState; clockSync carries now', () => {
    const s: ServerMessage = { type: 'state', state: { version: 1 } as unknown as GameState }
    const c: ServerMessage = { type: 'clock', now: Date.now() }
    const e: ServerMessage = { type: 'error', message: 'x' }
    expect(s.type).toBe('state')
    expect(c.type).toBe('clock')
    expect(e.type).toBe('error')
  })
})
