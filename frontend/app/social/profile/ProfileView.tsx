"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { Heart, MessageCircle, UserPlus } from "lucide-react"

import { useAuth } from "../../../lib/hooks/useAuth"
import { useApi } from "../../../lib/hooks/useApi"

type ProfileViewProps = {
  targetId: string // "me" or user identifier (sub/username/local part)
}

export function ProfileView({ targetId }: ProfileViewProps) {
  const { user } = useAuth()
  const { request } = useApi()
  const [followed, setFollowed] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => request("/profile"),
  })

  const { data: posts } = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => request("/social/posts"),
  })

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => request("/friends"),
  })

  const target = useMemo(() => {
    if (targetId === "me") {
      return {
        sub: profile?.sub,
        displayName:
          (profile?.displayName as string) ||
          (profile?.username as string) ||
          (user?.email ? user.email.split("@")[0] : "Your profile"),
        username: (profile?.username as string) || (user?.email ? user.email.split("@")[0] : "you"),
        avatarUrl: typeof profile?.avatarUrl === "string" ? (profile?.avatarUrl as string) : null,
      }
    }

    const fromFriends =
      Array.isArray(friends) &&
      (friends as any[]).find(
        (f) => f.sub === targetId || f.username === targetId || (f.email && f.email.split("@")[0] === targetId),
      )

    if (fromFriends) {
      return {
        sub: fromFriends.sub as string | undefined,
        displayName: (fromFriends.displayName as string) || (fromFriends.username as string) || "User",
        username: (fromFriends.username as string) || targetId,
        avatarUrl: typeof fromFriends.avatarUrl === "string" ? (fromFriends.avatarUrl as string) : null,
      }
    }

    return {
      sub: targetId,
      displayName: targetId,
      username: targetId,
      avatarUrl: null,
    }
  }, [friends, profile?.avatarUrl, profile?.displayName, profile?.sub, profile?.username, targetId, user?.email])

  const filteredPosts = useMemo(() => {
    if (!Array.isArray(posts)) return []
    return posts.filter((p: any) => {
      const authorSub = p.authorSub as string | undefined
      const authorEmail = p.authorEmail as string | undefined
      const authorHandle = authorEmail ? authorEmail.split("@")[0] : ""
      if (targetId === "me" && profile?.sub) return authorSub === profile.sub
      return authorSub === targetId || authorHandle === targetId || (p.authorUsername && p.authorUsername === targetId)
    })
  }, [posts, profile?.sub, targetId])

  const initials = target.displayName
    .toString()
    .split(/[._-\s]/)
    .filter(Boolean)
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <section className="glass-panel rounded-3xl border border-white/10 bg-black/70 p-4 text-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white/[0.1] text-lg font-semibold text-gray-100">
            {target.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={target.avatarUrl} alt={target.displayName} className="h-full w-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-100">{target.displayName}</p>
            <p className="text-sm text-gray-500">@{target.username}</p>
            <p className="text-xs text-gray-500 mt-1">Posts: {filteredPosts.length}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setFollowed((prev) => !prev)}
            className={`smooth-transition flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold ${
              followed ? "bg-white text-black" : "border border-white/20 bg-white/5 text-gray-100 hover:border-accent"
            }`}
          >
            <UserPlus className="h-4 w-4" />
            {followed ? "Following" : "Follow"}
          </button>
          <Link
            href="/social/messages"
            className="smooth-transition flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-gray-100 hover:border-accent"
          >
            Message
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {filteredPosts.length === 0 && (
          <div className="col-span-full rounded-2xl border border-white/10 bg-black/50 p-4 text-xs text-gray-400">
            No posts yet.
          </div>
        )}
        {filteredPosts.map((post: any) => {
          const title = typeof post.title === "string" ? post.title : "Untitled"
          const imageUrl = typeof post.imageUrl === "string" ? post.imageUrl : null
          const likeCount = typeof post.likeCount === "number" ? post.likeCount : 0
          const commentCount = typeof post.commentCount === "number" ? post.commentCount : 0
          const caption = typeof post.caption === "string" ? post.caption : ""

          return (
            <article
              key={post.id}
              className="rounded-2xl border border-white/10 bg-black/60 p-3 hover:bg-white/[0.03] smooth-transition"
            >
              <div className="space-y-2">
                <p className="truncate text-sm font-semibold text-gray-100">{title}</p>
                {caption && <p className="line-clamp-3 whitespace-pre-wrap text-[12px] text-gray-400">{caption}</p>}
                {imageUrl && (
                  <div className="overflow-hidden rounded-xl border border-white/5 bg-black/40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageUrl} alt={title} className="h-full max-h-60 w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center gap-3 text-[12px] text-gray-400">
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" />
                    {likeCount}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-4 w-4" />
                    {commentCount}
                  </span>
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}
