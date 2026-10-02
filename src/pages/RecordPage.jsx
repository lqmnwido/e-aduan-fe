import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router'
import { ArrowRight, AudioLines, Headphones, LoaderCircle, Mic, Pause, PencilLine, RotateCcw, Square, Trash2 } from 'lucide-react'
import { useI18n } from '../i18n/I18nContext'
import { useComplaint } from '../context/ComplaintContext'
import { useAudioRecorder } from '../hooks/useAudioRecorder'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { APP_CONFIG } from '../config'
import { appendSpeechSegment, formatDuration } from '../utils/format'
import PageHero from '../components/PageHero'
import Stepper from '../components/Stepper'
import Waveform from '../components/Waveform'
import TranscriptBox from '../components/TranscriptBox'
import Alert from '../components/ui/Alert'
import { ConfirmDialog } from '../components/ui/Modal'

const MAIN_BUTTON = {
  idle: { Icon: Mic, label: 'rec.start' },
  error: { Icon: Mic, label: 'rec.retry' },
  requesting: { Icon: LoaderCircle, label: 'rec.status.requesting' },
  recording: { Icon: Pause, label: 'rec.pause' },
  paused: { Icon: Mic, label: 'rec.resume' },
  stopped: { Icon: RotateCcw, label: 'rec.restart' },
}

