"use client"

import type { ReactNode } from "react"
import { useQuery } from "@tanstack/react-query"

import { RequireAuth } from "../components/require-auth"
import { useAuth } from "../../lib/hooks/useAuth"
import { useApi } from "../../lib/hooks/useApi"
import { SocialNavbar } from "./components/SocialNavbar"
import { BrandCard } from "./components/sidebar/BrandCard"
import { InboxCard } from "./components/sidebar/InboxCard"
import { WorkspacesCard } from "./components/sidebar/WorkspacesCard"
import { ProfileCard } from "./components/sidebar/ProfileCard"
import { QuickLinksCard } from "./components/sidebar/QuickLinksCard"

export default function SocialLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const { request } = useApi()

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => request("/profile"),
  })

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => request("/friends"),
  })

  const { data: threads } = useQuery({
    queryKey: ["social-threads"],
    queryFn: () => request("/social/threads"),
  })

  const { data: workspacesData } = useQuery({
    queryKey: ["workspaces"],
    queryFn: () => request("/workspaces"),
  })

  const getPartnerSub = (thread: any) =>
    thread?.userA === profile?.sub ? thread?.userB : thread?.userA

  const getFriendDisplay = (partnerSub: string) => {
    if (!Array.isArray(friends)) return null
    const friend = (friends as any[]).find((f: any) => f.sub === partnerSub)
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

  const workspaceItems: any[] = Array.isArray(workspacesData)
    ? (workspacesData
        .map((ws: any) => {
          const id = ws.id ?? (typeof ws.SK === "string" ? ws.SK.replace("WORKSPACE#", "") : undefined)
          if (!id) return null
          const name = (ws.name as string) ?? "Untitled"
          return {
            id,
            label: name,
            initials: name
              .split(" ")
              .map((p: string) => p[0])
              .join("")
              .slice(0, 2)
              .toUpperCase(),
            imageUrl: typeof ws.imageUrl === "string" ? ws.imageUrl : null,
            status: "Active",
          }
        })
        .filter(Boolean) as any[]).slice(0, 3)
    : []

  return (
    <RequireAuth>
      <main className="mx-auto grid min-h-screen w-full grid-cols-1 gap-4 px-4 pb-6 pt-4 lg:grid-cols-[380px,minmax(0,1.3fr),380px] lg:px-8">
        <aside className="sticky top-0 hidden h-[calc(100vh-2rem)] flex-col gap-3 text-xs text-gray-400 lg:flex">
          <BrandCard />

          <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 bg-black/70">
            <div className="flex flex-col gap-3 overflow-y-auto p-3 pr-2">
              <InboxCard
                items={topDmPartnerSubs.map((sub) => {
                  const friend = getFriendDisplay(sub)
                  const label = friend?.displayName || friend?.username || `user-${sub.slice(0, 6)}`
                  const handle = friend?.username || label
                  return {
                    id: sub,
                    label,
                    handle,
                    href: `/social/messages?user=${encodeURIComponent(sub)}`,
                  }
                })}
              />
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 bg-black/70">
            <div className="flex flex-col gap-3 overflow-y-auto p-3 pr-2">
              <WorkspacesCard
                items={workspaceItems}
                itemHref={(item) => (item.id ? `/dashboard/${encodeURIComponent(item.id)}` : null)}
              />
            </div>
          </div>

          <div className="glass-panel overflow-hidden rounded-2xl border border-white/10 bg-black/70">
            <div className="flex flex-col gap-3 overflow-y-auto p-3 pr-2">
              <QuickLinksCard />
            </div>
          </div>

          <div className="glass-panel rounded-2xl border border-white/10 bg-black/80 p-3">
            <ProfileCard
              initials={(profile?.displayName || profile?.username || user?.email || "U")
                .toString()
                .split(/[._-\s]/)
                .filter(Boolean)
                .map((p: string) => p[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
              displayName={
                (profile?.displayName as string) ||
                (profile?.username as string) ||
                (user?.email as string) ||
                "Your profile"
              }
              avatarUrl={(profile as any)?.avatarUrl as string | undefined}
              handle={
                (profile?.username as string) ||
                (user?.email ? (user.email as string).split("@")[0] : "you")
              }
              presence={(profile as any)?.presence || "Active"}
              statusText={
                ((profile as any)?.status as string) ||
                ((profile as any)?.statusMessage as string) ||
                null
              }
            />
          </div>
        </aside>

        <div className="flex flex-col gap-4">
          <SocialNavbar />
          {children}
        </div>

        <aside className="sticky top-0 hidden h-[calc(100vh-2rem)] flex-col gap-3 overflow-y-auto text-xs text-gray-400 lg:flex">
          <div className="glass-panel rounded-2xl border border-white/10 bg-black/70 p-3">
            <p className="text-[11px] font-semibold text-gray-200">DM tips</p>
            <ul className="mt-1 list-disc space-y-1 pl-4 text-[11px] text-gray-500">
              <li>Only friends can DM for now.</li>
              <li>Start chats from the friends list.</li>
              <li>Use messages for deeper collabs.</li>
            </ul>
          </div>
        </aside>
      </main>
    </RequireAuth>
  )
}
