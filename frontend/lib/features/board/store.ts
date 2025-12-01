import type { BoardColumn, BoardCard, BoardEvent } from './types'

interface BoardRoom {
  columns: Map<string, BoardColumn>
  cards: Map<string, BoardCard>
  createdAt: number
}

export class BoardStore {
  private rooms: Map<string, BoardRoom> = new Map()
  private eventQueues: Map<string, BoardEvent[]> = new Map()

  private getRoomKey(workspaceId: string, channelId: string): string {
    return `BOARD#${workspaceId}#${channelId}`
  }

  private ensureRoom(workspaceId: string, channelId: string): BoardRoom {
    const key = this.getRoomKey(workspaceId, channelId)
    if (!this.rooms.has(key)) {
      this.rooms.set(key, {
        columns: new Map(),
        cards: new Map(),
        createdAt: Date.now(),
      })
    }
    return this.rooms.get(key) as BoardRoom
  }

  upsertColumn(column: BoardColumn): void {
    const room = this.ensureRoom(column.workspaceId, column.channelId)
    room.columns.set(column.columnId, column)
  }

  deleteColumn(workspaceId: string, channelId: string, columnId: string): void {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return
    room.columns.delete(columnId)
    // Also remove cards in this column from memory only
    for (const [cardId, card] of room.cards.entries()) {
      if (card.columnId === columnId) {
        room.cards.delete(cardId)
      }
    }
  }

  upsertCard(card: BoardCard): void {
    const room = this.ensureRoom(card.workspaceId, card.channelId)
    room.cards.set(card.cardId, card)
  }

  deleteCard(workspaceId: string, channelId: string, cardId: string): void {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return
    room.cards.delete(cardId)
  }

  getColumns(workspaceId: string, channelId: string): BoardColumn[] {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return []
    return Array.from(room.columns.values()).sort((a, b) => a.order - b.order)
  }

  getCards(workspaceId: string, channelId: string): BoardCard[] {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return []
    return Array.from(room.cards.values()).sort((a, b) => a.order - b.order)
  }

  enqueueEvent(roomKey: string, event: BoardEvent): void {
    if (!this.eventQueues.has(roomKey)) {
      this.eventQueues.set(roomKey, [])
    }
    this.eventQueues.get(roomKey)!.push(event)
  }

  dequeueEvents(roomKey: string): BoardEvent[] {
    if (!this.eventQueues.has(roomKey)) {
      this.eventQueues.set(roomKey, [])
    }
    const events = this.eventQueues.get(roomKey) ?? []
    this.eventQueues.set(roomKey, [])
    return events
  }
}

export const boardStore = new BoardStore()
