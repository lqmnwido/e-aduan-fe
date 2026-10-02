import { useEffect, useRef, useState } from 'react'
import { Check, Copy, Eraser, FileText } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { countWords } from '../utils/format'
import { ConfirmDialog } from './ui/Modal'

export default function TranscriptBox({ value, onChange, interim, listening }) {
  const { t } = useI18n()
  const textareaRef = useRef(null)
  const [copied, setCopied] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  // auto scroll down on new text
  useEffect(() => {
    const el = textareaRef.current
    if (listening && el) el.scrollTop = el.scrollHeight
  }, [value, listening])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      textareaRef.current?.select()
    }
  }

  return (
    <section className="card transcript" aria-labelledby="transcript-title">
      <header className="card__header">
        <div>
          <h2 id="transcript-title" className="card__title">
            <FileText size={20} aria-hidden="true" />
            {t('tr.title')}
          </h2>
          <p className="card__desc">{t('tr.desc')}</p>
        </div>
        {listening && (
          <span className="live-pill">
            <span className="live-pill__dot" aria-hidden="true" />
            {t('tr.listening')}
          </span>
        )}
      </header>

      <div className={`transcript__box ${listening ? 'transcript__box--live' : ''}`}>
        <label htmlFor="transcript-text" className="sr-only">
          {t('tr.title')}
        </label>
        <textarea
          id="transcript-text"
          ref={textareaRef}
          className="transcript__textarea"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('tr.placeholder')}
          rows={9}
        />
        {(interim || listening) && (
          <div className="transcript__interim" aria-live="polite">
            <span className="typing-dots" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="transcript__interim-text">{interim}</span>
          </div>
        )}
      </div>

      <footer className="transcript__footer">
        <span className="transcript__count">{t('tr.words', { n: countWords(value) })}</span>
        <div className="transcript__actions">
          <button type="button" className="btn btn--ghost btn--sm" onClick={copy} disabled={!value}>
            {copied ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
            {copied ? t('tr.copied') : t('tr.copy')}
          </button>
          <button
            type="button"
            className="btn btn--ghost btn--sm"
            onClick={() => setConfirmClear(true)}
            disabled={!value}
          >
            <Eraser size={16} aria-hidden="true" />
            {t('tr.clear')}
          </button>
        </div>
      </footer>

      <ConfirmDialog
        open={confirmClear}
        title={t('tr.clearTitle')}
        body={t('tr.clearBody')}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          setConfirmClear(false)
          onChange('')
        }}
      />
    </section>
  )
}
