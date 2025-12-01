'use client'

import { useCallback, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { BoardCard, BoardColumn } from './types'
import { useAuth } from '../../hooks/useAuth'

interface UseBoardOptions {
  workspaceId: string
  channelId: string
}

interface BoardData {
  columns: BoardColumn[]
  cards: BoardCard[]
}

export function useBoard({ workspaceId, channelId }: UseBoardOptions) {
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
    data,
    isLoading,
    isError,
    error,
  } = useQuery<BoardData>({
    queryKey: ['board', workspaceId, channelId],
    queryFn: () =>
      fetchWithAuth(
        `/api/board?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(channelId)}`,
      ),
    enabled: Boolean(workspaceId && channelId && idToken),
  })

  const createColumn = useMutation({
    mutationFn: async (title: string) => {
      return fetchWithAuth('/api/board/columns/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, title }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  const updateColumn = useMutation({
    mutationFn: async (input: { columnId: string; updates: Partial<Pick<BoardColumn, 'title' | 'order'>> }) => {
      return fetchWithAuth('/api/board/columns/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, ...input }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  const deleteColumn = useMutation({
    mutationFn: async (columnId: string) => {
      return fetchWithAuth(
        `/api/board/columns/delete?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(
          channelId,
        )}&columnId=${encodeURIComponent(columnId)}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  const createCard = useMutation({
    mutationFn: async (input: { columnId: string; title: string; description?: string }) => {
      return fetchWithAuth('/api/board/cards/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, ...input }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  const updateCard = useMutation({
    mutationFn: async (input: { cardId: string; updates: Partial<BoardCard> }) => {
      return fetchWithAuth('/api/board/cards/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspaceId, channelId, ...input }),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  const deleteCard = useMutation({
    mutationFn: async (cardId: string) => {
      return fetchWithAuth(
        `/api/board/cards/delete?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(
          channelId,
        )}&cardId=${encodeURIComponent(cardId)}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
    },
  })

  // Poll board events for real-time sync
  useEffect(() => {
    if (!workspaceId || !channelId || !idToken) return

    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/board/events?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(channelId)}`,
          {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          },
        )
        const text = await res.text()
        if (!text || cancelled) return
        const payload = JSON.parse(text)
        const events = Array.isArray(payload.events) ? payload.events : []
        if (!events.length) return
        const hasSnapshot = events.some((e: any) => e?.type === 'board_snapshot')
        if (hasSnapshot) {
          queryClient.invalidateQueries({ queryKey: ['board', workspaceId, channelId] })
        }
      } catch {
        // ignore polling errors
      }
    }, 2500)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [workspaceId, channelId, idToken, queryClient])

  return {
    columns: data?.columns ?? [],
    cards: data?.cards ?? [],
    isLoading,
    isError,
    error: error instanceof Error ? error.message : null,
    createColumn: createColumn.mutateAsync,
    updateColumn: updateColumn.mutateAsync,
    deleteColumn: deleteColumn.mutateAsync,
    createCard: createCard.mutateAsync,
    updateCard: updateCard.mutateAsync,
    deleteCard: deleteCard.mutateAsync,
  }
}
