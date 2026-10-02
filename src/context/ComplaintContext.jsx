import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { EMPTY_FORM } from '../data/complaintFields'
import { readJSON, writeStorage } from '../utils/storage'

const DRAFT_KEY = 'eaduan:draft'
const ComplaintContext = createContext(null)

// complaint stuff shared between pages
export function ComplaintProvider({ children }) {
  const draft = useRef(readJSON(DRAFT_KEY, {}, { session: true })).current

  const [transcript, setTranscript] = useState(draft.transcript ?? '')
  const [speechLang, setSpeechLang] = useState(draft.speechLang ?? 'ms-MY')
  const [form, setForm] = useState({ ...EMPTY_FORM, ...draft.form })
  const [audio, setAudioState] = useState(null)

  useEffect(() => {
    writeStorage(DRAFT_KEY, JSON.stringify({ transcript, speechLang, form }), { session: true })
  }, [transcript, speechLang, form])

  // revoke old url so no memory leak
  const audioRef = useRef(null)

  const setAudio = useCallback((blob, duration) => {
    if (audioRef.current?.url) URL.revokeObjectURL(audioRef.current.url)
    audioRef.current = blob ? { url: URL.createObjectURL(blob), blob, duration } : null
    setAudioState(audioRef.current)
  }, [])

  const updateField = useCallback((id, value) => {
    setForm((previous) => ({ ...previous, [id]: value }))
  }, [])

  const resetForm = useCallback(() => setForm(EMPTY_FORM), [])

  // clear everything for new complaint
  const startNew = useCallback(() => {
    setTranscript('')
    setAudio(null)
    resetForm()
  }, [resetForm, setAudio])

  const value = useMemo(
    () => ({
      transcript,
      setTranscript,
      speechLang,
      setSpeechLang,
      audio,
      setAudio,
      form,
      updateField,
      resetForm,
      startNew,
    }),
    [transcript, speechLang, audio, setAudio, form, updateField, resetForm, startNew],
  )

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>
}

export function useComplaint() {
  const ctx = useContext(ComplaintContext)
  if (!ctx) throw new Error('useComplaint must be used inside <ComplaintProvider>')
  return ctx
}
