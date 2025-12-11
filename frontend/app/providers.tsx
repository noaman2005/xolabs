"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { ActivityProvider } from "./components/ActivityProvider"

const queryClient = new QueryClient()

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ActivityProvider>{children}</ActivityProvider>
    </QueryClientProvider>
  )
}
