export interface BoardColumn {
  columnId: string
  workspaceId: string
  channelId: string
  title: string
  order: number
  createdAt: string
  updatedAt: string
}

export type BoardCardPriority = 'low' | 'medium' | 'high'

export interface BoardCard {
  cardId: string
  workspaceId: string
  channelId: string
  columnId: string
  title: string
  description?: string
  assignees?: string[]
  dueDate?: string | null
  labels?: string[]
  priority?: BoardCardPriority
  order: number
  createdAt: string
  updatedAt: string
}

export type BoardEventType =
  | 'column_created'
  | 'column_updated'
  | 'column_deleted'
  | 'card_created'
  | 'card_updated'
  | 'card_deleted'
  | 'board_snapshot'

export interface BoardEvent {
  type: BoardEventType
  workspaceId: string
  channelId: string
  timestamp: number
  column?: BoardColumn
  card?: BoardCard
  columns?: BoardColumn[]
  cards?: BoardCard[]
}
