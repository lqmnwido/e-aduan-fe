import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { TriangleAlert, X } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext'

export default function Modal({ open, onClose, title, subtitle, size = 'md', children, footer, dismissible = true }) {
  const { t } = useI18n()
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined
    const previouslyFocused = document.activeElement
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && dismissible) onCloseRef.current?.()
      if (event.key === 'Tab') trapFocus(event, dialogRef.current)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = overflow
      previouslyFocused?.focus?.()
    }
  }, [open, dismissible])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (dismissible && event.target === event.currentTarget) onClose?.()
      }}
    >
      <div
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="modal__header">
          <div>
            <h2 id={titleId} className="modal__title">
              {title}
            </h2>
            {subtitle && <div className="modal__subtitle">{subtitle}</div>}
          </div>
          {dismissible && (
            <button type="button" className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
              <X size={20} />
            </button>
          )}
        </header>
        <div className="modal__body">{children}</div>
        {footer && <footer className="modal__footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  )
}

function trapFocus(event, container) {
  if (!container) return
  const focusable = container.querySelectorAll(
    'a[href], button:not([disabled]), textarea, input, select, iframe, [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && (document.activeElement === first || document.activeElement === container)) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

export function ConfirmDialog({ open, title, body, confirmLabel, onConfirm, onCancel, tone = 'danger' }) {
  const { t } = useI18n()
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            {t('common.cancel')}
          </button>
          <button type="button" className={`btn btn--${tone === 'danger' ? 'danger' : 'primary'}`} onClick={onConfirm}>
            {confirmLabel ?? t('common.confirm')}
          </button>
        </>
      }
    >
      <div className="confirm">
        <span className={`confirm__icon confirm__icon--${tone}`} aria-hidden="true">
          <TriangleAlert size={22} />
        </span>
        <p>{body}</p>
      </div>
    </Modal>
  )
}
