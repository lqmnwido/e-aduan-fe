import { Check } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'

const STEPS = [
  { title: 'step.record', desc: 'step.recordDesc' },
  { title: 'step.form', desc: 'step.formDesc' },
  { title: 'step.review', desc: 'step.reviewDesc' },
]

// 3 means all steps done
export default function Stepper({ current }) {
  const { t } = useI18n()
  return (
    <ol className="stepper">
      {STEPS.map((step, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'upcoming'
        return (
          <li
            key={step.title}
            className={`stepper__item stepper__item--${state}`}
            aria-current={state === 'current' ? 'step' : undefined}
          >
            <span className="stepper__marker" aria-hidden="true">
              {state === 'done' ? <Check size={18} strokeWidth={3} /> : i + 1}
            </span>
            <span className="stepper__text">
              <span className="stepper__eyebrow">{t('step.label', { n: i + 1 })}</span>
              <span className="stepper__title">{t(step.title)}</span>
              <span className="stepper__desc">{t(step.desc)}</span>
            </span>
          </li>
        )
      })}
    </ol>
  )
}
