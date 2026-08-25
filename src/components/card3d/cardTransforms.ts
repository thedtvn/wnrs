export interface CardTransform {
  x: number
  y: number
  z: number
  rotZ: number
}

/** offset = index - activeIndex */
export function fanTransform(index: number, activeIndex: number): CardTransform {
  const offset = index - activeIndex

  return {
    x: offset * 0.13,
    y: -Math.abs(offset) * 0.025,
    z: -index * 0.018,
    rotZ: offset * 0.045,
  }
}

/** Frame-rate-independent lerp alpha: 1 - exp(-rate * delta) */
export const dealAlpha = (delta: number, rate = 10): number => 1 - Math.exp(-rate * delta)

export const FLIP_TARGET_Y = Math.PI
export const FACE_OFFSET_Z = 0.002
