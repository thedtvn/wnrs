import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, fireEvent, renderWithChakra, screen } from '@src/test/utils'
import { RatingPhase } from './RatingPhase'
import { ScoringPhase } from './ScoringPhase'
import { FinishedPhase } from './FinishedPhase'
import { answeringState, lobbyState } from './__fixtures__/state'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'

const t = (k: string) => k

const makeSync = () =>
  ({
    clockOffset: 0,
    sendRateAnswer: vi.fn(),
    sendRevealNext: vi.fn(),
    sendNextQuestion: vi.fn(),
  }) as unknown as ReturnType<typeof useGameSync>

function ratingState(overrides?: Partial<GameState>): GameState {
  const s = answeringState()
  const { round: roundOverrides, ...restOverrides } = (overrides ?? {}) as Partial<GameState> & { round?: Record<string, unknown> }
  const baseRound = {
    ...s.round!,
    deadline: Date.now() + 30_000,
    answers: { p1: 'Blue', p2: 'Red' },
    revealedAnswerIds: ['p2'],
    currentRevealId: 'p2',
  }
  return {
    ...s,
    ...restOverrides,
    phase: 'rating',
    round: { ...baseRound, ...(roundOverrides as object) },
  } as GameState
}

afterEach(() => cleanup())

describe('RatingPhase', () => {
  it('renders 5 stars and sends engine rating (stars x2) on confirm', () => {
    const sync = makeSync()
    renderWithChakra(
      <RatingPhase state={ratingState()} sync={sync} isSpectator={false} userId="p1" t={t} />,
    )
    fireEvent.click(screen.getByRole('button', { name: '4' }))
    fireEvent.click(screen.getByRole('button', { name: /rating\.rate/ }))
    expect(sync.sendRateAnswer).toHaveBeenCalledWith('p2', 8)
  })

  it('hides the confirm button for the answer owner', () => {
    renderWithChakra(
      <RatingPhase state={ratingState()} sync={makeSync()} isSpectator={false} userId="p2" t={t} />,
    )
    expect(screen.queryByRole('button', { name: /rating\.rate/ })).not.toBeInTheDocument()
    expect(screen.getByText(/rating\.playerVote/)).toBeInTheDocument()
  })

  it('shows skip button when there are no eligible raters and I am host', () => {
    const s = ratingState({ spectatorIds: ['p2'] })
    s.round!.currentRevealId = 'p1'
    renderWithChakra(
      <RatingPhase state={s} sync={makeSync()} isSpectator={false} userId="p1" t={t} />,
    )
    expect(screen.getByRole('button', { name: 'revealing.skipVoting' })).toBeInTheDocument()
  })

  it('shows voted state with my stars after rating', () => {
    const s = ratingState()
    s.round!.ratings['p2'] = { p1: 8 }
    renderWithChakra(
      <RatingPhase state={s} sync={makeSync()} isSpectator={false} userId="p1" t={t} />,
    )
    expect(screen.getByText(/rating\.playerVote/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /rating\.rate/ })).not.toBeInTheDocument()
  })
})

describe('ScoringPhase', () => {
  function scoringState(): GameState {
    const s = ratingState()
    return { ...s, phase: 'scoring', roundHistory: [{ ...s.round!, currentRevealId: null, deadline: null }] }
  }

  it('renders a star-score row per answer with means out of 5', () => {
    const s = scoringState()
    s.round!.ratings = { p1: { p2: 9 }, p2: { p1: 5 } }
    renderWithChakra(<ScoringPhase state={s} sync={makeSync()} amHost={true} t={t} />)
    expect(screen.getByText('"Red"')).toBeInTheDocument()
    expect(screen.getByText('"Blue"')).toBeInTheDocument()
    expect(screen.getByText('4.5')).toBeInTheDocument()
    expect(screen.getByText('2.5')).toBeInTheDocument()
  })

  it('highlights the highest-mean row as the round winner', () => {
    const s = scoringState()
    s.round!.ratings = { p1: { p2: 9 }, p2: { p1: 5 } }
    renderWithChakra(<ScoringPhase state={s} sync={makeSync()} amHost={false} t={t} />)
    const winnerRow = screen.getByText('"Red"').closest('[class]')
    expect(winnerRow).not.toBeNull()
  })

  it('shows Next Question button for the host only', () => {
    const s = scoringState()
    const { unmount } = renderWithChakra(<ScoringPhase state={s} sync={makeSync()} amHost={true} t={t} />)
    expect(screen.getByRole('button', { name: 'scoring.nextQuestion' })).toBeInTheDocument()
    unmount()
    cleanup()
    renderWithChakra(<ScoringPhase state={s} sync={makeSync()} amHost={false} t={t} />)
    expect(screen.queryByRole('button', { name: 'scoring.nextQuestion' })).not.toBeInTheDocument()
  })
})

describe('FinishedPhase', () => {
  it('shows only the highest-rated answers grouped under their questions', () => {
    const base = lobbyState()
    const r1 = {
      question: 'q1', deadline: null,
      answers: { p1: 'a1', p2: 'b1' },
      ratings: { p1: { p2: 10 }, p2: { p1: 3 } },
      revealedAnswerIds: ['p1', 'p2'], currentRevealId: null,
    }
    const r2 = {
      ...r1,
      question: 'q2',
      answers: { p1: 'a2', p2: 'b2' },
      ratings: { p2: { p1: 10 } },
    }
    const s: GameState = { ...base, phase: 'finished', round: null, roundHistory: [r1, r2], roundNumber: 2 }
    renderWithChakra(<FinishedPhase state={s} onExit={() => {}} t={t} />)
    expect(screen.getByText('q1')).toBeInTheDocument()
    expect(screen.getByText('q2')).toBeInTheDocument()
    expect(screen.getByText('P1 - "a1"')).toBeInTheDocument()
    expect(screen.getByText('P2 - "b2"')).toBeInTheDocument()
    expect(screen.queryByText('P2 - "b1"')).not.toBeInTheDocument()
    expect(screen.queryByText('P1 - "a2"')).not.toBeInTheDocument()
    expect(screen.queryByText('finished.attractionPoints')).not.toBeInTheDocument()
  })
})
