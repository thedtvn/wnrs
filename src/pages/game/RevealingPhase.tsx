import { Box, Flex, SimpleGrid, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
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
      <SimpleGrid columns={{ base: 4, md: 6 }} gap="4" w="full" justifyItems="center">
        {submitted.map(id => {
          const player = state.players.find(p => p.id === id)
          return (
            <Box key={id} display="flex" flexDirection="column" alignItems="center" gap="1">
              <Avatar name={player?.name ?? id} avatar={player?.avatar} size="lg" />
              <Text color="fg.default" fontSize="xs" lineClamp={1} m={0} maxW="80px" textAlign="center">
                {player?.name ?? id}
              </Text>
            </Box>
          )
        })}
      </SimpleGrid>

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