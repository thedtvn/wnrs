import { Box, Flex, Heading, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import type { GameState, PlayerInfo } from '@src/shared/types'
import { ATTRACTIVE_THRESHOLD } from './constants'

export function FinishedPhase({
  state, onExit, t,
}: {
  state: GameState
  onExit: () => void
  t: (k: string) => string
}) {
  const allAnswers: { answer: string; player?: PlayerInfo; mean: number }[] = []
  for (const round of state.roundHistory) {
    for (const [id, answer] of Object.entries(round.answers)) {
      const player = state.players.find(p => p.id === id)
      const ratings = Object.values(round.ratings[id] ?? {})
      const mean = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0
      allAnswers.push({ answer, player, mean })
    }
  }
  const best = allAnswers.reduce((a, b) => b.mean > a.mean ? b : a, allAnswers[0])

  const attractionMap = new Map<string, { rater: PlayerInfo | undefined; answerer: PlayerInfo | undefined; ratings: number[] }>()
  for (const round of state.roundHistory) {
    for (const [answerId, raters] of Object.entries(round.ratings)) {
      for (const [raterId, rating] of Object.entries(raters)) {
        if (rating < ATTRACTIVE_THRESHOLD) continue
        const key = [raterId, answerId].sort().join(':')
        const existing = attractionMap.get(key)
        if (existing) {
          existing.ratings.push(rating)
        } else {
          attractionMap.set(key, {
            rater: state.players.find(p => p.id === raterId),
            answerer: state.players.find(p => p.id === answerId),
            ratings: [rating],
          })
        }
      }
    }
  }
  const attractions = Array.from(attractionMap.values()).sort((a, b) => b.ratings.length - a.ratings.length)

  return (
    <Stack align="center" gap="5" w="full" overflowY="auto">
      <Heading as="h2" color="accent.fg" fontSize="3xl" fontWeight="bold" m={0}>
        {t('finished.gameOver')}
      </Heading>

      {best ? (
        <Box w="full" bg="cardFace" borderRadius="22px" p="6" textAlign="center" maxW="320px" mx="auto">
          <Text color="fg.muted" fontSize="xs" mb="3" m={0} textTransform="uppercase" letterSpacing="wider" fontWeight="semibold">
            {t('finished.highestRated')}
          </Text>
          <Flex direction="column" alignItems="center" gap="2" mb="3">
            <Avatar name={best.player?.name ?? ''} avatar={best.player?.avatar} size="lg" />
            <Text color="fg.default" fontSize="md" fontWeight="semibold" m={0}>{best.player?.name}</Text>
          </Flex>
          <Text color="fg.onCard" fontSize="lg" m={0} fontStyle="italic" lineHeight="relaxed">"{best.answer}"</Text>
          <Text color="accent.fg" fontWeight="bold" fontSize="3xl" mt="3" m={0} fontVariantNumeric="tabular-nums">
            {best.mean.toFixed(1)}
          </Text>
        </Box>
      ) : (
        <Text color="fg.muted" fontSize="sm" m={0}>{t('finished.noAnswers')}</Text>
      )}

      {attractions.length > 0 ? (
        <Box w="full" bg="surface.card" borderRadius="l3" p="4" borderWidth="1px" borderColor="border.subtle">
          <Text color="fg.muted" fontSize="xs" textTransform="uppercase" letterSpacing="wider" fontWeight="semibold" mb="3" m={0}>
            {t('finished.attractionPoints')}
          </Text>
          <Stack gap="2">
            {attractions.map((a, i) => (
              <Flex key={i} alignItems="center" gap="3" bg="surface.card" borderRadius="l2" p="3" borderWidth="1px" borderColor="border.subtle">
                <Avatar name={a.rater?.name ?? ''} avatar={a.rater?.avatar} size="sm" />
                <Text color="fg.default" fontSize="sm" m={0}>→</Text>
                <Avatar name={a.answerer?.name ?? ''} avatar={a.answerer?.avatar} size="sm" />
                <Text color="fg.default" fontSize="sm" fontWeight="semibold" lineClamp={1} flex="1" m={0}>
                  {a.rater?.name} → {a.answerer?.name}
                </Text>
                <Text color="accent.fg" fontSize="xs" fontWeight="bold" m={0}>{a.ratings.length}×</Text>
              </Flex>
            ))}
          </Stack>
        </Box>
      ) : (
        <Text color="fg.muted" fontSize="sm" m={0}>{t('finished.noAttractions')}</Text>
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
