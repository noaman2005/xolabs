"use client"

import { useEffect, useMemo, useState } from "react"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "cmdk"
import { useRouter } from "next/navigation"
import { Plus, Search, NotebookPen, Home, MessageCircle, User, Pin } from "lucide-react"
import { useActivity } from "./ActivityProvider"

type PaletteAction = {
  id: string
  label: string
  hint?: string
  icon: React.ComponentType<{ className?: string }>
  onSelect: () => void
}

export function CommandPalette({ onAddProject }: { onAddProject: () => void }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const { push } = useActivity()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    window.addEventListener("keydown", down)
    return () => window.removeEventListener("keydown", down)
  }, [])

  const actions: PaletteAction[] = useMemo(
    () => [
      { id: "home", label: "Go to Home", icon: Home, onSelect: () => router.push("/") },
      { id: "social", label: "Open Social", icon: MessageCircle, onSelect: () => router.push("/social") },
      { id: "profile", label: "Open Profile", icon: User, onSelect: () => router.push("/profile") },
      { id: "projects", label: "Open Projects", icon: NotebookPen, onSelect: () => router.push("/projects") },
      { id: "add-project", label: "Add Project", icon: Plus, onSelect: () => onAddProject() },
      {
        id: "pin-tip",
        label: "Tip: Pin/unpin projects",
        hint: "Use card pin buttons",
        icon: Pin,
        onSelect: () => push("Use the pin button on any project card to feature it."),
      },
    ],
    [onAddProject, push, router]
  )

  return (
    <>
      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-28 right-4 z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/10 bg-black/90 shadow-2xl backdrop-blur">
            <Command aria-label="Command Palette">
              <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <CommandInput placeholder="Type a command or page..." />
              </div>
              <CommandEmpty className="p-3 text-sm text-gray-400">No results.</CommandEmpty>
              <CommandGroup heading="Navigate" className="px-1 py-1 text-xs text-gray-400">
                {actions.map((action) => {
                  const Icon = action.icon
                  return (
                    <CommandItem
                      key={action.id}
                      onSelect={() => {
                        setOpen(false)
                        action.onSelect()
                      }}
                      className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-100 aria-selected:bg-white/10"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{action.label}</span>
                      {action.hint ? <span className="text-[11px] text-gray-400">{action.hint}</span> : null}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </Command>
          </div>
        </>
      ) : null}
    </>
  )
}
