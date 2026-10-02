const MONTHS = {
  ms: ['Januari', 'Februari', 'Mac', 'April', 'Mei', 'Jun', 'Julai', 'Ogos', 'September', 'Oktober', 'November', 'Disember'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
}

const pad = (n) => String(n).padStart(2, '0')

export function formatDate(date, lang = 'ms') {
  const d = new Date(date)
  return `${d.getDate()} ${MONTHS[lang][d.getMonth()]} ${d.getFullYear()}`
}

export function formatDateTime(date, lang = 'ms') {
  const d = new Date(date)
  return `${formatDate(d, lang)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// ms to mm:ss
export function formatDuration(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}

export function countWords(text = '') {
  const trimmed = text.trim()
  return trimmed ? trimmed.split(/\s+/).length : 0
}

// tidy up speech text
export function formatSpeechSegment(text) {
  const clean = text.trim().replace(/\s+/g, ' ')
  if (!clean) return ''
  const capitalised = clean.charAt(0).toUpperCase() + clean.slice(1)
  return /[.!?…]$/.test(capitalised) ? capitalised : `${capitalised}.`
}

export function appendSpeechSegment(previous, segment) {
  const formatted = formatSpeechSegment(segment)
  if (!formatted) return previous
  const base = previous.trimEnd()
  return base ? `${base} ${formatted}` : formatted
}
