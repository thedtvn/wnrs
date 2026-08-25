import { describe, expect, it } from 'vitest'
import en from './en.json'
import vi from './vi.json'
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

type Nested = Record<string, unknown>

function flatKeys(obj: Nested, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? flatKeys(v as Nested, prefix ? `${prefix}.${k}` : k) : [prefix ? `${prefix}.${k}` : k],
  )
}

function resolve(obj: Nested, key: string): unknown {
  return key.split('.').reduce<unknown>((acc, part) => (acc && typeof acc === 'object' ? (acc as Nested)[part] : undefined), obj)
}

const enKeys = flatKeys(en as Nested)
const viKeys = flatKeys(vi as Nested)

describe('i18n parity', () => {
  it('en and vi have identical namespace+key sets', () => {
    expect([...viKeys].sort()).toEqual([...enKeys].sort())
  })

  it('no vi value is an empty string', () => {
    for (const k of viKeys) expect(typeof resolve(vi as Nested, k), `vi.${k} type`).toBe('string')
    for (const k of viKeys) expect(resolve(vi as Nested, k) as string, `vi.${k}`).not.toBe('')
  })

  it('every literal t("…") call in src/ resolves in BOTH locales', () => {
    const seen = new Set<string>()
    const walk = (dir: string): void => {
      for (const f of readdirSync(dir)) {
        const p = join(dir, f)
        if (statSync(p).isDirectory()) walk(p)
        else if (/\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f)) {
          const src = readFileSync(p, 'utf8')
          for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) seen.add(m[1])
          for (const m of src.matchAll(/\bt\(\s*"([^"]+)"/g)) seen.add(m[1])
        }
      }
    }
    walk(join(__dirname, '..'))
    expect(seen.size).toBeGreaterThan(20)
    for (const key of seen) {
      expect(resolve(en as Nested, key), `en missing ${key}`).toBeDefined()
      expect(resolve(vi as Nested, key), `vi missing ${key}`).toBeDefined()
    }
  })

  it('every deck registry nameKey resolves in both locales', async () => {
    const reg = await import('@src/decks/registry')
    const registry = (reg as unknown as { DECK_REGISTRY?: { nameKey?: string }[] }).DECK_REGISTRY
      ?? (Object.values(reg).find(v => Array.isArray(v)) as { nameKey?: string }[] | undefined)
    expect(registry).toBeDefined()
    for (const d of registry!) {
      expect(d.nameKey, 'deck nameKey present').toBeTruthy()
      expect(resolve(en as Nested, d.nameKey!), `en ${d.nameKey}`).toBeDefined()
      expect(resolve(vi as Nested, d.nameKey!), `vi ${d.nameKey}`).toBeDefined()
    }
  })
})
