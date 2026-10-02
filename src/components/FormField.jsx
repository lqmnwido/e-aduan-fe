import { CircleAlert, CircleCheck, LoaderCircle } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

export default function FormField({ field, value, onChange, error, autofillStatus, disabled }) {
  const { t, lang } = useI18n()
  const id = `field-${field.id}`
  const errorId = `${id}-error`
  const length = value.length
  const nearLimit = field.maxLength && length > field.maxLength * 0.9

  return (
    <div className={`field ${error ? 'field--invalid' : ''} ${autofillStatus ? `field--autofill-${autofillStatus}` : ''}`}>
      <label htmlFor={id} className="field__label">
        {field.label[lang]}
        {field.required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
        {autofillStatus === 'writing' && <LoaderCircle className="field__autofill-icon spin" size={15} aria-label={t('form.autofillWriting')} />}
        {autofillStatus === 'done' && <CircleCheck className="field__autofill-icon" size={15} aria-label={t('form.autofillWritten')} />}
      </label>

      <textarea
        id={id}
        className="textarea"
        rows={field.rows}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={field.placeholder[lang]}
        maxLength={field.maxLength}
        disabled={disabled}
        required={field.required}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
      />

      {field.maxLength && (
        <span className={`counter ${nearLimit ? 'counter--warn' : ''}`}>
          {length} / {field.maxLength}
        </span>
      )}
      {error && (
        <p id={errorId} className="field__error">
          <CircleAlert size={14} aria-hidden="true" />
          {error === 'max' ? t('form.errMax', { max: field.maxLength }) : t('form.errRequired')}
        </p>
      )}
    </div>
  )
}
