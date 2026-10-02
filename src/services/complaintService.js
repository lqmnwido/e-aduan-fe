// placeholder, swap w/ real api later

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// send complaint to backend
export async function submitComplaint(payload) {
  await delay(1200)
  return { submittedAt: new Date().toISOString() }
}
