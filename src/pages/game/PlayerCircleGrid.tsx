import type { ReactNode } from 'react'
import { Box, Flex, Text } from '@chakra-ui/react'
import { Avatar } from '@src/components/ui/avatar'
import type { PlayerInfo } from '@src/shared/types'

interface PlayerCircleGridProps {
  players: PlayerInfo[]
  maxVisible?: number
  badge?: (p: PlayerInfo) => ReactNode
  circleOverlay?: (p: PlayerInfo) => ReactNode
  moreLabel?: (count: number) => ReactNode
}

export function PlayerCircleGrid({
  players,
  maxVisible = 8,
  badge,
  circleOverlay,
  moreLabel,
}: PlayerCircleGridProps) {
  const visible = players.slice(0, maxVisible)
  const extra = players.length - visible.length
  const firstExtra = extra > 0 ? players[visible.length] : undefined

  return (
    <Flex w="full" wrap="wrap" justify="center" gap={{ base: '4', lg: '6' }}>
      {visible.map(p => (
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
          {circleOverlay ? (
            <Box position="relative">
              <Avatar name={p.name} avatar={p.avatar} size="xl" />
              {circleOverlay(p)}
            </Box>
          ) : (
            <Avatar name={p.name} avatar={p.avatar} size="xl" />
          )}
          <Text color="fg.default" fontSize="xs" lineClamp={1} m={0} textAlign="center" maxW="96px">
            {p.name}
          </Text>
          {badge?.(p)}
        </Box>
      ))}

      {extra > 0 && firstExtra && (
        <Box display="flex" flexDirection="column" alignItems="center" gap="1" width="96px">
          <Box position="relative">
            <Avatar
              name={firstExtra.name}
              avatar={firstExtra.avatar}
              size="xl"
              style={{ filter: 'brightness(0.6)' }}
            />
            <Flex position="absolute" inset="0" alignItems="center" justifyContent="center">
              <Text fontSize="2xl" fontWeight="bold" color="white" m={0} textShadow="0 1px 4px rgba(0,0,0,0.7)">
                +{extra}
              </Text>
            </Flex>
          </Box>
          <Text color="fg.muted" fontSize="xs" m={0} textAlign="center">
            {moreLabel ? moreLabel(extra) : `+${extra}`}
          </Text>
        </Box>
      )}
    </Flex>
  )
}
