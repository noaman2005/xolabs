import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}

    const usernameRaw = typeof body.username === 'string' ? body.username : ''
    const username = usernameRaw.trim().toLowerCase().replace(/\s+/g, '')

    if (!username) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'username is required' }),
      }
    }

    // Look up target user by username mapping
    const usernameKey = {
      PK: 'USERNAME',
      SK: `USERNAME#${username}`,
    }

    const mappingRes = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: usernameKey,
      }),
    )

    if (!mappingRes.Item) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'User not found' }),
      }
    }

    const targetSub = typeof mappingRes.Item.sub === 'string' ? (mappingRes.Item.sub as string) : ''
    const targetEmail = typeof mappingRes.Item.email === 'string' ? (mappingRes.Item.email as string) : ''

    if (!targetSub) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Invalid target user' }),
      }
    }

    if (targetSub === user.sub) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'You cannot add yourself as a friend' }),
      }
    }

    const pk = `FRIEND#USER#${user.sub}`
    const sk = `FRIEND#${targetSub}`

    // Check if already friends
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      }),
    )

    if (existing.Item) {
      return {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Already friends' }),
      }
    }

    const now = new Date().toISOString()

    const item = {
      PK: pk,
      SK: sk,
      friendSub: targetSub,
      friendUsername: username,
      friendEmail: targetEmail,
      createdAt: now,
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
    console.error('add friend error', err)
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
