"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../lib/hooks/useAuth"

export default function LoginPage() {
  const { login } = useAuth()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      setError(err?.message || "Login failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-gray-100">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-surface px-8 py-6 shadow-lg">
        <h1 className="mb-2 text-xl font-semibold">Welcome back to XO Labs</h1>
        <p className="mb-6 text-sm text-gray-400">
          Sign in to access your workspaces and channels.
        </p>
        <form onSubmit={onSubmit} className="space-y-4 text-sm">
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md bg-background px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs font-medium text-gray-400">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md bg-background px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-black hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-500">
          Don't have an account?{" "}
          <Link href="/signup" className="text-accent hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
