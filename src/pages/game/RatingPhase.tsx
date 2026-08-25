import { useState } from 'react'
import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'
import { QuestionCard } from './QuestionCard'
import { TimerBar } from './TimerBar'
import { useCountdown } from './useCountdown'

const STAR = '\u2605'

function StarRow({
  value, max, onSelect, disabled,
}: {
  value: number
  max: number
  onSelect?: (v: number) => void
  disabled?: boolean
}) {
  return (
    <Flex gap="1" justify="center">
      {Array.from({ length: max }, (_, i) => i + 1).map(n => {
        const filled = n <= value
        return (
          <Text
            key={n}
            as="button"
            fontSize="4xl"
            lineHeight={1}
            m={0}
            cursor={disabled ? 'default' : 'pointer'}
            color={filled ? '#ffd700' : 'whiteAlpha.300'}
            transition="transform 120ms"
            _active={disabled ? undefined : { transform: 'scale(0.9)' }}
            _focusVisible={{ outline: 'none' }}
            onClick={disabled ? undefined : () => onSelect?.(n)}
            aria-label={`${n}`}
          >
            {STAR}
          </Text>
        )
      })}
    </Flex>
  )
}

export function RatingPhase({
  state, sync, isSpectator, userId, t,
}: {
  state: GameState
  sync: ReturnType<typeof useGameSync>
  isSpectator: boolean
  userId?: string
  t: (k: string) => string
}) {
  const round = state.round!
  const ownerId = round.currentRevealId!
  const owner = state.players.find(p => p.id === ownerId)
  const myRating = round.ratings[ownerId]?.[userId ?? '']
  const timeLeft = useCountdown(round.deadline, sync.clockOffset)
  const total = state.settings.ratingSeconds
  const isMyAnswer = ownerId === userId

  const eligibleRaters = state.players
    .filter(p => !state.spectatorIds.includes(p.id) && !state.disconnectedIds.includes(p.id))
    .filter(p => p.id !== ownerId)
  const hasEligibleRaters = eligibleRaters.length > 0
  const isHost = state.hostId === userId
  const votes = Object.keys(round.ratings[ownerId] ?? {}).length
  const [selectedStars, setSelectedStars] = useState(0)

  const myStars = myRating !== undefined ? Math.round(myRating / 2) : 0

  return (
    <Stack align="center" gap="4" w="full">
      <TimerBar timeLeft={timeLeft} total={total} />

      <QuestionCard question={round.question} />

      <Flex align="center" gap="2">
        <Avatar name={owner?.name ?? ownerId} avatar={owner?.avatar} size="md" />
        <Text color="fg.default" fontSize="sm" fontWeight="semibold" m={0}>{owner?.name}</Text>
      </Flex>

      <Box w="full" maxW="xl" bg="surface.card" borderRadius="11px" p="6" textAlign="center">
        <Text color="fg.default" fontSize="md" m={0} fontStyle="italic" lineHeight="relaxed">
          "{round.answers[ownerId]}"
        </Text>
      </Box>

      {!hasEligibleRaters ? (
        <Stack align="center" gap="3" w="full">
          <Text color="fg.muted" fontSize="sm" textAlign="center" m={0}>{t('rating.noEligibleRaters')}</Text>
          {isHost && (
            <Button minWidth="150px" onClick={() => sync.sendRevealNext()}>
              {t('revealing.skipVoting')}
            </Button>
          )}
        </Stack>
      ) : isMyAnswer || isSpectator ? (
        <Stack align="center" gap="2">
          <StarRow value={myStars} max={5} disabled />
          <Text color="fg.muted" fontSize="sm" m={0}>
            {votes}/{eligibleRaters.length} {t('rating.playerVote')}
          </Text>
        </Stack>
      ) : myRating !== undefined ? (
        <Stack align="center" gap="2">
          <StarRow value={myStars} max={5} disabled />
          <Text color="fg.muted" fontSize="sm" m={0}>
            {votes}/{eligibleRaters.length} {t('rating.playerVoted')}
          </Text>
        </Stack>
      ) : (
        <Stack align="center" gap="3" w="full">
          <Text color="fg.muted" fontSize="sm" m={0}>
            {votes}/{eligibleRaters.length} {t('rating.playerVote')}
          </Text>
          <StarRow max={5} value={selectedStars} onSelect={setSelectedStars} />
          <Button
            minWidth="150px"
            disabled={selectedStars === 0}
            onClick={() => sync.sendRateAnswer(ownerId, selectedStars * 2)}
          >
            {t('rating.rate')}
          </Button>
        </Stack>
      )}
    </Stack>
  )
}