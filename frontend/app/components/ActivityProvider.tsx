"use client"

import { createContext, useContext, useMemo, useState, useCallback } from "react"

type Activity = { id: string; message: string; ts: number; level?: "info" | "error" }

type ActivityContextType = {
  activities: Activity[]
  push: (message: string, level?: "info" | "error") => void
}

const ActivityContext = createContext<ActivityContextType | undefined>(undefined)

export function ActivityProvider({ children }: { children: React.ReactNode }) {
  const [activities, setActivities] = useState<Activity[]>([])

  const push = useCallback((message: string, level: "info" | "error" = "info") => {
    setActivities((prev) => {
      const next = [{ id: crypto.randomUUID(), message, ts: Date.now(), level }, ...prev].slice(0, 6)
      return next
    })
    setTimeout(() => {
      setActivities((prev) => prev.slice(0, -1))
    }, 4000)
  }, [])

  const value = useMemo(() => ({ activities, push }), [activities, push])

  return (
    <ActivityContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-50 flex flex-col gap-2">
        {activities.map((a) => (
          <div
            key={a.id}
            className={`pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg ${
              a.level === "error"
                ? "border-rose-400/40 bg-rose-500/10 text-rose-50"
                : "border-white/10 bg-black/70 text-gray-100"
            }`}
          >
            {a.message}
          </div>
        ))}
      </div>
    </ActivityContext.Provider>
  )
}

export function useActivity() {
  const ctx = useContext(ActivityContext)
  if (!ctx) throw new Error("useActivity must be used within ActivityProvider")
  return ctx
}
