import { CircleAlert, CircleCheck, Info, LoaderCircle, PencilLine, TriangleAlert } from 'lucide-react'

const ICONS = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleAlert,
  note: PencilLine,
  loading: LoaderCircle,
}

export default function Alert({ tone = 'info', title, children, action, icon, className = '', role }) {
  const Icon = icon ?? ICONS[tone] ?? Info
  const live = tone === 'danger' ? 'alert' : 'status'
  return (
    <div className={`alert alert--${tone} ${className}`} role={role ?? live}>
      <Icon className={`alert__icon ${tone === 'loading' ? 'spin' : ''}`} size={18} aria-hidden="true" />
      <div className="alert__content">
        {title && <p className="alert__title">{title}</p>}
        {children && <div className="alert__body">{children}</div>}
      </div>
      {action && <div className="alert__action">{action}</div>}
    </div>
  )
}
