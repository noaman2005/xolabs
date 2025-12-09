import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const rawThreadId = event.pathParameters?.threadId
    const threadId = rawThreadId ? decodeURIComponent(rawThreadId) : null
    const body = event.body ? JSON.parse(event.body) : {}

    const text = typeof body.text === 'string' && body.text.trim() ? body.text.trim() : null

    if (!threadId) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'threadId is required' }),
      }
    }

    if (!text) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'text is required' }),
      }
    }

    // Ensure thread exists and user is a participant
    const threadKey = {
      PK: 'DM',
      SK: `THREAD#${threadId}`,
    }

    const existingThread = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: threadKey,
      }),
    )

    const thread = existingThread.Item as any | undefined

    if (!thread || (thread.userA !== user.sub && thread.userB !== user.sub)) {
      return {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Thread not found or access denied' }),
      }
    }

    const id = uuid()
    const now = new Date().toISOString()

    const messageItem = {
      PK: `THREAD#${threadId}`,
      SK: `MSG#${now}#${id}`,
      id,
      threadId,
      sender: user.sub,
      text,
      createdAt: now,
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: messageItem,
      }),
    )

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: threadKey,
        UpdateExpression: 'SET lastMessage = :lastMessage, lastAt = :lastAt, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':lastMessage': text,
          ':lastAt': now,
          ':updatedAt': now,
        },
      }),
    )

    return {
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(messageItem),
    }
  } catch (err) {
    console.error('create social message error', err)
    const statusCode = err instanceof UnauthorizedError ? 401 : 500
    const message = err instanceof UnauthorizedError ? err.message : 'Internal error'
    return {
      statusCode,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ message }),
    }
  }
}
