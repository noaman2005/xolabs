'use client'

import { ReactNode } from 'react'

interface ResponsiveFeaturePanelProps {
  title: string
  subtitle?: string
  children: ReactNode
  actions?: ReactNode
}

export function ResponsiveFeaturePanel({
  title,
  subtitle,
  children,
  actions,
}: ResponsiveFeaturePanelProps) {
  return (
    <section className="glass-panel smooth-transition flex flex-1 flex-col rounded-0 lg:rounded-3xl px-4 lg:px-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <h2 className="text-lg lg:text-xl font-bold text-gray-100">{title}</h2>
          {subtitle && <p className="text-xs lg:text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">{children}</div>
    </section>
  )
}
