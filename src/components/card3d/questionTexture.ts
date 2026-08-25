import { CanvasTexture, SRGBColorSpace } from 'three'

export const TEX_W = 1024
export const TEX_H = 1440

/** Greedy word-wrap using an injectable width measurer. */
export function wrapLines(text: string, maxWidth: number, measure: (s: string) => number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (measure(next) > maxWidth && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

export function createQuestionTexture(question: string): CanvasTexture {
  const c = document.createElement('canvas')
  c.width = TEX_W
  c.height = TEX_H
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#d9d9d9'
  ctx.fillRect(0, 0, TEX_W, TEX_H)
  ctx.fillStyle = '#272727'
  ctx.font = 'bold 64px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const lines = wrapLines(question, TEX_W - 160, s => ctx.measureText(s).width)
  const lh = 84
  const y0 = TEX_H / 2 - ((lines.length - 1) * lh) / 2
  lines.forEach((l, i) => ctx.fillText(l, TEX_W / 2, y0 + i * lh))
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}