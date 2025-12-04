'use client'

import React from 'react'

type Props = {
  email: string
  timezone: string
  tzFallback: string
}

export function ProfileOverviewTab({ email, timezone, tzFallback }: Props) {
  return (
    <div className="space-y-4 text-sm text-gray-300">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white/[0.03] p-3">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Account</h2>
          <p className="text-xs text-gray-500">Email</p>
          <p className="truncate text-sm text-gray-100">{email}</p>
        </div>
        <div className="rounded-xl bg-white/[0.03] p-3">
          <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">Presence</h2>
          <p className="text-xs text-gray-500">Status</p>
          <p className="text-sm text-gray-100">Online</p>
          <p className="mt-1 text-xs text-gray-500">Activity and richer presence coming soon.</p>
        </div>
      </div>
      <div className="rounded-xl bg-white/[0.03] p-3">
        <h2 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">System</h2>
        <p className="text-xs text-gray-500">Timezone</p>
        <p className="text-sm text-gray-100">{timezone || tzFallback}</p>
      </div>
    </div>
  )
}
