import { describe, it, expect } from 'vitest'
import { handleClientMessage, checkTimeouts, createInitialState } from './gameEngine'
import type { GameState, PlayerInfo } from '../src/shared/types'

const p1: PlayerInfo = { id: 'p1', name: 'Alice' }
const p2: PlayerInfo = { id: 'p2', name: 'Bob' }
const p3: PlayerInfo = { id: 'p3', name: 'Charlie' }

/** Build a lobby with the given players joined; first is host. */
function lobbyWith(...players: PlayerInfo[]): GameState {
  let s = createInitialState()
  for (const p of players) {
    s = handleClientMessage(s, { type: 'join', user: p }, p.id, 0).state
  }
  return s
}

/** Ready everyone except host, then host starts. Returns answering-phase state. */
function startGame(base: GameState, now = 1000): GameState {
  let s = base
  const host = s.hostId
  for (const p of s.players) {
    if (p.id !== host) s = handleClientMessage(s, { type: 'ready' }, p.id, now).state
  }
  s = handleClientMessage(s, { type: 'start' }, host!, now).state
  return s
}

describe('lobby', () => {
  it('initializes to lobby, no host', () => {
    const s = createInitialState()
    expect(s.phase).toBe('lobby')
    expect(s.roundNumber).toBe(0)
    expect(s.hostId).toBeNull()
  })

  it('first joiner becomes host', () => {
    const s = lobbyWith(p1)
    expect(s.hostId).toBe('p1')
    expect(s.players.map(p => p.id)).toEqual(['p1'])
  })

  it('additional joiners are players, host unchanged', () => {
    const s = lobbyWith(p1, p2, p3)
    expect(s.hostId).toBe('p1')
    expect(s.players.map(p => p.id)).toEqual(['p1', 'p2', 'p3'])
  })

  it('rejoin by same id is idempotent', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'join', user: p2 }, p2.id, 0).state
    expect(s.players.filter(p => p.id === 'p2')).toHaveLength(1)
  })

  it('late join during game auto-joins as spectator', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'join', user: p3 }, 'p3', 2000).state
    expect(s.players.map(p => p.id)).not.toContain('p3')
    expect(s.spectatorIds).toContain('p3')
    expect(s.spectatorInfos.find(p => p.id === 'p3')?.name).toBe('Charlie')
  })

  it('all players submitting auto-advances to revealing without host action', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    expect(s.phase).toBe('answering')
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 2000).state
    expect(s.phase).toBe('answering')
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 2000).state
    expect(s.phase).toBe('revealing')
  })

  it('ready / unready toggles readiness', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 0).state
    expect(s.readyIds).toContain('p2')
    s = handleClientMessage(s, { type: 'unready' }, 'p2', 0).state
    expect(s.readyIds).not.toContain('p2')
  })

  it('spectate removes from players and readiness', () => {
    let s = lobbyWith(p1, p2, p3)
    s = handleClientMessage(s, { type: 'ready' }, 'p3', 0).state
    s = handleClientMessage(s, { type: 'spectate' }, 'p3', 0).state
    expect(s.spectatorIds).toContain('p3')
    expect(s.players.map(p => p.id)).not.toContain('p3')
    expect(s.readyIds).not.toContain('p3')
  })

  it('unspectate returns player to players list', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'spectate' }, 'p2', 0).state
    s = handleClientMessage(s, { type: 'unspectate' }, 'p2', 0).state
    expect(s.players.map(p => p.id)).toContain('p2')
    expect(s.spectatorIds).not.toContain('p2')
  })

  it('spectate preserves real name; unspectate restores it', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'spectate' }, 'p2', 0).state
    expect(s.players.find(p => p.id === 'p2')).toBeUndefined()
    expect(s.spectatorInfos.find(p => p.id === 'p2')?.name).toBe('Bob')
    s = handleClientMessage(s, { type: 'unspectate' }, 'p2', 0).state
    expect(s.players.find(p => p.id === 'p2')?.name).toBe('Bob')
    expect(s.spectatorInfos).toHaveLength(0)
  })

  it('midgame join goes to spectators, not eligible players', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 0).state
    s = handleClientMessage(s, { type: 'start' }, 'p1', 0).state
    s = handleClientMessage(s, { type: 'join', user: { id: 'p3', name: 'P3' } }, 'p3', 0).state
    expect(s.spectatorIds).toContain('p3')
    expect(s.players.find(p => p.id === 'p3')).toBeUndefined()
  })

  it('endGame: host can end, non-host cannot, lobby rejected', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 0).state
    s = handleClientMessage(s, { type: 'start' }, 'p1', 0).state
    const r1 = handleClientMessage(s, { type: 'endGame' }, 'p2', 0)
    expect(r1.error).toBe('not host')
    const r2 = handleClientMessage(r1.state, { type: 'endGame' }, 'p1', 0)
    expect(r2.state.phase).toBe('finished')
    const r3 = handleClientMessage(r2.state, { type: 'endGame' }, 'p1', 0)
    expect(r3.error).toBe('not in game')
  })
  it('spectator can join as player during scoring phase', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 0).state
    s = handleClientMessage(s, { type: 'start' }, 'p1', 0).state
    s = handleClientMessage(s, { type: 'join', user: { id: 'p3', name: 'P3' } }, 'p3', 0).state
    expect(s.spectatorIds).toContain('p3')
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 100).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 100).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 100).state
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: 'p1', rating: 7 }, 'p2', 200).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 300).state
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: 'p2', rating: 5 }, 'p1', 400).state
    expect(s.phase).toBe('scoring')
    s = handleClientMessage(s, { type: 'unspectate' }, 'p3', 500).state
    expect(s.players.map(p => p.id)).toContain('p3')
    expect(s.spectatorIds).not.toContain('p3')
  })

  it('host can set settings; non-host cannot', () => {
    let s = lobbyWith(p1, p2)
    const settings = { selectedDecks: ['main'], seed: 'z', answerSeconds: 45, ratingSeconds: 20, totalRounds: 5, locale: 'en' as const }
    s = handleClientMessage(s, { type: 'setSettings', settings }, 'p2', 0).state
    expect(s.settings.answerSeconds).not.toBe(45) // non-host ignored
    s = handleClientMessage(s, { type: 'setSettings', settings }, 'p1', 0).state
    expect(s.settings.answerSeconds).toBe(45)
    expect(s.settings.totalRounds).toBe(5)
  })

  it('host can transfer host to another player', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'transferHost', targetId: 'p2' }, 'p1', 0).state
    expect(s.hostId).toBe('p2')
    // non-host cannot transfer
    s = handleClientMessage(s, { type: 'transferHost', targetId: 'p1' }, 'p1', 0).state
    expect(s.hostId).toBe('p2')
  })

  it('start is blocked unless all non-host non-spectator players are ready', () => {
    let s = lobbyWith(p1, p2, p3)
    // nobody ready
    s = handleClientMessage(s, { type: 'start' }, 'p1', 100).state
    expect(s.phase).toBe('lobby')
    // ready p2 only
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 100).state
    s = handleClientMessage(s, { type: 'start' }, 'p1', 100).state
    expect(s.phase).toBe('lobby')
    // ready p3 too
    s = handleClientMessage(s, { type: 'ready' }, 'p3', 100).state
    s = handleClientMessage(s, { type: 'start' }, 'p1', 100).state
    expect(s.phase).toBe('answering')
  })

  it('non-host cannot start', () => {
    let s = lobbyWith(p1, p2)
    s = handleClientMessage(s, { type: 'ready' }, 'p2', 0).state
    s = handleClientMessage(s, { type: 'start' }, 'p2', 0).state
    expect(s.phase).toBe('lobby')
  })
})

