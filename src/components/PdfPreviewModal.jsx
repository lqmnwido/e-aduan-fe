import { useEffect, useRef, useState } from 'react'
import {
  CircleCheckBig,
  Download,
  ExternalLink,
  FilePlus2,
  FileText,
  LoaderCircle,
  Printer,
  RotateCcw,
  Send,
} from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useComplaint } from '../context/ComplaintContext'
import { submitComplaint } from '../services/complaintService'
import { formatDateTime } from '../utils/format'
import Modal from './ui/Modal'
import Alert from './ui/Alert'

// mobile browsers cant show pdf in iframe
const canPreviewInline = typeof navigator === 'undefined' || navigator.pdfViewerEnabled !== false

const pad = (n) => String(n).padStart(2, '0')
// pdf file name (name date time format)
const pdfFileName = (d) =>
  `Borang-Aduan-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.pdf`

// pdf preview popup, also shows confirmation after sending
export default function PdfPreviewModal({ open, onClose, onFinished }) {
  const { t, lang } = useI18n()
  const { form, transcript, audio } = useComplaint()
  const [attempt, setAttempt] = useState(0)
  const [doc, setDoc] = useState({ status: 'idle' })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(false)
  const [result, setResult] = useState(null)
  const iframeRef = useRef(null)

  useEffect(() => {
    if (open) setResult(null)
  }, [open])

  // make the pdf when popup opens
  useEffect(() => {
    if (!open) return undefined
    let cancelled = false
    let url = null
    setDoc({ status: 'loading' })
    setSubmitError(false)
    const generatedAt = new Date()

    ;(async () => {
      try {
        const { generateComplaintPdf } = await import('../pdf/generatePdf.jsx')
        const blob = await generateComplaintPdf({
          form,
          transcript,
          audioDuration: audio?.duration,
          generatedAt,
          lang,
          t,
        })
        if (cancelled) return
        url = URL.createObjectURL(blob)
        setDoc({ status: 'ready', url, blob, fileName: pdfFileName(generatedAt) })
      } catch (err) {
        console.error('Gagal menjana PDF', err)
        if (!cancelled) setDoc({ status: 'error' })
      }
    })()

    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, attempt, lang])

  const ready = doc.status === 'ready'

  const print = () => {
    try {
      iframeRef.current.contentWindow.focus()
      iframeRef.current.contentWindow.print()
    } catch {
      window.open(doc.url, '_blank', 'noopener')
    }
  }

  const submit = async () => {
    setSubmitting(true)
    setSubmitError(false)
    try {
      const response = await submitComplaint({
        form,
        transcript,
        audioBlob: audio?.blob,
        pdfBlob: doc.blob,
      })
      setResult({
        submittedAt: response.submittedAt,
        priority: form.priority,
        title: form.tajuk,
      })
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  const downloadButton = (label) =>
    ready ? (
      <a className="btn btn--secondary" href={doc.url} download={doc.fileName}>
        <Download size={18} aria-hidden="true" />
        {label}
      </a>
    ) : (
      <button type="button" className="btn btn--secondary" disabled>
        <Download size={18} aria-hidden="true" />
        {label}
      </button>
    )

  /* confirmation */
  if (result) {
    return (
      <Modal
        open={open}
        onClose={onFinished}
        size="md"
        title={t('done.title')}
        footer={
          <div className="modal__actions">
            {downloadButton(t('done.download'))}
            <button type="button" className="btn btn--primary" onClick={onFinished}>
              <FilePlus2 size={18} aria-hidden="true" />
              {t('done.new')}
            </button>
          </div>
        }
      >
        <div className="success">
          <span className="success__icon" aria-hidden="true">
            <CircleCheckBig size={40} />
          </span>
          <p className="success__body">{t('done.body')}</p>

          <dl className="success__meta">
            {result.title && (
              <div className="success__meta-wide">
                <dt>{t('done.subject')}</dt>
                <dd>{result.title}</dd>
              </div>
            )}
            <div>
              <dt>{t('done.submittedAt')}</dt>
              <dd>{formatDateTime(result.submittedAt, lang)}</dd>
            </div>
            <div>
              <dt>{t('done.priority')}</dt>
              <dd>
                {result.priority ? <span className="badge badge--urgent">URGENT</span> : t('doc.priorityNormal')}
              </dd>
            </div>
          </dl>
        </div>
      </Modal>
    )
  }

  /* pdf preview */
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!submitting}
      size="xl"
      title={t('pdf.title')}
      footer={
        <>
          <p className="modal__note">{t('pdf.checkNote')}</p>
          <div className="modal__actions">
            {downloadButton(t('pdf.download'))}
            {canPreviewInline && (
              <button type="button" className="btn btn--secondary" onClick={print} disabled={!ready}>
                <Printer size={18} aria-hidden="true" />
                {t('pdf.print')}
              </button>
            )}
            <button type="button" className="btn btn--primary" onClick={submit} disabled={!ready || submitting}>
              {submitting ? (
                <LoaderCircle size={18} className="spin" aria-hidden="true" />
              ) : (
                <Send size={18} aria-hidden="true" />
              )}
              {submitting ? t('pdf.submitting') : t('pdf.submit')}
            </button>
          </div>
        </>
      }
    >
      {submitError && <Alert tone="danger">{t('pdf.submitError')}</Alert>}

      <div className="pdf-preview">
        {doc.status === 'loading' && (
          <div className="pdf-preview__state" role="status">
            <LoaderCircle size={36} className="spin" aria-hidden="true" />
            <p>{t('pdf.generating')}</p>
          </div>
        )}

        {doc.status === 'error' && (
          <div className="pdf-preview__state">
            <Alert tone="danger">{t('pdf.error')}</Alert>
            <button type="button" className="btn btn--outline" onClick={() => setAttempt((n) => n + 1)}>
              <RotateCcw size={18} aria-hidden="true" />
              {t('pdf.retry')}
            </button>
          </div>
        )}

        {ready &&
          (canPreviewInline ? (
            <iframe
              ref={iframeRef}
              className="pdf-preview__frame"
              title={t('pdf.title')}
              src={`${doc.url}#toolbar=1&navpanes=0&view=FitH`}
            />
          ) : (
            <div className="pdf-preview__state">
              <FileText size={44} aria-hidden="true" />
              <p>{t('pdf.noInline')}</p>
              <a className="btn btn--outline" href={doc.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={18} aria-hidden="true" />
                {t('pdf.openTab')}
              </a>
            </div>
          ))}
      </div>
    </Modal>
  )
}
