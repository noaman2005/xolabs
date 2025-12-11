"use client"

import { useRouter } from "next/navigation"
import { CommandPalette } from "./CommandPalette"
import { MessageSquareMore } from "lucide-react"

export function GlobalOverlays() {
  const router = useRouter()
  const openPalette = () => {
    const event = new KeyboardEvent("keydown", { key: "k", ctrlKey: true })
    window.dispatchEvent(event)
  }
  return (
    <>
      <CommandPalette
        onAddProject={() => {
          router.push("/projects")
        }}
      />
      <button
        type="button"
        onClick={openPalette}
        className="fixed right-4 top-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/80 text-gray-100 shadow-lg backdrop-blur hover:border-white/30 hover:text-white active:scale-[0.98]"
        aria-label="Open command palette"
      >
        <MessageSquareMore className="h-5 w-5" />
      </button>
    </>
  )
}
