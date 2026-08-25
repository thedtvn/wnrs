import en from './en.json'
import vi from './vi.json'

export type Locale = 'en' | 'vi'

type Messages = Record<string, Record<string, string>>

const messages: Record<Locale, Messages> = { en, vi }

const STORAGE_KEY = 'wnrs-locale'
const LOCALE_EVENT = 'wnrs-locale-change'

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'en' || stored === 'vi') return stored
  } catch {}
  return navigator.language.startsWith('vi') ? 'vi' : 'en'
}

let activeLocale: Locale = detectLocale()

export function getLocale(): Locale {
  return activeLocale
}

export function setLocale(locale: Locale): void {
  if (locale === activeLocale) return
  activeLocale = locale
  try {
    localStorage.setItem(STORAGE_KEY, locale)
  } catch {}
  window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: locale }))
}

export function t(key: string): string {
  const [ns, ...rest] = key.split('.')
  const field = rest.join('.')
  return messages[activeLocale]?.[ns]?.[field] ?? key
}

export { LOCALE_EVENT }
