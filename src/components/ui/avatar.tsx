import React from 'react'
import { Box, chakra } from '@chakra-ui/react'

function hashName(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0
  }
  return Math.abs(h)
}

const sizeMap = {
  sm: { boxSize: '7', fontSize: 'xs' },
  md: { boxSize: '10', fontSize: 'sm' },
  lg: { boxSize: '14', fontSize: 'lg' },
  xl: { boxSize: '20', fontSize: '2xl' },
} as const

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string
  avatar?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  online?: boolean
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, avatar, size = 'md', online, ...props }, ref) => {
    const hue = hashName(name) % 360
    const initial = (name?.[0] ?? '?').toUpperCase()
    const [imgError, setImgError] = React.useState(false)
    const showImg = avatar && !imgError
    const { boxSize, fontSize } = sizeMap[size]

    return (
      <Box
        ref={ref}
        position="relative"
        display="inline-flex"
        flexShrink={0}
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        fontWeight="bold"
        boxSize={boxSize}
        fontSize={fontSize}
        style={{ backgroundColor: `hsl(${hue}, 45%, 45%)`, color: '#fff' }}
        {...props}
      >
        {showImg ? (
          <chakra.img
            boxSize="full"
            borderRadius="full"
            objectFit="cover"
            alt={name}
            src={avatar}
            onError={() => setImgError(true)}
          />
        ) : (
          <span>{initial}</span>
        )}
        {online !== undefined && (
          <Box
            data-part="status-dot"
            position="absolute"
            bottom="0"
            right="0"
            boxSize="2.5"
            borderRadius="full"
            borderWidth="2px"
            borderColor="bg.canvas"
            bg={online ? 'success.solid' : 'fg.muted'}
          />
        )}
      </Box>
    )
  },
)
Avatar.displayName = 'Avatar'

export { Avatar }
