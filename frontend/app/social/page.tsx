"use client"

import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { useAuth } from "../../lib/hooks/useAuth"
import { useApi } from "../../lib/hooks/useApi"

export default function SocialPage() {
  const { user } = useAuth()
  const { request } = useApi()
  const queryClient = useQueryClient()

  const [composerOpen, setComposerOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState("")
  const [error, setError] = useState<string | null>(null)

  const { data: posts, isLoading } = useQuery({
    queryKey: ["social-posts"],
    queryFn: () => request("/social/posts"),
  })

  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: () => request("/profile"),
  })

  const { data: friends } = useQuery({
    queryKey: ["friends"],
    queryFn: () => request("/friends"),
  })

  const createPost = useMutation({
    mutationFn: async () => {
      const body: any = {
        title: title.trim(),
        caption: caption.trim(),
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ""
        for (let i = 0; i < bytes.length; i += 1) {
          binary += String.fromCharCode(bytes[i])
        }
        const base64Data = btoa(binary)
        body.image = {
          fileName: file.name,
          contentType: file.type || "application/octet-stream",
          data: base64Data,
        }
      }

      return request("/social/posts", {
        method: "POST",
        body: JSON.stringify(body),
      })
    },
    onSuccess: () => {
      setTitle("")
      setCaption("")
      setFile(null)
      setPreviewUrl("")
      setError(null)
      setComposerOpen(false)
      queryClient.invalidateQueries({ queryKey: ["social-posts"] })
    },
    onError: (err) => {
      console.error("create social post error", err)
      setError("Could not create post. Please try again.")
    },
  })

  const renderPosts = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8 text-xs text-gray-500">
          Loading posts...
        </div>
      )
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      return (
        <div className="flex items-center justify-center py-8 text-center text-xs text-gray-500">
          <p className="max-w-xs">No posts yet. Be the first to share something using the Create tab.</p>
        </div>
      )
    }

    return posts.map((post: any) => {
      const email = typeof post.authorEmail === "string" ? post.authorEmail : ""
      const authorSub = typeof post.authorSub === "string" ? post.authorSub : null
      const localPart = email ? email.split("@")[0] : ""
      const baseUsername = localPart ? localPart.toLowerCase() : "unknown"
      const titleValue = typeof post.title === "string" && post.title.trim() ? post.title.trim() : "Untitled"
      const captionValue = typeof post.caption === "string" ? post.caption : ""
      const imageUrl = typeof post.imageUrl === "string" ? post.imageUrl : null

      let timeLabel = "Just now"
      let dateLabel = ""
      if (typeof post.createdAt === "string") {
        const d = new Date(post.createdAt)
        if (!Number.isNaN(d.getTime())) {
          timeLabel = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          dateLabel = d.toLocaleDateString()
        }
      }

      const isMe =
        (profile && typeof profile.email === "string" && profile.email === email) ||
        (user?.email && user.email === email)

      const friendFromSub =
        Array.isArray(friends) && authorSub
          ? (friends as any[]).find((f) => f.sub === authorSub)
          : null

      let username: string = baseUsername
      let displayName: string | null = null
      let avatarUrl: string | null = null

      if (friendFromSub) {
        username =
          typeof friendFromSub.username === "string" && friendFromSub.username.trim()
            ? friendFromSub.username.trim()
            : baseUsername
        displayName =
          typeof friendFromSub.displayName === "string" && friendFromSub.displayName.trim()
            ? friendFromSub.displayName.trim()
            : username
        avatarUrl = typeof friendFromSub.avatarUrl === "string" ? friendFromSub.avatarUrl : null
      } else if (isMe && profile) {
        username =
          typeof profile.username === "string" && profile.username.trim()
            ? profile.username.trim()
            : baseUsername
        displayName =
          typeof profile.displayName === "string" && profile.displayName.trim()
            ? profile.displayName.trim()
            : username
        avatarUrl =
          typeof profile.avatarUrl === "string" && profile.avatarUrl
            ? (profile.avatarUrl as string)
            : null
      } else {
        username = baseUsername
        displayName = baseUsername
        avatarUrl = null
      }

      const initials = (displayName || username || "?")
        .split(/[._-\s]/)
        .filter(Boolean)
        .map((p: string) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()

      return (
        <article
          key={post.id}
          className="glass-panel rounded-2xl border border-white/10 bg-black/60 p-3 text-sm hover:bg-white/[0.03] smooth-transition"
        >
          <div className="flex gap-3">
            <div className="mt-1 flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarUrl}
                  alt={username}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <header className="flex items-center gap-2 text-xs">
                <span className="max-w-[40%] truncate font-semibold text-gray-100">{displayName || username}</span>
                <span className="truncate text-[11px] text-gray-500">@{username}</span>
                <span className="flex-shrink-0 text-[11px] text-gray-500">· {dateLabel || timeLabel}</span>
              </header>

              <div className="space-y-2 text-sm">
                <h2 className="text-sm font-semibold text-gray-100">{titleValue}</h2>
                {captionValue && (
                  <p className="text-[13px] leading-snug text-gray-100 whitespace-pre-line">{captionValue}</p>
                )}
                {imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imageUrl}
                    alt={captionValue || titleValue}
                    className="max-h-80 w-full rounded-2xl border border-white/[0.06] object-cover"
                  />
                )}
              </div>

              <footer className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    className="smooth-transition flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/[0.06] hover:text-gray-100"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 stroke-current"
                      fill="none"
                      strokeWidth="1.6"
                    >
                      <path d="M4 5h16a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1H8.5L4 20V6a1 1 0 0 1 1-1Z" />
                    </svg>
                    <span>{typeof post.commentCount === "number" ? post.commentCount : 0}</span>
                  </button>
                  <button
                    type="button"
                    className="smooth-transition flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/[0.06] hover:text-gray-100"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 stroke-current"
                      fill="none"
                      strokeWidth="1.6"
                    >
                      <path d="M12.1 19.3 12 19.4l-.1-.1C7.1 15.1 4 12.3 4 8.9 4 6.8 5.5 5.3 7.6 5.3c1.3 0 2.6.7 3.4 1.9.8-1.2 2.1-1.9 3.4-1.9 2.1 0 3.6 1.5 3.6 3.6 0 3.4-3.1 6.2-7.9 10.4Z" />
                    </svg>
                    <span>{typeof post.likeCount === "number" ? post.likeCount : 0}</span>
                  </button>
                  <button
                    type="button"
                    className="smooth-transition flex items-center gap-1 rounded-full px-2 py-1 hover:bg-white/[0.06] hover:text-gray-100"
                  >
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="h-4 w-4 stroke-current"
                      fill="none"
                      strokeWidth="1.6"
                    >
                      <path d="M5 12h9" />
                      <path d="M12 5 19 12 12 19" />
                    </svg>
                    <span>Share</span>
                  </button>
                </div>
                <span className="text-[10px] uppercase tracking-wide text-gray-600">Prototype</span>
              </footer>
            </div>
          </div>
        </article>
      )
    })
  }

  return (
    <>
      <section className="glass-panel rounded-2xl border border-white/10 bg-black/60 p-3 text-sm">
        <button
          type="button"
          onClick={() => setComposerOpen(true)}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left text-xs text-gray-400 hover:bg-white/[0.04]"
        >
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
            {user?.email?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1">
            <p className="text-[11px] text-gray-500">Share what you're working on…</p>
          </div>
          <span className="rounded-full bg-accent/90 px-3 py-1 text-[11px] font-semibold text-black">New post</span>
        </button>
      </section>

      <section className="space-y-3">
        {renderPosts()}
      </section>

      {composerOpen && (
        <div className="fixed inset-0 z-40 flex items-start justify-center bg-black/70 px-4 pt-20">
          <div className="glass-panel w-full max-w-lg rounded-2xl border border-white/10 bg-black/90 p-4 text-sm shadow-2xl">
            <div className="mb-3 flex items-start gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
                {user?.email?.[0]?.toUpperCase() ?? "U"}
              </div>
              <div className="flex-1 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold text-gray-100">Create post</p>
                  <button
                    type="button"
                    onClick={() => {
                      if (createPost.isPending) return
                      setComposerOpen(false)
                    }}
                    className="text-[11px] text-gray-500 hover:text-gray-300"
                  >
                    Close
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-[11px] font-medium text-gray-300">
                    <span>Title</span>
                    <span className="text-[10px] text-gray-500">{title.trim().length}/80</span>
                  </label>
                  <input
                    type="text"
                    maxLength={80}
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Give your post a short title"
                    className="w-full rounded-lg border border-white/12 bg-black/70 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-gray-300">Caption</label>
                  <textarea
                    value={caption}
                    onChange={(e) => {
                      setCaption(e.target.value)
                      if (error) setError(null)
                    }}
                    rows={3}
                    placeholder="Add a bit more detail…"
                    className="w-full resize-none rounded-lg border border-white/12 bg-black/70 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/40"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-medium text-gray-300">Image (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const selected = e.target.files?.[0] ?? null
                      setFile(selected)
                      if (error) setError(null)
                      if (selected) {
                        const url = URL.createObjectURL(selected)
                        setPreviewUrl(url)
                      } else {
                        setPreviewUrl("")
                      }
                    }}
                    className="w-full text-[11px] text-gray-300 file:mr-3 file:rounded-full file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-gray-100 hover:file:bg-white/20"
                  />
                </div>

                {error && <p className="text-[11px] text-rose-400">{error}</p>}

                {(caption.trim() || previewUrl) && (
                  <div className="mt-1 rounded-2xl border border-white/10 bg-black/70 p-2 text-[11px]">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Preview</p>
                    {caption.trim() && (
                      <p className="mb-2 whitespace-pre-line text-gray-100">{caption}</p>
                    )}
                    {previewUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={previewUrl}
                        alt="Preview"
                        className="max-h-60 w-full rounded-xl border border-white/[0.08] object-cover"
                      />
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <span className="text-gray-500">
                    {createPost.isPending ? "Posting…" : "Title is required. Image is optional."}
                  </span>
                  <button
                    type="button"
                    disabled={!title.trim() || createPost.isPending}
                    onClick={() => {
                      if (!title.trim() || createPost.isPending) return
                      setError(null)
                      createPost.mutate()
                    }}
                    className="smooth-transition rounded-full bg-accent px-4 py-1.5 text-[11px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {createPost.isPending ? "Posting…" : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}