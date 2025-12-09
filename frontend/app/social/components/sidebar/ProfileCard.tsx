"use client"

type ProfileCardProps = {
  initials: string
  displayName: string
  handle: string
  avatarUrl?: string | null
  presence?: string
  statusText?: string | null
}

export function ProfileCard({
  initials,
  displayName,
  handle,
  avatarUrl,
  presence = "Active",
  statusText,
}: ProfileCardProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-semibold text-gray-100">{displayName}</p>
          <p className="truncate text-[11px] text-gray-500">@{handle}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span>{presence}</span>
        </div>
        {statusText && <span className="truncate text-[10px] text-gray-500">{statusText}</span>}
      </div>

      <div className="mt-1 flex gap-2 text-[11px]">
        <button
          type="button"
          className="smooth-transition flex-1 rounded-full border border-white/14 bg-white/[0.04] px-3 py-1 font-semibold text-gray-100 hover:border-accent hover:text-white"
        >
          Edit profile
        </button>
        <button
          type="button"
          className="smooth-transition flex-1 rounded-full border border-white/14 bg-white/[0.02] px-3 py-1 font-semibold text-gray-200 hover:border-accent hover:text-white"
        >
          Open profile
        </button>
      </div>
    </div>
  )
}
