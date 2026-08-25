import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react'

const colorRamp = (values: readonly string[]) => ({
  50: { value: values[0] },
  100: { value: values[1] },
  200: { value: values[2] },
  300: { value: values[3] },
  400: { value: values[4] },
  500: { value: values[5] },
  600: { value: values[6] },
  700: { value: values[7] },
  800: { value: values[8] },
  900: { value: values[9] },
  950: { value: values[10] },
})

const forcedDark = (value: string) => ({ value: { base: value, _dark: value } })

const paletteContract = (palette: 'brand' | 'accent' | 'success') => ({
  solid: forcedDark(`{colors.${palette}.500}`),
  contrast: forcedDark('#ffffff'),
  fg: forcedDark(`{colors.${palette}.300}`),
  muted: forcedDark(`{colors.${palette}.900}`),
  subtle: forcedDark(`{colors.${palette}.950}`),
  emphasized: forcedDark(`{colors.${palette}.600}`),
  focusRing: forcedDark(`{colors.${palette}.500}`),
})

const globalCss = {
  html: {
    minHeight: 'calc(100% + env(safe-area-inset-top))',
    height: '100%',
    padding:
      'env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)',
  },
  body: {
    bg: 'bg.canvas',
    color: 'fg.default',
    fontFamily: 'body',
    WebkitFontSmoothing: 'antialiased',
    MozOsxFontSmoothing: 'grayscale',
    margin: 0,
  },
  '#root': { height: 'var(--app-height, 100vh)' },
  '*::-webkit-scrollbar': { width: '6px' },
  '*::-webkit-scrollbar-track': {
    background: 'transparent',
    borderRadius: '3px',
  },
  '*::-webkit-scrollbar-thumb': {
    background: 'rgba(255,255,255,0.15)',
    borderRadius: '3px',
  },
}

const config = defineConfig({
  globalCss,
  theme: {
    tokens: {
      colors: {
        brand: colorRamp([
          '#feecec', '#fed6d6', '#ffb3b3', '#ff8585', '#fa5252', '#fa2828',
          '#d61f1f', '#b01a1a', '#8a1414', '#661010', '#330808',
        ]),
        accent: colorRamp([
          '#fdf8ed', '#faeccc', '#f4d795', '#eec163', '#e8a849', '#e8a849',
          '#c9852c', '#a76724', '#885224', '#714421', '#40230e',
        ]),
        success: colorRamp([
          '#f0f9f2', '#dbf0e0', '#b9e1c4', '#8bcb9e', '#5cb870', '#5cb870',
          '#3d9455', '#317645', '#2a5e3a', '#244e31', '#0f2b18',
        ]),
        canvas: { value: '#272727' },
        surface: { value: '#333333' },
        cardFace: { value: '#d9d9d9' },
      },
      fonts: {
        body: { value: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
        heading: { value: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
      },
      radii: {
        l1: { value: '8px' },
        l2: { value: '12px' },
        l3: { value: '16px' },
      },
    },
    semanticTokens: {
      radii: {
        l1: { value: '8px' },
        l2: { value: '12px' },
        l3: { value: '16px' },
      },
      colors: {
        bg: {
          canvas: forcedDark('{colors.canvas}'),
          surface: forcedDark('{colors.surface}'),
        },
        fg: {
          default: forcedDark('#f3f0f7'),
          muted: forcedDark('#9b93a8'),
          onCard: forcedDark('#272727'),
        },
        border: { subtle: forcedDark('rgba(243,240,247,0.10)') },
        surface: {
          card: forcedDark('#484848'),
          raised: forcedDark('#3d3d3d'),
        },
        brand: paletteContract('brand'),
        accent: paletteContract('accent'),
        success: paletteContract('success'),
      },
    },
    recipes: {
      button: {
        base: {
          fontWeight: 'semibold',
          borderRadius: 'l1',
          cursor: 'pointer',
          transition: 'all 150ms',
          _disabled: { opacity: 0.5, pointerEvents: 'none' },
        },
        variants: {
          variant: {
            solid: {
              bg: 'brand.solid', color: 'brand.contrast', boxShadow: 'lg',
              _hover: { bg: 'brand.emphasized' },
            },
            secondary: {
              bg: 'surface.raised', color: 'fg.default', borderWidth: '1px', borderColor: 'border.subtle',
              _hover: { bg: 'whiteAlpha.200' },
            },
            ghost: {
              bg: 'transparent', color: 'fg.default', _hover: { bg: 'whiteAlpha.200' },
            },
            destructive: { bg: 'red.500', color: 'white', _hover: { bg: 'red.600' } },
            accent: {
              bg: 'accent.solid', color: 'accent.contrast', _hover: { bg: 'accent.emphasized' },
            },
            outline: {
              bg: 'transparent', color: 'fg.default', borderWidth: '1px', borderColor: 'border.subtle',
              _hover: { bg: 'whiteAlpha.200' },
            },
          },
          size: {
            sm: { h: 9, px: 3, fontSize: 'xs' },
            md: { h: 12, px: 6, fontSize: 'sm' },
            lg: { h: 14, px: 8, fontSize: 'md' },
            icon: { h: 10, w: 10, px: 0 },
          },
        },
        defaultVariants: { variant: 'solid', size: 'md' },
      },
    },
  },
})

export const system = createSystem(defaultConfig, config)
