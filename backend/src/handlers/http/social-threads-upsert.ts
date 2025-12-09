import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}

    const friendSub = typeof body.friendSub === 'string' && body.friendSub.trim() ? body.friendSub.trim() : null

    if (!friendSub) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'friendSub is required' }),
      }
    }

    if (friendSub === user.sub) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Cannot create DM thread with yourself' }),
      }
    }

    const userKey = user.sub < friendSub ? user.sub : friendSub
    const friendKey = user.sub < friendSub ? friendSub : user.sub

    const existing = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': 'DM',
          ':skPrefix': `THREAD#${userKey}#${friendKey}`,
        },
        Limit: 1,
      }),
    )

    if (Array.isArray(existing.Items) && existing.Items.length > 0) {
      return {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify(existing.Items[0]),
      }
    }

    const id = uuid()
    const now = new Date().toISOString()
    const threadId = `${userKey}#${friendKey}`

    const item = {
      PK: 'DM',
      SK: `THREAD#${threadId}`,
      id,
      threadId,
      userA: userKey,
      userB: friendKey,
      createdAt: now,
      updatedAt: now,
      lastMessage: '',
      lastAt: now,
      GSI1PK: `USER#${user.sub}`,
      GSI1SK: `THREAD#${now}#${threadId}`,
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    )

    return {
      statusCode: 201,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(item),
    }
  } catch (err) {
    console.error('upsert social thread error', err)
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
