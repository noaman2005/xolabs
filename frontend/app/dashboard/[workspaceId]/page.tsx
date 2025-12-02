"use client"

import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState } from "react"
import { Search, Users as UsersIcon, Settings, Pencil, Trash2, Smile, Paperclip } from "lucide-react"

import { useApi } from "../../../lib/hooks/useApi"
import { RequireAuth } from "../../components/require-auth"
import { useAuth } from "../../../lib/hooks/useAuth"
import { useWebRTC } from "../../../lib/features/voice/useWebRTC"
import { VoiceChannelPanel } from "../../../lib/features/voice/components/VoiceChannelPanel"
import { useTasks } from "../../../lib/features/tasks/useTasks"
import { TasksPanel } from "../../../lib/features/tasks/components/TasksPanel"
import { useBoard } from "../../../lib/features/board/useBoard"
import { BoardPanel } from "../../../lib/features/board/components/BoardPanel"
import { ResponsiveLayout } from "../../../lib/components/ResponsiveLayout"

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
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [voiceConnecting, setVoiceConnecting] = useState(false)
  const { user, idToken } = useAuth()

  const activeChannelId = useMemo(() => {
    if (!activeChannel) return null
    if (activeChannel.id) return activeChannel.id
    if (typeof activeChannel.SK === "string") {
      return activeChannel.SK.replace("CHANNEL#", "")
    }
    return null
  }, [activeChannel])

  const handleJoinVoice = async () => {
    if (voiceConnecting || voiceState.isConnected) return
    setVoiceConnecting(true)
    try {
      await voiceState.joinVoice()
    } finally {
      setVoiceConnecting(false)
    }
  }

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
      setInviteModalOpen(false)
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

  const serverRail = (
    <aside className="glass-sidebar smooth-transition hidden h-screen w-20 flex-col items-center justify-between px-3 py-4 lg:flex">
      <div className="flex flex-col items-center gap-4">
        <img src="/logo.png" alt="XO Labs" className="h-10 w-10 object-contain" />

        <div className="flex flex-col gap-3">
          {workspacesLoading && (
            <div className="text-[10px] text-gray-500 text-center">Loading…</div>
          )}
          {!workspacesLoading && Array.isArray(workspaces) && workspaces.length === 0 && (
            <div className="text-[10px] text-gray-500 text-center">No workspaces</div>
          )}
          {!workspacesLoading && Array.isArray(workspaces) && workspaces.map((ws: any) => {
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
        href="/"
        className="smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl card-glass text-gray-400 glow-green-hover"
        title="Back to home"
      >
        ←
      </a>
    </aside>
  )

  const channelRail = (
    <aside className="glass-panel smooth-transition flex h-full w-72 flex-col rounded-none border-r border-white/[0.06] bg-sidebar px-4 py-4 text-sm text-gray-300 lg:rounded-3xl lg:border lg:bg-transparent lg:px-6 lg:py-6">
      {/* Workspace header */}
      <div className="mb-6 border-b border-white/[0.08] pb-4">
        {workspacesLoading && <div className="text-gray-500 text-sm">Loading workspace…</div>}
        {!workspacesLoading && !workspace && (
          <div className="text-gray-500 text-sm">Workspace not found.</div>
        )}
        {workspace && (
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-gray-100">{workspace.name}</h2>
              {Array.isArray(workspace.members) && workspace.members.length > 0 && (
                <p className="text-xs text-gray-500">
                  {workspace.members.length} member{workspace.members.length > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {isWorkspaceOwner && (
              <button
                type="button"
                onClick={() => setInviteModalOpen(true)}
                className="smooth-transition rounded-lg bg-white/[0.06] px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/[0.12] hover:text-gray-100"
              >
                Invite
              </button>
            )}
          </div>
        )}
      </div>

      {/* Channels section */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            Channels
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

        {/* Channels list grouped by type */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {channelsLoading && (
            <div className="text-xs text-gray-500">Loading channels…</div>
          )}
          {!channelsLoading && (!channels || channels.length === 0) && (
            <div className="text-xs text-gray-500">No channels yet</div>
          )}
          {!channelsLoading && Array.isArray(channels) && channels.length > 0 && (
            <div className="space-y-3">
              {(['text', 'voice', 'tasks', 'board'] as ChannelType[]).map((type) => {
                const typeChannels = channels.filter((ch: any) => (ch.type as ChannelType) === type)
                if (!typeChannels.length) return null
                const meta = CHANNEL_TYPE_META[type]
                return (
                  <div key={type} className="space-y-1">
                    <div className="flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                      {type === 'voice' && (
                        <span className="text-[10px] text-gray-600">Voice rooms</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      {typeChannels.map((ch: any) => {
                        const isActive =
                          activeChannel &&
                          (activeChannel.id === ch.id || activeChannel.SK === ch.SK)

                        return (
                          <div
                            key={ch.SK ?? ch.id}
                            className={
                              "smooth-transition group flex items-center gap-2 rounded-lg px-3 py-2 text-xs cursor-pointer border " +
                              (isActive
                                ? "bg-gradient-to-r from-green-500/25 to-green-600/20 text-green-300 border-green-500/60 shadow-[0_0_18px_rgba(34,197,94,0.45)]"
                                : "bg-white/[0.03] text-gray-300 border-white/[0.08] hover:bg-white/[0.08]")
                            }
                          >
                            <span
                              className="flex-1 truncate flex items-center gap-2"
                              onClick={() => setActiveChannel(ch)}
                            >
                              <ChannelTypeBadge type={(ch.type as ChannelType) || 'text'} />
                              {ch.name ?? "untitled-channel"}
                            </span>

                            {type === 'voice' && (
                              <span className="text-[10px] text-gray-500">
                                {(ch.activeParticipantCount as number | undefined) ?? 0}
                              </span>
                            )}

                            {isWorkspaceOwner && (
                              <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  type="button"
                                  className="smooth-transition rounded-md p-1 text-gray-500 hover:text-gray-300 hover:bg-white/[0.12]"
                                  title="Rename channel"
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
                                  <Pencil className="h-3.5 w-3.5" />
                                  <span className="sr-only">Rename</span>
                                </button>
                                <button
                                  type="button"
                                  className="smooth-transition rounded-md p-1 text-red-500/70 hover:text-red-300 hover:bg-red-500/15"
                                  title="Delete channel"
                                  onClick={() => {
                                    const cid =
                                      ch.id ?? (typeof ch.SK === "string" ? ch.SK.replace("CHANNEL#", "") : null)
                                    if (!cid || deleteChannel.isPending) return
                                    if (!window.confirm("Delete this channel and its messages?")) return
                                    deleteChannel.mutate(cid)
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </aside>
  )

  const mainContent = (
    <section className="glass-panel smooth-transition flex min-h-[calc(100vh-3.5rem)] flex-1 flex-col rounded-none px-4 py-4 lg:min-h-[unset] lg:rounded-3xl lg:px-8 lg:py-6">
      {activeChannel ? (
        <>
          {/* Channel header bar */}
          <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="text-xs uppercase tracking-wider text-gray-600">Channel</span>
                <span className="text-xs text-gray-500">/
                  {(activeChannel.type as ChannelType) || 'text'}</span>
              </div>
              <h2 className="truncate text-base font-semibold text-gray-100 sm:text-xl sm:font-bold">
                <span className="mr-1 text-gray-500">#</span>
                {activeChannel.name ?? "untitled-channel"}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
              <button className="smooth-transition inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-400 ring-1 ring-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200">
                <Search className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Search</span>
              </button>
              <button className="smooth-transition inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-400 ring-1 ring-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200">
                <UsersIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Members</span>
              </button>
              {isWorkspaceOwner && (
                <button className="smooth-transition inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-400 ring-1 ring-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200">
                  <Settings className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
              )}
            </div>
          </div>

          {(activeChannel.type as ChannelType) === 'voice' ? (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <VoiceChannelPanel
                isConnected={voiceState.isConnected}
                isMuted={voiceState.isMuted}
                participants={voiceState.participants}
                localStream={voiceState.localStream}
                remoteStreams={voiceState.remoteStreams}
                onJoin={handleJoinVoice}
                onLeave={voiceState.leaveVoice}
                onToggleMute={voiceState.toggleMute}
                isLoading={voiceConnecting && !voiceState.isConnected}
                error={voiceState.error}
              />
            </div>
          ) : (activeChannel.type as ChannelType) === 'tasks' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <TasksPanel
                tasks={tasksState.tasks}
                isLoading={tasksState.isLoading}
                error={tasksState.error}
                onCreate={(input) => tasksState.createTask(input)}
                onUpdate={(input) => tasksState.updateTask(input)}
                onDelete={(taskId) => tasksState.deleteTask(taskId)}
              />
            </div>
          ) : (activeChannel.type as ChannelType) === 'board' ? (
            <div className="flex min-h-0 flex-1 flex-col">
              <BoardPanel
                columns={boardState.columns}
                cards={boardState.cards}
                isLoading={boardState.isLoading}
                error={boardState.error}
                onCreateColumn={(title) => boardState.createColumn(title)}
                onCreateCard={(input) => boardState.createCard(input)}
              />
            </div>
          ) : (
            <div className="flex min-h-0 flex-1 flex-col">
              {/* Message list */}
              <div className="flex-1 space-y-3 overflow-y-auto pb-4">
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
                      className="smooth-transition group rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 hover:border-green-500/30 hover:bg-white/[0.06] sm:px-4 sm:py-3"
                    >
                      <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 sm:mb-2 sm:justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[11px] text-gray-300">
                            {(msg.authorEmail as string | undefined)?.[0]?.toUpperCase() ?? "?"}
                          </div>
                          <span className="font-semibold text-gray-300">{msg.authorEmail ?? "unknown"}</span>
                        </div>
                        <span>
                          {msg.createdAt
                            ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </span>
                      </div>
                      <div className="whitespace-pre-line rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-gray-100 sm:px-4 sm:py-2">
                        {msg.text}
                      </div>
                    </div>
                  ))}
              </div>

              {/* Message composer fixed to bottom of panel */}
              <form
                className="mt-auto space-y-2 border-t border-white/[0.06] pt-3 sm:space-y-3 sm:pt-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!messageText.trim() || sendMessage.isPending) return
                  sendMessage.mutate(messageText.trim())
                }}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
                  <div className="relative flex-1">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message…"
                      className="smooth-transition h-20 w-full resize-none rounded-2xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 sm:h-16 sm:px-4 sm:py-3"
                    />
                    <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 text-[10px] text-gray-500 sm:bottom-2.5 sm:right-4">
                      <span className="pointer-events-auto cursor-pointer rounded-md bg-white/[0.06] p-1">
                        <Smile className="h-3.5 w-3.5" />
                      </span>
                      <span className="pointer-events-auto cursor-pointer rounded-md bg-white/[0.06] p-1">
                        <Paperclip className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="btn-accent flex h-10 items-center justify-center rounded-2xl px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-6"
                    disabled={!messageText.trim() || sendMessage.isPending}
                  >
                    {sendMessage.isPending ? "Sending…" : "Send"}
                  </button>
                </div>
                <p className="text-[10px] text-gray-600 sm:text-xs">
                  Press <kbd className="rounded bg-white/[0.1] px-1.5 py-0.5">Enter</kbd> to send
                </p>
              </form>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-2xl border-2 border-dashed border-white/[0.1] text-center">
          <div className="space-y-2">
            <p className="text-lg font-semibold text-gray-400">No channel selected</p>
            <p className="text-sm text-gray-600">Choose a channel from the left to start</p>
          </div>
        </div>
      )}
    </section>
  )

  return (
    <RequireAuth>
      <ResponsiveLayout
        serverRail={serverRail}
        channelRail={channelRail}
        mainContent={mainContent}
        mobileHeaderTitle={workspace?.name || "Workspace"}
      />

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

      {inviteModalOpen && isWorkspaceOwner && (
        <InviteMemberModal
          onClose={() => setInviteModalOpen(false)}
          inviteEmail={inviteEmail}
          setInviteEmail={setInviteEmail}
          onInvite={() => {
            if (!inviteEmail.trim() || inviteMutation.isPending) return
            inviteMutation.mutate(inviteEmail.trim())
          }}
          isSubmitting={inviteMutation.isPending}
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
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-400'
                  }`}>
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

type InviteMemberModalProps = {
  onClose: () => void
  inviteEmail: string
  setInviteEmail: (value: string) => void
  onInvite: () => void
  isSubmitting: boolean
}

function InviteMemberModal({
  onClose,
  inviteEmail,
  setInviteEmail,
  onInvite,
  isSubmitting,
}: InviteMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 px-6 py-6 text-sm text-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Invite member</h3>
            <p className="text-xs text-gray-500">Send an email invite to join this workspace.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email address
            </label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
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
              onClick={onInvite}
              disabled={!inviteEmail.trim() || isSubmitting}
              className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending…' : 'Send invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}