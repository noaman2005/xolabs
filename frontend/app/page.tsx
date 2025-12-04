'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { LayoutDashboard, Users, Compass, Search as SearchIcon, X, ExternalLink } from 'lucide-react'
import { useApi } from '../lib/hooks/useApi'
import { RequireAuth } from './components/require-auth'
import { useAuth } from '../lib/hooks/useAuth'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

type WorkspaceItem = {
  id: string
  name: string
  initials: string
  imageUrl: string | null
  isOwner: boolean
}

export default function HomePage() {
  const { request } = useApi()
  const queryClient = useQueryClient()
  const router = useRouter()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'dashboard' | 'friends' | 'workspaces' | 'search'>('workspaces')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => request('/workspaces'),
  })

  const { data: friendsData, isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: () => request('/friends'),
  })

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
          {/* Header */}
          {activeSection === 'workspaces' && (
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-50 sm:text-3xl">Workspaces</h1>
                <p className="mt-1 text-sm text-gray-400">Manage your collaboration spaces</p>
              </div>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="smooth-transition rounded-lg bg-green-500 px-3 py-2 text-xs font-medium text-white shadow-md hover:bg-green-400 hover:shadow-lg"
              >
                + Create workspace
              </button>
            </div>
          )}

          {activeSection === 'friends' && (
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-50 sm:text-3xl">Friends</h1>
              <p className="mt-1 text-sm text-gray-400">Add friends by username and see who&apos;s around.</p>
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
              <div className="flex h-full flex-col gap-4">
                <div className="rounded-xl bg-white/[0.03] p-3 text-sm">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Add friend</h2>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="text"
                      value={newFriendUsername}
                      onChange={(e) => setNewFriendUsername(e.target.value)}
                      placeholder="friendusername"
                      className="flex-1 rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      disabled={!newFriendUsername.trim() || addFriend.isPending}
                      onClick={() => addFriend.mutate()}
                      className="smooth-transition rounded-lg bg-accent px-3 py-2 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {addFriend.isPending ? 'Adding…' : 'Add friend'}
                    </button>
                  </div>
                </div>

                <div className="flex-1 rounded-xl bg-white/[0.03] p-3 text-sm">
                  <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Friends list</h2>
                  {friendsLoading && (
                    <div className="flex h-full items-center justify-center text-xs text-gray-500">Loading friends…</div>
                  )}
                  {!friendsLoading && (!Array.isArray(friendsData) || friendsData.length === 0) && (
                    <p className="text-xs text-gray-500">No friends yet. Add someone by username to get started.</p>
                  )}
                  {!friendsLoading && Array.isArray(friendsData) && friendsData.length > 0 && (
                    <div className="space-y-2">
                      {friendsData.map((f: any) => {
                        const presence: 'online' | 'idle' | 'dnd' | 'offline' =
                          f.presence === 'online' || f.presence === 'idle' || f.presence === 'dnd' || f.presence === 'offline'
                            ? f.presence
                            : 'online'
                        const presenceDotClass =
                          presence === 'online'
                            ? 'bg-emerald-400'
                            : presence === 'idle'
                            ? 'bg-amber-400'
                            : presence === 'dnd'
                            ? 'bg-rose-400'
                            : 'bg-gray-500'
                        return (
                          <div
                            key={f.sub}
                            className="flex items-center justify-between gap-3 rounded-lg bg-black/40 px-3 py-2 text-xs text-gray-200"
                          >
                            <div className="flex items-center gap-2">
                              <div className="relative h-7 w-7">
                                {f.avatarUrl ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img
                                    src={f.avatarUrl}
                                    alt={f.displayName || f.username}
                                    className="h-full w-full rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center rounded-full bg-white/[0.08] text-[11px] font-semibold">
                                    {(f.displayName || f.username || '?')
                                      .toString()
                                      .split(' ')
                                      .map((p: string) => p[0])
                                      .join('')
                                      .slice(0, 2)
                                      .toUpperCase()}
                                  </div>
                                )}
                                <span className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border border-black/80 ${presenceDotClass}`} />
                              </div>
                              <div className="flex min-w-0 flex-col">
                                <span className="truncate text-xs font-medium text-gray-100">{f.displayName || f.username}</span>
                                <span className="truncate text-[10px] text-gray-500">@{f.username}</span>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
      className={`nav-item${active ? ' nav-item-active' : ''}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  )
}

type SidebarProps = {
  workspaces: WorkspaceItem[]
  userEmail?: string
  onLogout?: () => void
  isOpen?: boolean
  onClose?: () => void
  activeSection: 'dashboard' | 'friends' | 'workspaces' | 'search'
  onSectionChange: (section: 'dashboard' | 'friends' | 'workspaces' | 'search') => void
  onProfileClick?: () => void
}

function Sidebar({
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
    queryKey: ['profile'],
    queryFn: () => request('/profile'),
  })

  const email = (profile && typeof profile.email === 'string' ? profile.email : userEmail) || 'Guest'
  const displayName =
    (profile && typeof profile.displayName === 'string' && profile.displayName.trim()) || email.split('@')[0]
  const avatarUrl = profile && typeof profile.avatarUrl === 'string' ? profile.avatarUrl : null
  const statusMessage = profile && typeof profile.statusMessage === 'string' ? profile.statusMessage : ''
  const presence: 'online' | 'idle' | 'dnd' | 'offline' =
    profile &&
    (profile.presence === 'online' ||
      profile.presence === 'idle' ||
      profile.presence === 'dnd' ||
      profile.presence === 'offline')
      ? profile.presence
      : 'online'

  const initials = (email || 'XO')
    .split('@')[0]
    .split('.')
    .filter(Boolean)
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const presenceDotClass =
    presence === 'online'
      ? 'bg-emerald-400'
      : presence === 'idle'
      ? 'bg-amber-400'
      : presence === 'dnd'
      ? 'bg-rose-400'
      : 'bg-gray-500'

  return (
    <aside
      className={`glass-sidebar ${
        isOpen ? 'flex' : 'hidden'
      } fixed inset-y-0 left-0 z-40 w-72 flex-col border-b border-white/[0.12] px-4 py-4 lg:static lg:flex lg:w-64 lg:border-b-0 lg:px-6 lg:py-6`}
    >
      {/* Brand logo */}
      <div className="mb-4 flex items-center justify-center">
        <div className="relative h-8 w-8">
          <Image src="/logo.png" alt="XO Labs" fill className="object-contain" />
        </div>
      </div>

      {/* Top Navigation */}
      <div className="mb-6 space-y-2 mt-2 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-300">Dashboard</h2>
          <button
            type="button"
            onClick={onClose}
            className="smooth-transition rounded-lg bg-white/[0.12] p-1.5 text-gray-300 hover:bg-white/[0.18] hover:text-gray-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <NavItem
          icon={<LayoutDashboard className="h-5 w-5" />}
          label="Dashboard"
          active={activeSection === 'dashboard'}
          onClick={() => onSectionChange('dashboard')}
        />
      </div>

      {/* Friends Section */}
      <div className="mb-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Friends</h3>
        <NavItem
          icon={<Users className="h-5 w-5" />}
          label="Friends"
          active={activeSection === 'friends'}
          onClick={() => onSectionChange('friends')}
        />
      </div>

      {/* Workspaces Section */}
      <div className="mb-4 space-y-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workspaces</h3>
        <NavItem
          icon={<Compass className="h-5 w-5" />}
          label="Workspaces"
          active={activeSection === 'workspaces'}
          onClick={() => onSectionChange('workspaces')}
        />
      </div>

      {/* Search */}
      <div className="mb-6">
        <NavItem
          icon={<SearchIcon className="h-5 w-5" />}
          label="Search"
          active={activeSection === 'search'}
          onClick={() => onSectionChange('search')}
        />
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
                {statusMessage || (presence === 'online' ? 'Online' : presence === 'idle' ? 'Idle' : presence === 'dnd' ? 'Do Not Disturb' : 'Offline')}
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
