import { useEffect, useState } from 'react'
import { createListCollection, Select, Badge, Box, Flex, Heading, Input, Slider, Stack, Text } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import { Avatar } from '@src/components/ui/avatar'
import { DeckSelector } from '@src/components/DeckSelector'
import { DECK_REGISTRY } from '@src/decks/registry'
import { PlayerCircleGrid } from './PlayerCircleGrid'
import { useLocale } from '@src/hooks/useLocale'
import type { useGameSync } from '@src/hooks/useGameSync'
import type { GameState, GameSettings } from '@src/shared/types'

const langCollection = createListCollection<{ label: string; value: 'en' | 'vi' }>({
  items: [
    { label: '🇬🇧 English', value: 'en' },
    { label: '🇻🇳 Tiếng Việt', value: 'vi' },
  ],
})

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
  const { setLocale } = useLocale()
  const [confirmTarget, setConfirmTarget] = useState<string | null>(null)
  const [settings, setSettings] = useState<GameSettings>(state.settings)

  const allReady = state.players
    .filter(p => p.id !== state.hostId)
    .every(p => state.readyIds.includes(p.id))

  const iAmReady = state.readyIds.includes(userId ?? '')
  const iAmSpectator = state.spectatorIds.includes(userId ?? '')
  const selectedDecks = state.settings.selectedDecks

  useEffect(() => { setSettings({ ...state.settings, locale }) }, [state.settings, locale])


  const playersCircleGrid = (
    <PlayerCircleGrid
      players={state.players}
      maxVisible={8}
      moreLabel={n => `${n} ${t('midgame.players')}`}
      badge={p =>
        p.id === state.hostId ? (
          <Badge borderRadius="full" px="2" fontSize="10px" fontWeight="semibold" bg="accent.subtle" color="accent.fg">
            {t('common.host')}
          </Badge>
        ) : state.readyIds.includes(p.id) ? (
          <Badge borderRadius="full" px="2" fontSize="10px" fontWeight="semibold" bg="success.subtle" color="success.fg">
            ✓
          </Badge>
        ) : null
      }
      circleOverlay={p => {
        const canTransfer = amHost && p.id !== state.hostId && !state.spectatorIds.includes(p.id)
        if (!canTransfer) return null
        if (confirmTarget === p.id) {
          return (
            <Flex
              position="absolute"
              inset="-10px -14px auto -14px"
              zIndex={5}
              direction="column"
              gap="1"
              bg="surface"
              borderWidth="1px"
              borderColor="border.subtle"
              borderRadius="l2"
              p="2"
              boxShadow="lg"
            >
              <Text fontSize="10px" color="fg.default" m={0} textAlign="center" lineClamp={2}>
                {t('lobby.confirmTransfer')} {p.name}?
              </Text>
              <Flex gap="1" justify="center">
                <Button size="sm" px="2" onClick={() => { sync.sendTransferHost(p.id); setConfirmTarget(null) }}>
                  ✓
                </Button>
                <Button variant="ghost" size="sm" px="2" onClick={() => setConfirmTarget(null)}>
                  ✕
                </Button>
              </Flex>
            </Flex>
          )
        }
        return (
          <Button
            variant="secondary"
            size="sm"
            position="absolute"
            inset="0"
            opacity={0}
            _groupHover={{ opacity: 1 }}
            _focusVisible={{ opacity: 1 }}
            transition="opacity 150ms"
            onClick={() => setConfirmTarget(p.id)}
            aria-label={`${t('lobby.makeHost')}: ${p.name}`}
          >
            {t('lobby.makeHost')}
          </Button>
        )
      }}
    />
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
            fontSize="sm"
            color="fg.default"
          >
            {deck ? t(deck.nameKey) : slug}
          </Box>
        )
      })}
    </Flex>
  )

  return (
    <Box position="relative" w="full">
      <Box position="absolute" top="0" right="0" minWidth="120px">
        <Select.Root
          collection={langCollection}
          size="sm"
          value={[locale]}
          onValueChange={e => setLocale(e.value[0] as 'en' | 'vi')}
          positioning={{ placement: 'bottom-end' }}
        >
          <Select.HiddenSelect aria-label="Language" />
          <Select.Control>
            <Select.Trigger
              minHeight="40px"
              borderRadius="l2"
              bg="surface.raised"
              borderColor="border.subtle"
              color="fg.default"
            >
              <Select.ValueText />
            </Select.Trigger>
            <Select.Indicator />
          </Select.Control>
          <Select.Positioner>
            <Select.Content bg="surface" borderColor="border.subtle">
              {langCollection.items.map(item => (
                <Select.Item item={item} key={item.value} fontSize="sm" color="fg.default">
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Select.Root>
      </Box>

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
    </Box>
  )
}