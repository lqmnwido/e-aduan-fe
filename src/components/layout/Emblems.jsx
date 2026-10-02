// system logo

export function SystemLogo({ className, size = 44 }) {
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path d="M32 3 8 12v18c0 15.5 10.2 26.6 24 31 13.8-4.4 24-15.5 24-31V12L32 3Z" fill="#1e3a8a" />
      <path d="M32 3 8 12v18c0 15.5 10.2 26.6 24 31V3Z" fill="#2563eb" />
      <rect x="26" y="15" width="12" height="21" rx="6" fill="#fff" />
      <path d="M20 30a12 12 0 0 0 24 0" fill="none" stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M32 42v6" stroke="#facc15" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  )
}
