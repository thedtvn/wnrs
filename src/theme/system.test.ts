import { describe, expect, it } from 'vitest'
import { system } from './system'

describe('chakra system', () => {
  it('resolves the brand colorPalette contract', () => {
    for (const k of ['solid','contrast','fg','muted','subtle','emphasized','focusRing']) {
      expect(system.token(`colors.brand.${k}`), `missing colors.brand.${k}`).toBeTruthy()
    }
  })
  it('ports the locked palette exactly', () => {
    expect(system.token('colors.brand.500')).toBe('#fa2828')
    expect(system.token('colors.accent.500')).toBe('#e8a849')
    expect(system.token('colors.success.500')).toBe('#5cb870')
    expect(system.token('colors.canvas')).toBe('#272727')
  })
  it('ports the locked radii', () => {
    expect(system.tokens.getByName('radii.l1')?.originalValue).toBe('8px')
    expect(system.tokens.getByName('radii.l2')?.originalValue).toBe('12px')
    expect(system.tokens.getByName('radii.l3')?.originalValue).toBe('16px')
  })
  it('keeps DM Sans first in the body font stack', () => {
    expect(system.token('fonts.body')).toMatch(/^'DM Sans'/)
  })
  it('registers every legacy button variant', () => {
    const v = Object.keys(system.getRecipe('button').variants?.variant ?? {})
    for (const legacy of ['solid','secondary','ghost','destructive','accent','outline']) {
      expect(v).toContain(legacy)
    }
  })
})
