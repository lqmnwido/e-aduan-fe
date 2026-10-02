import { useI18n } from '../../i18n/I18nContext'

export default function LanguageSwitch({ className = '' }) {
  const { lang, setLang, t } = useI18n()
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('a11y.language')}>
      {[
        ['ms', 'BM'],
        ['en', 'EN'],
      ].map(([code, label]) => (
        <button
          key={code}
          type="button"
          className="lang-switch__btn"
          aria-pressed={lang === code}
          onClick={() => setLang(code)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
