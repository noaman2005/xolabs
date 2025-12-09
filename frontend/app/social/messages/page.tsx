"use client"

import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useSearchParams } from "next/navigation"
import { useAuth } from "../../../lib/hooks/useAuth"
import { useApi } from "../../../lib/hooks/useApi"

function formatTime(time?: string) {
  if (!time) return ""
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

function formatDate(time?: string) {
  if (!time) return ""
  const d = new Date(time)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString()
}

export default function SocialMessagesPage() {
  const { user } = useAuth()
  const { request } = useApi()
  const searchParams = useSearchParams()
  const [selectedThread, setSelectedThread] = useState<any | null>(null)
  const [messageText, setMessageText] = useState("")
  const messagesViewportRef = useRef<HTMLDivElement | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => request("/profile"),
  })

  const { data: threads, isLoading: threadsLoading, refetch: refetchThreads } = useQuery({
    queryKey: ["social-threads"],
    queryFn: () => request("/social/threads"),
  })

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => request("/friends"),
  })

  const threadIdEncoded = selectedThread?.threadId ? encodeURIComponent(selectedThread.threadId) : null

  const messagesQuery = useQuery({
    queryKey: ["social-messages", selectedThread?.threadId],
    queryFn: () => request(`/social/threads/${threadIdEncoded}/messages`),
    enabled: !!threadIdEncoded,
    refetchInterval: 5000,
  })

  const upsertThread = useMutation({
    mutationFn: async (friendSub: string) =>
      request("/social/threads", {
        method: "POST",
        body: JSON.stringify({ friendSub }),
      }),
    onSuccess: (data) => {
      setSelectedThread(data)
      refetchThreads()
    },
  })

  const sendMessage = useMutation({
    mutationFn: async () =>
      request(`/social/threads/${threadIdEncoded}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: messageText.trim() }),
      }),
    onSuccess: () => {
      setMessageText("")
      messagesQuery.refetch()
      refetchThreads()
    },
  })

  useEffect(() => {
    if (messagesQuery.isFetching) {
      setIsSyncing(true)
    } else if (isSyncing) {
      const timer = setTimeout(() => setIsSyncing(false), 800)
      return () => clearTimeout(timer)
    }
  }, [messagesQuery.isFetching])

  useEffect(() => {
    if (messagesViewportRef.current) {
      messagesViewportRef.current.scrollTo({
        top: messagesViewportRef.current.scrollHeight,
        behavior: "smooth",
      })
    }
  }, [messagesQuery.data, selectedThread])

  const getPartnerSub = (thread: any) =>
    thread?.userA === profile?.sub ? thread?.userB : thread?.userA

  const getFriendDisplay = (partnerSub: string) => {
    if (!Array.isArray(friends)) return null
    const friend = friends.find((f: any) => f.sub === partnerSub)
    return friend
  }

  const sortedThreads = Array.isArray(threads)
    ? [...threads].sort((a: any, b: any) => {
        const aTime = a?.lastAt ? new Date(a.lastAt).getTime() : 0
        const bTime = b?.lastAt ? new Date(b.lastAt).getTime() : 0
        return bTime - aTime
      })
    : []

  const topDmPartnerSubs: string[] = sortedThreads
    .map((t: any) => getPartnerSub(t))
    .filter((sub: string | null): sub is string => typeof sub === "string" && sub.length > 0)
    .filter((sub: string, index: number, all: string[]) => all.indexOf(sub) === index)
    .slice(0, 3)

  const workspaceItems: any[] = Array.isArray((profile as any)?.workspaces)
    ? ((profile as any).workspaces as any[]).slice(0, 3)
    : []

  // Auto-select thread from ?user=sub param when threads are loaded
  useEffect(() => {
    const targetUser = searchParams.get("user")
    if (!targetUser || !Array.isArray(threads) || !profile?.sub) return

    const match = threads.find((t: any) => {
      const partner = getPartnerSub(t)
      return partner === targetUser
    })
    if (match) {
      setSelectedThread(match)
    }
  }, [searchParams, threads, profile?.sub])

  return (
    <section className="glass-panel flex min-h-[420px] flex-1 rounded-2xl border border-white/10 bg-black/60 p-4 text-sm">
      <div className="flex w-full flex-col gap-4">
        <div className="hidden flex-col gap-3 sm:flex">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Friends</h2>
          <p className="text-[10px] text-gray-400">Tap to start a DM (friends only).</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {Array.isArray(friends) && friends.map((friend: any) => (
              <button
                key={friend.sub}
                type="button"
                onClick={() => upsertThread.mutate(friend.sub)}
                className="smooth-transition rounded-full border border-white/10 px-3 py-1 text-[11px] text-gray-200 hover:border-accent"
              >
                @{friend.username || friend.sub}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Conversations</h2>
          {threadsLoading && (
            <div className="py-4 text-[11px] text-gray-500">Loading threads...</div>
          )}
          {!threadsLoading && (!Array.isArray(threads) || threads.length === 0) && (
            <div className="py-4 text-[11px] text-gray-500">No messages yet. Start a chat from your friends list.</div>
          )}

          <div className="space-y-1 max-h-40 overflow-y-auto">
            {Array.isArray(threads) && threads.map((thread: any) => {
              const partnerSub = getPartnerSub(thread)
              const friend = partnerSub ? getFriendDisplay(partnerSub) : null
              const displayName = friend?.displayName || friend?.username || `user-${partnerSub?.slice(0, 6)}`
              const username = friend?.username || displayName
              const initials = (displayName || username)
                .split(" ")
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()
              const presence: "online" | "idle" | "dnd" | "offline" = friend?.presence || "offline"
              const presenceColor =
                presence === "online"
                  ? "bg-emerald-400"
                  : presence === "idle"
                    ? "bg-amber-400"
                    : presence === "dnd"
                      ? "bg-rose-500"
                      : "bg-gray-500"

              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => setSelectedThread(thread)}
                  className={`smooth-transition flex w-full items-center gap-2 rounded-lg px-1.5 py-1.5 text-left text-gray-200 hover:bg-white/[0.08] ${
                    selectedThread?.threadId === thread.threadId ? "bg-white/[0.08]" : ""
                  }`}
                >
                  <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.06] text-[11px] font-semibold">
                    {friend?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={friend.avatarUrl}
                        alt={displayName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-black/80 ${presenceColor}`}
                    />
                  </div>

                  <div className="min-w-0 flex-1 hidden sm:block">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium">{displayName}</p>
                        <p className="truncate text-[10px] text-gray-500">@{username}</p>
                      </div>
                      <span className="flex-shrink-0 text-[9px] text-gray-500">
                        {formatTime(thread.lastAt) || "--"}
                      </span>
                    </div>
                    <p className="mt-0.5 line-clamp-1 text-[10px] text-gray-400">
                      {thread.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <section className="flex min-h-[240px] flex-1 flex-col rounded-2xl bg-black/40 px-3 py-3">
          {!selectedThread && (
            <div className="flex flex-1 flex-col items-center justify-center text-center text-[11px] text-gray-500">
              <p className="text-xs font-semibold text-gray-100">Select a conversation</p>
              <p className="text-[10px] text-gray-500">Messages between you and your friends will appear here.</p>
            </div>
          )}

          {selectedThread && (
            <>
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-gray-100">
                    {(() => {
                      const partnerSub = getPartnerSub(selectedThread)
                      const friend = partnerSub ? getFriendDisplay(partnerSub) : null
                      return friend ? `Chat with ${friend.displayName || friend.username}` : "Chat"
                    })()}
                  </h3>
                  <p className="text-[10px] text-gray-500">
                    {formatDate(selectedThread.lastAt) || ""}
                  </p>
                </div>
              </div>

              <div className="mb-4 flex flex-1 flex-col gap-3 overflow-y-auto text-[11px] text-gray-200">
                {messagesQuery.isLoading && <p className="text-center text-gray-500">Loading messages…</p>}
                {Array.isArray(messagesQuery.data) && messagesQuery.data.map((msg: any) => {
                  const isSelf = msg.sender === profile?.sub
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isSelf ? "items-end" : "items-start"}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl px-3 py-2 text-[12px] ${
                          isSelf ? "bg-accent text-black" : "bg-white/[0.08] text-gray-100"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-500">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center gap-2 border-t border-white/10 pt-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 rounded-full border border-white/10 bg-black/70 px-4 py-2 text-[11px] text-gray-100 placeholder:text-gray-500 focus:border-accent focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!messageText.trim() || sendMessage.isPending) return
                    sendMessage.mutate()
                  }}
                  className="smooth-transition rounded-full bg-accent px-4 py-2 text-[11px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={!messageText.trim()}
                >
                  {sendMessage.isPending ? "Sending…" : "Send"}
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </section>
  )
}
