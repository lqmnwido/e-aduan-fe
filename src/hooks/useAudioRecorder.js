import { useCallback, useEffect, useRef, useState } from 'react'

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']

function pickMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
  return MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) ?? ''
}

function errorCode(err) {
  if (err?.name === 'NotAllowedError' || err?.name === 'SecurityError') return 'permission'
  if (err?.name === 'NotFoundError' || err?.name === 'OverconstrainedError') return 'nodevice'
  return 'generic'
}

// mic recording + waveform data
export function useAudioRecorder({ onComplete } = {}) {
  const [status, setStatusState] = useState('idle')
  const [error, setError] = useState(null)
  const [elapsed, setElapsed] = useState(0)

  const statusRef = useRef('idle')
  const analyserRef = useRef(null)
  const streamRef = useRef(null)
  const audioCtxRef = useRef(null)
  const recorderRef = useRef(null)
  const chunksRef = useRef([])
  const accumulatedRef = useRef(0)
  const segmentStartRef = useRef(0)
  const tickRef = useRef(null)
  const onCompleteRef = useRef(onComplete)

  useEffect(() => {
    onCompleteRef.current = onComplete
  })

  const setStatus = (next) => {
    statusRef.current = next
    setStatusState(next)
  }

  const isSupported = typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  const startClock = () => {
    segmentStartRef.current = performance.now()
    clearInterval(tickRef.current)
    tickRef.current = setInterval(() => {
      setElapsed(accumulatedRef.current + performance.now() - segmentStartRef.current)
    }, 200)
  }

  const stopClock = () => {
    clearInterval(tickRef.current)
    if (statusRef.current === 'recording') {
      accumulatedRef.current += performance.now() - segmentStartRef.current
    }
    setElapsed(accumulatedRef.current)
  }

  const releaseDevices = () => {
    clearInterval(tickRef.current)
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
    analyserRef.current = null
  }

  const start = useCallback(async () => {
    if (!isSupported) {
      setError(window.isSecureContext === false ? 'insecure' : 'nodevice')
      setStatus('error')
      return false
    }
    setError(null)
    setStatus('requesting')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      streamRef.current = stream

      const AudioCtx = window.AudioContext || window.webkitAudioContext
      const audioCtx = new AudioCtx()
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.5
      audioCtx.createMediaStreamSource(stream).connect(analyser)
      audioCtxRef.current = audioCtx
      analyserRef.current = analyser

      chunksRef.current = []
      if (typeof MediaRecorder !== 'undefined') {
        const mimeType = pickMimeType()
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
        recorder.ondataavailable = (event) => {
          if (event.data.size) chunksRef.current.push(event.data)
        }
        recorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
          onCompleteRef.current?.(blob, accumulatedRef.current)
        }
        recorder.start(1000)
        recorderRef.current = recorder
      }

      accumulatedRef.current = 0
      setElapsed(0)
      startClock()
      setStatus('recording')
      return true
    } catch (err) {
      releaseDevices()
      setError(errorCode(err))
      setStatus('error')
      return false
    }
  }, [isSupported])

  const pause = useCallback(() => {
    if (statusRef.current !== 'recording') return
    if (recorderRef.current?.state === 'recording') recorderRef.current.pause()
    stopClock()
    setStatus('paused')
  }, [])

  const resume = useCallback(() => {
    if (statusRef.current !== 'paused') return
    if (recorderRef.current?.state === 'paused') recorderRef.current.resume()
    startClock()
    setStatus('recording')
  }, [])

  const stop = useCallback(() => {
    if (statusRef.current !== 'recording' && statusRef.current !== 'paused') return
    stopClock()
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') recorder.stop()
    recorderRef.current = null
    releaseDevices()
    setStatus('stopped')
  }, [])

  const reset = useCallback(() => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null
      recorder.stop()
    }
    recorderRef.current = null
    releaseDevices()
    accumulatedRef.current = 0
    setElapsed(0)
    setError(null)
    setStatus('idle')
  }, [])

  // save n release mic if user leaves page
  useEffect(
    () => () => {
      if (statusRef.current === 'recording') {
        accumulatedRef.current += performance.now() - segmentStartRef.current
      }
      const recorder = recorderRef.current
      if (recorder && recorder.state !== 'inactive') recorder.stop()
      releaseDevices()
    },
    [],
  )

  return { status, error, elapsed, analyserRef, isSupported, start, pause, resume, stop, reset }
}
