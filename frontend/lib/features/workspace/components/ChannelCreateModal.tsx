"use client"

import { CHANNEL_TYPE_META, ChannelType } from "../channelTypes"

export type ChannelCreateModalProps = {
  onClose: () => void
  channelName: string
  setChannelName: (value: string) => void
  channelType: ChannelType
  setChannelType: (value: ChannelType) => void
  onCreate: () => void
  isSubmitting: boolean
}

export function ChannelCreateModal({
  onClose,
  channelName,
  setChannelName,
  channelType,
  setChannelType,
  onCreate,
  isSubmitting,
}: ChannelCreateModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 px-6 py-6 text-sm text-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Create Channel</h3>
            <p className="text-xs text-gray-500">Choose a type and give it a name to get started.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500">Channel type</div>
          <div className="space-y-2">
            {(Object.keys(CHANNEL_TYPE_META) as ChannelType[]).map((type) => {
              const meta = CHANNEL_TYPE_META[type]
              const isActive = channelType === type
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => setChannelType(type)}
                  className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left smooth-transition ${
                    isActive
                      ? 'border-green-500/60 bg-white/10 text-white'
                      : 'border-white/10 bg-white/5 text-gray-300 hover:border-white/30'
                  }`}
                >
                  <div className={`mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive ? 'bg-green-500/20 text-green-300' : 'bg-white/5 text-gray-400'
                  }`}>
                    <span>{meta.icon}</span>
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{meta.label}</div>
                    <div className="text-xs text-gray-500">{meta.description}</div>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Channel name
            </label>
            <input
              value={channelName}
              onChange={(e) => setChannelName(e.target.value)}
              placeholder="e.g. roadmap or design-sync"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="btn-glass px-4 py-2 text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onCreate}
              disabled={!channelName.trim() || isSubmitting}
              className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating…' : 'Create Channel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
