import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import type { Task, TaskStatus } from './types'

const TABLE_NAME = process.env.TABLE_NAME as string
const REGION = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME env var must be set for tasks')
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

export async function getTasks(workspaceId: string, channelId: string): Promise<Task[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': `CHANNEL#${channelId}`,
        ':skPrefix': 'TASK#',
      },
      ScanIndexForward: true,
      Limit: 200,
    }),
  )

  const items = (result.Items ?? []) as any[]
  return items.map((item) =>
    normalizeTask(item),
  )
}

function normalizeTask(item: any): Task {
  return {
    taskId: item.taskId,
    workspaceId: item.workspaceId,
    channelId: item.channelId,
    title: item.title,
    description: item.description ?? undefined,
    status: (item.status as TaskStatus) ?? 'todo',
    assignedTo: item.assignedTo ?? null,
    dueDate: item.dueDate ?? null,
    priority: item.priority ?? null,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }
}

export async function createTask(params: {
  workspaceId: string
  channelId: string
  title: string
  description?: string
  assignedTo?: string | null
  dueDate?: string | null
  priority?: Task['priority']
}): Promise<Task> {
  const { workspaceId, channelId, title, description, assignedTo, dueDate, priority } = params
  const now = new Date().toISOString()
  const taskId = uuid()

  const item = {
    PK: `CHANNEL#${channelId}`,
    SK: `TASK#${now}#${taskId}`,
    taskId,
    workspaceId,
    channelId,
    title,
    description: description ?? null,
    status: 'todo',
    assignedTo: assignedTo ?? null,
    dueDate: dueDate ?? null,
    priority: priority ?? null,
    createdAt: now,
    updatedAt: now,
  }

  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
    }),
  )

  return normalizeTask(item)
}

export async function updateTask(params: {
  taskId: string
  workspaceId: string
  channelId: string
  updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'assignedTo' | 'dueDate' | 'priority'>>
}): Promise<Task | null> {
  const { taskId, workspaceId, channelId, updates } = params

  const list = await getTasks(workspaceId, channelId)
  const current = list.find((t) => t.taskId === taskId)
  if (!current) return null

  const now = new Date().toISOString()
  const next: Task = {
    ...current,
    ...updates,
    updatedAt: now,
  }

  const sk = `TASK#${current.createdAt}#${current.taskId}`

  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `CHANNEL#${channelId}`,
        SK: sk,
      },
      UpdateExpression:
        'SET #title = :title, #description = :description, #status = :status, #assignedTo = :assignedTo, #dueDate = :dueDate, #priority = :priority, #updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#title': 'title',
        '#description': 'description',
        '#status': 'status',
        '#assignedTo': 'assignedTo',
        '#dueDate': 'dueDate',
        '#priority': 'priority',
        '#updatedAt': 'updatedAt',
      },
      ExpressionAttributeValues: {
        ':title': next.title,
        ':description': next.description ?? null,
        ':status': next.status,
        ':assignedTo': next.assignedTo ?? null,
        ':dueDate': next.dueDate ?? null,
        ':priority': next.priority ?? null,
        ':updatedAt': next.updatedAt,
      },
    }),
  )

  return next
}

export async function deleteTask(params: {
  taskId: string
  workspaceId: string
  channelId: string
}): Promise<void> {
  const { taskId, workspaceId, channelId } = params
  const list = await getTasks(workspaceId, channelId)
  const current = list.find((t) => t.taskId === taskId)
  if (!current) return

  const sk = `TASK#${current.createdAt}#${current.taskId}`

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
