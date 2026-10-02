// storage can get blocked so wrap it

export function readStorage(key, { session = false } = {}) {
  try {
    return (session ? sessionStorage : localStorage).getItem(key)
  } catch {
    return null
  }
}

export function writeStorage(key, value, { session = false } = {}) {
  try {
    const store = session ? sessionStorage : localStorage
    if (value === null || value === undefined) store.removeItem(key)
    else store.setItem(key, value)
  } catch {
    /* ignore */
  }
}

export function readJSON(key, fallback, options) {
  const raw = readStorage(key, options)
  if (!raw) return fallback
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}
