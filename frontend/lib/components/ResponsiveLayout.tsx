'use client'

import { ReactNode, useState } from 'react'

interface ResponsiveLayoutProps {
  serverRail: ReactNode
  channelRail: ReactNode
  mainContent: ReactNode
  mobileHeaderTitle?: string
}

export function ResponsiveLayout({
  serverRail,
  channelRail,
  mainContent,
  mobileHeaderTitle = 'XO Labs',
}: ResponsiveLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen flex-col bg-transparent text-gray-100 lg:flex-row">
      {/* Mobile header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] bg-sidebar px-4 py-3 lg:hidden">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="smooth-transition flex h-9 w-9 items-center justify-center rounded-lg bg-surfaceSoft text-gray-300 hover:text-accent active:animate-press"
        >
          ☰
        </button>
        <h1 className="text-sm font-bold text-gray-100">{mobileHeaderTitle}</h1>
        <div className="w-9" />
      </div>

      {/* Server rail (hidden on mobile, visible on desktop) */}
      <div className="hidden lg:block">{serverRail}</div>

      {/* Channel rail (collapsible on mobile, fixed on desktop) */}
      <div
        className={`smooth-transition fixed left-0 top-14 bottom-0 z-40 w-72 lg:static lg:top-auto lg:bottom-auto lg:z-auto lg:w-auto ${
          sidebarOpen ? 'block' : 'hidden'
        } lg:block`}
      >
        {channelRail}
      </div>

      {/* Main content (full width on mobile, flex on desktop) */}
      <div className="flex flex-1 flex-col gap-0 lg:gap-4 lg:px-6 lg:py-4 min-h-screen">
        {mainContent}
      </div>

      {/* Mobile overlay backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}
