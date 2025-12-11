'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/hooks/useApi'
import { RequireAuth } from './components/require-auth'
import { useAuth } from '../lib/hooks/useAuth'
import { useEffect, useState } from 'react'
import { Sidebar, type HomeSection } from './components/HomeSidebar'
import { HomeFriendsPanel } from './components/HomeFriendsPanel'
import { useRouter, useSearchParams } from 'next/navigation'
import { Rocket, Users, Sparkles, ArrowUpRight } from 'lucide-react'
import { MessageSquareMore, PenLine, FlaskConical, PlusCircle } from 'lucide-react'

export type WorkspaceItem = {
  id: string
  name: string
  initials: string
  imageUrl: string | null
  isOwner: boolean
  ownerEmail?: string | null
  members?: string[] | null
}

export default function HomePage() {
  const { request } = useApi()
  const queryClient = useQueryClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const sectionParam = searchParams?.get('section')
  const initialSection: HomeSection =
    sectionParam === 'friends' || sectionParam === 'workspaces' || sectionParam === 'dashboard'
      ? (sectionParam as HomeSection)
      : 'dashboard'
  const [activeSection, setActiveSection] = useState<HomeSection>(initialSection)
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  useEffect(() => {
    const nextSection: HomeSection =
      sectionParam === 'friends' || sectionParam === 'workspaces' || sectionParam === 'dashboard'
        ? (sectionParam as HomeSection)
        : 'dashboard'
    setActiveSection(nextSection)
  }, [sectionParam])
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => request('/workspaces'),
  })

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => request('/friends'),
  })

  const { data: projectsData, isLoading: projectsLoading, isError: projectsError } = useQuery({
    queryKey: ['projects-dashboard'],
    queryFn: () => fetch('/api/projects', { credentials: 'include' }).then((r) => r.json()),
  })

  const { data: socialFeed, isLoading: socialLoading, isError: socialError } = useQuery({
    queryKey: ['social-feed'],
    queryFn: () => request('/social/posts'),
  })

  const projectsArray: any[] = Array.isArray(projectsData)
    ? projectsData
    : Array.isArray((projectsData as any)?.items)
    ? (projectsData as any).items
    : []
  const socialArray: any[] = Array.isArray(socialFeed)
    ? socialFeed
    : Array.isArray((socialFeed as any)?.items)
    ? (socialFeed as any).items
    : []

  const workspaces: WorkspaceItem[] = Array.isArray(data)
    ? (data
        .map((ws: any) => {
          const id = ws.id ?? (typeof ws.SK === 'string' ? ws.SK.replace('WORKSPACE#', '') : undefined)
          if (!id) return null
          const name = (ws.name as string) ?? 'Untitled'
          const initials = name
            .split(' ')
            .map((p) => p[0])
            .join('')
            .slice(0, 2)
            .toUpperCase()
          const imageUrl = typeof ws.imageUrl === 'string' ? ws.imageUrl : null
          const ownerEmail = typeof ws.ownerEmail === 'string' ? ws.ownerEmail : null
          const isOwner = !!ownerEmail && ownerEmail === user?.email
          return { id, name, initials, imageUrl, isOwner }
        })
        .filter(Boolean) as WorkspaceItem[])
    : []

  const workspacesCount = workspaces.length
  const friendsCount = Array.isArray(friendsData) ? friendsData.length : 0
  const recentProjects = projectsArray.slice(0, 4)
  const recentSocial = socialArray.slice(0, 4)

  const createWorkspace = useMutation({
    mutationFn: async (name: string) => {
      return request('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: (created: any) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setCreateModalOpen(false)
      setNewWorkspaceName('')
      const id = created?.id ?? (typeof created?.SK === 'string' ? created.SK.replace('WORKSPACE#', '') : undefined)
      if (id) {
        router.push(`/dashboard/${id}`)
      }
    },
  })

  const renameWorkspace = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return request(`/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const deleteWorkspace = useMutation({
    mutationFn: async (id: string) => {
      return request(`/workspaces/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const leaveWorkspace = useMutation({
    mutationFn: async (id: string) => {
      return request(`/workspaces/${id}/leave`, {
        method: 'POST',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const [newFriendUsername, setNewFriendUsername] = useState('')
  const [addFriendError, setAddFriendError] = useState<string | null>(null)

  const addFriend = useMutation({
    mutationFn: async () => {
      const username = newFriendUsername.trim().toLowerCase().replace(/\s+/g, '')
      if (!username) return
      return request('/friends', {
        method: 'POST',
        body: JSON.stringify({ username }),
      })
    },
    onSuccess: () => {
      setNewFriendUsername('')
      setAddFriendError(null)
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
    onError: (err: any) => {
      const message = typeof err?.message === 'string' ? err.message : ''
      if (message.toLowerCase().includes('not found')) {
        setAddFriendError('User not found')
      } else if (message.toLowerCase().includes('already friends')) {
        setAddFriendError('You are already friends with this user')
      } else if (message.toLowerCase().includes('cannot add yourself')) {
        setAddFriendError('You cannot add yourself')
      } else {
        setAddFriendError('Could not add friend. Please try again.')
      }
    },
  })

  const removeFriend = useMutation({
    mutationFn: async (username: string) => {
      const safeUsername = username.trim().toLowerCase().replace(/\s+/g, '')
      if (!safeUsername) return
      return request(`/friends/${safeUsername}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friends'] })
    },
  })

  return (
    <RequireAuth>
      <main className="flex min-h-screen flex-col bg-gradient-to-br from-black via-neutral-950 to-black text-gray-100 lg:flex-row">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="smooth-transition flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.06] text-gray-200 hover:bg-white/[0.12]"
          >
            ☰
          </button>
          <div className="flex items-center gap-2">
            <div className="relative h-7 w-7 overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <Image src="/logo.png" alt="XO Labs" fill className="object-contain" />
            </div>
            <span className="text-sm font-semibold text-gray-100">XO Labs</span>
          </div>
          <div className="w-9" />
        </div>

        {/* Left Sidebar */}
        <Sidebar
          workspaces={workspaces}
          userEmail={user?.email ?? ''}
          onLogout={logout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          onProfileClick={() => router.push('/profile')}
        />

        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <div className="flex flex-1 flex-col overflow-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
          {/* Hero / quick actions (dashboard only) */}
          {activeSection === 'dashboard' && (
            <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-indigo-600/20 via-purple-600/15 to-sky-500/15 px-4 py-4 shadow-inner">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-400">Dashboard</p>
                  <h1 className="text-2xl font-bold text-gray-50 sm:text-3xl">Welcome back{user?.email ? `, ${user.email}` : ''}</h1>
                  <p className="mt-1 text-sm text-gray-300">
                    Jump into a workspace, invite friends, or head to projects.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setCreateModalOpen(true)}
                    className="smooth-transition inline-flex items-center gap-2 rounded-lg bg-green-500 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-green-400"
                  >
                    <Sparkles className="h-4 w-4" /> Create workspace
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/projects')}
                    className="smooth-transition inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-100 hover:border-white/30"
                  >
                    <Rocket className="h-4 w-4" /> Projects
                  </button>
                  <button
                    type="button"
                    onClick={() => router.push('/social')}
                    className="smooth-transition inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-gray-100 hover:border-white/30"
                  >
                    <Users className="h-4 w-4" /> Social
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">Workspaces</p>
                  <p className="text-2xl font-semibold text-white">{workspacesCount}</p>
                  <p className="text-[11px] text-gray-500">Owned or shared</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">Friends</p>
                  <p className="text-2xl font-semibold text-white">{friendsCount}</p>
                  <p className="text-[11px] text-gray-500">Connected people</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                  <p className="text-[11px] uppercase tracking-[0.12em] text-gray-400">Quick links</p>
                  <div className="mt-2 flex gap-2 text-[12px] text-gray-200">
                    <Link href="/projects" className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 hover:bg-white/15">
                      Projects <ArrowUpRight className="h-3 w-3" />
                    </Link>
                    <Link href="/social" className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 hover:bg-white/15">
                      Social <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Quick actions */}
              <div className="mt-4 grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => router.push('/projects')}
                  className="smooth-transition flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-gray-100 hover:border-white/20 hover:bg-white/10"
                >
                  <PlusCircle className="h-4 w-4 text-emerald-300" />
                  <div>
                    <p className="font-semibold">Add New Project</p>
                    <p className="text-[11px] text-gray-400">Create and showcase a build</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/social')}
                  className="smooth-transition flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-gray-100 hover:border-white/20 hover:bg-white/10"
                >
                  <PenLine className="h-4 w-4 text-sky-300" />
                  <div>
                    <p className="font-semibold">Create New Post</p>
                    <p className="text-[11px] text-gray-400">Share updates with friends</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/social')}
                  className="smooth-transition flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-gray-100 hover:border-white/20 hover:bg-white/10"
                >
                  <MessageSquareMore className="h-4 w-4 text-amber-300" />
                  <div>
                    <p className="font-semibold">Open Messages</p>
                    <p className="text-[11px] text-gray-400">Jump into conversations</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="smooth-transition flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-left text-sm text-gray-100 hover:border-white/20 hover:bg-white/10"
                >
                  <FlaskConical className="h-4 w-4 text-purple-300" />
                  <div>
                    <p className="font-semibold">Go to Workspace</p>
                    <p className="text-[11px] text-gray-400">Browse your spaces</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Section header based on tab */}
          {activeSection === 'workspaces' && (
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-50 sm:text-2xl">Your workspaces</h2>
                <p className="text-sm text-gray-400">Recent spaces you own or collaborate in</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="smooth-transition rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white shadow hover:bg-green-400"
              >
                + New workspace
              </button>
            </div>
          )}
          {activeSection === 'friends' && (
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-50 sm:text-2xl">Friends</h2>
              <p className="text-sm text-gray-400">Add friends by username and see who's around.</p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {activeSection === 'workspaces' && (
              <>
                {isLoading && (
                  <div className="flex h-full items-center justify-center text-sm text-gray-500">Loading workspaces…</div>
                )}
                {!isLoading && workspaces.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm text-gray-400">No workspaces yet.</p>
                    <p className="max-w-xs text-xs text-gray-500">Create one from the dashboard to see it here.</p>
                  </div>
                )}
                {!isLoading && workspaces.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        className="group smooth-transition flex flex-col items-center rounded-2xl px-1.5 py-2.5 text-center hover:bg-white/[0.04]"
                      >
                        <Link
                          href={`/dashboard/${ws.id}`}
                          className="smooth-transition mb-1.5 flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-accent/80 to-accent-soft/70 text-base font-semibold text-white shadow-[0_0_10px_rgba(0,0,0,0.6)] hover:shadow-[0_0_16px_rgba(0,0,0,0.9)]"
                        >
                          {ws.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={ws.imageUrl} alt={ws.name} className="h-full w-full object-cover" />
                          ) : (
                            <span>{ws.initials}</span>
                          )}
                        </Link>
                        <p className="truncate text-xs font-semibold text-gray-50 group-hover:text-green-300 smooth-transition">
                          {ws.name}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeSection === 'friends' && (
              <div className="flex flex-col gap-4 lg:flex-row">
                <div className="lg:w-2/3">
                  <HomeFriendsPanel
                    workspaces={workspaces}
                    friendsData={friendsData}
                    friendsLoading={friendsLoading}
                    addFriend={addFriend}
                    removeFriend={removeFriend}
                    newFriendUsername={newFriendUsername}
                    setNewFriendUsername={setNewFriendUsername}
                    addFriendError={addFriendError}
                    setAddFriendError={setAddFriendError}
                  />
                </div>
              </div>
            )}

            {activeSection === 'dashboard' && (
              <div className="grid gap-4 lg:grid-cols-3">
                {/* Recent Projects */}
                <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Recent Projects</p>
                      <h3 className="text-lg font-semibold text-gray-100">Latest builds</h3>
                    </div>
                    <Link
                      href="/projects"
                      className="text-xs text-accent underline decoration-accent/50 underline-offset-4 hover:text-accent-foreground"
                    >
                      View all
                    </Link>
                  </div>
                  {projectsLoading ? (
                    <p className="text-sm text-gray-500">Loading projects…</p>
                  ) : projectsError ? (
                    <p className="text-sm text-rose-400">Could not load projects.</p>
                  ) : recentProjects.length === 0 ? (
                    <p className="text-sm text-gray-500">No projects yet. Create one to get started.</p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2">
                      {recentProjects.map((proj: any) => (
                        <div
                          key={proj.id}
                          className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-xs text-gray-100 shadow-sm transition hover:border-accent/60 hover:bg-white/[0.06] hover:shadow-lg hover:shadow-accent/10"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <p className="truncate text-sm font-semibold text-gray-100 transition group-hover:text-accent">
                                {proj.title}
                              </p>
                              <p className="line-clamp-2 text-[11px] text-gray-400">{proj.description}</p>
                              {proj.category ? (
                                <span className="inline-flex rounded-full bg-white/10 px-2 py-1 text-[10px] text-gray-100">
                                  {proj.category}
                                </span>
                              ) : null}
                            </div>
                            {proj.status ? (
                              <span
                                className={`rounded-full px-2 py-1 text-[10px] ${
                                  proj.status === 'Completed'
                                    ? 'bg-emerald-500/20 text-emerald-200'
                                    : 'bg-amber-500/20 text-amber-100'
                                }`}
                              >
                                {proj.status}
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-gray-300">
                            {(proj.techStack || []).slice(0, 3).map((t: string) => (
                              <span key={t} className="rounded-full bg-accent/15 px-2 py-1 text-accent-foreground">
                                {t}
                              </span>
                            ))}
                            {(proj.tags || []).slice(0, 2).map((tag: string) => (
                              <span key={tag} className="rounded-full bg-white/10 px-2 py-1 text-[10px] text-gray-100">
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-accent">
                            {proj.projectUrl ? <span className="inline-flex items-center gap-1">Live</span> : null}
                            {proj.githubUrl ? <span className="inline-flex items-center gap-1">GitHub</span> : null}
                            {typeof proj.progress === 'number' ? (
                              <span className="text-[10px] text-gray-400">Progress {proj.progress}%</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Social Activity + Mini Graph */}
                <div className="space-y-4">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Recent Social</p>
                        <h3 className="text-lg font-semibold text-gray-100">Activity feed</h3>
                      </div>
                      <Link
                        href="/social"
                        className="text-xs text-accent underline decoration-accent/50 underline-offset-4 hover:text-accent-foreground"
                      >
                        Open
                      </Link>
                    </div>
                    {socialLoading ? (
                      <p className="text-sm text-gray-500">Loading activity…</p>
                    ) : socialError ? (
                      <p className="text-sm text-rose-400">Could not load activity.</p>
                    ) : recentSocial.length === 0 ? (
                      <p className="text-sm text-gray-500">No posts yet. Share something!</p>
                    ) : (
                      <div className="space-y-3 text-sm">
                        {recentSocial.map((post: any) => (
                          <div
                            key={post.id}
                            className="rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2"
                          >
                            <p className="font-semibold text-gray-100 truncate">{post.title || 'Untitled post'}</p>
                            {post.caption ? (
                              <p className="line-clamp-2 text-[12px] text-gray-400">{post.caption}</p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Snapshot</p>
                        <h3 className="text-lg font-semibold text-gray-100">Engagement</h3>
                      </div>
                    </div>
                    <div className="h-24 rounded-lg bg-gradient-to-r from-accent/20 via-emerald-400/20 to-sky-400/20">
                      {/* Placeholder mini-graph block */}
                    </div>
                    <div className="mt-3 flex justify-between text-[11px] text-gray-400">
                      <span>Views</span>
                      <span>Posts</span>
                      <span>Messages</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {createModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="glass-panel w-full max-w-sm rounded-2xl border border-white/10 bg-black/80 p-5 shadow-xl">
            <h2 className="mb-2 text-sm font-semibold text-gray-100">Create workspace</h2>
            <p className="mb-4 text-xs text-gray-500">Give your new workspace a short, memorable name.</p>
            <input
              type="text"
              value={newWorkspaceName}
              onChange={(e) => setNewWorkspaceName(e.target.value)}
              placeholder="Workspace name"
              className="mb-4 w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-green-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  if (createWorkspace.isPending) return
                  setCreateModalOpen(false)
                  setNewWorkspaceName('')
                }}
                className="smooth-transition rounded-lg bg-white/[0.04] px-3 py-1.5 text-gray-300 hover:bg-white/[0.08]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!newWorkspaceName.trim() || createWorkspace.isPending}
                onClick={() => {
                  if (!newWorkspaceName.trim() || createWorkspace.isPending) return
                  createWorkspace.mutate(newWorkspaceName.trim())
                }}
                className="smooth-transition rounded-lg bg-green-500 px-3 py-1.5 text-white disabled:cursor-not-allowed disabled:bg-green-500/40"
              >
                {createWorkspace.isPending ? 'Creating…' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

    </RequireAuth>
  )
}
