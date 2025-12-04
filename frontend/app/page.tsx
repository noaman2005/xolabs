'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../lib/hooks/useApi'
import { RequireAuth } from './components/require-auth'
import { useAuth } from '../lib/hooks/useAuth'
import { useState } from 'react'
import { Sidebar, type HomeSection } from './components/HomeSidebar'
import { HomeFriendsPanel } from './components/HomeFriendsPanel'
import { useRouter } from 'next/navigation'

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
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<HomeSection>('workspaces')
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
              <HomeFriendsPanel
                workspaces={workspaces}
                friendsData={friendsData}
                friendsLoading={friendsLoading}
                newFriendUsername={newFriendUsername}
                setNewFriendUsername={setNewFriendUsername}
                addFriendError={addFriendError}
                setAddFriendError={setAddFriendError}
                addFriend={addFriend as any}
                removeFriend={removeFriend as any}
              />
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
