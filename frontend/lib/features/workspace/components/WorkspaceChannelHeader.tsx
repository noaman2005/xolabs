"use client"

import { Search, Users as UsersIcon, Settings } from "lucide-react"
import React from "react"
import { ChannelType } from "../channelTypes"

type Props = {
  activeChannel: any | null
  isWorkspaceOwner: boolean
  membersOpen: boolean
  onToggleMembers: () => void
}

export function WorkspaceChannelHeader({
  activeChannel,
  isWorkspaceOwner,
  membersOpen,
  onToggleMembers,
}: Props) {
  const channelType = (activeChannel?.type as ChannelType) || "text"
  const channelName = activeChannel?.name ?? "untitled-channel"

  return (
    <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-3 sm:mb-6 sm:flex-row sm:items-center sm:justify-between sm:pb-4">
      <div className="space-y-1 min-w-0">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span className="text-xs uppercase tracking-wider text-gray-600">Channel</span>
          <span className="text-xs text-gray-500">/ {channelType}</span>
        </div>
        <h2 className="truncate text-base font-semibold text-gray-100 sm:text-xl sm:font-bold">
          <span className="mr-1 text-gray-500">#</span>
          {channelName}
        </h2>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs sm:gap-3">
        <button className="smooth-transition inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-400 ring-1 ring-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200">
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
        </button>
        <button
          type="button"
          onClick={onToggleMembers}
          className="smooth-transition inline-flex items-center gap-1 rounded-lg bg-white/[0.04] px-2 py-1 text-gray-400 ring-1 ring-white/[0.06] hover:bg-white/[0.08] hover:text-gray-200"
        >
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
  )
}
