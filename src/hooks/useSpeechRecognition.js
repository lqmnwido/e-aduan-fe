import { useCallback, useEffect, useRef, useState } from 'react'
import { APP_CONFIG } from '../config'

// Low latency gateway: 100ms PCM frames, ASR after 600ms, utterance end after 400ms silence.
function cleanTranscript(text) {
  return String(text ?? '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim()
}

export function useSpeechRecognition({ lang = 'ms-MY', onFinal } = {}) {
  const [listening, setListening] = useState(false)
  const [interim, setInterim] = useState('')
  const [error, setError] = useState(null)

  const recognitionRef = useRef(null)
  const onFinalRef = useRef(onFinal)
  const queuedFramesRef = useRef([])

  useEffect(() => {
    onFinalRef.current = onFinal
  })

  const start = useCallback(() => {
    setError(null)
    try {
      const socket = new WebSocket(APP_CONFIG.transcriptionWebSocketUrl)
      socket.binaryType = 'arraybuffer'
      socket.onopen = () => {
        socket.send(JSON.stringify({ type: 'start', sample_rate: 16000, language: lang }))
        queuedFramesRef.current.forEach((frame) => socket.send(frame))
        queuedFramesRef.current = []
        setListening(true)
      }
      socket.onmessage = (event) => {
        const message = JSON.parse(event.data)
        const transcript = cleanTranscript(message.text)
        if (message.type === 'interim') setInterim(transcript)
        if (message.type === 'final') {
          if (transcript) onFinalRef.current?.(transcript)
          setInterim('')
        }
        if (message.type === 'error') setError(message.code ?? 'network')
      }
      socket.onerror = () => setError('network')
      socket.onclose = () => {
        if (recognitionRef.current === socket) recognitionRef.current = null
        setListening(false)
      }
      recognitionRef.current = socket
    } catch {
      setError('network')
      return false
    }
    return true
  }, [lang])

  const stop = useCallback(() => {
    const socket = recognitionRef.current
    if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'end' }))
    else socket?.close()
    setListening(false)
  }, [])

  const sendAudio = useCallback((pcm) => {
    const socket = recognitionRef.current
    const buffer = pcm.buffer.slice(pcm.byteOffset, pcm.byteOffset + pcm.byteLength)
    if (socket?.readyState === WebSocket.OPEN) socket.send(buffer)
    else if (socket?.readyState === WebSocket.CONNECTING) queuedFramesRef.current.push(buffer)
  }, [])

  useEffect(
    () => () => {
      recognitionRef.current?.close()
    },
    [],
  )

  return { isSupported: typeof WebSocket !== 'undefined', listening, interim, error, start, stop, sendAudio }
}

//ughhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh
