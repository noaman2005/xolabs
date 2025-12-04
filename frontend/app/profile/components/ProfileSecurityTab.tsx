'use client'

import React from 'react'

type Props = {
  email: string
  onLogout: () => void
}

export function ProfileSecurityTab({ email, onLogout }: Props) {
  return (
    <div className="space-y-4 text-sm">
      <div className="rounded-xl bg-white/[0.03] p-3">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Password</h2>
        <p className="text-xs text-gray-500">
          Password changes will be managed via Cognito / auth flows. This is a placeholder for now.
        </p>
      </div>
      <div className="rounded-xl bg-white/[0.03] p-3">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Session</h2>
        <p className="mb-2 text-xs text-gray-500">You&apos;re signed in as {email}.</p>
        <button
          type="button"
          onClick={onLogout}
          className="btn-glass px-3 py-1.5 text-xs text-gray-100"
        >
          Log out
        </button>
      </div>
    </div>
  )
}
