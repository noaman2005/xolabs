import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const rawUsername = event.pathParameters?.username
    const username = typeof rawUsername === 'string' ? rawUsername.trim().toLowerCase().replace(/\s+/g, '') : ''

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

    // Resolve username -> target sub via USERNAME mapping
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

    const targetSub = mappingRes.Item && typeof mappingRes.Item.sub === 'string' ? (mappingRes.Item.sub as string) : ''

    if (!targetSub) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Friend not found' }),
      }
    }

    const pk = `FRIEND#USER#${user.sub}`
    const sk = `FRIEND#${targetSub}`

    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      }),
    )

    if (!existing.Item) {
      // Not friends; treat as success to keep idempotent
      return {
        statusCode: 200,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Not friends' }),
      }
    }

    await ddb.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ message: 'Friend removed' }),
    }
  } catch (err) {
    console.error('remove friend error', err)
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
