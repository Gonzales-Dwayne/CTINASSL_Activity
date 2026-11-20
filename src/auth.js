import { apiRequest, clearSession, readSession as readStoredSession, saveSession } from './api'

export async function authenticate(email, password) {
  const { user, token } = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  })

  saveSession({ user, token })
  return user
}

export async function register({ name, email, password }) {
  const { user, token } = await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password },
  })

  saveSession({ user, token })
  return user
}

export function readSession() {
  return readStoredSession()?.user ?? null
}

export function logout() {
  clearSession()
}
