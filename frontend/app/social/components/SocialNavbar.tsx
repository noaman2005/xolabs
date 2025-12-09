"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export function SocialNavbar() {
  const pathname = usePathname()

  const navItems = [
    { href: "/social", label: "Home" },
    { href: "/social/messages", label: "Messages" },
    { href: "/social/create", label: "Create" },
    { href: "/profile", label: "Profile" },
  ] as const

  return (
    <header className="sticky top-0 z-30 flex flex-col gap-2 border-b border-white/10 bg-black/90/80 backdrop-blur">
      <nav className="glass-panel mx-auto flex w-full max-w-3xl gap-2 rounded-full border border-white/10 bg-black/70 p-1 text-xs">
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`smooth-transition flex-1 rounded-full px-3 py-1.5 text-center font-medium ${
                active
                  ? "bg-white text-black shadow-sm"
                  : "text-gray-400 hover:bg-white/[0.06] hover:text-gray-100"
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
