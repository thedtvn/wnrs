import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Heading, Spinner, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import { useDiscord } from '@src/discord/DiscordContext'
import { useGameSync } from '@src/hooks/useGameSync'
import { useLocale } from '@src/hooks/useLocale'
import type { GameRoute } from '@src/client/router'
import { LobbyPhase } from './LobbyPhase'
import { AnsweringPhase } from './AnsweringPhase'
import { RevealingPhase } from './RevealingPhase'
import { RatingPhase } from './RatingPhase'
import { ScoringPhase } from './ScoringPhase'
import { FinishedPhase } from './FinishedPhase'

interface GameProps {
  route: GameRoute
  onExit: () => void
}

export default function Game({ route, onExit }: GameProps) {
  const { user, instanceId, jwt, mode } = useDiscord()
  const { t, locale } = useLocale()
  const roomId = instanceId ? `discord:${instanceId}` : `web:${route.seed}`
  const sync = useGameSync(roomId, user, jwt)

  const state = sync.state
  const amHost = state?.hostId === user?.id
  const isSpectator = state?.spectatorIds.includes(user?.id ?? '') ?? false

  const wasInLobby = useRef(false)
  const [midgameChoice, setMidgameChoice] = useState<'pending' | 'spectate' | 'leave'>('pending')

  if (state?.phase === 'lobby') wasInLobby.current = true

  const showMidgameGate = state && state.phase !== 'lobby' && !wasInLobby.current && midgameChoice === 'pending'

  if (!state || !sync.connected) {
    return (
      <Flex as="main" h="full" alignItems="center" justifyContent="center" bg="bg.canvas">
        <Stack align="center" gap="4">
          <Spinner size="lg" colorPalette="brand" />
          <Text color="fg.muted">{t('common.loading')}</Text>
          {sync.error && <Text color="red.400" fontSize="sm">{sync.error}</Text>}
        </Stack>
      </Flex>
    )
  }

  if (showMidgameGate) {
    return (
      <Flex as="main" h="full" alignItems="center" justifyContent="center" bg="bg.canvas">
        <Stack gap="5" w="full" maxW="xs" p="6">
          <Box textAlign="center">
            <Heading as="h2" fontSize="xl" fontWeight="bold" color="fg.default" m={0}>
              {t('midgame.title')}
            </Heading>
            <Text color="fg.muted" fontSize="sm" mt="2" m={0}>{t('midgame.description')}</Text>
          </Box>

          <Flex w="full" bg="surface.card" borderRadius="l3" p="4" alignItems="center" gap="3">
            <Avatar
              name={state.players.find(p => p.id === state.hostId)?.name ?? ''}
              avatar={state.players.find(p => p.id === state.hostId)?.avatar}
              size="md"
            />
            <Box flex="1" minWidth={0}>
              <Text color="fg.default" fontSize="sm" fontWeight="semibold" m={0} lineClamp={1}>
                {state.players.find(p => p.id === state.hostId)?.name}
              </Text>
              <Text color="fg.muted" fontSize="xs" m={0}>
                {t('midgame.host')} · {state.players.length} {t('midgame.players')}
              </Text>
            </Box>
          </Flex>

          <Button width="full" onClick={() => setMidgameChoice('spectate')}>
            {t('midgame.joinSpectate')}
          </Button>

          <Button variant="ghost" width="full" onClick={() => { setMidgameChoice('leave'); onExit() }}>
            {t('midgame.backToHome')}
          </Button>
        </Stack>
      </Flex>
    )
  }

  return (
    <Flex as="main" h="full" direction="column" bg="bg.canvas">
      <Flex direction="column" alignItems="center" flex="1" overflow="hidden">
        <Stack
          w="full"
          maxW={{ base: 'lg', md: '2xl' }}
          alignItems="center"
          gap="4"
          padding={{ base: '4', sm: '6', md: '8' }}
          flex="1"
          overflowY="auto"
        >
          {state.phase === 'lobby' && (
            <LobbyPhase state={state} sync={sync} amHost={amHost} isSpectator={isSpectator} userId={user?.id} t={t} locale={locale} />
          )}
          {state.phase === 'answering' && (
            <AnsweringPhase state={state} sync={sync} amHost={amHost} isSpectator={isSpectator} t={t} />
          )}
          {state.phase === 'revealing' && (
            <RevealingPhase state={state} sync={sync} amHost={amHost} t={t} />
          )}
          {state.phase === 'rating' && (
            <RatingPhase state={state} sync={sync} isSpectator={isSpectator} userId={user?.id} t={t} />
          )}
          {state.phase === 'scoring' && (
            <ScoringPhase state={state} sync={sync} amHost={amHost} t={t} />
          )}
          {state.phase === 'finished' && (
            <FinishedPhase state={state} onExit={onExit} t={t} />
          )}
        </Stack>
      </Flex>
    </Flex>
  )
}
