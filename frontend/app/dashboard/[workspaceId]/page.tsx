"use client"

import { useParams, useRouter } from "next/navigation"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useMemo, useState, useEffect } from "react"

import { Search, Users as UsersIcon, Settings, Pencil, Trash2 } from "lucide-react"

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
import { ChannelType, CHANNEL_TYPE_META, ChannelTypeBadge } from "../../../lib/features/workspace/channelTypes"
import { ChannelCreateModal } from "../../../lib/features/workspace/components/ChannelCreateModal"
import { InviteMemberModal } from "../../../lib/features/workspace/components/InviteMemberModal"
import { TextChannelPanel } from "../../../lib/features/workspace/components/TextChannelPanel"
import { WorkspaceServerRail } from "../../../lib/features/workspace/components/WorkspaceServerRail"
import { WorkspaceChannelRail } from "../../../lib/features/workspace/components/WorkspaceChannelRail"
import { WorkspaceImageModal } from "../../../lib/features/workspace/components/WorkspaceImageModal"
import { getWorkspaceImageUrl, setWorkspaceImageUrl as persistWorkspaceImageUrl } from "../../../lib/features/workspace/useWorkspaceImage"

export default function WorkspacePage() {
  const params = useParams<{ workspaceId: string }>()
  const workspaceId = params.workspaceId
  const router = useRouter()

  const { request } = useApi()
  const queryClient = useQueryClient()

  const [channelName, setChannelName] = useState("")
  const [channelType, setChannelType] = useState<ChannelType>('text')
  const [channelModalOpen, setChannelModalOpen] = useState(false)

  const [activeChannel, setActiveChannel] = useState<any | null>(null)
  const [messageText, setMessageText] = useState("")
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [imageModalOpen, setImageModalOpen] = useState(false)
  const [workspaceImageUrl, setWorkspaceImageUrlState] = useState<string | null>(() => getWorkspaceImageUrl(workspaceId))
  const [voiceConnecting, setVoiceConnecting] = useState(false)
  const { user, idToken } = useAuth()

  useEffect(() => {
    setWorkspaceImageUrlState(getWorkspaceImageUrl(workspaceId))
  }, [workspaceId])

  const activeChannelId = useMemo(() => {
    if (!activeChannel) return null
    if (activeChannel.id) return activeChannel.id
    if (typeof activeChannel.SK === "string") {
      return activeChannel.SK.replace("CHANNEL#", "")
    }
    return null
  }, [activeChannel])

  const renameWorkspace = useMutation({
    mutationFn: async (name: string) => {
      return request(`/workspaces/${workspaceId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: async () => {
      return request(`/workspaces/${workspaceId}`, {
        method: "DELETE",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      router.push("/")
    },
  })

  const leaveWorkspace = useMutation({
    mutationFn: async () => {
      return request(`/workspaces/${workspaceId}/leave`, {
        method: "POST",
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] })
      router.push("/")
    },
  })

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

  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      const arrayBuffer = await file.arrayBuffer()
      const base64Data = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))
      const body = {
        fileName: file.name,
        contentType: file.type || 'application/octet-stream',
        data: base64Data,
      }
      return request(`/workspaces/${workspaceId}/image`, {
        method: 'POST',
        body: JSON.stringify(body),
      })
    },
    onSuccess: (data: any) => {
      const newUrl = (data && typeof data.imageUrl === 'string') ? data.imageUrl : null
      if (newUrl) {
        persistWorkspaceImageUrl(workspaceId, newUrl)
        setWorkspaceImageUrlState(newUrl)
      }
      setImageModalOpen(false)
    },
  })

  const serverRail = (
    <WorkspaceServerRail
      workspaces={Array.isArray(workspaces) ? workspaces : null}
      currentWorkspaceId={workspaceId}
      isLoading={workspacesLoading}
    />
  )

  const channelRail = (
    <WorkspaceChannelRail
      workspace={workspace}
      workspacesLoading={workspacesLoading}
      channels={Array.isArray(channels) ? channels : null}
      channelsLoading={channelsLoading}
      isWorkspaceOwner={isWorkspaceOwner}
      onOpenInviteModal={() => setInviteModalOpen(true)}
      onOpenCreateChannelModal={() => setChannelModalOpen(true)}
      onOpenImageModal={() => setImageModalOpen(true)}
      onRenameWorkspace={() => {
        if (!workspace || !isWorkspaceOwner) return
        const currentName = (workspace.name as string) ?? "Workspace"
        const nextName = window.prompt("Rename workspace", currentName)
        if (!nextName || !nextName.trim() || renameWorkspace.isPending) return
        renameWorkspace.mutate(nextName.trim())
      }}
      onDeleteWorkspace={() => {
        if (!workspace || !isWorkspaceOwner || deleteWorkspace.isPending) return
        const confirmed = window.confirm("Delete this workspace and all its channels and messages? This cannot be undone.")
        if (!confirmed) return
        deleteWorkspace.mutate()
      }}
      onLeaveWorkspace={() => {
        if (!workspace || isWorkspaceOwner || leaveWorkspace.isPending) return
        const confirmed = window.confirm("Leave this workspace? You will lose access to its channels and messages.")
        if (!confirmed) return
        leaveWorkspace.mutate()
      }}
      workspaceImageUrl={workspaceImageUrl}
      activeChannel={activeChannel}
      setActiveChannel={setActiveChannel}
      renameChannel={renameChannel}
      deleteChannel={deleteChannel}
    />
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
                onUpdateCard={(input) => boardState.updateCard(input)}
              />
            </div>
          ) : (
            <TextChannelPanel
              messages={messages}
              isLoading={messagesLoading}
              messageText={messageText}
              setMessageText={setMessageText}
              onSend={() => {
                if (!messageText.trim() || sendMessage.isPending) return
                sendMessage.mutate(messageText.trim())
              }}
              isSending={sendMessage.isPending}
            />
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

      {imageModalOpen && workspace && (
        <WorkspaceImageModal
          onClose={() => setImageModalOpen(false)}
          initialImageUrl={workspaceImageUrl}
          workspaceName={workspace.name ?? "Workspace"}
          onSave={(file) => {
            if (!file || uploadImage.isPending) {
              // Clear existing image if no file selected
              persistWorkspaceImageUrl(workspaceId, null)
              setWorkspaceImageUrlState(null)
              setImageModalOpen(false)
              return
            }
            uploadImage.mutate(file)
          }}
          isSubmitting={uploadImage.isPending}
        />
      )}
    </RequireAuth>
  )
}