'use client'

import React from 'react'
import Link from 'next/link'

type WorkspaceItem = {
  id: string
  name: string
  initials: string
  imageUrl: string | null
  isOwner: boolean
}

type Props = {
  workspaces: WorkspaceItem[]
}

export function ProfileWorkspacesTab({ workspaces }: Props) {
  return (
    <div className="space-y-3 text-sm">
      {workspaces.length === 0 ? (
        <p className="text-xs text-gray-500">You&apos;re not a member of any workspaces yet.</p>
      ) : (
        <div className="space-y-2">
          {workspaces.map((ws) => (
            <div
              key={ws.id}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/[0.03] px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-2xl bg-white/[0.12] text-xs font-semibold">
                  {ws.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ws.imageUrl} alt={ws.name} className="h-full w-full object-cover" />
                  ) : (
                    <>{ws.initials}</>
                  )}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-gray-100">{ws.name}</span>
                  <span className="text-[11px] text-gray-500">{ws.isOwner ? 'Owner' : 'Member'}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <Link
                  href={`/dashboard/${ws.id}`}
                  className="btn-glass px-2 py-1 text-gray-100"
                >
                  Open
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
