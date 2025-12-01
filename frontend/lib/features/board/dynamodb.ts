import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import type { BoardCard, BoardColumn } from './types'

const TABLE_NAME = process.env.TABLE_NAME as string
const REGION = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME env var must be set for board feature')
}

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: REGION,
  }),
)

export async function assertWorkspaceMember(workspaceId: string, userEmail: string): Promise<void> {
  const result = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: 'WORKSPACE',
        SK: `WORKSPACE#${workspaceId}`,
      },
    }),
  )

  const workspace = result.Item as any | undefined
  const members: string[] = Array.isArray(workspace?.members)
    ? workspace!.members.map((m: any) => String(m).toLowerCase())
    : []
  const isOwner = workspace?.ownerEmail === userEmail
  const isMember = members.includes(userEmail.toLowerCase())

  if (!workspace || (!isOwner && !isMember)) {
    const error: any = new Error('Workspace not found or access denied')
    error.statusCode = 403
    throw error
  }
}

export async function getBoard(workspaceId: string, channelId: string): Promise<{ columns: BoardColumn[]; cards: BoardCard[] }> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': `CHANNEL#${channelId}`,
      },
      Limit: 500,
    }),
  )

  const items = (result.Items ?? []) as any[]
  const columns: BoardColumn[] = []
  const cards: BoardCard[] = []

  for (const item of items) {
    if (typeof item.SK === 'string' && item.SK.startsWith('BOARD_COLUMN#')) {
      columns.push(normalizeColumn(item))
    } else if (typeof item.SK === 'string' && item.SK.startsWith('BOARD_CARD#')) {
      cards.push(normalizeCard(item))
    }
  }

  columns.sort((a, b) => a.order - b.order)
  cards.sort((a, b) => a.order - b.order)

  return { columns, cards }
}

function normalizeColumn(item: any): BoardColumn {
  return {
    columnId: item.columnId,
    workspaceId: item.workspaceId,
    channelId: item.channelId,
    title: item.title,
    order: typeof item.order === 'number' ? item.order : 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

function normalizeCard(item: any): BoardCard {
  return {
    cardId: item.cardId,
    workspaceId: item.workspaceId,
    channelId: item.channelId,
    columnId: item.columnId,
    title: item.title,
    description: item.description ?? undefined,
    assignees: Array.isArray(item.assignees) ? item.assignees.map(String) : undefined,
    dueDate: item.dueDate ?? null,
    labels: Array.isArray(item.labels) ? item.labels.map(String) : undefined,
    priority: item.priority,
    order: typeof item.order === 'number' ? item.order : 0,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export async function createColumn(params: {
  workspaceId: string
  channelId: string
  title: string
  order?: number
}): Promise<BoardColumn> {
  const { workspaceId, channelId, title } = params
  const now = new Date().toISOString()
  const columnId = uuid()

  const item = {
    PK: `CHANNEL#${channelId}`,
    SK: `BOARD_COLUMN#${now}#${columnId}`,
    columnId,
    workspaceId,
    channelId,
    title,
    order: typeof params.order === 'number' ? params.order : Date.now(),
    createdAt: now,
    updatedAt: now,
  }

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  )

  return normalizeColumn(item)
}

export async function updateColumn(params: {
  workspaceId: string
  channelId: string
  columnId: string
  updates: Partial<Pick<BoardColumn, 'title' | 'order'>>
}): Promise<BoardColumn | null> {
  const { workspaceId, channelId, columnId, updates } = params
  const { columns } = await getBoard(workspaceId, channelId)
  const current = columns.find((c) => c.columnId === columnId)
  if (!current) return null

  const now = new Date().toISOString()
  const next: BoardColumn = {
    ...current,
    ...updates,
    updatedAt: now,
  }

  const sk = `BOARD_COLUMN#${current.createdAt}#${current.columnId}`

  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CHANNEL#${channelId}`,
        SK: sk,
      },
      UpdateExpression: 'SET #title = :title, #order = :order, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#order': 'order',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': next.title,
        ':order': next.order,
        ':updatedAt': next.updatedAt,
      },
    }),
  )

  return next
}

