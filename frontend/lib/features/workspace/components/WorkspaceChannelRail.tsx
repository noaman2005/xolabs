"use client"

import React, { useState } from "react"
import { Pencil, Trash2, ChevronDown } from "lucide-react"
import { ChannelType, CHANNEL_TYPE_META, ChannelTypeBadge } from "../channelTypes"

export type WorkspaceChannelRailProps = {
  workspace: any | null
  workspacesLoading: boolean
  channels: any[] | null | undefined
  channelsLoading: boolean
  isWorkspaceOwner: boolean
  onOpenInviteModal: () => void
  onOpenCreateChannelModal: () => void
  onOpenImageModal: () => void
  onRenameWorkspace: () => void
  onDeleteWorkspace: () => void
  onLeaveWorkspace: () => void
  workspaceImageUrl?: string | null
  activeChannel: any | null
  setActiveChannel: (ch: any | null) => void
  renameChannel: { isPending: boolean; mutate: (args: { channelId: string; name: string }) => void }
  deleteChannel: { isPending: boolean; mutate: (channelId: string) => void }
}

export function WorkspaceChannelRail({
  workspace,
  workspacesLoading,
  channels,
  channelsLoading,
  isWorkspaceOwner,
  onOpenInviteModal,
  onOpenCreateChannelModal,
  onOpenImageModal,
  onRenameWorkspace,
  onDeleteWorkspace,
  onLeaveWorkspace,
  workspaceImageUrl,
  activeChannel,
  setActiveChannel,
  renameChannel,
  deleteChannel,
}: WorkspaceChannelRailProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className="glass-panel smooth-transition flex h-full w-72 flex-col rounded-none border-r border-white/[0.06] bg-sidebar px-4 py-4 text-sm text-gray-300 lg:rounded-3xl lg:border lg:bg-transparent lg:px-6 lg:py-6">
      {/* Workspace header */}
      <div className="mb-6 border-b border-white/[0.08] pb-4">
        {workspacesLoading && <div className="text-gray-500 text-sm">Loading workspace…</div>}
        {!workspacesLoading && !workspace && (
          <div className="text-gray-500 text-sm">Workspace not found.</div>
        )}
        {workspace && (
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-xs font-semibold text-gray-100 overflow-hidden">
                {workspaceImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={workspaceImageUrl} alt={workspace.name} className="h-full w-full object-cover" />
                ) : (
                  (workspace.name as string)
                    .split(" ")
                    .map((p: string) => p[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-semibold text-gray-100">{workspace.name}</h2>
                {Array.isArray(workspace.members) && workspace.members.length > 0 && (
                  <p className="text-xs text-gray-500">
                    {workspace.members.length} member{workspace.members.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
            {workspace && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setMenuOpen((v) => !v)}
                  className="smooth-transition inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.06] text-gray-300 hover:bg-white/[0.12] hover:text-gray-100"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 z-10 mt-2 w-40 rounded-xl border border-white/10 bg-black/80 p-1 text-xs text-gray-200 shadow-lg backdrop-blur">
                    {isWorkspaceOwner ? (
                      <>
                        <button
                          type="button"
                          className="smooth-transition flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.08]"
                          onClick={() => {
                            setMenuOpen(false)
                            onOpenInviteModal()
                          }}
                        >
                          <span>Invite members</span>
                        </button>
                        <button
                          type="button"
                          className="smooth-transition mt-0.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.08]"
                          onClick={() => {
                            setMenuOpen(false)
                            onRenameWorkspace()
                          }}
                        >
                          <span>Rename workspace</span>
                        </button>
                        <button
                          type="button"
                          className="smooth-transition mt-0.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.08]"
                          onClick={() => {
                            setMenuOpen(false)
                            onOpenImageModal()
                          }}
                        >
                          <span>Change image</span>
                        </button>
                        <button
                          type="button"
                          className="smooth-transition mt-0.5 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-red-300 hover:bg-red-500/20"
                          onClick={() => {
                            setMenuOpen(false)
                            onDeleteWorkspace()
                          }}
                        >
                          <span>Delete workspace</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        className="smooth-transition flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-red-300 hover:bg-red-500/20"
                        onClick={() => {
                          setMenuOpen(false)
                          onLeaveWorkspace()
                        }}
                      >
                        <span>Leave workspace</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
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
              onClick={onOpenCreateChannelModal}
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
}
