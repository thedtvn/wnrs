import { describe, expect, it } from 'vitest'
import { wrapLines } from './questionTexture'

const measure = (s: string): number => s.length * 10

describe('wrapLines', () => {
  it('keeps a short string on one line', () => {
    expect(wrapLines('hello world', 200, measure)).toEqual(['hello world'])
  })
  it('breaks when measured width exceeds max', () => {
    expect(wrapLines('hello world again', 120, measure)).toEqual(['hello world', 'again'])
  })
  it('never emits an empty line', () => {
    for (const line of wrapLines('a  b   c', 10, measure)) expect(line.trim().length).toBeGreaterThan(0)
  })
  it('collapses multiple whitespace', () => {
    expect(wrapLines('a    b', 200, measure)).toEqual(['a b'])
  })
  it('handles a single word longer than maxWidth without infinite looping', () => {
    expect(() => wrapLines('supercalifragilistic', 50, measure)).not.toThrow()
    expect(wrapLines('supercalifragilistic', 50, measure)).toEqual(['supercalifragilistic'])
  })
  it('handles Vietnamese diacritics without splitting graphemes', () => {
    const lines = wrapLines('Bạn có muốn trở thành người thật sự không?', 220, measure)
    const joined = lines.join(' ')
    expect(joined).toContain('Bạn')
    expect(joined).toContain('không?')
    for (const l of lines) expect(l).not.toMatch(/\s$/)
  })
})