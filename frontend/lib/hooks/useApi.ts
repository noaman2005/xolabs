const API_URL = process.env.NEXT_PUBLIC_API_URL

export function useApi() {
  const request = async (path: string, init?: RequestInit) => {
    let idToken: string | null = null

    if (typeof window !== 'undefined') {
      const raw = window.localStorage.getItem('xolabs_auth')
      if (raw) {
        try {
          const parsed = JSON.parse(raw)
          idToken = parsed.idToken ?? null
        } catch {
          idToken = null
        }
      }
    }

    const headers: HeadersInit = {
      'content-type': 'application/json',
      ...(init?.headers || {}),
    }

    if (idToken) {
      ;(headers as any).authorization = `Bearer ${idToken}`
    }

    const res = await fetch(`${API_URL}${path}`, {
      ...init,
      headers,
    })

    if (res.status === 401) {
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem('xolabs_auth')
          const next = window.location.pathname + window.location.search
          const url = `/login?next=${encodeURIComponent(next)}&reason=session_expired`
          window.location.href = url
        } catch {
          // ignore
        }
      }
      throw new Error('Unauthorized')
    }

    if (!res.ok) throw new Error(`API error ${res.status}`)

    if (res.status === 204 || res.status === 205) {
      return null
    }

    const contentType = res.headers.get('content-type')?.toLowerCase() ?? ''
    if (contentType.includes('application/json')) {
      return res.json()
    }

    return res.text()
  }

  return { request }
}
