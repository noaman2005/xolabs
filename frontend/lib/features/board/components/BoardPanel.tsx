"use client"

import { useState } from 'react'
import type { BoardCard, BoardColumn } from '../types'

interface BoardPanelProps {
  columns: BoardColumn[]
  cards: BoardCard[]
  isLoading: boolean
  error: string | null
  onCreateColumn: (title: string) => Promise<any>
  onCreateCard: (input: { columnId: string; title: string; description?: string }) => Promise<any>
  onUpdateCard: (input: { cardId: string; updates: Partial<BoardCard> }) => Promise<any>
}

export function BoardPanel({ columns, cards, isLoading, error, onCreateColumn, onCreateCard, onUpdateCard }: BoardPanelProps) {
  const [draggedCardId, setDraggedCardId] = useState<string | null>(null)

  async function handleCreateColumn(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    if (!title) return
    await onCreateColumn(title)
    form.reset()
  }

  function handleCardDragStart(cardId: string) {
    setDraggedCardId(cardId)
  }

  function handleCardDragEnd() {
    setDraggedCardId(null)
  }

  async function handleColumnDrop(columnId: string) {
    if (!draggedCardId) return
    const card = cards.find((c) => c.cardId === draggedCardId)
    if (!card) {
      setDraggedCardId(null)
      return
    }

    const targetCards = cards.filter((c) => c.columnId === columnId)
    const maxOrder = targetCards.length ? Math.max(...targetCards.map((c) => c.order)) : 0
    const nextOrder = maxOrder + 1

    await onUpdateCard({ cardId: card.cardId, updates: { columnId, order: nextOrder } })
    setDraggedCardId(null)
  }

  return (
    <div className="glass-panel smooth-transition flex flex-1 flex-col rounded-none px-4 py-6 overflow-hidden lg:rounded-3xl lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.08] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base lg:text-lg font-bold text-gray-100">Board</h3>
          <p className="text-xs text-gray-500">Organize work as columns and cards.</p>
        </div>
        <form onSubmit={handleCreateColumn} className="flex flex-col gap-2 sm:flex-row sm:items-center text-xs">
          <input
            name="title"
            placeholder="Add column"
            className="rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-1.5 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
          />
          <button
            type="submit"
            className="btn-accent px-3 py-1.5 text-xs active:animate-press"
          >
            + Column
          </button>
        </form>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      {isLoading && <div className="text-xs text-gray-500 mb-2">Loading board…</div>}

      <div className="flex-1 overflow-x-auto overflow-y-hidden">
        <div className="flex h-full gap-4">
          {columns.length === 0 && !isLoading && (
            <div className="mt-2 text-xs text-gray-600">No columns yet. Create one to get started.</div>
          )}

          {columns.map((column) => {
            const columnCards = cards.filter((card) => card.columnId === column.columnId)

            async function handleCreateCard(e: React.FormEvent<HTMLFormElement>) {
              e.preventDefault()
              const form = e.currentTarget
              const formData = new FormData(form)
              const title = String(formData.get('title') ?? '').trim()
              const description = String(formData.get('description') ?? '').trim()
              if (!title) return
              await onCreateCard({ columnId: column.columnId, title, description: description || undefined })
              form.reset()
            }

            return (
              <div
                key={column.columnId}
                className="flex h-full min-w-[230px] max-w-[260px] flex-col rounded-2xl border border-white/[0.08] bg-black/40 px-3 py-3"
                onDragOver={(e) => {
                  if (draggedCardId) e.preventDefault()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  void handleColumnDrop(column.columnId)
                }}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="truncate text-xs font-semibold text-gray-100" title={column.title}>
                    {column.title}
                  </div>
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] text-gray-400">
                    {columnCards.length}
                  </span>
                </div>

                <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                  {columnCards.map((card) => (
                    <div
                      key={card.cardId}
                      draggable
                      onDragStart={() => handleCardDragStart(card.cardId)}
                      onDragEnd={handleCardDragEnd}
                      className="rounded-xl border border-white/[0.08] bg-white/[0.05] px-3 py-2 text-xs text-gray-100 shadow-sm hover:bg-white/[0.08]"
                    >
                      <div className="font-semibold break-words">{card.title}</div>
                      {card.description && (
                        <div className="mt-1 text-[11px] text-gray-400 line-clamp-3 break-words">{card.description}</div>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
                        {card.dueDate && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5">
                            Due: {new Date(card.dueDate).toLocaleDateString()}
                          </span>
                        )}
                        {card.priority && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 capitalize">
                            Priority: {card.priority}
                          </span>
                        )}
                        {Array.isArray(card.labels) && card.labels.length > 0 && (
                          <span className="rounded-full bg-white/[0.06] px-2 py-0.5">
                            {card.labels.join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleCreateCard} className="mt-2 space-y-1 border-t border-white/[0.08] pt-2 text-[11px]">
                  <input
                    name="title"
                    placeholder="Add card"
                    className="w-full rounded-lg border border-white/[0.1] bg-white/[0.05] px-2 py-1 text-[11px] text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                  />
                  <textarea
                    name="description"
                    placeholder="Optional description"
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-[11px] text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30"
                  />
                  <button
                    type="submit"
                    className="mt-1 w-full rounded-lg border border-white/[0.1] bg-white/[0.04] px-2 py-1 text-[11px] text-gray-200 hover:bg-white/[0.08]"
                  >
                    + Add card
                  </button>
                </form>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
