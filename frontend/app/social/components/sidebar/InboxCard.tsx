import Link from "next/link"
import type { ReactNode } from "react"

type InboxItem = {
  id: string
  label: string
  handle: string
  href?: string
}

type InboxCardProps = {
  title?: string
  descriptionEmpty?: string
  items: InboxItem[]
  footer?: ReactNode
}

export function InboxCard({
  title = "Inbox",
  descriptionEmpty = "No recent DMs yet. Start a chat from your friends list.",
  items,
  footer,
}: InboxCardProps) {
  const hasItems = items.length > 0

  return (
    <div className="space-y-3">
      <p className="text-[13px] font-semibold text-gray-100">{title}</p>
      {!hasItems && <p className="text-[12.5px] text-gray-400">{descriptionEmpty}</p>}
      {hasItems && (
        <ul className="space-y-2 text-[13px] text-gray-200">
          {items.map((item) => {
            const content = (
              <>
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-medium text-gray-100">{item.label}</p>
                  <p className="truncate text-[12px] text-gray-500">@{item.handle}</p>
                </div>
                <span className="text-[12px] text-gray-500">DM</span>
              </>
            )
            return (
              <li
                key={item.id}
                className="smooth-transition flex items-center justify-between gap-3 rounded-xl px-3.5 py-2 hover:bg-white/[0.08]"
              >
                {item.href ? (
                  <Link href={item.href} className="flex w-full items-center justify-between gap-2">
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
      {footer}
    </div>
  )
}
