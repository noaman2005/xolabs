"use client"

import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"

import { useApi } from "../../../lib/hooks/useApi"
import { RequireAuth } from "../../components/require-auth"
import { useAuth } from "../../../lib/hooks/useAuth"
import { useWebRTC } from "../../../lib/features/voice/useWebRTC"
import { VoiceChannelPanel } from "../../../lib/features/voice/components/VoiceChannelPanel"
import { useTasks } from "../../../lib/features/tasks/useTasks"
import { TasksPanel } from "../../../lib/features/tasks/components/TasksPanel"
import { useBoard } from "../../../lib/features/board/useBoard"
import { BoardPanel } from "../../../lib/features/board/components/BoardPanel"

type ChannelType = 'text' | 'voice' | 'tasks' | 'board'

const CHANNEL_TYPE_META: Record<ChannelType, { label: string; description: string; icon: string }> = {
  text: {
    label: 'Text',
    description: 'Send messages, images, files, memos.',
    icon: '#',
  },
  voice: {
    label: 'Voice',
    description: 'Drop into audio/video standups.',
    icon: '',
  },
  tasks: {
    label: 'Tasks',
    description: 'Kanban-style lists & assignments.',
    icon: '',
  },
  board: {
    label: 'Board',
    description: 'Freeform visual collaboration.',
    icon: '',
  },
}

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const { request } = useApi()
  const queryClient = useQueryClient()

  const [channelName, setChannelName] = useState("")
  const [channelType, setChannelType] = useState<ChannelType>('text')
  const [channelModalOpen, setChannelModalOpen] = useState(false)

  const [activeChannel, setActiveChannel] = useState<any | null>(null)
  const [messageText, setMessageText] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const { user, idToken } = useAuth()

  const activeChannelId = useMemo(() => {
    if (!activeChannel) return null
    if (activeChannel.id) return activeChannel.id
    if (typeof activeChannel.SK === "string") {
      return activeChannel.SK.replace("CHANNEL#", "")
    }
    return null
  }, [activeChannel])

  const voiceState = useWebRTC({
    workspaceId,
    channelId: activeChannelId ?? "",
    userId: user?.email ?? "",
    userEmail: user?.email ?? "",
    authToken: idToken ?? "",
  })

  const tasksState = useTasks({
    workspaceId,
    channelId: activeChannelId ?? "",
  })

  const boardState = useBoard({
    workspaceId,
    channelId: activeChannelId ?? "",
  })

  const {
    data: workspaces,
    isLoading: workspacesLoading,
  } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => request("/workspaces"),
  })

  const workspace = Array.isArray(workspaces)
    ? workspaces.find(
        (ws: any) =>
          ws.id === workspaceId || ws.SK === `WORKSPACE#${workspaceId}`,
      )
    : null

  const isWorkspaceOwner = Boolean(
    workspace?.ownerEmail && user?.email && workspace.ownerEmail === user.email,
  )

  const {
    data: channels,
    isLoading: channelsLoading,
  } = useQuery({
    queryKey: ["channels", workspaceId],
    queryFn: () => request(`/workspaces/${workspaceId}/channels`),
    enabled: !!workspaceId,
  })

  const createChannel = useMutation({
    mutationFn: async ({ name, type }: { name: string; type: ChannelType }) => {
      return request(`/workspaces/${workspaceId}/channels`, {
        method: "POST",
        body: JSON.stringify({ name, type, ownerEmail: user?.email ?? null }),
      })
    },
    onSuccess: () => {
      setChannelName("")
      setChannelType('text')
      setChannelModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] })
    },
  })

  const renameChannel = useMutation({
    mutationFn: async ({ channelId, name }: { channelId: string; name: string }) => {
      return request(`/workspaces/${workspaceId}/channels/${channelId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] })
    },
  })

  const deleteChannel = useMutation({
    mutationFn: async (channelId: string) => {
      return request(`/workspaces/${workspaceId}/channels/${channelId}`, {
        method: "DELETE",
      })
    },
    onSuccess: (_data, channelId) => {
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] })
      setActiveChannel((current: any | null) => {
        if (!current) return current
        const currentId = current.id ?? (typeof current.SK === "string" ? current.SK.replace("CHANNEL#", "") : null)
        if (currentId === channelId) return null
        return current
      })
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (email: string) => {
      return request(`/workspaces/${workspaceId}/invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      })
    },
    onSuccess: () => {
      setInviteEmail("")
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })

  const {
    data: messages,
    isLoading: messagesLoading,
  } = useQuery({
    queryKey: ["messages", workspaceId, activeChannelId],
    queryFn: () =>
      request(
        `/workspaces/${workspaceId}/channels/${activeChannelId}/messages`,
      ),
    enabled: !!workspaceId && !!activeChannelId,
    refetchInterval: 5000,
  })

  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      return request(
        `/workspaces/${workspaceId}/channels/${activeChannelId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ text }),
        },
      )
    },
    onSuccess: () => {
      setMessageText("")
      queryClient.invalidateQueries({
        queryKey: ["messages", workspaceId, activeChannelId],
      })
    },
  })

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-transparent text-gray-100">
        {/* Sidebar 1: Workspaces */}
        <aside className="glass-sidebar smooth-transition flex w-24 flex-col items-center justify-between px-3 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/30 to-green-600/20 ring-1 ring-green-500/40 glow-green">
              <span className="text-lg font-bold text-green-400">X</span>
            </div>

            <div className="flex flex-col gap-3">
              {workspacesLoading && (
                <div className="text-[10px] text-gray-500 text-center">Loading…</div>
              )}
              {!workspacesLoading && Array.isArray(workspaces) && workspaces.length === 0 && (
                <div className="text-[10px] text-gray-500 text-center">No workspaces</div>
              )}
              {!workspacesLoading &&
                Array.isArray(workspaces) &&
                workspaces.map((ws: any) => {
                  const id = ws.id ?? (typeof ws.SK === "string" ? ws.SK.replace("WORKSPACE#", "") : undefined)
                  if (!id) return null
                  const name = (ws.name as string) ?? "Untitled"
                  const initials = name
                    .split(" ")
                    .map((p) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()

                  const isCurrent = id === workspaceId

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
                      <span className={isCurrent ? "" : "group-hover:text-green-400"}>{initials}</span>
                    </a>
                  )
                })}
            </div>
          </div>

          <a
            href="/dashboard"
            className="smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl card-glass text-gray-400 glow-green-hover"
            title="Back to dashboard"
          >
            ←
          </a>
        </aside>

        {/* Main columns */}
        <div className="flex min-h-screen flex-1 gap-4 px-6 py-4">
          {/* Sidebar 2: Workspace + Channels */}
          <aside className="glass-panel smooth-transition flex w-80 flex-col rounded-3xl px-6 py-6 text-sm text-gray-300">
            {/* Workspace header */}
            <div className="mb-6 space-y-2 border-b border-white/[0.08] pb-4">
              {workspacesLoading && <div className="text-gray-500 text-sm">Loading workspace…</div>}
              {!workspacesLoading && !workspace && (
                <div className="text-gray-500 text-sm">Workspace not found.</div>
              )}
              {workspace && (
                <>
                  <h2 className="text-lg font-bold text-gray-100">{workspace.name}</h2>
                  <p className="text-xs text-gray-600 break-all">ID: {workspace.id}</p>
                  {workspace.ownerEmail && (
                    <p className="text-xs text-gray-500">Owner: {workspace.ownerEmail}</p>
                  )}
                  {Array.isArray(workspace.members) && workspace.members.length > 0 && (
                    <div className="text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-500">Members</p>
                      <div className="flex flex-wrap gap-1">
                        {workspace.members.map((member: string, idx: number) => (
                          <span
                            key={idx}
                            className="inline-block rounded-full bg-white/[0.06] border border-white/[0.1] px-2 py-1 text-[10px] text-gray-400"
                          >
                            {member}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Invite section */}
            {workspace && isWorkspaceOwner && (
              <form
                className="mb-6 space-y-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!inviteEmail.trim() || inviteMutation.isPending) return
                  inviteMutation.mutate(inviteEmail.trim())
                }}
              >
                <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Invite Member
                </label>
                <div className="flex gap-2">
                  <input
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="Email address"
                    className="smooth-transition flex-1 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                  />
                  <button
                    type="submit"
                    className="btn-accent px-3 py-2 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!inviteEmail.trim() || inviteMutation.isPending}
                  >
                    {inviteMutation.isPending ? "…" : "Add"}
                  </button>
                </div>
              </form>
            )}
            {workspace && !isWorkspaceOwner && (
              <p className="mb-6 text-xs text-gray-600">
                Only workspace owners can invite new members.
              </p>
            )}

            {/* Channels section */}
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Text Channels
                </h3>
              </div>

              {/* Create channel button */}
              {isWorkspaceOwner ? (
                <div className="mb-4">
                  <button
                    onClick={() => setChannelModalOpen(true)}
                    className="smooth-transition w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-gray-300 hover:border-green-500/40 hover:bg-white/[0.08]"
                  >
                    + Create channel
                  </button>
                </div>
              ) : (
                <div className="mb-4 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-gray-600">
                  Channels can be created and managed by the workspace owner.
                </div>
              )}

              {/* Channels list */}
              <div className="flex-1 overflow-y-auto space-y-1">
                {channelsLoading && (
                  <div className="text-xs text-gray-500">Loading channels…</div>
                )}
                {!channelsLoading && (!channels || channels.length === 0) && (
                  <div className="text-xs text-gray-500">No channels yet</div>
                )}
                {!channelsLoading &&
                  Array.isArray(channels) &&
                  channels.map((ch: any) => {
                    const isActive =
                      activeChannel &&
                      (activeChannel.id === ch.id || activeChannel.SK === ch.SK)

                    return (
                      <div
                        key={ch.SK ?? ch.id}
                        className={
                          "smooth-transition group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer " +
                          (isActive
                            ? "bg-gradient-to-r from-green-500/30 to-green-600/20 text-green-300 border border-green-500/30"
                            : "bg-white/[0.04] text-gray-300 hover:bg-white/[0.08] border border-white/[0.08]")
                        }
                      >
                        <span
                          className="flex-1 truncate flex items-center gap-2"
                          onClick={() => setActiveChannel(ch)}
                        >
                          <ChannelTypeBadge type={(ch.type as ChannelType) || 'text'} />
                          {ch.name ?? "untitled-channel"}
                        </span>

                        {isWorkspaceOwner && (
                          <>
                            <button
                              className="smooth-transition rounded px-1.5 py-0.5 text-[10px] text-gray-600 hover:text-gray-400 hover:bg-white/[0.1] opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const currentName = (ch.name as string) ?? ""
                                const nextName = window.prompt("Rename channel", currentName)
                                if (!nextName || !nextName.trim()) return
                                const cid =
                                  ch.id ?? (typeof ch.SK === "string" ? ch.SK.replace("CHANNEL#", "") : null)
                                if (!cid || renameChannel.isPending) return
                                renameChannel.mutate({ channelId: cid, name: nextName.trim() })
                              }}
                            >
                              Rename
                            </button>
                            <button
                              className="smooth-transition rounded px-1.5 py-0.5 text-[10px] text-red-500/60 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100"
                              onClick={() => {
                                const cid =
                                  ch.id ?? (typeof ch.SK === "string" ? ch.SK.replace("CHANNEL#", "") : null)
                                if (!cid || deleteChannel.isPending) return
                                if (!window.confirm("Delete this channel and its messages?")) return
                                deleteChannel.mutate(cid)
                              }}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )
                  })}
              </div>
            </div>
          </aside>

          {/* Main chat / voice panel */}
          <section className="glass-panel smooth-transition flex flex-1 flex-col rounded-3xl px-8 py-6">
            {activeChannel ? (
              <>
                {/* Chat header */}
                <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-gray-100">
                      #{activeChannel.name ?? "untitled-channel"}
                    </h2>
                    <p className="text-xs text-gray-600 mt-1">Channel ID: {activeChannelId}</p>
                  </div>
                </div>

                {(activeChannel.type as ChannelType) === 'voice' ? (
                  <div className="flex-1 flex flex-col">
                    <VoiceChannelPanel
                      isConnected={voiceState.isConnected}
                      isMuted={voiceState.isMuted}
                      participants={voiceState.participants}
                      localStream={voiceState.localStream}
                      remoteStreams={voiceState.remoteStreams}
                      onJoin={voiceState.joinVoice}
                      onLeave={voiceState.leaveVoice}
                      onToggleMute={voiceState.toggleMute}
                      error={voiceState.error}
                    />
                  </div>
                ) : (activeChannel.type as ChannelType) === 'tasks' ? (
                  <TasksPanel
                    tasks={tasksState.tasks}
                    isLoading={tasksState.isLoading}
                    error={tasksState.error}
                    onCreate={(input) => tasksState.createTask(input)}
                    onUpdate={(input) => tasksState.updateTask(input)}
                    onDelete={(taskId) => tasksState.deleteTask(taskId)}
                  />
                ) : (activeChannel.type as ChannelType) === 'board' ? (
                  <BoardPanel
                    columns={boardState.columns}
                    cards={boardState.cards}
                    isLoading={boardState.isLoading}
                    error={boardState.error}
                    onCreateColumn={(title) => boardState.createColumn(title)}
                    onCreateCard={(input) => boardState.createCard(input)}
                  />
                ) : (
                  <>
                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto space-y-4 mb-6">
                      {messagesLoading && (
                        <div className="text-xs text-gray-500">Loading messages…</div>
                      )}
                      {!messagesLoading && (!messages || messages.length === 0) && (
                        <div className="flex h-full items-center justify-center text-center">
                          <div className="text-sm text-gray-500">
                            No messages yet. Start the conversation!
                          </div>
                        </div>
                      )}
                      {!messagesLoading &&
                        Array.isArray(messages) &&
                        messages.map((msg: any) => (
                          <div
                            key={msg.SK ?? msg.id}
                            className="smooth-transition group rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3 hover:border-green-500/30 hover:bg-white/[0.06]"
                          >
                            <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                              <span className="font-semibold text-gray-400">{msg.authorEmail ?? "unknown"}</span>
                              <span>
                                {msg.createdAt
                                  ? new Date(msg.createdAt).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })
                                  : ""}
                              </span>
                            </div>
                            <div className="whitespace-pre-line text-sm text-gray-200">{msg.text}</div>
                          </div>
                        ))}
                    </div>

                    {/* Message composer */}
                    <form
                      className="space-y-3 border-t border-white/[0.08] pt-4"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!messageText.trim() || sendMessage.isPending) return
                        sendMessage.mutate(messageText.trim())
                      }}
                    >
                      <textarea
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Type your message…"
                        className="smooth-transition h-24 w-full resize-none rounded-xl bg-white/[0.06] border border-white/[0.1] px-4 py-3 text-sm text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-gray-600">
                          Press <kbd className="rounded bg-white/[0.1] px-1.5 py-0.5">Enter</kbd> to send
                        </p>
                        <button
                          type="submit"
                          className="btn-accent px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={!messageText.trim() || sendMessage.isPending}
                        >
                          {sendMessage.isPending ? "Sending…" : "Send"}
                        </button>
                      </div>
                    </form>
                  </>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.1] text-center">
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-gray-400">No channel selected</p>
                  <p className="text-sm text-gray-600">Choose a channel from the left to start chatting</p>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      {channelModalOpen && isWorkspaceOwner && (
        <ChannelCreateModal
          onClose={() => setChannelModalOpen(false)}
          channelName={channelName}
          setChannelName={setChannelName}
          channelType={channelType}
          setChannelType={setChannelType}
          onCreate={() => {
            if (!channelName.trim() || createChannel.isPending) return
            createChannel.mutate({ name: channelName.trim(), type: channelType })
          }}
          isSubmitting={createChannel.isPending}
        />
      )}
    </RequireAuth>
  )
}

function ChannelTypeBadge({ type }: { type: ChannelType }) {
  const meta = CHANNEL_TYPE_META[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  )
}

type ChannelCreateModalProps = {
  onClose: () => void
  channelName: string
  setChannelName: (value: string) => void
  channelType: ChannelType
  setChannelType: (value: ChannelType) => void
  onCreate: () => void
  isSubmitting: boolean
}

function ChannelCreateModal({
  onClose,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  onCreate,
  isSubmitting,
}: ChannelCreateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 px-6 py-6 text-sm text-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Create Channel</h3>
            <p className="text-xs text-gray-500">Choose a type and give it a name to get started.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Channel type</div>
          <div className="space-y-2">
            {(Object.keys(CHANNEL_TYPE_META) as ChannelType[]).map((type) => {
              const meta = CHANNEL_TYPE_META[type]
              const isActive = channelType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChannelType(type)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left smooth-transition ${
                    isActive
                      ? 'border-green-500/60 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${isActive ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-400'}`}>
                    <span>{meta.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <div className="text-xs text-gray-500">{meta.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Channel name
            </label>
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. roadmap or design-sync"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={!channelName.trim() || isSubmitting}
              className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : 'Create Channel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}