describe('answering phase', () => {
  it('start enters answering with a question and a deadline', () => {
    const s = startGame(lobbyWith(p1, p2), 1000)
    expect(s.phase).toBe('answering')
    expect(s.roundNumber).toBe(1)
    expect(s.round).not.toBeNull()
    expect(typeof s.round!.question).toBe('string')
    expect(s.round!.question.length).toBeGreaterThan(0)
    expect(s.round!.deadline).toBe(1000 + s.settings.answerSeconds * 1000)
  })

  it('players submit answers; own answer stored', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'my answer' }, 'p1', 1500).state
    expect(s.round!.answers['p1']).toBe('my answer')
  })

  it('does not reveal answers of others while answering (redaction is transport concern, engine stores raw)', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'secret' }, 'p1', 1500).state
    expect(s.phase).toBe('answering')
  })

  it('when all eligible players submit, phase advances to revealing', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state
    expect(s.phase).toBe('answering')
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state
    expect(s.phase).toBe('revealing')
  })

  it('spectators do not gate answering completion', () => {
    let base = lobbyWith(p1, p2, p3)
    base = handleClientMessage(base, { type: 'spectate' }, 'p3', 0).state
    let s = startGame(base, 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state
    expect(s.phase).toBe('revealing') // p3 spectator not required
  })

  it('timeout ends answering even with missing answers', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'only one' }, 'p1', 1500).state
    const deadline = s.round!.deadline!
    s = checkTimeouts(s, deadline + 1).state
    expect(s.phase).toBe('revealing')
  })

  it('checkTimeouts bumps version on phase transition', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a' }, 'p1', 1500).state
    const before = s.version
    s = checkTimeouts(s, s.round!.deadline! + 1).state
    expect(s.version).toBeGreaterThan(before)
  })

  it('host can skip answering phase with revealNext', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    expect(s.phase).toBe('answering')
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'only one' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    expect(s.phase).toBe('revealing')
  })

  it('non-host cannot skip answering phase', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'revealNext' }, 'p2', 2000).state
    expect(s.phase).toBe('answering')
  })

  it('empty answer counts as submitted', () => {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: '' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: '' }, 'p2', 1600).state
    expect(s.phase).toBe('revealing')
  })
})

