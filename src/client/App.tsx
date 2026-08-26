import { useEffect, useState } from 'react'
import { ThemeProvider } from '@src/context/ThemeContext'
import { DiscordProvider, useDiscord } from '@src/discord/DiscordContext'
import { Flex, Text, Spinner } from '@chakra-ui/react'
import { Button } from '@src/components/ui/button'
import Home from '@src/pages/Home'
import Game from '@src/pages/Game'
import { parseRoute, navigate } from './router'
import type { Route } from './router'

function AppInner() {
  const [route, setRoute] = useState<Route>(parseRoute)
  const { mode, error, closeActivity } = useDiscord()

  useEffect(() => {
    const onHashChange = () => setRoute(parseRoute())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  useEffect(() => {
    const appHeight = () =>
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`)
    window.addEventListener('resize', appHeight)
    appHeight()
    return () => window.removeEventListener('resize', appHeight)
  }, [])

  if (mode === 'connecting') {
    return (
      <Flex as="main" h="100vh" alignItems="center" justifyContent="center" flexDirection="column" gap="4" bg="bg.canvas" color="fg.default">
        <Text fontSize="xl" fontWeight="bold" textTransform="uppercase" letterSpacing="wide">
          Connecting to Discord…
        </Text>
        <Spinner size="lg" colorPalette="brand" />
      </Flex>
    )
  }

  if (error) {
    return (
      <Flex as="main" h="100vh" alignItems="center" justifyContent="center" flexDirection="column" gap="4" padding="8" textAlign="center" bg="bg.canvas" color="fg.default">
        <Text fontSize="lg" fontWeight="bold" textTransform="uppercase">Authentication Failed</Text>
        <Text fontSize="sm" opacity={0.7}>{error}</Text>
        <Button
          onClick={() => closeActivity()}
          marginTop="4"
        >
          Close
        </Button>
      </Flex>
    )
  }

  return (
    <>
      {route.view === 'home' ? (
        <Home />
      ) : (
        <Game
          route={route}
          onExit={() => navigate({ view: 'home' })}
        />
      )}
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <DiscordProvider>
        <AppInner />
      </DiscordProvider>
    </ThemeProvider>
  )
}
