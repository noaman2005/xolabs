"use client"

import Link from "next/link"
import Image from "next/image"
import { useQuery } from "@tanstack/react-query"
import {
  LayoutDashboard,
  Users,
  Compass,
  Rocket,
  X,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from "lucide-react"
import React from "react"

import { useApi } from "../../lib/hooks/useApi"
import type { WorkspaceItem } from "../page"

export type HomeSection = "dashboard" | "friends" | "workspaces"

type NavItemProps = {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
}

function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
        className={`nav-item relative overflow-hidden focus:outline-none ${
        active
          ? "nav-item-active bg-white/10 text-white border border-accent/50 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]"
          : "text-gray-200 hover:bg-white/[0.08]"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {active ? <span className="absolute inset-y-1 left-1 w-1 rounded-full bg-accent" /> : null}
    </button>
  )
}

type SidebarProps = {
  workspaces: WorkspaceItem[]
  userEmail?: string
  onLogout?: () => void
  isOpen?: boolean
  onClose?: () => void
  activeSection: HomeSection
  onSectionChange: (section: HomeSection) => void
  onProfileClick?: () => void
}

export function Sidebar({
  workspaces,
  userEmail,
  onLogout,
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
  onProfileClick,
}: SidebarProps) {
  const { request } = useApi()

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => request("/profile"),
  })

  const email = (profile && typeof profile.email === "string" ? profile.email : userEmail) || "Guest"
  const displayName =
    (profile && typeof profile.displayName === "string" && profile.displayName.trim()) || email.split("@")[0]
  const avatarUrl = profile && typeof profile.avatarUrl === "string" ? profile.avatarUrl : null
  const statusMessage = profile && typeof profile.statusMessage === "string" ? profile.statusMessage : ""
  const presence: "online" | "idle" | "dnd" | "offline" =
    profile &&
    (profile.presence === "online" ||
      profile.presence === "idle" ||
      profile.presence === "dnd" ||
      profile.presence === "offline")
      ? profile.presence
      : "online"

  const initials = (email || "XO")
    .split("@")[0]
    .split(".")
    .filter(Boolean)
    .map((part: string) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  const presenceDotClass =
    presence === "online"
      ? "bg-emerald-400"
      : presence === "idle"
      ? "bg-amber-400"
      : presence === "dnd"
      ? "bg-rose-400"
      : "bg-gray-500"

  return (
    <aside
      className={`glass-sidebar ${
        isOpen ? "flex" : "hidden"
      } fixed inset-y-0 left-0 z-40 w-72 flex-col border-b border-white/[0.12] bg-gradient-to-b from-black/75 via-slate-950/80 to-black/60 px-4 py-5 shadow-2xl lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-64 lg:border-b-0 lg:px-6 lg:py-6`}
    >
      {/* Brand logo */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative h-9 w-9 overflow-hidden rounded-xl border border-white/10 bg-white/10">
            <Image src="/logo.png" alt="XO Labs" fill className="object-contain" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-gray-50">XO Labs</p>
            <p className="text-[11px] text-gray-400">Collaborate boldly</p>
          </div>
        </div>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="smooth-transition rounded-lg bg-white/[0.12] p-1.5 text-gray-300 hover:bg-white/[0.18] hover:text-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        ) : null}
      </div>

      {/* Top Navigation */}
      <div className="mb-4 space-y-2 mt-1">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500">Navigate</div>
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          active={activeSection === "dashboard"}
          onClick={() => onSectionChange("dashboard")}
        />
      </div>

      {/* Friends Section */}
      <div className="mb-4 space-y-2">
        <div className="text-[11px] uppercase tracking-[0.08em] text-gray-500">People</div>
        <NavItem
          icon={<Users className="h-5 w-5" />}
          label="Friends"
          active={activeSection === "friends"}
          onClick={() => onSectionChange("friends")}
        />
      </div>

      {/* Workspaces Section */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.08em] text-gray-500">
          <span>Workspaces</span>
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <NavItem
          icon={<Compass className="h-5 w-5" />}
          label="Workspaces"
          active={activeSection === "workspaces"}
          onClick={() => onSectionChange("workspaces")}
        />
      </div>

      {/* Social Section (separate route) */}
      <div className="mb-4 space-y-2">
        <Link href="/social" className="nav-item">
          <MessageCircle className="h-5 w-5" />
          <span className="font-medium">Social</span>
        </Link>
      </div>

      {/* Projects (GitHub) */}
      <div className="mb-6">
        <Link href="/projects" className="nav-item">
          <Rocket className="h-5 w-5" />
          <span className="font-medium">Projects</span>
        </Link>
      </div>

      {/* Workspaces list in sidebar */}
      <div className="flex-1 space-y-2 overflow-y-auto pt-2">
        {workspaces.map((ws) => (
          <Link
            key={ws.id}
            href={`/dashboard/${ws.id}`}
            className="smooth-transition flex items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-2 text-xs text-gray-200 hover:bg-white/[0.12] hover:text-gray-100"
          >
            <span className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] text-[11px] font-semibold">
              {ws.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ws.imageUrl} alt={ws.name} className="h-full w-full object-cover" />
              ) : (
                <>{ws.initials}</>
              )}
            </span>
            <span className="truncate">{ws.name}</span>
          </Link>
        ))}
      </div>

      {/* External Links */}
      <div className="mt-4 pt-4">
        <div className="mb-3 space-y-2">
          <a
            href="https://xo-labs.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">Landing page</span>
          </a>
        </div>
      </div>

      {/* Profile & logout */}
      <div className="mt-2 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onProfileClick}
            className="flex flex-1 items-center gap-2 overflow-hidden text-left hover:opacity-90 smooth-transition"
          >
            <div className="relative h-8 w-8">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
                  {initials}
                </div>
              )}
              <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-black/80 ${presenceDotClass}`} />
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-gray-200">{displayName}</span>
              <span className="truncate text-[10px] text-gray-500">
                {statusMessage ||
                  (presence === "online"
                    ? "Online"
                    : presence === "idle"
                    ? "Idle"
                    : presence === "dnd"
                    ? "Do Not Disturb"
                    : "Offline")}
              </span>
            </div>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="smooth-transition rounded-lg bg-white/[0.06] px-2 py-1 text-[11px] text-gray-300 hover:bg-white/[0.12] hover:text-gray-100"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}
