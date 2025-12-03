"use client"

// Simple client-side storage for workspace images, keyed by workspaceId.
// This keeps the feature purely frontend for now; later we can sync with the backend.

const STORAGE_KEY = "xolabs_workspace_images"

type WorkspaceImageMap = Record<string, string>

function readImageMap(): WorkspaceImageMap {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed as WorkspaceImageMap
  } catch {
    // ignore
  }
  return {}
}

function writeImageMap(map: WorkspaceImageMap) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

export function getWorkspaceImageUrl(workspaceId: string | null | undefined): string | null {
  if (!workspaceId) return null
  const map = readImageMap()
  return map[workspaceId] ?? null
}

export function setWorkspaceImageUrl(workspaceId: string | null | undefined, url: string | null) {
  if (!workspaceId) return
  const map = readImageMap()
  if (url && url.trim()) {
    map[workspaceId] = url.trim()
  } else {
    delete map[workspaceId]
  }
  writeImageMap(map)
}
