import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import type { GameState, PlayerInfo } from '@src/shared/types'

interface RatedAnswer {
  question: string
  answer: string
  player?: PlayerInfo
  mean: number
}

export function FinishedPhase({
  state, onExit, t,
}: {
  state: GameState
  onExit: () => void
  t: (k: string) => string
}) {
  const allAnswers: RatedAnswer[] = []
  for (const round of state.roundHistory) {
    for (const [id, answer] of Object.entries(round.answers)) {
      const ratings = Object.values(round.ratings[id] ?? {})
      const mean = ratings.length > 0
        ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
        : 0
      allAnswers.push({
        question: round.question,
        answer,
        player: state.players.find(player => player.id === id),
        mean,
      })
    }
  }

  const highestMean = allAnswers.reduce(
    (highest, entry) => Math.max(highest, entry.mean),
    0,
  )
  const highestRatedAnswers = allAnswers.filter(entry => entry.mean === highestMean)

  return (
    <Stack align="center" gap="5" w="full" overflowY="auto">
      <Heading as="h2" color="accent.fg" fontSize="3xl" fontWeight="bold" m={0}>
        {t('finished.gameOver')}
      </Heading>

      {highestRatedAnswers.length > 0 ? (
        <Stack w="full" maxW="xl" gap="4">
          <Text color="fg.muted" fontSize="xs" m={0} textAlign="center" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold">
            {t('finished.highestRated')}
          </Text>
          {highestRatedAnswers.map((entry, index) => (
            <Box
              key={`${entry.question}:${entry.player?.id ?? index}`}
              w="full"
              bg="#1a1a1a"
              borderRadius="22px"
              borderWidth="1px"
              borderColor="whiteAlpha.200"
              p="5"
            >
              <Text color="fg.default" fontSize="lg" fontWeight="semibold" lineHeight="relaxed" mb="3" m={0}>
                {entry.question}
              </Text>
              <Flex alignItems="center" gap="2" wrap="wrap">
                <Text color="accent.fg" fontWeight="bold" fontSize="md" m={0} fontVariantNumeric="tabular-nums">
                  {(entry.mean / 2).toFixed(1)}
                </Text>
                <Text aria-hidden="true" fontSize="lg" lineHeight={1} m={0} color="#ffd700">★</Text>
                <Text color="fg.default" fontSize="md" m={0}>
                  {entry.player?.name ?? ''} - "{entry.answer}"
                </Text>
              </Flex>
            </Box>
          ))}
        </Stack>
      ) : (
        <Text color="fg.muted" fontSize="sm" m={0}>{t('finished.noAnswers')}</Text>
      )}

      <Text color="fg.muted" fontSize="sm" m={0}>
        {state.roundHistory.length} {state.roundHistory.length === 1 ? 'round' : 'rounds'} · {state.players.length} {state.players.length === 1 ? 'player' : 'players'}
      </Text>

      <Button width="full" onClick={onExit}>
        {t('common.mainPage')}
      </Button>
    </Stack>
  )
}
