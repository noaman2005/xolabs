"use client"

import Link from "next/link"

type WorkspaceItem = {
  id: string
  label: string
  initials?: string
  imageUrl?: string | null
  status?: string
}

type WorkspacesCardProps = {
  title?: string
  emptyDescription?: string
  items: WorkspaceItem[]
  itemHref?: (item: WorkspaceItem) => string | null
}

export function WorkspacesCard({
  title = "Workspaces",
  emptyDescription = "Your most active workspaces will appear here.",
  items,
  itemHref,
}: WorkspacesCardProps) {
  const hasItems = items.length > 0

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-gray-100">{title}</p>
      {!hasItems && <p className="text-[12.5px] text-gray-400">{emptyDescription}</p>}
      {hasItems && (
        <ul className="mt-1 space-y-2 text-[13px] text-gray-200">
          {items.map((item) => {
            const href = itemHref ? itemHref(item) : null
            const content = (
              <>
                <div className="flex items-center gap-3">
                  <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-white/[0.12] text-[12px] font-semibold">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.label} className="h-full w-full object-cover" />
                    ) : (
                      <>{item.initials ?? (item.label || "W").slice(0, 2).toUpperCase()}</>
                    )}
                  </span>
                  <p className="truncate text-[13px] font-medium text-gray-100">{item.label}</p>
                </div>
                <span className="text-[12px] text-gray-500">{item.status ?? "Active"}</span>
              </>
            )
            return (
              <li
                key={item.id}
                className="smooth-transition flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 hover:bg-white/[0.08]"
              >
                {href ? (
                  <Link href={href} className="flex w-full items-center justify-between gap-2">
                    {content}
                  </Link>
                ) : (
                  content
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
