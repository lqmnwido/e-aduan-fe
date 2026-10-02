import { APP_CONFIG } from '../config'

export async function extractComplaintFields(transcript) {
  const response = await fetch(`${APP_CONFIG.backendUrl}/api/complaints/extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  })
  if (!response.ok) throw new Error('extraction_failed')
  const payload = await response.json()
  return payload.fields ?? {}
}