describe('revealing phase', () => {
  function toRevealing(): GameState {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state
    return s
  }

  it('host revealNext reveals first answer and enters rating', () => {
    let s = toRevealing()
    expect(s.phase).toBe('revealing')
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    expect(s.phase).toBe('rating')
    expect(s.round!.currentRevealId).not.toBeNull()
    expect(s.round!.revealedAnswerIds).toHaveLength(1)
  })

  it('non-host cannot revealNext', () => {
    let s = toRevealing()
    s = handleClientMessage(s, { type: 'revealNext' }, 'p2', 2000).state
    expect(s.phase).toBe('revealing')
  })

  it('rating deadline is set on reveal', () => {
    let s = toRevealing()
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    expect(s.round!.deadline).toBe(2000 + s.settings.ratingSeconds * 1000)
  })

  it('solo: revealNext still enters rating (does not skip)', () => {
    let s = startGame(lobbyWith(p1), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'solo answer' }, 'p1', 1500).state
    expect(s.phase).toBe('revealing')
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    expect(s.phase).toBe('rating')
    expect(s.round!.currentRevealId).toBe('p1')
  })
})

describe('rating phase', () => {
  function toRating(): GameState {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    return s
  }

  it('players rate the revealed answer 1-10; owner cannot rate self', () => {
    let s = toRating()
    const ownerId = s.round!.currentRevealId!
    const other = ownerId === 'p1' ? 'p2' : 'p1'
    // owner tries to rate self -> ignored
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 5 }, ownerId, 2100).state
    expect(s.round!.ratings[ownerId]?.[ownerId]).toBeUndefined()
    // other rates -> stored
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state
    expect(s.round!.ratings[ownerId]?.[other]).toBe(8)
  })

  it('when all eligible raters rate, goes back to revealing (more answers) or scoring (done)', () => {
    let s = toRating()
    const ownerId = s.round!.currentRevealId!
    const other = ownerId === 'p1' ? 'p2' : 'p1'
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state
    // only 2 answers, one revealed & rated -> back to revealing for the 2nd
    expect(s.phase).toBe('revealing')
  })

  it('rating timeout advances even with missing ratings', () => {
    let s = toRating()
    const deadline = s.round!.deadline!
    s = checkTimeouts(s, deadline + 1).state
    expect(s.phase).toBe('revealing')
  })

  it('after last answer rated, phase becomes scoring with per-answer means', () => {
    let s = toRating()
    // reveal & rate first
    let ownerId = s.round!.currentRevealId!
    let other = ownerId === 'p1' ? 'p2' : 'p1'
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state
    // reveal & rate second
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2200).state
    ownerId = s.round!.currentRevealId!
    other = ownerId === 'p1' ? 'p2' : 'p1'
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 6 }, other, 2300).state
    expect(s.phase).toBe('scoring')
  })

  it('revealNext from rating phase acts as skip-voting', () => {
    let s = toRating()
    expect(s.phase).toBe('rating')
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2100).state
    expect(s.phase).toBe('revealing')
    expect(s.round!.currentRevealId).toBeNull()
  })

  it('author is not a required rater — auto-advances once all others voted', () => {
    let s = startGame(lobbyWith(p1, p2, p3), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1100).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1200).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a3' }, 'p3', 1300).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state

    const owner = s.round!.currentRevealId!
    const others = ['p1', 'p2', 'p3'].filter(id => id !== owner)

    s = handleClientMessage(s, { type: 'rateAnswer', targetId: owner, rating: 7 }, others[0], 2100).state
    expect(s.phase).toBe('rating')

    s = handleClientMessage(s, { type: 'rateAnswer', targetId: owner, rating: 9 }, others[1], 2200).state
    expect(s.phase).toBe('revealing')
    expect(s.round!.currentRevealId).toBeNull()
    expect(Object.keys(s.round!.ratings[owner])).toHaveLength(2)
  })
})

