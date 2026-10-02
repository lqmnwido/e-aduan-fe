# e-Aduan — Voice-to-Complaint Frontend

Frontend-only React app for a voice-based complaint flow. The officer records the complaint by voice,
reviews the live transcript, fills in the complaint form, and generates a PDF. UI is in BM/EN.

## Page structure

Every page shares one layout (`Layout.jsx`): a navy header with the language switch, the page content,
and a footer. There are only two routes; any other URL redirects to `/`.

| Step | Route | What happens |
| --- | --- | --- |
| 1. Rakam Suara | `/` | Real-time mic, live audio waveform, editable live transcript. Pause / resume / finish, audio playback. |
| 2. Borang Aduan | `/borang` | Complaint form, with the transcript and audio shown alongside. Priority (URGENT) toggle, required-field validation. |
| 3. Semak & Jana PDF | popup on `/borang` | PDF preview: download, print, or confirm & submit. After submitting it shows a confirmation and a "Buat Aduan Baharu" button. |

The transcript and form draft live in `ComplaintContext` and are saved to `sessionStorage`, so a
refresh doesn't lose them. The audio recording is kept in memory only.

### Source layout

```
src/
├── main.jsx, App.jsx      # entry point, fonts/styles, router
├── config.js              # system name, speech languages
├── pages/                 # RecordPage (/), FormPage (/borang)
├── components/            # Waveform, TranscriptBox, Stepper, FormField, PdfPreviewModal, ...
│   ├── layout/            # Layout, Header, Footer, LanguageSwitch
│   └── ui/                # Modal, Alert, Switch
├── hooks/                 # useSpeechRecognition (Web Speech API), useAudioRecorder (mic + waveform data)
├── context/               # ComplaintContext: transcript, form, audio shared across pages
├── data/complaintFields.js  # form questions; the form, validation and PDF all read from this list
├── pdf/                   # ComplaintDocument (PDF layout), generatePdf
├── services/              # complaintService: submit placeholder for the backend
├── i18n/                  # BM/EN strings and language context
├── styles/                # tokens, base, layout, components, pages CSS
└── utils/                 # formatting, storage helpers
```

## Tech stack

- **React 19** with **Vite 8** (`@vitejs/plugin-react`), plain JavaScript (JSX)
- **React Router 8** for the two routes
- **@react-pdf/renderer** to generate the complaint PDF in the browser
- **lucide-react** icons; **Inter** and **Poppins** fonts via `@fontsource`
- Plain CSS with design tokens (`src/styles/tokens.css`), no CSS framework
- Browser APIs: **Web Speech API** (live transcription), **MediaRecorder** + **Web Audio API** (recording
  and waveform)

## Running it

### Prerequisites

- **Node.js 22.22 or newer** (React Router 8 requires it) and npm
- **Chrome or Edge.** Live transcription uses the Web Speech API, which Firefox doesn't support.
- A microphone. The browser only allows mic access on `localhost` or HTTPS.
- An internet connection while recording. Chrome's Web Speech API sends audio to Google's speech
  service.

### Install and start

```bash
npm install
npm run dev
```

Open the URL Vite prints (default http://localhost:5173) and allow microphone access when asked. If
port 5173 is taken, run `npm run dev -- --port 5180`.

### Production build

```bash
npm run build     # output in dist/
npm run preview   # serve dist/ locally to check it
```

`dist/` is a static site. The host must send unknown paths (e.g. `/borang`) to `index.html` so the
router can handle them.

## Backend integration

- **Submit is a placeholder.** `submitComplaint({ form, transcript, audioBlob, pdfBlob })` in
  `src/services/complaintService.js` waits, then resolves. Replace it with the real POST (e.g. `FormData`
  with the audio and PDF blobs).
- **Speech-to-text privacy:** for sensitive complaints, replace `useSpeechRecognition` with streaming to
  an in-house STT service (e.g. Whisper over WebSocket). The hook's interface (`start`, `stop`, `interim`,
  `onFinal`) can stay the same.
