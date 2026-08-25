import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'
import { QuestionCard } from './QuestionCard'

export function ScoringPhase({
  state, sync, amHost, t,
}: {
  state: GameState
  sync: ReturnType<typeof useGameSync>
  amHost: boolean
  t: (k: string) => string
}) {
  const round = state.round!

  const entries = Object.entries(round.answers).map(([id, answer]) => {
    const player = state.players.find(p => p.id === id)
    const ratings = Object.values(round.ratings[id] ?? {})
    const mean = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
    return { id, answer, player, mean }
  })
  const best = entries.reduce((a, b) => b.mean > a.mean ? b : a, entries[0])
  const totalRounds = state.settings.totalRounds

  return (
    <Stack align="center" gap="5" w="full">
      <QuestionCard question={round.question} />

      <Stack w="full" maxW="xl" bg="surface.card" borderRadius="11px" p="4" gap="2">
        {entries.map(e => (
          <Flex key={e.id} alignItems="center" gap="3" py="1.5" px="2" borderRadius="l2" bg={best.id === e.id ? 'whiteAlpha.100' : undefined}>
            <Avatar name={e.player?.name ?? e.id} avatar={e.player?.avatar} size="md" />
            <Text color="fg.default" flex="1" fontSize="sm" fontWeight="semibold" lineClamp={1} m={0}>
              {e.player?.name ?? e.id}
            </Text>
            <Text color="fg.muted" fontSize="xs" lineClamp={1} maxW="40%" m={0} fontStyle="italic">
              "{e.answer}"
            </Text>
            <Text color="fg.default" fontSize="sm" fontWeight="bold" m={0} fontVariantNumeric="tabular-nums">
              {(e.mean / 2).toFixed(1)}
            </Text>
            <Text fontSize="xl" lineHeight={1} m={0} color="#ffd700">{'\u2605'}</Text>
          </Flex>
        ))}
      </Stack>

      <Text color="fg.muted" fontSize="sm" m={0} fontVariantNumeric="tabular-nums">
        {state.roundNumber} / {totalRounds > 0 ? totalRounds : '\u221E'}
      </Text>

      {amHost && (
        <Button minWidth="177px" onClick={() => sync.sendNextQuestion()}>
          {t('scoring.nextQuestion')}
        </Button>
      )}
    </Stack>
  )
}