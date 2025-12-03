"use client"

export type InviteMemberModalProps = {
  onClose: () => void
  inviteEmail: string
  setInviteEmail: (value: string) => void
  onInvite: () => void
  isSubmitting: boolean
}

export function InviteMemberModal({
  onClose,
  inviteEmail,
  setInviteEmail,
  onInvite,
  isSubmitting,
}: InviteMemberModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="glass-panel w-full max-w-md rounded-3xl border border-white/10 px-6 py-6 text-sm text-gray-200">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Invite member</h3>
            <p className="text-xs text-gray-500">Send an email invite to join this workspace.</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Email address
            </label>
            <input
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@example.com"
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
              onClick={onInvite}
              disabled={!inviteEmail.trim() || isSubmitting}
              className="btn-accent px-5 py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Sending…' : 'Send Invite'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
