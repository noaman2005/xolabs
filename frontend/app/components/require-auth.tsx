"use client"

import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"
import { useAuth } from "../../lib/hooks/useAuth"

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!isReady) return
    if (!isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`)
    }
  }, [isAuthenticated, isReady, pathname, router])

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-gray-100 text-sm">
        Checking your session...
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-gray-100 text-sm">
        Redirecting to login...
      </div>
    )
  }

  return <>{children}</>
}
