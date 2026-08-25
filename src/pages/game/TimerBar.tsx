import { Box, Text } from '@chakra-ui/react'

const PULSE_CSS_ID = 'tb-pulse-keyframes'
const PULSE_CSS = `#${PULSE_CSS_ID} { content: ''; }
@keyframes tb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }`

export function TimerBar({ timeLeft, total }: { timeLeft: number; total: number }) {
  const pct = Math.max(0, Math.min(100, (timeLeft / Math.max(total, 1)) * 100))
  return (
    <Box
      w="full"
      h="9"
      borderRadius="full"
      overflow="hidden"
      bg="surface"
      position="relative"
      mb="4"
      style={timeLeft <= 5 ? { animation: 'tb-pulse 1s infinite' } : undefined}
    >
      <style id={PULSE_CSS_ID}>{PULSE_CSS}</style>
      <Box
        data-timer-fill
        h="full"
        borderRadius="full"
        transition="width 200ms linear"
        style={{
          width: `${pct}%`,
          background: timeLeft <= 5 ? 'var(--chakra-colors-brand-solid)' : timeLeft <= 15 ? 'var(--chakra-colors-accent-solid)' : 'var(--chakra-colors-success-solid)',
        }}
      />
      <Text
        position="absolute"
        inset="0"
        display="flex"
        alignItems="center"
        justifyContent="center"
        fontWeight="bold"
        fontSize="md"
        color="white"
        fontVariantNumeric="tabular-nums"
      >
        {timeLeft}s
      </Text>
    </Box>
  )
}
