import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ArrowLeft, AudioLines, FileText, PencilLine, RotateCcw, Siren } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useComplaint } from '../context/ComplaintContext'
import { COMPLAINT_FIELDS, validateForm } from '../data/complaintFields'
import { formatDuration } from '../utils/format'
import PageHero from '../components/PageHero'
import Stepper from '../components/Stepper'
import FormField from '../components/FormField'
import PdfPreviewModal from '../components/PdfPreviewModal'
import Alert from '../components/ui/Alert'
import Switch from '../components/ui/Switch'
import { ConfirmDialog } from '../components/ui/Modal'
import { extractComplaintFields } from '../services/extractionService'

function TranscriptSideCard({ transcript, audio }) {
  const { t, lang } = useI18n()
  return (
    <section className="card card--compact side-transcript" aria-labelledby="side-transcript-title">
      <h2 id="side-transcript-title" className="side-title">
        <AudioLines size={18} aria-hidden="true" />
        {t('side.transcript')}
      </h2>

      {audio && (
        <div className="side-transcript__audio">
          <span>
            {t('side.duration')}: <strong>{formatDuration(audio.duration)}</strong>
          </span>
          <audio controls src={audio.url} preload="metadata" />
        </div>
      )}

      {transcript ? (
        <blockquote className="side-transcript__text" tabIndex={0}>
          {transcript}
        </blockquote>
      ) : (
        <p className="muted">{t('side.noTranscript')}</p>
      )}

      <div className="side-transcript__actions">
        <Link to="/" className="btn btn--ghost btn--sm btn--block">
          <PencilLine size={16} aria-hidden="true" />
          {transcript ? t('side.edit') : t('side.record')}
        </Link>
      </div>
    </section>
  )
}

