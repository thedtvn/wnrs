import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { PlayerCircleGrid } from './PlayerCircleGrid'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState } from '@src/shared/types'
import { QuestionCard } from './QuestionCard'

export function RevealingPhase({
  state, sync, amHost, t,
}: {
  state: GameState
  sync: ReturnType<typeof useGameSync>
  amHost: boolean
  t: (k: string) => string
}) {
  const round = state.round!
  const submitted = Object.keys(round.answers)

  return (
    <Stack align="center" gap="5" w="full">
      <QuestionCard question={round.question} />

      <Text color="fg.muted" fontSize="sm" m={0}>{t('revealing.submittedPlayers')}</Text>
      <PlayerCircleGrid
        players={submitted.map(id => state.players.find(p => p.id === id) ?? { id, name: id })}
        maxVisible={8}
        moreLabel={n => `+${n} ${t('midgame.players')}`}
      />

      {amHost ? (
        <Button minWidth="150px" onClick={() => sync.sendRevealNext()}>
          {t('revealing.revealNext')}
        </Button>
      ) : (
        <Text color="fg.muted" fontSize="sm" m={0}>{t('revealing.waitingForHost')}</Text>
      )}
    </Stack>
  )
}