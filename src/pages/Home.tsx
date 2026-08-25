import { useState } from 'react'
import { Button } from '@src/components/ui/button'
import { useDiscord } from '@src/discord/DiscordContext'
import { useLocale } from '@src/hooks/useLocale'
import { navigate } from '@src/client/router'
import type { GameRoute } from '@src/client/router'
import { Flex, Text, Heading, Input } from '@chakra-ui/react'

export default function Home() {
  const { user, instanceId, mode } = useDiscord()
  const { locale, setLocale, t } = useLocale()
  const [joinCode, setJoinCode] = useState('')

  const createRoom = () => {
    const seed = crypto.randomUUID().slice(0, 8)
    const name = user?.name ?? 'Player'
    const route: GameRoute = { view: 'game', seed, names: [name] }
    navigate(route)
  }

  const joinRoom = () => {
    const code = joinCode.trim()
    if (!code) return
    const name = user?.name ?? 'Player'
    const route: GameRoute = { view: 'game', seed: code, names: [name] }
    navigate(route)
  }

  if (mode === 'discord' && instanceId) {
    const route: GameRoute = { view: 'game', seed: instanceId, names: [user?.name ?? 'Player'] }
    navigate(route)
    return null
  }

  return (
    <Flex as="main" direction="column" alignItems="center" justifyContent="center" h="full" gap="8" padding="6" position="relative" bg="bg.canvas">
      <Button
        variant="ghost"
        position="absolute"
        top="4"
        right="4"
        minWidth="44px"
        minHeight="44px"
        size="sm"
        borderWidth="1px"
        borderColor="border.subtle"
        bg="surface.raised"
        onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}
      >
        {locale === 'en' ? '🇻🇳 VI' : '🇬🇧 EN'}
      </Button>

      <Flex direction="column" alignItems="center" textAlign="center">
        <Heading fontSize={{ base: '3xl', sm: '4xl' }} fontWeight="bold" color="fg.default" letterSpacing="tight" lineHeight="tight">
          Let Talk
        </Heading>
        <Text color="fg.muted" fontSize="sm" mt="2">
          Online
        </Text>
      </Flex>

      <Flex direction="column" gap="3" w="100%" maxW="xs">
        <Button onClick={createRoom} w="100%" fontSize="md" fontWeight="semibold">
          {t('home.newGame') || 'New Game'}
        </Button>

        <Flex gap="2">
          <Input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder={t('home.enterCode') || 'Room code'}
            onKeyDown={e => e.key === 'Enter' && joinRoom()}
            minHeight="48px"
            width="100%"
            bg="surface.raised"
            borderColor="border.subtle"
            color="fg.default"
            fontSize="sm"
            borderRadius="l2"
            _placeholder={{ color: 'fg.muted' }}
            _focusVisible={{ borderColor: 'brand.solid', boxShadow: '0 0 0 2px var(--chakra-colors-brand-solid)' }}
          />
          <Button variant="secondary" onClick={joinRoom} disabled={!joinCode.trim()}>
            {t('home.join') || 'Join'}
          </Button>
        </Flex>
      </Flex>

      <Text color="fg.muted" fontSize="xs" marginTop="auto" opacity={0.6}>
        The card game about what really matters
      </Text>
    </Flex>
  )
}
