import { ChakraProvider } from '@chakra-ui/react'
import { ThemeProvider as ColorModeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { system } from '@src/theme/system'

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <ChakraProvider value={system}>
      <ColorModeProvider
        attribute="class"
        defaultTheme="dark"
        forcedTheme="dark"
        enableSystem={false}
        disableTransitionOnChange
      >
        {children}
      </ColorModeProvider>
    </ChakraProvider>
  )
}
