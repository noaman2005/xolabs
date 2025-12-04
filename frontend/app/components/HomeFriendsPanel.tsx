"use client"

import React from "react"
import type { WorkspaceItem } from "../page"

type Props = {
  workspaces: WorkspaceItem[]
  friendsData: any
  friendsLoading: boolean
  newFriendUsername: string
  setNewFriendUsername: (value: string) => void
  addFriendError: string | null
  setAddFriendError: (value: string | null) => void
  addFriend: { mutate: () => void; isPending: boolean }
  removeFriend: { mutate: (username: string) => void; isPending: boolean }
}

export function HomeFriendsPanel({
  workspaces,
  friendsData,
  friendsLoading,
  newFriendUsername,
  setNewFriendUsername,
  addFriendError,
  setAddFriendError,
  addFriend,
  removeFriend,
}: Props) {
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="rounded-xl bg-white/[0.03] p-3 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Add friend</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={newFriendUsername}
            onChange={(e) => {
              setNewFriendUsername(e.target.value)
              if (addFriendError) setAddFriendError(null)
            }}
            placeholder="friendusername"
            className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
          />
          <button
            type="button"
            disabled={!newFriendUsername.trim() || addFriend.isPending}
            onClick={() => addFriend.mutate()}
            className="smooth-transition rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {addFriend.isPending ? "Adding…" : "Add friend"}
          </button>
        </div>
        {addFriendError && (
          <p className="mt-2 text-[11px] text-rose-400">{addFriendError}</p>
        )}
      </div>

      <div className="flex-1 rounded-xl bg-white/[0.03] p-3 text-sm">
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Friends list</h2>
        {friendsLoading && (
          <div className="flex h-full items-center justify-center text-xs text-gray-500">Loading friends…</div>
        )}
        {!friendsLoading && (!Array.isArray(friendsData) || friendsData.length === 0) && (
          <p className="text-xs text-gray-500">No friends yet. Add someone by username to get started.</p>
        )}
        {!friendsLoading && Array.isArray(friendsData) && friendsData.length > 0 && (
          <div className="space-y-2">
            {friendsData.map((f: any) => {
              const presence: "online" | "idle" | "dnd" | "offline" =
                f.presence === "online" || f.presence === "idle" || f.presence === "dnd" || f.presence === "offline"
                  ? f.presence
                  : "online"
              const presenceDotClass =
                presence === "online"
                  ? "bg-emerald-400"
                  : presence === "idle"
                  ? "bg-amber-400"
                  : presence === "dnd"
                  ? "bg-rose-400"
                  : "bg-gray-500"

              const sharedWorkspaces = workspaces.filter((ws) => {
                const ownerMatch = typeof ws.ownerEmail === "string" && ws.ownerEmail.toLowerCase() === f.email?.toLowerCase()
                const members: string[] = Array.isArray(ws.members)
                  ? ws.members.map((m: any) => String(m).toLowerCase())
                  : []
                const memberMatch = !!f.email && members.includes(String(f.email).toLowerCase())
                return ownerMatch || memberMatch
              }).length

              return (
                <div
                  key={f.sub}
                  className="flex items-center justify-between gap-3 rounded-lg bg-black/40 px-3 py-2 text-xs text-gray-200"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative h-7 w-7">
                      {f.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={f.avatarUrl}
                          alt={f.displayName || f.username}
                          className="h-full w-full rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold">
                          {(f.displayName || f.username || "?")
                            .toString()
                            .split(" ")
                            .map((p: string) => p[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                      )}
                      <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-black/80 ${presenceDotClass}`} />
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-xs font-medium text-gray-100">{f.displayName || f.username}</span>
                      <span className="truncate text-[10px] text-gray-500">@{f.username}</span>
                      <span className="truncate text-[10px] text-gray-600">
                        {sharedWorkspaces > 0
                          ? `Works with you in ${sharedWorkspaces} workspace${sharedWorkspaces === 1 ? "" : "s"}`
                          : "No shared workspaces yet"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const uname = (f.username || "").toString()
                      if (!uname) return
                      const confirmed = window.confirm(`Remove ${uname} from your friends?`)
                      if (!confirmed || removeFriend.isPending) return
                      removeFriend.mutate(uname)
                    }}
                    className="text-[10px] text-gray-500 hover:text-rose-400 smooth-transition"
                  >
                    Remove
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
