import { Box, Text } from '@chakra-ui/react'

const flipInName = 'card-draw-flip-in'

const keyframeStyle = `
  @keyframes ${flipInName} {
    from {
      transform: perspective(800px) rotateY(-90deg);
      opacity: 0;
    }
    to {
      transform: perspective(800px) rotateY(0deg);
      opacity: 1;
    }
  }
`

interface CardDrawFallbackProps {
  readonly question: string
}

export function CardDrawFallback({ question }: CardDrawFallbackProps) {
  return (
    <>
      <style>{keyframeStyle}</style>
      <Box
        w="full"
        h="full"
        borderRadius="22px"
        bg="cardFace"
        display="flex"
        alignItems="center"
        justifyContent="center"
        p="6"
        textAlign="center"
        style={{ animation: `${flipInName} 900ms ease-out` }}
      >
        <Text fontSize="2xl" fontWeight="semibold" color="fg.onCard" lineHeight="relaxed">
          {question}
        </Text>
      </Box>
    </>
  )
}
