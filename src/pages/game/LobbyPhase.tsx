import { useEffect, useState } from 'react'
import { Badge, Box, Flex, Heading, Input, Slider, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import { DeckSelector } from '@src/components/DeckSelector'
import { DECK_REGISTRY } from '@src/decks/registry'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState, GameSettings } from '@src/shared/types'

export function LobbyPhase({
  state, sync, amHost, isSpectator, userId, t, locale,
}: {
  state: GameState
  sync: ReturnType<typeof useGameSync>
  amHost: boolean
  isSpectator: boolean
  userId?: string
  t: (k: string) => string
  locale: 'en' | 'vi'
}) {
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<GameSettings>(state.settings)

  const allReady = state.players
    .filter(p => p.id !== state.hostId)
    .every(p => state.readyIds.includes(p.id))

  const iAmReady = state.readyIds.includes(userId ?? '')
  const iAmSpectator = state.spectatorIds.includes(userId ?? '')
  const selectedDecks = state.settings.selectedDecks

  useEffect(() => { setSettings({ ...state.settings, locale }) }, [state.settings, locale])

  const decksCard = (
    <Box w="full" bg="surface.card" borderRadius="l3" p="4">
      <DeckSelector selected={selectedDecks} readOnly />
    </Box>
  )

  const MAX_CIRCLES = 11
  const visiblePlayers = state.players.slice(0, MAX_CIRCLES)
  const extraCount = state.players.length - visiblePlayers.length

  const playersCircleGrid = (
    <Flex w="full" wrap="wrap" justify="center" gap={{ base: '4', lg: '6' }}>
      {visiblePlayers.map(p => {
        const canTransfer = amHost && p.id !== state.hostId && !state.spectatorIds.includes(p.id)
        return (
          <Box
            key={p.id}
            position="relative"
            role="group"
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap="1"
            width="96px"
          >
            <Avatar name={p.name} avatar={p.avatar} size="xl" />
            <Text color="fg.default" fontSize="xs" lineClamp={1} m={0} textAlign="center" maxW="96px">
              {p.name}
            </Text>
            {p.id === state.hostId ? (
              <Badge
                borderRadius="full"
                px="2"
                fontSize="10px"
                fontWeight="semibold"
                bg="accent.subtle"
                color="accent.fg"
              >
                {t('common.host')}
              </Badge>
            ) : state.readyIds.includes(p.id) ? (
              <Badge
                borderRadius="full"
                px="2"
                fontSize="10px"
                fontWeight="semibold"
                bg="success.subtle"
                color="success.fg"
              >
                ✓
              </Badge>
            ) : null}
            {canTransfer && (
              <Button
                variant="secondary"
                size="sm"
                opacity={0}
                _groupHover={{ opacity: 1 }}
                _focusVisible={{ opacity: 1 }}
                transition="opacity 150ms"
                onClick={() => sync.sendTransferHost(p.id)}
                aria-label={`${t('lobby.makeHost')}: ${p.name}`}
              >
                {t('lobby.makeHost')}
              </Button>
            )}
          </Box>
        )
      })}
      {extraCount > 0 && (
        <Box display="flex" flexDirection="column" alignItems="center" gap="1" width="96px">
          <Flex
            boxSize="80px"
            borderRadius="full"
            borderWidth="2px"
            borderColor="whiteAlpha.300"
            bg="surface"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="fg.default" fontSize="2xl" fontWeight="bold" m={0}>+{extraCount}</Text>
          </Flex>
          <Text color="fg.muted" fontSize="xs" m={0}>
            {extraCount} {t('midgame.players')}
          </Text>
        </Box>
      )}
    </Flex>
  )

  const selectedDeckPills = (
    <Flex wrap="wrap" justify="center" gap="2">
      {selectedDecks.map(slug => {
        const deck = DECK_REGISTRY.find(d => d.slug === slug)
        return (
          <Box
            key={slug}
            px="3"
            py="1"
            borderRadius="12px"
            bg="surface.raised"
            fontSize="xs"
            color="fg.default"
          >
            {deck ? t(deck.nameKey) : slug}
          </Box>
        )
      })}
    </Flex>
  )

  const playersCard = (
    <Box w="full" bg="surface.card" borderRadius="l3" p="4">
      {state.players.map(p => {
        const canTransfer = amHost && p.id !== state.hostId && !state.spectatorIds.includes(p.id)
        return (
          <Box
            key={p.id}
            position="relative"
            role="group"
            borderRadius="l2"
            _hover={{ bg: 'whiteAlpha.100' }}
          >
            <Flex alignItems="center" gap="3" py="2.5" minHeight="48px">
              <Avatar name={p.name} avatar={p.avatar} size="md" />
              <Text color="fg.default" flex="1" fontSize="sm" fontWeight="semibold" lineClamp={1} m={0}>
                {p.name}
              </Text>
              <Badge
                borderRadius="full"
                px="2.5"
                py="1"
                fontSize="xs"
                fontWeight="semibold"
                bg={
                  p.id === state.hostId ? 'accent.subtle'
                    : state.readyIds.includes(p.id) ? 'success.subtle'
                    : 'whiteAlpha.200'
                }
                color={
                  p.id === state.hostId ? 'accent.fg'
                    : state.readyIds.includes(p.id) ? 'success.fg'
                    : 'fg.muted'
                }
              >
                {p.id === state.hostId ? t('common.host') : state.readyIds.includes(p.id) ? '✓' : '...'}
              </Badge>
            </Flex>
            {canTransfer && (
              <Button
                variant="secondary"
                size="sm"
                position="absolute"
                right="2"
                top="50%"
                transform="translateY(-50%)"
                opacity={{ base: 1, lg: 0 }}
                _groupHover={{ opacity: 1 }}
                _focusVisible={{ opacity: 1 }}
                transition="opacity 150ms"
                bg="surface.raised"
                onClick={() => sync.sendTransferHost(p.id)}
                aria-label={`${t('lobby.makeHost')}: ${p.name}`}
              >
                {t('lobby.makeHost')}
              </Button>
            )}
          </Box>
        )
      })}
      {state.spectatorIds.length > 0 && (
        <Text color="fg.muted" fontSize="sm" mt="2" m={0}>
          {state.spectatorIds.length} {t('common.spectator').toLowerCase()}
        </Text>
      )}
    </Box>
  )

  const settingsPanel = (
    <Stack gap="4">
      <Box w="full" bg="surface.card" borderRadius="l3" p="4">
        <DeckSelector
          selected={selectedDecks}
          onChange={next => sync.sendSetSettings({ ...settings, selectedDecks: next })}
        />
      </Box>

      <Stack w="full" bg="surface.card" borderRadius="l3" p="4" gap="4">
        <Stack gap="3">
          <Text color="fg.muted" fontSize="sm" m={0}>
            {t('lobby.answerTime')}{' '}
            <Text as="span" color="fg.default" ml="2" fontWeight="semibold">{settings.answerSeconds}s</Text>
          </Text>
          <Slider.Root
            min={10}
            max={300}
            step={10}
            value={[settings.answerSeconds]}
            onValueChange={e => setSettings(s => ({ ...s, answerSeconds: e.value[0] }))}
            colorPalette="brand"
            w="full"
          >
            <Slider.Control>
              <Slider.Track><Slider.Range /></Slider.Track>
              <Slider.Thumb index={0} />
            </Slider.Control>
          </Slider.Root>

          <Text color="fg.muted" fontSize="sm" m={0}>
            {t('lobby.ratingTime')}{' '}
            <Text as="span" color="fg.default" ml="2" fontWeight="semibold">{settings.ratingSeconds}s</Text>
          </Text>
          <Slider.Root
            min={5}
            max={120}
            step={5}
            value={[settings.ratingSeconds]}
            onValueChange={e => setSettings(s => ({ ...s, ratingSeconds: e.value[0] }))}
            colorPalette="brand"
            w="full"
          >
            <Slider.Control>
              <Slider.Track><Slider.Range /></Slider.Track>
              <Slider.Thumb index={0} />
            </Slider.Control>
          </Slider.Root>

          <Text as="label" color="fg.muted" fontSize="sm" m={0}>
            {t('lobby.totalRounds')}{' '}
            <Input
              type="number"
              min={0}
              max={50}
              value={settings.totalRounds}
              onChange={e => setSettings(s => ({ ...s, totalRounds: +e.target.value }))}
              width="16"
              ml="2"
              display="inline-block"
              size="sm"
            />
            <Text as="span" color="fg.muted" ml="1">(0 = unlimited)</Text>
          </Text>
        </Stack>

        <Button width="full" onClick={() => sync.sendSetSettings(settings)}>
          {t('common.save')}
        </Button>
      </Stack>
    </Stack>
  )

  return (
    <>
      <Heading as="h2" fontSize="3xl" fontWeight="semibold" color="fg.default" m={0} textAlign="center">
        {t('lobby.title')}
      </Heading>

      {playersCircleGrid}

      <Stack align="center" gap="4" w="full">
        {selectedDeckPills}

        {amHost ? (
          <Flex gap="3" wrap="wrap" justify="center">
            <Button
              minWidth="165px"
              onClick={() => sync.sendStart()}
              disabled={!allReady}
              title={allReady ? undefined : t('lobby.waitingForPlayers')}
            >
              {t('lobby.startGame')}
            </Button>
            <Button
              variant="secondary"
              minWidth="165px"
              bg="surface.raised"
              onClick={() => setShowSettings(true)}
            >
              {t('lobby.hostSettings')}
            </Button>
          </Flex>
        ) : (
          <Flex gap="3" wrap="wrap" justify="center">
            {!iAmSpectator && (
              <Button
                minWidth="165px"
                variant="secondary"
                bg="surface.raised"
                onClick={() => sync[iAmReady ? 'sendUnready' : 'sendReady']()}
              >
                {iAmReady ? t('lobby.unready') : t('lobby.readyUp')}
              </Button>
            )}
            <Button
              minWidth="165px"
              variant="secondary"
              bg="surface.raised"
              onClick={() => sync[iAmSpectator ? 'sendUnspectate' : 'sendSpectate']()}
            >
              {iAmSpectator ? t('lobby.joinAsPlayer') : t('lobby.spectate')}
            </Button>
          </Flex>
        )}

        {amHost && !allReady && (
          <Text color="fg.muted" fontSize="sm" m={0} textAlign="center">
            {t('lobby.waitingForPlayers')}
          </Text>
        )}
      </Stack>

      {showSettings && (
        <Box
          position="fixed"
          inset="0"
          zIndex={50}
          bg="blackAlpha.700"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
          onClick={() => setShowSettings(false)}
        >
          <Box
            w="full"
            maxW="lg"
            maxH="full"
            overflowY="auto"
            bg="bg.canvas"
            borderRadius="l3"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="xl"
            p="5"
            onClick={e => e.stopPropagation()}
          >
            <Flex justify="space-between" align="center" mb="4">
              <Heading as="h3" fontSize="lg" fontWeight="bold" color="fg.default" m={0}>
                {t('lobby.hostSettings')}
              </Heading>
              <Button variant="ghost" size="sm" minWidth="36px" onClick={() => setShowSettings(false)} aria-label={t('common.close')}>
                ✕
              </Button>
            </Flex>
            <Stack gap="4">
              <Box w="full" bg="surface.card" borderRadius="l3" p="4">
                <DeckSelector
                  selected={selectedDecks}
                  onChange={next => sync.sendSetSettings({ ...settings, selectedDecks: next })}
                />
              </Box>

              <Stack w="full" bg="surface.card" borderRadius="l3" p="4" gap="4">
                <Stack gap="3">
                  <Text color="fg.muted" fontSize="sm" m={0}>
                    {t('lobby.answerTime')}{' '}
                    <Text as="span" color="fg.default" ml="2" fontWeight="semibold">{settings.answerSeconds}s</Text>
                  </Text>
                  <Slider.Root
                    min={10}
                    max={300}
                    step={10}
                    value={[settings.answerSeconds]}
                    onValueChange={e => setSettings(s => ({ ...s, answerSeconds: e.value[0] }))}
                    colorPalette="brand"
                    w="full"
                  >
                    <Slider.Control>
                      <Slider.Track><Slider.Range /></Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>

                  <Text color="fg.muted" fontSize="sm" m={0}>
                    {t('lobby.ratingTime')}{' '}
                    <Text as="span" color="fg.default" ml="2" fontWeight="semibold">{settings.ratingSeconds}s</Text>
                  </Text>
                  <Slider.Root
                    min={5}
                    max={120}
                    step={5}
                    value={[settings.ratingSeconds]}
                    onValueChange={e => setSettings(s => ({ ...s, ratingSeconds: e.value[0] }))}
                    colorPalette="brand"
                    w="full"
                  >
                    <Slider.Control>
                      <Slider.Track><Slider.Range /></Slider.Track>
                      <Slider.Thumb index={0} />
                    </Slider.Control>
                  </Slider.Root>

                  <Text as="label" color="fg.muted" fontSize="sm" m={0}>
                    {t('lobby.totalRounds')}{' '}
                    <Input
                      type="number"
                      min={0}
                      max={50}
                      value={settings.totalRounds}
                      onChange={e => setSettings(s => ({ ...s, totalRounds: +e.target.value }))}
                      width="16"
                      ml="2"
                      display="inline-block"
                      size="sm"
                    />
                    <Text as="span" color="fg.muted" ml="1">(0 = unlimited)</Text>
                  </Text>
                </Stack>

                <Button width="full" onClick={() => sync.sendSetSettings(settings)}>
                  {t('common.save')}
                </Button>
              </Stack>
            </Stack>
          </Box>
        </Box>
      )}
    </>
  )
}