export default function FormPage() {
  const { t, lang } = useI18n()
  const navigate = useNavigate()
  const { transcript, audio, form, updateField, updateFields, resetForm, startNew } = useComplaint()

  const [attempted, setAttempted] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [pdfOpen, setPdfOpen] = useState(false)
  const [autofillState, setAutofillState] = useState('idle')
  const [autofilledFields, setAutofilledFields] = useState([])
  const [writingField, setWritingField] = useState(null)
  const autofillStarted = useRef(false)
  const autofillTimers = useRef([])
  const mountedRef = useRef(true)
  const formRef = useRef(form)
  formRef.current = form

  useEffect(() => {
    // React Strict Mode intentionally mounts, cleans up, then mounts effects again
    // in development. Restore this flag on each mount so a valid API response is
    // not mistaken for a response from an unmounted page.
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      autofillTimers.current.forEach(clearTimeout)
    }
  }, [])

  useEffect(() => {
    const isBlank = COMPLAINT_FIELDS.every((field) => !String(formRef.current[field.id] ?? '').trim())
    if (!transcript.trim() || !isBlank || autofillStarted.current) return
    autofillStarted.current = true
    setAutofillState('loading')
    extractComplaintFields(transcript)
      .then((fields) => {
        if (!mountedRef.current) return
        // Officer remarks are deliberately never derived from a complainant recording.
        const pendingFields = COMPLAINT_FIELDS.filter((field) => fields[field.id])
        if (!pendingFields.length) {
          setAutofillState('done')
          return
        }
        setAutofillState('writing')
        pendingFields.forEach((field, index) => {
          const timer = setTimeout(() => {
            if (!mountedRef.current) return
            setWritingField(field.id)
            updateFields({ [field.id]: fields[field.id] })
            setAutofilledFields((previous) => [...previous, field.id])
            if (index === pendingFields.length - 1) {
              const doneTimer = setTimeout(() => {
                if (mountedRef.current) {
                  setWritingField(null)
                  setAutofillState('done')
                }
              }, 450)
              autofillTimers.current.push(doneTimer)
            }
          }, index * 450)
          autofillTimers.current.push(timer)
        })
      })
      .catch(() => {
        if (mountedRef.current) setAutofillState('error')
      })
  }, [transcript, updateFields])

  const errors = attempted ? validateForm(form) : {}
  const errorCount = Object.keys(errors).length
  const isAutofilling = autofillState === 'loading' || autofillState === 'writing'

  const onGenerate = (event) => {
    event.preventDefault()
    setAttempted(true)
    const found = validateForm(form)
    const firstInvalid = COMPLAINT_FIELDS.find((field) => found[field.id])
    if (firstInvalid) {
      const el = document.getElementById(`field-${firstInvalid.id}`)
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
      return
    }
    setPdfOpen(true)
  }

  return (
    <>
      <PageHero title={t('form.title')} subtitle={t('form.subtitle')} />

      <div className="container page-body">
        <div className="stepper-wrap">
          <Stepper current={pdfOpen ? 2 : 1} />
        </div>

        <div className="page-grid">
          <div className="page-grid__main">
            <form className="card complaint-form" onSubmit={onGenerate} noValidate>
              <header className="complaint-form__header">
                <h2 className="section-title">{t('form.section')}</h2>
                {form.priority && (
                  <span className="badge badge--urgent">
                    <Siren size={14} aria-hidden="true" />
                    URGENT
                  </span>
                )}
              </header>

              <Alert tone="note" title={t('form.required')}>
                {t('form.requiredHint')}
              </Alert>
              {(autofillState === 'loading' || autofillState === 'writing') && <Alert tone="loading">{t('form.autofillLoading')}</Alert>}
              {autofillState === 'done' && <Alert tone="success">{t('form.autofillDone')}</Alert>}
              {autofillState === 'error' && <Alert tone="warning">{t('form.autofillError')}</Alert>}
              {autofillState === 'writing' && (
                <ol className="autofill-progress" aria-label={t('form.autofillProgress')}>
                  {COMPLAINT_FIELDS.filter((field) => field.id !== 'ulasan').map((field) => {
                    const state = writingField === field.id ? 'writing' : autofilledFields.includes(field.id) ? 'done' : 'pending'
                    return (
                      <li key={field.id} className={`autofill-progress__item autofill-progress__item--${state}`}>
                        <span aria-hidden="true" />
                        {field.label[lang]}
                      </li>
                    )
                  })}
                </ol>
              )}
              {errorCount > 0 && <Alert tone="danger">{t('form.errSummary', { n: errorCount })}</Alert>}

              <fieldset className="complaint-form__fields" disabled={isAutofilling}>
                <legend className="sr-only">{t('form.section')}</legend>

                <div className="priority">
                  <Switch
                    id="field-priority"
                    checked={form.priority}
                    onChange={(value) => updateField('priority', value)}
                    label={t('form.priority')}
                    disabled={isAutofilling}
                  />
                </div>

                {COMPLAINT_FIELDS.map((field) => (
                  <FormField
                    key={field.id}
                    field={field}
                    value={form[field.id] ?? ''}
                    onChange={(value) => updateField(field.id, value)}
                    error={errors[field.id]}
                    autofillStatus={writingField === field.id ? 'writing' : autofilledFields.includes(field.id) ? 'done' : undefined}
                    disabled={isAutofilling}
                  />
                ))}
              </fieldset>

              <footer className="form-actions">
                <button type="button" className="btn btn--secondary" onClick={() => navigate('/')}>
                  <ArrowLeft size={18} aria-hidden="true" />
                  {t('form.back')}
                </button>
                <div className="form-actions__end">
                  <button type="button" className="btn btn--ghost" onClick={() => setConfirmReset(true)} disabled={isAutofilling}>
                    <RotateCcw size={18} aria-hidden="true" />
                    {t('form.reset')}
                  </button>
                  <button type="submit" className="btn btn--primary btn--lg" disabled={isAutofilling}>
                    <FileText size={18} aria-hidden="true" />
                    {t('form.generate')}
                  </button>
                </div>
              </footer>
            </form>
          </div>

          <aside className="page-grid__aside page-grid__aside--sticky">
            <TranscriptSideCard transcript={transcript} audio={audio} />
          </aside>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title={t('form.resetTitle')}
        body={t('form.resetBody')}
        confirmLabel={t('form.reset')}
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetForm()
          setAttempted(false)
          setConfirmReset(false)
        }}
      />

      <PdfPreviewModal
        open={pdfOpen}
        onClose={() => setPdfOpen(false)}
        onFinished={() => {
          startNew()
          navigate('/')
        }}
      />
    </>
  )
}
