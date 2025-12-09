import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)

    const pk = 'USER'
    const sk = `USER#${user.sub}`

    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      }),
    )

    const item = existing.Item ?? {}

    const email = user.email
    const username =
      typeof item.username === 'string' && item.username.trim()
        ? (item.username as string)
        : email.split('@')[0].toLowerCase()

    const profile = {
      email,
      username,
      displayName:
        typeof item.displayName === 'string' && item.displayName.trim() ? (item.displayName as string) : email.split('@')[0],
      avatarUrl: typeof item.avatarUrl === 'string' ? (item.avatarUrl as string) : null,
      statusMessage: typeof item.statusMessage === 'string' ? (item.statusMessage as string) : '',
      presence:
        item.presence === 'online' ||
        item.presence === 'idle' ||
        item.presence === 'dnd' ||
        item.presence === 'offline'
          ? item.presence
          : 'online',
      sub: user.sub,
      themePreference:
        item.themePreference === 'system' ||
        item.themePreference === 'light' ||
        item.themePreference === 'dark' ||
        item.themePreference === 'charcoal'
          ? item.themePreference
          : 'system',
      bio: typeof item.bio === 'string' ? item.bio : '',
      pronouns: typeof item.pronouns === 'string' ? item.pronouns : '',
      timezone: typeof item.timezone === 'string' ? item.timezone : '',
      github: typeof item.github === 'string' ? item.github : '',
      twitter: typeof item.twitter === 'string' ? item.twitter : '',
      website: typeof item.website === 'string' ? item.website : '',
    }

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(profile),
    }
  } catch (err) {
    console.error('get profile error', err)
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
