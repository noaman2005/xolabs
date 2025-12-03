"use client"

import React from "react"

export type WorkspaceSummary = {
  id: string
  name: string
}

export type WorkspaceServerRailProps = {
  workspaces: any[] | null | undefined
  currentWorkspaceId: string
  isLoading: boolean
}

export function WorkspaceServerRail({ workspaces, currentWorkspaceId, isLoading }: WorkspaceServerRailProps) {
  return (
    <aside className="glass-sidebar smooth-transition hidden h-screen w-20 flex-col items-center justify-between px-3 py-4 lg:flex">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="XO Labs" className="h-10 w-10 object-contain" />

        <div className="flex flex-col gap-3">
          {isLoading && (
            <div className="text-[10px] text-gray-500 text-center">Loading…</div>
          )}
          {!isLoading && Array.isArray(workspaces) && workspaces.length === 0 && (
            <div className="text-[10px] text-gray-500 text-center">No workspaces</div>
          )}
          {!isLoading && Array.isArray(workspaces) && workspaces.map((ws: any) => {
            const id = ws.id ?? (typeof ws.SK === "string" ? ws.SK.replace("WORKSPACE#", "") : undefined)
            if (!id) return null
            const name = (ws.name as string) ?? "Untitled"
            const initials = name
              .split(" ")
              .map((p) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()

            const isCurrent = id === currentWorkspaceId

            return (
              <a
                key={ws.SK ?? ws.id}
                href={`/dashboard/${id}`}
                className={
                  "smooth-transition group flex h-12 w-12 items-center justify-center rounded-2xl text-[11px] font-semibold ring-1 " +
                  (isCurrent
                    ? "card-glass bg-gradient-to-br from-green-500/40 to-green-600/30 ring-green-500/50 text-green-300 glow-green"
                    : "card-glass text-gray-200 ring-white/[0.1] glow-green-hover")
                }
                title={name}
              >
                {typeof ws.imageUrl === "string" && ws.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={ws.imageUrl} alt={name} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <span className={isCurrent ? "" : "group-hover:text-green-400"}>{initials}</span>
                )}
              </a>
            )
          })}
        </div>
      </div>

      <a
        href="/"
        className="smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl card-glass text-gray-400 glow-green-hover"
        title="Back to home"
      >
        ←
      </a>
    </aside>
  )
}
