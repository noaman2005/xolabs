import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)

    const pk = `FRIEND#USER#${user.sub}`

    const friendsResult = await ddb.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :sk)',
        ExpressionAttributeValues: {
          ':pk': pk,
          ':sk': 'FRIEND#',
        },
      }),
    )

    const items = Array.isArray(friendsResult.Items) ? friendsResult.Items : []

    const friends = await Promise.all(
      items.map(async (item) => {
        const friendSub = typeof item.friendSub === 'string' ? item.friendSub : null
        if (!friendSub) return null

        const profileKey = { PK: 'USER', SK: `USER#${friendSub}` }
        const profileRes = await ddb.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: profileKey,
          }),
        )

        const profile = profileRes.Item ?? {}

        const email = typeof profile.email === 'string' ? (profile.email as string) : ''
        const username =
          typeof profile.username === 'string' && profile.username.trim()
            ? (profile.username as string)
            : email.split('@')[0].toLowerCase()
        const displayName =
          typeof profile.displayName === 'string' && profile.displayName.trim()
            ? (profile.displayName as string)
            : username
        const avatarUrl = typeof profile.avatarUrl === 'string' ? (profile.avatarUrl as string) : null
        const presence: 'online' | 'idle' | 'dnd' | 'offline' =
          profile.presence === 'online' ||
          profile.presence === 'idle' ||
          profile.presence === 'dnd' ||
          profile.presence === 'offline'
            ? profile.presence
            : 'online'

        return {
          sub: friendSub,
          email,
          username,
          displayName,
          avatarUrl,
          presence,
        }
      }),
    )

    const filtered = friends.filter((f) => f !== null)

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(filtered),
    }
  } catch (err) {
    console.error('list friends error', err)
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
