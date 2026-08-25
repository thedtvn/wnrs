import { Button as ChakraButton, type ButtonProps as ChakraButtonProps } from '@chakra-ui/react'
import React from 'react'

type LegacyVariant = 'default' | 'secondary' | 'ghost' | 'destructive' | 'accent' | 'outline'
type LegacySize = 'default' | 'sm' | 'lg' | 'icon'

// Custom theme-recipe keys are not reflected in ChakraButtonProps without
// running `chakra typegen`; these bridges narrow legacy names onto the
// recipe registered in src/theme/system.ts (asserted by system.test).
const VARIANT_VALUES = {
  default: 'solid',
  secondary: 'secondary',
  ghost: 'ghost',
  destructive: 'destructive',
  accent: 'accent',
  outline: 'outline',
} as const

const SIZE_VALUES = {
  default: 'md',
  sm: 'sm',
  lg: 'lg',
  icon: 'icon',
} as const

const toVariant = (v: LegacyVariant): NonNullable<ChakraButtonProps['variant']> =>
  VARIANT_VALUES[v] as NonNullable<ChakraButtonProps['variant']>

const toSize = (s: LegacySize): NonNullable<ChakraButtonProps['size']> =>
  SIZE_VALUES[s] as NonNullable<ChakraButtonProps['size']>

export interface ButtonProps extends Omit<ChakraButtonProps, 'variant' | 'size'> {
  variant?: LegacyVariant
  size?: LegacySize
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', ...props }, ref) => (
    <ChakraButton ref={ref} variant={toVariant(variant)} size={toSize(size)} {...props} />
  ),
)
Button.displayName = 'Button'
