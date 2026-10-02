import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { STRINGS } from './strings'
import { readStorage, writeStorage } from '../utils/storage'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => (readStorage('eaduan:lang') === 'en' ? 'en' : 'ms'))

  useEffect(() => {
    document.documentElement.lang = lang
    writeStorage('eaduan:lang', lang)
  }, [lang])

  const t = useCallback(
    (key, vars) => {
      let text = STRINGS[lang][key] ?? STRINGS.ms[key] ?? key
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [lang],
  )

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t])
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
