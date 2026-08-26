import { useEffect, useRef, useState } from 'react'
import { Box, Stack, Text, Textarea } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { useDiscord } from '@src/discord/DiscordContext'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'
import { TimerBar } from './TimerBar'
import { QuestionCard } from './QuestionCard'
import { useCountdown } from './useCountdown'

const CARD_IN_CSS = `
  @keyframes card-in {
    from { transform: translateY(28px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
`

export function AnsweringPhase({
  state, sync, isSpectator, t,
}: {
  state: GameState
  sync: ReturnType<typeof useGameSync>
  amHost: boolean
  isSpectator: boolean
  t: (k: string) => string
}) {
  const [answer, setAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const timeLeft = useCountdown(state.round?.deadline ?? null, sync.clockOffset)
  const total = state.settings.answerSeconds
  const myId = useDiscord().user?.id

  const hasSubmitted = myId ? (state.round?.answers[myId] !== undefined) : false

  const handleSubmit = () => {
    if (!answer.trim() || hasSubmitted) return
    sync.sendSubmitAnswer(answer.trim())
    setSubmitted(true)
  }

  const totalPlayers = state.players.filter(p => !state.spectatorIds.includes(p.id)).length
  const answeredCount = Object.keys(state.round?.answers ?? {}).length

  const prevRoundNumber = useRef<number | null>(null)
  const [drawKey, setDrawKey] = useState(0)

  useEffect(() => {
    if (state.phase !== 'answering') return
    if (prevRoundNumber.current === state.roundNumber) return
    prevRoundNumber.current = state.roundNumber
    setDrawKey(k => k + 1)
  }, [state.phase, state.roundNumber])

  return (
    <Stack align="center" gap="4" w="full">
      {!hasSubmitted && !submitted && <TimerBar timeLeft={timeLeft} total={total} />}

      <style>{CARD_IN_CSS}</style>
      <Box
        key={drawKey}
        w="full"
        maxW={{ base: '260px', md: '300px' }}
        mx="auto"
        style={drawKey > 0 ? { animation: 'card-in 700ms ease-out both' } : undefined}
      >
        <QuestionCard question={state.round?.question ?? ''} />
      </Box>

      {isSpectator ? (
        <Text color="fg.muted" fontSize="sm">{t('common.spectator')}</Text>
      ) : hasSubmitted || submitted ? (
        <Stack align="center" gap="2">
          <Text color="success.fg" fontWeight="semibold" m={0}>✓ {t('answering.submitted')}</Text>
          <Text color="fg.muted" fontSize="sm" m={0}>{answeredCount} of {totalPlayers} answered</Text>
        </Stack>
      ) : (
        <>
          <Box position="relative" w="full" bg="surface" borderRadius="15px" p="4">
            <Textarea
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              maxLength={500}
              placeholder={t('answering.yourAnswer')}
              rows={3}
              resize="none"
              p="0"
              bg="transparent"
              borderWidth={0}
              color="fg.default"
              fontSize="13px"
              lineHeight="relaxed"
              _placeholder={{ color: 'fg.muted' }}
              _focusVisible={{ outline: 'none', boxShadow: 'none' }}
            />
            <Text position="absolute" bottom="2" right="3" fontSize="xs" color="fg.muted">
              {answer.length}/500
            </Text>
          </Box>
          <Button minWidth="150px" onClick={handleSubmit} disabled={!answer.trim()}>
            {t('answering.submit')}
          </Button>
        </>
      )}

      {hasSubmitted && (
        <Text color="fg.muted" fontSize="sm" m={0}>{t('answering.waitingForOthers')}</Text>
      )}

    </Stack>
  )
}
