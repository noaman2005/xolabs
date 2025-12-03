const API_URL = process.env.NEXT_PUBLIC_API_URL

type StoredAuth = {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  email: string | null
}

function readStoredAuth(): StoredAuth | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem('xolabs_auth')
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return {
      accessToken: parsed.accessToken ?? null,
      idToken: parsed.idToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      email: parsed.email ?? null,
    }
  } catch {
    return null
  }
}

function writeStoredAuth(next: StoredAuth | null) {
  if (typeof window === 'undefined') return
  if (!next || (!next.accessToken && !next.idToken)) {
    window.localStorage.removeItem('xolabs_auth')
    return
  }
  window.localStorage.setItem('xolabs_auth', JSON.stringify(next))
}

export function useApi() {
  const request = async (path: string, init?: RequestInit, allowRefresh: boolean = true): Promise<any> => {
    const stored = readStoredAuth()
    let idToken = stored?.idToken ?? null

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

    if (res.status === 401 && allowRefresh && stored?.refreshToken) {
      // Try to refresh session once
      try {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ refreshToken: stored.refreshToken }),
        })
        const refreshData = await refreshRes.json().catch(() => ({}))
        if (refreshRes.ok && (refreshData.idToken || refreshData.accessToken)) {
          const next: StoredAuth = {
            accessToken: refreshData.accessToken ?? stored.accessToken ?? null,
            idToken: refreshData.idToken ?? stored.idToken ?? null,
            refreshToken: stored.refreshToken,
            email: stored.email,
          }
          writeStoredAuth(next)
          // Retry original request once with new token
          return request(path, init, false)
        }
      } catch {
        // fall through to logout
      }
    }

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
