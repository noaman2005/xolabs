'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useQuery } from '@tanstack/react-query'
import { LayoutDashboard, Users, Compass, Search as SearchIcon, X } from 'lucide-react'
import { useApi } from '../lib/hooks/useApi'
import { RequireAuth } from './components/require-auth'
import { useAuth } from '../lib/hooks/useAuth'
import { useState } from 'react'

type WorkspaceItem = {
  id: string
  name: string
  initials: string
}

export default function HomePage() {
  const { request } = useApi()
  const { user, logout } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<'dashboard' | 'friends' | 'workspaces' | 'search'>('workspaces')
  const { data, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => request('/workspaces'),
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
          return { id, name, initials }
        })
        .filter(Boolean) as WorkspaceItem[])
    : []

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
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-50 sm:text-3xl">Workspaces</h1>
              <p className="mt-1 text-sm text-gray-400">Manage your collaboration spaces</p>
            </div>
          </div>

          {/* Workspaces Grid (current only section) */}
          <div className="flex-1 overflow-y-auto">
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
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {workspaces.map((ws) => (
                  <div
                    key={ws.id}
                    className="group smooth-transition flex flex-col justify-between rounded-2xl border border-white/[0.15] bg-white/[0.1] p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-3xl hover:border-white/[0.2] hover:bg-white/[0.12]"
                  >
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent/80 to-accent-soft/70 text-sm font-semibold text-white shadow-[0_0_18px_rgba(88,101,242,0.5)]">
                        {ws.initials}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-50 group-hover:text-green-300 smooth-transition">
                          {ws.name}
                        </h3>
                        <p className="text-xs text-gray-500">Workspace</p>
                      </div>
                    </div>
                    <Link
                      href={`/dashboard/${ws.id}`}
                      className="smooth-transition rounded-lg bg-white/[0.12] px-3 py-2 text-xs text-gray-200 hover:bg-white/[0.18] hover:text-gray-100"
                    >
                      Open
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
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
}

function Sidebar({
  workspaces,
  userEmail,
  onLogout,
  isOpen,
  onClose,
  activeSection,
  onSectionChange,
}: SidebarProps) {
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
      <div className="mb-6 space-y-2">
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
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.12] text-[11px] font-semibold">
              {ws.initials}
            </span>
            <span className="truncate">{ws.name}</span>
          </Link>
        ))}
      </div>

      {/* Profile & logout */}
      <div className="mt-4 border-t border-white/10 pt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
              {(userEmail || 'XO')
                .split('@')[0]
                .split('.')
                .filter(Boolean)
                .map((part) => part[0])
                .join('')
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-xs text-gray-200">{userEmail || 'Guest'}</span>
              <span className="text-[10px] text-gray-500">Signed in</span>
            </div>
          </div>
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
