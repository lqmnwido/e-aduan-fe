// app info
export const APP_CONFIG = {
  systemName: 'e-Aduan',
  transcriptionWebSocketUrl: import.meta.env.VITE_TRANSCRIPTION_WS_URL ?? 'ws://localhost:8088/ws/transcription',
  backendUrl: import.meta.env.VITE_BACKEND_URL ?? 'http://localhost:8088',

  // speech langs
  speechLanguages: [
    { code: 'ms-MY', label: 'Bahasa Melayu' },
    { code: 'en-GB', label: 'English' },
  ],
}
