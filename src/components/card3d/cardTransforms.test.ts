import { describe, expect, it } from 'vitest'
import { dealAlpha, fanTransform } from './cardTransforms'

describe('fanTransform', () => {
  it('returns the identity transform when offset is zero at index 0', () => {
    // Given
    const index = 0
    const activeIndex = 0

    // When
    const transform = fanTransform(index, activeIndex)

    // Then
    expect(transform.x).toBeCloseTo(0)
    expect(transform.y).toBeCloseTo(0)
    expect(transform.z).toBeCloseTo(0)
    expect(transform.rotZ).toBeCloseTo(0)
  })

  it('spaces x by 0.13 for each offset step', () => {
    // Given
    const index = 0
    const activeIndex = 2

    // When
    const transform = fanTransform(index, activeIndex)

    // Then
    expect(transform.x).toBe(-0.26)
  })

  it('dips y symmetrically on either side of the active card', () => {
    // Given
    const activeIndex = 2

    // When
    const left = fanTransform(0, activeIndex)
    const right = fanTransform(4, activeIndex)

    // Then
    expect(left.y).toBe(right.y)
    expect(left.y).toBeLessThan(0)
  })

  it('stacks z by index regardless of the active index', () => {
    // Given
    const firstIndex = 0
    const lastIndex = 4

    // When
    const firstAtA = fanTransform(firstIndex, 3)
    const firstAtB = fanTransform(firstIndex, 1)
    const last = fanTransform(lastIndex, 2)

    // Then: z = -index * 0.018
    expect(firstAtA.z).toBeCloseTo(0)
    expect(firstAtB.z).toBeCloseTo(0)
    expect(last.z).toBeCloseTo(-0.072)
  })
})

describe('dealAlpha', () => {
  it('returns a value between zero and one for a positive delta', () => {
    // Given
    const delta = 1 / 60

    // When
    const alpha = dealAlpha(delta)

    // Then
    expect(alpha).toBeGreaterThan(0)
    expect(alpha).toBeLessThan(1)
  })

  it('increases as delta increases', () => {
    // Given
    const smallDelta = 1 / 120
    const mediumDelta = 1 / 60
    const largeDelta = 1 / 30

    // When
    const smallAlpha = dealAlpha(smallDelta)
    const mediumAlpha = dealAlpha(mediumDelta)
    const largeAlpha = dealAlpha(largeDelta)

    // Then
    expect(mediumAlpha).toBeGreaterThan(smallAlpha)
    expect(largeAlpha).toBeGreaterThan(mediumAlpha)
  })

  it('uses the expected alpha for a 60 FPS frame', () => {
    // Given
    const delta = 1 / 60

    // When
    const alpha = dealAlpha(delta)

    // Then
    expect(alpha).toBeCloseTo(0.1535, 3)
  })
})
