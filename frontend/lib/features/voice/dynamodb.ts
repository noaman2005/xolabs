import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import type { VoiceEvent, VoiceParticipant } from './types'

const TABLE_NAME = process.env.TABLE_NAME as string
const REGION = process.env.AWS_REGION ?? process.env.NEXT_PUBLIC_AWS_REGION

if (!TABLE_NAME) {
  throw new Error('TABLE_NAME env var must be set for voice feature')
}

const client = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region: REGION,
  }),
)

const roomPk = (workspaceId: string, channelId: string) => `VOICE_ROOM#${workspaceId}#${channelId}`
const connectionPk = (connectionId: string) => `VOICE_CONN#${connectionId}`

export async function registerParticipant(params: {
  workspaceId: string
  channelId: string
  participant: VoiceParticipant
}): Promise<void> {
  const { workspaceId, channelId, participant } = params

  const participantItem = {
    PK: roomPk(workspaceId, channelId),
    SK: `PARTICIPANT#${participant.connectionId}`,
    workspaceId,
    channelId,
    ...participant,
  }

  const connectionMetaItem = {
    PK: connectionPk(participant.connectionId),
    SK: 'META',
    workspaceId,
    channelId,
    connectionId: participant.connectionId,
    userId: participant.userId,
    email: participant.email,
  }

  await Promise.all([
    client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: participantItem,
      }),
    ),
    client.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: connectionMetaItem,
      }),
    ),
  ])
}

export async function unregisterParticipant(connectionId: string): Promise<
  | {
      participant: VoiceParticipant
      workspaceId: string
      channelId: string
    }
  | null
> {
  const meta = await getConnectionMeta(connectionId)
  if (!meta) return null

  const participantKey = {
    PK: roomPk(meta.workspaceId, meta.channelId),
    SK: `PARTICIPANT#${connectionId}`,
  }

  const participantItem = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: participantKey,
    }),
  )

  await Promise.all([
    client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: participantKey,
      }),
    ),
    client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: connectionPk(connectionId), SK: 'META' },
      }),
    ),
    deleteAllEventsForConnection(connectionId),
  ])

  const participant = participantItem.Item
    ? normalizeParticipant(participantItem.Item)
    : {
        userId: meta.userId,
        email: meta.email,
        connectionId,
        isMuted: false,
        joinedAt: Date.now(),
      }

  return {
    participant,
    workspaceId: meta.workspaceId,
    channelId: meta.channelId,
  }
}

export async function listParticipants(workspaceId: string, channelId: string): Promise<VoiceParticipant[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': roomPk(workspaceId, channelId),
        ':skPrefix': 'PARTICIPANT#',
      },
      Limit: 200,
    }),
  )

  return (result.Items ?? []).map((item) => normalizeParticipant(item))
}

export async function updateParticipantMute(
  workspaceId: string,
  channelId: string,
  connectionId: string,
  isMuted: boolean,
): Promise<void> {
  await client.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: roomPk(workspaceId, channelId),
        SK: `PARTICIPANT#${connectionId}`,
      },
      UpdateExpression: 'SET #isMuted = :isMuted',
      ExpressionAttributeNames: {
        '#isMuted': 'isMuted',
      },
      ExpressionAttributeValues: {
        ':isMuted': isMuted,
      },
    }),
  )
}

export async function getConnectionsInRoom(
  workspaceId: string,
  channelId: string,
  excludeConnectionId?: string,
): Promise<string[]> {
  const participants = await listParticipants(workspaceId, channelId)
  return participants
    .map((participant) => participant.connectionId)
    .filter((id) => (excludeConnectionId ? id !== excludeConnectionId : true))
}

export async function enqueueEvent(connectionId: string, event: VoiceEvent): Promise<void> {
  const sk = `EVENT#${event.timestamp}#${uuid()}`
  await client.send(
    new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        PK: connectionPk(connectionId),
        SK: sk,
        type: event.type,
        userId: event.userId,
        workspaceId: event.workspaceId,
        channelId: event.channelId,
        connectionId: event.connectionId ?? null,
        data: event.data ?? null,
        timestamp: event.timestamp,
      },
    }),
  )
}

export async function enqueueEventForRoom(
  workspaceId: string,
  channelId: string,
  event: VoiceEvent,
  excludeConnectionId?: string,
): Promise<void> {
  const connectionIds = await getConnectionsInRoom(workspaceId, channelId, excludeConnectionId)
  await Promise.all(connectionIds.map((connectionId) => enqueueEvent(connectionId, event)))
}

export async function dequeueEvents(connectionId: string): Promise<VoiceEvent[]> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': connectionPk(connectionId),
        ':skPrefix': 'EVENT#',
      },
      ScanIndexForward: true,
      Limit: 100,
    }),
  )

  const items = result.Items ?? []
  if (items.length > 0) {
    await deleteEventItems(connectionId, items.map((item) => item.SK as string))
  }

  return items.map((item) => ({
    type: item.type as VoiceEvent['type'],
    userId: item.userId,
    workspaceId: item.workspaceId,
    channelId: item.channelId,
    connectionId: item.connectionId ?? undefined,
    data: item.data ?? undefined,
    timestamp: item.timestamp,
  }))
}

export async function getRoomForConnection(
  connectionId: string,
): Promise<{ workspaceId: string; channelId: string } | null> {
  const meta = await getConnectionMeta(connectionId)
  if (!meta) return null
  return { workspaceId: meta.workspaceId, channelId: meta.channelId }
}

async function getConnectionMeta(
  connectionId: string,
): Promise<{ workspaceId: string; channelId: string; userId: string; email: string } | null> {
  const result = await client.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: connectionPk(connectionId),
        SK: 'META',
      },
    }),
  )

  if (!result.Item) return null
  return {
    workspaceId: result.Item.workspaceId,
    channelId: result.Item.channelId,
    userId: result.Item.userId,
    email: result.Item.email,
  }
}

async function deleteAllEventsForConnection(connectionId: string): Promise<void> {
  const result = await client.send(
    new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
      ExpressionAttributeValues: {
        ':pk': connectionPk(connectionId),
        ':skPrefix': 'EVENT#',
      },
      ProjectionExpression: 'SK',
    }),
  )

  const skValues = (result.Items ?? []).map((item) => item.SK as string)
  if (skValues.length > 0) {
    await deleteEventItems(connectionId, skValues)
  }
}

async function deleteEventItems(connectionId: string, skValues: string[]): Promise<void> {
  if (skValues.length === 0) return

  const chunks: string[][] = []
  for (let i = 0; i < skValues.length; i += 25) {
    chunks.push(skValues.slice(i, i + 25))
  }

  await Promise.all(
    chunks.map((chunk) =>
      client.send(
        new BatchWriteCommand({
          RequestItems: {
            [TABLE_NAME]: chunk.map((sk) => ({
              DeleteRequest: {
                Key: {
                  PK: connectionPk(connectionId),
                  SK: sk,
                },
              },
            })),
          },
        }),
      ),
    ),
  )
}

function normalizeParticipant(item: any): VoiceParticipant {
  return {
    userId: item.userId,
    email: item.email,
    connectionId: item.connectionId,
    isMuted: Boolean(item.isMuted),
    joinedAt: typeof item.joinedAt === 'number' ? item.joinedAt : Date.now(),
  }
}