export async function deleteColumn(params: {
  workspaceId: string
  channelId: string
  columnId: string
}): Promise<void> {
  const { workspaceId, channelId, columnId } = params
  const { columns, cards } = await getBoard(workspaceId, channelId)
  const current = columns.find((c) => c.columnId === columnId)
  if (!current) return

  const sk = `BOARD_COLUMN#${current.createdAt}#${current.columnId}`

  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CHANNEL#${channelId}`,
        SK: sk,
      },
    }),
  )

  // Delete cards for this column
  const columnCards = cards.filter((card) => card.columnId === columnId)
  for (const card of columnCards) {
    const cardSk = `BOARD_CARD#${card.columnId}#${card.createdAt}#${card.cardId}`
    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `CHANNEL#${channelId}`,
          SK: cardSk,
        },
      }),
    )
  }
}

export async function createCard(params: {
  workspaceId: string
  channelId: string
  columnId: string
  title: string
  description?: string
}): Promise<BoardCard> {
  const { workspaceId, channelId, columnId, title, description } = params
  const now = new Date().toISOString()
  const cardId = uuid()

  const item = {
    PK: `CHANNEL#${channelId}`,
    SK: `BOARD_CARD#${columnId}#${now}#${cardId}`,
    cardId,
    workspaceId,
    channelId,
    columnId,
    title,
    description: description ?? null,
    assignees: [],
    dueDate: null,
    labels: [],
    priority: 'medium',
    order: Date.now(),
    createdAt: now,
    updatedAt: now,
  }

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  )

  return normalizeCard(item)
}

export async function updateCard(params: {
  workspaceId: string
  channelId: string
  cardId: string
  updates: Partial<
    Pick<BoardCard, 'title' | 'description' | 'assignees' | 'dueDate' | 'labels' | 'priority' | 'columnId' | 'order'>
  >
}): Promise<BoardCard | null> {
  const { workspaceId, channelId, cardId, updates } = params
  const { cards } = await getBoard(workspaceId, channelId)
  const current = cards.find((c) => c.cardId === cardId)
  if (!current) return null

  const now = new Date().toISOString()
  const next: BoardCard = {
    ...current,
    ...updates,
    updatedAt: now,
  }

  const sk = `BOARD_CARD#${current.columnId}#${current.createdAt}#${current.cardId}`

  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CHANNEL#${channelId}`,
        SK: sk,
      },
      UpdateExpression:
        'SET #title = :title, #description = :description, #assignees = :assignees, #dueDate = :dueDate, #labels = :labels, #priority = :priority, #columnId = :columnId, #order = :order, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
        '#assignees': 'assignees',
        '#dueDate': 'dueDate',
        '#labels': 'labels',
        '#priority': 'priority',
        '#columnId': 'columnId',
        '#order': 'order',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': next.title,
        ':description': next.description ?? null,
        ':assignees': next.assignees ?? [],
        ':dueDate': next.dueDate ?? null,
        ':labels': next.labels ?? [],
        ':priority': next.priority ?? 'medium',
        ':columnId': next.columnId,
        ':order': next.order,
        ':updatedAt': next.updatedAt,
      },
    }),
  )

  return next
}

export async function deleteCard(params: {
  workspaceId: string
  channelId: string
  cardId: string
}): Promise<void> {
  const { workspaceId, channelId, cardId } = params
  const { cards } = await getBoard(workspaceId, channelId)
  const current = cards.find((c) => c.cardId === cardId)
  if (!current) return

  const sk = `BOARD_CARD#${current.columnId}#${current.createdAt}#${current.cardId}`

  await client.send(
    new DeleteCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CHANNEL#${channelId}`,
        SK: sk,
      },
    }),
  )
}
