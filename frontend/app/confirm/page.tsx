"use client"

import { Suspense, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"

function ConfirmPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialEmail = searchParams.get("email") ?? ""
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setLoading(true)
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/confirm-signup`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.message || "Confirmation failed")
      }
      setSuccess(true)
      setTimeout(() => router.push("/login"), 1000)
    } catch (err: any) {
      setError(err?.message || "Confirmation failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-gray-100">
      <div className="w-full max-w-md rounded-xl border border-gray-800 bg-surface px-8 py-6 shadow-lg">
        <h1 className="mb-2 text-xl font-semibold">Confirm your email</h1>
        <p className="mb-6 text-sm text-gray-400">
          We sent a 6-digit code to your email. Enter it below to activate your account.
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
            <label className="block text-xs font-medium text-gray-400">Confirmation code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full rounded-md bg-background px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:outline-none focus:ring-1 focus:ring-accent"
              placeholder="123456"
              required
            />
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          {success && (
            <div className="text-xs text-emerald-400">Confirmation successful! Redirecting to login...</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-accent px-3 py-2 text-sm font-medium text-black hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Confirming..." : "Confirm"}
          </button>
        </form>
        <div className="mt-4 text-center text-xs text-gray-500">
          Already confirmed?{" "}
          <Link href="/login" className="text-accent hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmPageInner />
    </Suspense>
  )
}
