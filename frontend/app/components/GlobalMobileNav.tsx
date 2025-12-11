"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { LayoutDashboard, FlaskConical, Users, Rocket, UserRound } from "lucide-react"

export function GlobalMobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const section = searchParams?.get("section")

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 flex items-center justify-around border-t border-white/10 bg-black/85 px-3 py-3 backdrop-blur lg:hidden">
      <Link
        href="/"
        className={`smooth-transition flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
          pathname === "/" && !section ? "bg-white text-black shadow" : "text-gray-300 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <LayoutDashboard className="h-5 w-5" />
        <span>Home</span>
      </Link>

      <Link
        href="/?section=workspaces"
        className={`smooth-transition flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
          pathname === "/" && section === "workspaces" ? "bg-white text-black shadow" : "text-gray-300 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <FlaskConical className="h-5 w-5" />
        <span>Work</span>
      </Link>

      <Link
        href="/?section=friends"
        className={`smooth-transition flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
          pathname === "/" && section === "friends" ? "bg-white text-black shadow" : "text-gray-300 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <Users className="h-5 w-5" />
        <span>Friends</span>
      </Link>

      <Link
        href="/projects"
        className={`smooth-transition flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
          pathname?.startsWith("/projects") ? "bg-white text-black shadow" : "text-gray-300 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <Rocket className="h-5 w-5" />
        <span>Projects</span>
      </Link>

      <Link
        href="/profile"
        className={`smooth-transition flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-semibold ${
          pathname?.startsWith("/profile") ? "bg-white text-black shadow" : "text-gray-300 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <UserRound className="h-5 w-5" />
        <span>Profile</span>
      </Link>
    </nav>
  )
}
