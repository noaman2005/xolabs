"use client"

import { useCallback, useEffect, useState } from "react"

type AuthTokens = {
  accessToken: string | null
  idToken: string | null
  refreshToken: string | null
  email: string | null
}

const STORAGE_KEY = "xolabs_auth"

function readStoredTokens(): AuthTokens {
  if (typeof window === "undefined") {
    return { accessToken: null, idToken: null, refreshToken: null, email: null }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { accessToken: null, idToken: null, refreshToken: null, email: null }
    const parsed = JSON.parse(raw)
    return {
      accessToken: parsed.accessToken ?? null,
      idToken: parsed.idToken ?? null,
      refreshToken: parsed.refreshToken ?? null,
      email: parsed.email ?? null,
    }
  } catch {
    return { accessToken: null, idToken: null, refreshToken: null, email: null }
  }
}

function writeStoredTokens(tokens: AuthTokens | null) {
  if (typeof window === "undefined") return
  if (!tokens || (!tokens.accessToken && !tokens.idToken)) {
    window.localStorage.removeItem(STORAGE_KEY)
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens))
}

export function useAuth() {
  const [tokens, setTokens] = useState<AuthTokens | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setTokens(readStoredTokens())
    setIsReady(true)
  }, [])

  const isAuthenticated = !!tokens?.idToken

  const signup = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.message || "Signup failed")
    }
    return data
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data?.message || "Login failed")
    }

    const newTokens: AuthTokens = {
      accessToken: data.accessToken ?? null,
      idToken: data.idToken ?? null,
      refreshToken: data.refreshToken ?? null,
      email: data.email ?? null,
    }
    writeStoredTokens(newTokens)
    setTokens(newTokens)
    return data
  }, [])

  const logout = useCallback(() => {
    writeStoredTokens(null)
    setTokens({ accessToken: null, idToken: null, refreshToken: null, email: null })
    if (typeof window !== "undefined") {
      const next = window.location.pathname + window.location.search
      const loginUrl = `/login?next=${encodeURIComponent(next)}&reason=logged_out`
      window.location.href = loginUrl
    }
  }, [])

  const user = tokens?.email
    ? {
        email: tokens.email,
      }
    : null

  return {
    user,
    idToken: tokens?.idToken ?? null,
    isAuthenticated,
    isReady,
    signup,
    login,
    logout,
  }
}
