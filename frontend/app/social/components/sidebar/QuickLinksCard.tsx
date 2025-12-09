"use client"

import Link from "next/link"
import { Bell, Home, Settings, Users } from "lucide-react"

type QuickLink = {
  label: string
  href: string
  note?: string
  icon: React.ReactNode
}

type QuickLinksCardProps = {
  title?: string
  links?: QuickLink[]
}

export function QuickLinksCard({
  title = "Quick links",
  links = [
    { label: "Home", href: "/", icon: <Home className="h-5.5 w-5.5" /> },
    { label: "Friends", href: "/friends", icon: <Users className="h-5.5 w-5.5" />, note: "Soon" },
    { label: "Notifications", href: "/notifications", icon: <Bell className="h-5.5 w-5.5" />, note: "Soon" },
    { label: "Settings", href: "/settings", icon: <Settings className="h-5.5 w-5.5" />, note: "Soon" },
  ],
}: QuickLinksCardProps) {
  return (
    <div className="space-y-3">
      <p className="text-[14px] font-semibold text-gray-100">{title}</p>
      <ul className="space-y-2 text-[14px] text-gray-200">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="smooth-transition flex items-center justify-between gap-3 rounded-xl px-4 py-2.5 hover:bg-white/[0.08]"
            >
              <span className="flex items-center gap-3">
                <span className="text-gray-200">{link.icon}</span>
                <span className="truncate font-semibold">{link.label}</span>
              </span>
              {link.note ? <span className="text-[12.5px] text-gray-500">{link.note}</span> : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
