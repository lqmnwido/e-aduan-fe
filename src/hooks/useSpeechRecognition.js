import { useCallback, useEffect, useRef, useState } from 'react'

const SpeechRecognitionImpl =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : undefined

// errors that restarting recognition wont fix
const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'network', 'audio-capture', 'language-not-supported'])

// live transcription and web speech api
export function useSpeechRecognition({ lang = 'ms-MY', onFinal } = {}) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const wantedRef = useRef(false)
  const onFinalRef = useRef(onFinal)

  useEffect(() => {
    onFinalRef.current = onFinal
  })

  const start = useCallback(() => {
    if (!SpeechRecognitionImpl) return false
    wantedRef.current = true
    setError(null)

    const recognition = new SpeechRecognitionImpl()
    recognition.lang = lang
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onresult = (event) => {
      let pending = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        const text = result[0].transcript
        if (result.isFinal) {
          if (text.trim()) onFinalRef.current?.(text)
        } else {
          pending += text
        }
      }
      setInterim(pending.trim())
    }

    recognition.onerror = (event) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return
      if (FATAL_ERRORS.has(event.error)) wantedRef.current = false
      setError(event.error)
    }

    // chrome stops after silence so restart it
    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return
      setInterim('')
      if (wantedRef.current) {
        try {
          recognition.start()
          return
        } catch {
          /* ignore */
        }
      }
      recognitionRef.current = null
      setListening(false)
    }

    try {
      recognition.start()
    } catch {
      wantedRef.current = false
      return false
    }
    recognitionRef.current = recognition
    setListening(true)
    return true
  }, [lang])

  const stop = useCallback(() => {
    wantedRef.current = false
    // stop not abort so last bit still gets saved
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  useEffect(
    () => () => {
      wantedRef.current = false
      recognitionRef.current?.stop()
    },
    [],
  )

  return { isSupported: Boolean(SpeechRecognitionImpl), listening, interim, error, start, stop }
}

//ughhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