describe('scoring & progression', () => {
  function toScoring(): GameState {
    let s = startGame(lobbyWith(p1, p2), 1000)
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a1' }, 'p1', 1500).state
    s = handleClientMessage(s, { type: 'submitAnswer', answer: 'a2' }, 'p2', 1600).state
    // reveal & rate both
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2000).state
    let ownerId = s.round!.currentRevealId!
    let other = ownerId === 'p1' ? 'p2' : 'p1'
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 8 }, other, 2100).state
    s = handleClientMessage(s, { type: 'revealNext' }, 'p1', 2200).state
    ownerId = s.round!.currentRevealId!
    other = ownerId === 'p1' ? 'p2' : 'p1'
    s = handleClientMessage(s, { type: 'rateAnswer', targetId: ownerId, rating: 6 }, other, 2300).state
    return s
  }

  it('toScoring archives round in roundHistory', () => {
    const s = toScoring()
    expect(s.phase).toBe('scoring')
    expect(s.roundHistory).toHaveLength(1)
    const archived = s.roundHistory[0]
    expect(Object.keys(archived.answers)).toHaveLength(2)
    expect(Object.keys(archived.ratings)).toHaveLength(2)
  })

  it('host nextQuestion advances round and re-enters answering', () => {
    let s = toScoring()
    s = handleClientMessage(s, { type: 'nextQuestion' }, 'p1', 3000).state
    expect(s.phase).toBe('answering')
    expect(s.roundNumber).toBe(2)
    expect(s.round!.answers).toEqual({})
  })

  it('non-host cannot advance', () => {
    let s = toScoring()
    s = handleClientMessage(s, { type: 'nextQuestion' }, 'p2', 3000).state
    expect(s.phase).toBe('scoring')
  })

  it('after totalRounds reached, nextQuestion goes to finished', () => {
    let s = toScoring()
    // force this to be the last round
    s = { ...s, settings: { ...s.settings, totalRounds: 1 } }
    s = handleClientMessage(s, { type: 'nextQuestion' }, 'p1', 3000).state
    expect(s.phase).toBe('finished')
  })

  it('finished phase archives all rounds in roundHistory', () => {
    let s = toScoring()
    s = { ...s, settings: { ...s.settings, totalRounds: 1 } }
    s = handleClientMessage(s, { type: 'nextQuestion' }, 'p1', 3000).state
    expect(s.phase).toBe('finished')
    expect(s.roundHistory.length).toBe(1)
    expect(Object.keys(s.roundHistory[0].answers)).toHaveLength(2)
  })
})
