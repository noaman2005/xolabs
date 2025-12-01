"use client"

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import Link from 'next/link'
import { useApi } from '../../lib/hooks/useApi'
import { RequireAuth } from '../components/require-auth'
import { useAuth } from '../../lib/hooks/useAuth'

export default function DashboardPage() {
  const { request } = useApi()
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const { user, logout } = useAuth()
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => request('/workspaces'),
  })

  const createMutation = useMutation({
    mutationFn: async (workspaceName: string) => {
      return request('/workspaces', {
        method: 'POST',
        body: JSON.stringify({ name: workspaceName }),
      })
    },
    onSuccess: () => {
      setName('')
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const renameMutation = useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      return request(`/workspaces/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: newName }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return request(`/workspaces/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  return (
    <RequireAuth>
      <div className="flex min-h-screen bg-transparent text-gray-100">
        {/* Sidebar 1: Workspaces */}
        <aside className="glass-sidebar smooth-transition flex w-24 flex-col items-center justify-between px-3 py-4">
          {/* Logo */}
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/30 to-green-600/20 ring-1 ring-green-500/40 glow-green">
              <span className="text-lg font-bold text-green-400">X</span>
            </div>

            {/* Workspace icons */}
            <div className="flex flex-col gap-3">
              {isLoading && (
                <div className="text-[10px] text-gray-500 text-center">Loading…</div>
              )}
              {!isLoading && Array.isArray(data) && data.length === 0 && (
                <div className="text-[10px] text-gray-500 text-center">No workspaces</div>
              )}
              {!isLoading &&
                Array.isArray(data) &&
                data.map((ws: any) => {
                  const id = ws.id ?? (typeof ws.SK === 'string' ? ws.SK.replace('WORKSPACE#', '') : undefined)
                  if (!id) return null
                  const name = (ws.name as string) ?? 'Untitled'
                  const initials = name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()

                  return (
                    <Link
                      key={ws.SK ?? ws.id}
                      href={`/dashboard/${id}`}
                      className="smooth-transition group flex h-12 w-12 items-center justify-center rounded-2xl card-glass text-[11px] font-semibold text-gray-200 glow-green-hover"
                      title={name}
                    >
                      <span className="group-hover:text-green-400">{initials}</span>
                    </Link>
                  )
                })}
            </div>
          </div>

          {/* Create workspace button */}
          <button
            onClick={() => {
              const nextName = window.prompt('New workspace name')
              if (!nextName || !nextName.trim() || createMutation.isPending) return
              createMutation.mutate(nextName.trim())
            }}
            className="smooth-transition flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-green-500/60 to-green-600/40 text-xl font-bold text-black ring-1 ring-green-500/50 glow-green hover:from-green-500 hover:to-green-600 hover:glow-green"
            title="Create workspace"
          >
            +
          </button>
        </aside>

        {/* Main content */}
        <div className="flex min-h-screen flex-1 flex-col gap-4 px-6 py-4">
          {/* Top bar */}
          <header className="glass-topbar smooth-transition flex h-14 items-center justify-between rounded-2xl px-6">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-100">Workspaces</h1>
              <span className="text-xs text-gray-500">Organize your collaboration</span>
            </div>
            <div className="flex items-center gap-4">
              {user && <span className="text-sm text-gray-400">{user.email}</span>}
              <button
                onClick={logout}
                className="btn-glass px-4 py-2 text-sm text-gray-300"
              >
                Logout
              </button>
            </div>
          </header>

          {/* Main content area */}
          <main className="glass-panel smooth-transition flex flex-1 flex-col rounded-3xl px-8 py-8">
            {/* Header with create form */}
            <div className="mb-8 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-100">Your Workspaces</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Create and manage workspaces for your teams and projects.
                </p>
              </div>
              <form
                className="flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!name.trim() || createMutation.isPending) return
                  createMutation.mutate(name.trim())
                }}
              >
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Workspace name"
                  className="smooth-transition rounded-lg bg-white/[0.06] border border-white/[0.1] px-4 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                />
                <button
                  type="submit"
                  className="btn-accent px-6 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!name.trim() || createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating…' : 'Create'}
                </button>
              </form>
            </div>

            {/* Workspaces grid */}
            <div className="flex-1 overflow-y-auto">
              {isLoading && (
                <div className="flex h-full items-center justify-center">
                  <div className="text-gray-500">Loading workspaces…</div>
                </div>
              )}
              {!isLoading && (!data || data.length === 0) && (
                <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                  <div className="text-lg font-semibold text-gray-300">No workspaces yet</div>
                  <p className="max-w-xs text-sm text-gray-500">
                    Create your first workspace to start collaborating with your team.
                  </p>
                </div>
              )}
              {!isLoading && Array.isArray(data) && data.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {data.map((ws: any) => {
                    const id = ws.id ?? (typeof ws.SK === 'string' ? ws.SK.replace('WORKSPACE#', '') : undefined)
                    const wsName = ws.name ?? 'Untitled workspace'
                    if (!id) return null

                    return (
                      <div
                        key={ws.SK ?? ws.id}
                        className="group smooth-transition card-glass flex flex-col justify-between p-6 hover:bg-white/[0.08] hover:border-green-500/30"
                      >
                        <div className="mb-4 space-y-2">
                          <Link
                            href={`/dashboard/${id}`}
                            className="block text-lg font-semibold text-gray-100 group-hover:text-green-400 smooth-transition"
                          >
                            {wsName}
                          </Link>
                          <p className="text-xs text-gray-600 break-all">ID: {id.slice(0, 8)}…</p>
                        </div>
                        <div className="flex gap-2 text-xs">
                          <button
                            onClick={() => {
                              const current = (ws.name as string) ?? ''
                              const nextName = window.prompt('Rename workspace', current)
                              if (!nextName || !nextName.trim()) return
                              if (renameMutation.isPending) return
                              renameMutation.mutate({ id, newName: nextName.trim() })
                            }}
                            className="smooth-transition flex-1 rounded-lg bg-white/[0.06] border border-white/[0.1] px-3 py-2 text-gray-400 hover:bg-white/[0.1] hover:text-gray-300"
                          >
                            Rename
                          </button>
                          <button
                            onClick={() => {
                              if (deleteMutation.isPending) return
                              if (!window.confirm('Delete this workspace and all its channels/messages?')) return
                              deleteMutation.mutate(id)
                            }}
                            className="smooth-transition rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </RequireAuth>
  )
}
