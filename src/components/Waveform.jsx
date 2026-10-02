import { useEffect, useRef } from 'react'

const BAR_WIDTH = 3
const BAR_GAP = 2
const SAMPLE_INTERVAL_MS = 45
const MAX_HISTORY = 800

const COLORS = {
  activeFrom: '#60a5fa',
  activeTo: '#1d4ed8',
  inactive: '#94a3b8',
  baseline: 'rgba(148, 163, 184, 0.45)',
}

function drawWave(canvas, history, active) {
  const ctx = canvas.getContext('2d')
  const dpr = window.devicePixelRatio || 1
  const width = canvas.width / dpr
  const height = canvas.height / dpr
  if (!width || !height) return

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, width, height)

  const step = BAR_WIDTH + BAR_GAP
  const capacity = Math.floor(width / step)
  const visible = history.slice(-capacity)
  const mid = height / 2
  const maxHalf = height * 0.46
  const offsetX = width - visible.length * step

  // dotted line for empty part
  ctx.fillStyle = COLORS.baseline
  for (let x = offsetX - step; x >= 0; x -= step) {
    ctx.fillRect(x, mid - 1, BAR_WIDTH, 2)
  }

  if (!visible.length) return

  let fill = COLORS.inactive
  if (active) {
    fill = ctx.createLinearGradient(0, 0, width, 0)
    fill.addColorStop(0, COLORS.activeFrom)
    fill.addColorStop(1, COLORS.activeTo)
  }
  ctx.fillStyle = fill
  ctx.beginPath()
  visible.forEach((level, i) => {
    const half = Math.max(1.5, level * maxHalf)
    const x = offsetX + i * step
    if (ctx.roundRect) ctx.roundRect(x, mid - half, BAR_WIDTH, half * 2, 1.5)
    else ctx.rect(x, mid - half, BAR_WIDTH, half * 2)
  })
  ctx.fill()
}

// live waveform
export default function Waveform({ analyserRef, active, label, children }) {
  const canvasRef = useRef(null)
  const historyRef = useRef([])
  const activeRef = useRef(active)

  useEffect(() => {
    activeRef.current = active
  })

  // fit canvas to screen
  useEffect(() => {
    const canvas = canvasRef.current
    const observer = new ResizeObserver(([entry]) => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(entry.contentRect.width * dpr)
      canvas.height = Math.round(entry.contentRect.height * dpr)
      drawWave(canvas, historyRef.current, activeRef.current)
    })
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!active) {
      drawWave(canvas, historyRef.current, false)
      return undefined
    }

    let frame
    let lastSample = 0
    let buffer = null

    const loop = (now) => {
      const analyser = analyserRef.current
      if (analyser && now - lastSample >= SAMPLE_INTERVAL_MS) {
        lastSample = now
        if (!buffer || buffer.length !== analyser.fftSize) buffer = new Float32Array(analyser.fftSize)
        analyser.getFloatTimeDomainData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) sum += buffer[i] * buffer[i]
        const rms = Math.sqrt(sum / buffer.length)
        // so quiet voices still show
        historyRef.current.push(Math.min(1, Math.sqrt(rms) * 1.9))
        if (historyRef.current.length > MAX_HISTORY) historyRef.current.shift()
      }
      drawWave(canvas, historyRef.current, true)
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [active, analyserRef])

  return (
    <div className="waveform">
      <canvas ref={canvasRef} className="waveform__canvas" role="img" aria-label={label} />
      {children}
    </div>
  )
}