export default function RecordPage() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { transcript, setTranscript, speechLang, setSpeechLang, audio, setAudio } = useComplaint()
  const [waveKey, setWaveKey] = useState(0)
  const [confirm, setConfirm] = useState(null)
  const [leaving, setLeaving] = useState(false)

  const appendFinal = useCallback(
    (text) => setTranscript((previous) => appendSpeechSegment(previous, text)),
    [setTranscript],
  )
  const speech = useSpeechRecognition({ lang: speechLang, onFinal: appendFinal })
  const recorder = useAudioRecorder({ onComplete: setAudio, onPcmChunk: speech.sendAudio })

  // show old recording if coming back from form
  const phase = recorder.status === 'idle' && audio ? 'stopped' : recorder.status
  const isLive = phase === 'recording' || phase === 'paused'
  const elapsed = recorder.status === 'idle' && audio ? audio.duration : recorder.elapsed

  const begin = async () => {
    speech.start()
    const started = await recorder.start()
    if (!started) speech.stop()
  }
  const pause = () => {
    recorder.pause()
    speech.stop()
  }
  const resume = () => {
    recorder.resume()
    speech.start()
  }
  const finish = () => {
    recorder.stop()
    speech.stop()
  }
  // clear recording n reset
  const clearRecording = () => {
    setConfirm(null)
    speech.stop()
    recorder.reset()
    setTranscript('')
    setAudio(null)
    setWaveKey((k) => k + 1)
  }
  const restart = () => {
    clearRecording()
    begin()
  }

  const onMainButton = () => {
    if (phase === 'idle' || phase === 'error') begin()
    else if (phase === 'recording') pause()
    else if (phase === 'paused') resume()
    else if (phase === 'stopped') setConfirm('restart')
  }

  const proceed = async () => {
    if (isLive) {
      setLeaving(true)
      finish()
      // wait a bit for last bits to finish
      await new Promise((resolve) => setTimeout(resolve, 700))
    }
    navigate('/borang')
  }

  const speechErrorText =
    speech.error &&
    ({
      network: t('stt.err.network'),
      'not-allowed': t('stt.err.notAllowed'),
      'service-not-allowed': t('stt.err.notAllowed'),
      'language-not-supported': t('stt.err.language'),
    }[speech.error] ??
      t('stt.err.generic', { code: speech.error }))

  const { Icon: MainIcon, label: mainLabelKey } = MAIN_BUTTON[phase]
  const mainLabel = t(mainLabelKey)

  return (
    <>
      <PageHero title={t('record.title')} subtitle={t('record.subtitle')} />

      <div className="container page-body">
        <div className="stepper-wrap">
          <Stepper current={0} />
        </div>

        <div className="page-grid__main">
          <section className="card recorder" aria-labelledby="recorder-title">
            <header className="card__header">
              <div>
                <h2 id="recorder-title" className="card__title">
                  <Mic size={20} aria-hidden="true" />
                  {t('rec.cardTitle')}
                </h2>
                <p className="card__desc">{t('rec.cardDesc')}</p>
              </div>
              <div className="inline-field">
                <label htmlFor="speech-lang">{t('rec.language')}</label>
                <select
                  id="speech-lang"
                  className="select"
                  value={speechLang}
                  onChange={(event) => setSpeechLang(event.target.value)}
                  disabled={isLive || phase === 'requesting'}
                >
                  {APP_CONFIG.speechLanguages.map((option) => (
                    <option key={option.code} value={option.code}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </header>

            <div className="recorder__alerts">
              {!speech.isSupported && <Alert tone="info">{t('stt.unsupported')}</Alert>}
              {recorder.error && <Alert tone="danger">{t(`rec.err.${recorder.error}`)}</Alert>}
              {speechErrorText && <Alert tone="warning">{speechErrorText}</Alert>}
            </div>

            <div className={`recorder__stage recorder__stage--${phase}`}>
              <div className="recorder__meta">
                <span className={`status-chip status-chip--${phase}`}>
                  <span className="status-chip__dot" aria-hidden="true" />
                  {t(`rec.status.${phase}`)}
                </span>
                <span className="recorder__timer" role="timer" aria-live="off">
                  {formatDuration(elapsed)}
                </span>
              </div>
              <Waveform
                key={waveKey}
                analyserRef={recorder.analyserRef}
                active={phase === 'recording'}
                label={t('rec.waveLabel')}
              >
                {phase === 'idle' && (
                  <div className="waveform__empty">
                    <AudioLines size={20} aria-hidden="true" />
                  </div>
                )}
              </Waveform>
            </div>

            <div className="recorder__controls">
              <div className="recorder__side">
                {isLive && (
                  <button type="button" className="btn btn--secondary" onClick={() => setConfirm('restart')}>
                    <RotateCcw size={18} aria-hidden="true" />
                    <span>{t('rec.restart')}</span>
                  </button>
                )}
              </div>

              <div className="recorder__center">
                <button
                  type="button"
                  className={`mic-btn mic-btn--${phase}`}
                  onClick={onMainButton}
                  disabled={phase === 'requesting' || leaving}
                  aria-label={mainLabel}
                >
                  {phase === 'recording' && <span className="mic-btn__pulse" aria-hidden="true" />}
                  <MainIcon size={34} className={phase === 'requesting' ? 'spin' : ''} aria-hidden="true" />
                </button>
                <span className="mic-btn__label" aria-hidden="true">
                  {mainLabel}
                </span>
              </div>

              <div className="recorder__side recorder__side--end">
                {isLive && (
                  <button type="button" className="btn btn--outline" onClick={finish}>
                    <Square size={16} fill="currentColor" aria-hidden="true" />
                    <span>{t('rec.finish')}</span>
                  </button>
                )}
              </div>
            </div>

            <p className="recorder__hint" aria-live="polite">
              {t(`rec.hint.${phase}`)}
            </p>

            {(phase === 'paused' || phase === 'stopped') && (
              <div className="recorder__clear">
                <button
                  type="button"
                  className="btn btn--ghost-danger btn--sm"
                  onClick={() => setConfirm('clear')}
                  disabled={leaving}
                >
                  <Trash2 size={16} aria-hidden="true" />
                  {t('rec.clear')}
                </button>
              </div>
            )}

            {audio && !isLive && (
              <div className="recorder__playback">
                <span className="recorder__playback-label">
                  <Headphones size={16} aria-hidden="true" />
                  {t('rec.playback')} · {formatDuration(audio.duration)}
                </span>
                <audio controls src={audio.url} preload="metadata" />
              </div>
            )}
          </section>

          <TranscriptBox
            value={transcript}
            onChange={setTranscript}
            interim={speech.interim}
            listening={speech.listening}
          />

          <div className="action-bar">
            <button type="button" className="btn btn--ghost" onClick={proceed} disabled={leaving}>
              <PencilLine size={18} aria-hidden="true" />
              {t('record.skip')}
            </button>
            <div className="action-bar__primary">
              <button
                type="button"
                className="btn btn--primary btn--lg"
                onClick={proceed}
                disabled={leaving || phase === 'requesting' || (!transcript.trim() && !isLive)}
              >
                {leaving ? t('record.saving') : t('record.next')}
                {leaving ? (
                  <LoaderCircle size={18} className="spin" aria-hidden="true" />
                ) : (
                  <ArrowRight size={18} aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm === 'restart'}
        title={t('rec.confirmTitle')}
        body={t('rec.confirmBody')}
        confirmLabel={t('rec.restart')}
        onCancel={() => setConfirm(null)}
        onConfirm={restart}
      />
      <ConfirmDialog
        open={confirm === 'clear'}
        title={t('rec.clearTitle')}
        body={t('rec.clearBody')}
        confirmLabel={t('rec.clear')}
        onCancel={() => setConfirm(null)}
        onConfirm={clearRecording}
      />
    </>
  )
}
