'use client'

import { useCallback, useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { Task, TaskStatus, TaskPriority } from './types'
import { useAuth } from '../../hooks/useAuth'

interface UseTasksOptions {
  workspaceId: string
  channelId: string
}

export function useTasks({ workspaceId, channelId }: UseTasksOptions) {
  const { idToken } = useAuth()
  const queryClient = useQueryClient()

  const fetchWithAuth = useCallback(
    async (input: RequestInfo, init?: RequestInit) => {
      if (!idToken) throw new Error('Not authenticated')
      const res = await fetch(input, {
        ...init,
        headers: {
          ...(init?.headers || {}),
          Authorization: `Bearer ${idToken}`,
        },
      })
      const text = await res.text()
      const data = text ? JSON.parse(text) : null
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed')
      }
      return data
    },
    [idToken],
  )

  const {
    data: tasks,
    isLoading,
    isError,
    error,
  } = useQuery<Task[]>({
    queryKey: ['tasks', workspaceId, channelId],
    queryFn: () =>
      fetchWithAuth(
        `/api/tasks/list?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(channelId)}`,
      ),
    enabled: Boolean(workspaceId && channelId && idToken),
  })

  const createMutation = useMutation({
    mutationFn: async (input: { title: string; description?: string; assignedTo?: string; dueDate?: string; priority?: TaskPriority }) => {
      return fetchWithAuth('/api/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, ...input }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, channelId] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: { taskId: string; updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'priority'>> }) => {
      return fetchWithAuth('/api/tasks/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, ...input }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, channelId] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (taskId: string) => {
      return fetchWithAuth(
        `/api/tasks/delete?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(
          channelId,
        )}&taskId=${encodeURIComponent(taskId)}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, channelId] })
    },
  })

  // Poll events endpoint to react to real-time updates
  useEffect(() => {
    if (!workspaceId || !channelId || !idToken) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/tasks/events?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(channelId)}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        )
        const text = await res.text()
        if (!text || cancelled) return
        const data = JSON.parse(text)
        const events = Array.isArray(data.events) ? data.events : []
        if (!events.length) return

        // For now we simply refetch when we see any snapshot event
        const hasSnapshot = events.some((e: any) => e?.type === 'tasks_snapshot')
        if (hasSnapshot) {
          queryClient.invalidateQueries({ queryKey: ['tasks', workspaceId, channelId] })
        }
      } catch {
        // ignore polling errors for now
      }
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [workspaceId, channelId, idToken, queryClient])

  return {
    tasks: tasks ?? [],
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    createTask: createMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
