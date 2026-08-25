import { useCallback, useEffect, useState } from 'react'
import {
  t as translate,
  getLocale,
  setLocale as setGlobalLocale,
  LOCALE_EVENT,
  type Locale,
} from '@src/i18n'

export function useLocale() {
  const [locale, setLocaleState] = useState<Locale>(getLocale)

  useEffect(() => {
    const handler = (e: Event) => {
      setLocaleState((e as CustomEvent<Locale>).detail)
    }
    window.addEventListener(LOCALE_EVENT, handler)
    return () => window.removeEventListener(LOCALE_EVENT, handler)
  }, [])

  const setLocale = useCallback((lang: Locale) => {
    setGlobalLocale(lang)
  }, [])

  return { locale, setLocale, t: translate }
}
