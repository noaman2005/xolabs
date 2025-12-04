import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}

    const pk = 'USER'
    const sk = `USER#${user.sub}`

    const now = new Date().toISOString()

    // Load existing profile to support username updates & mapping cleanup
    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
      }),
    )

    const existingItem = existing.Item ?? {}
    const existingUsername =
      typeof existingItem.username === 'string' && existingItem.username.trim()
        ? (existingItem.username as string)
        : ''

    const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''
    const rawUsername = typeof body.username === 'string' ? body.username : ''
    const avatarUrl = typeof body.avatarUrl === 'string' ? body.avatarUrl : null
    const statusMessage = typeof body.statusMessage === 'string' ? body.statusMessage : ''
    const bio = typeof body.bio === 'string' ? body.bio : ''
    const pronouns = typeof body.pronouns === 'string' ? body.pronouns : ''
    const timezone = typeof body.timezone === 'string' ? body.timezone : ''
    const github = typeof body.github === 'string' ? body.github : ''
    const twitter = typeof body.twitter === 'string' ? body.twitter : ''
    const website = typeof body.website === 'string' ? body.website : ''

    const presenceValues = ['online', 'idle', 'dnd', 'offline'] as const
    const presence = presenceValues.includes(body.presence) ? body.presence : 'online'

    const themeValues = ['system', 'light', 'dark', 'charcoal'] as const
    const themePreference = themeValues.includes(body.themePreference) ? body.themePreference : 'system'

    // Username: normalize / ensure lowercase / no spaces
    const normalizedRequested = rawUsername.trim().toLowerCase().replace(/\s+/g, '')
    const emailPrefix = user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '')

    let finalUsername = normalizedRequested || existingUsername

    // If still no username, auto-generate one
    if (!finalUsername) {
      const base = emailPrefix || 'user'
      let candidate = base
      let suffix = 0

      // Try candidate, candidate1, candidate2, ... until free or owned by this user
      // Limit attempts to a reasonable number to avoid infinite loops
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const key = {
          PK: 'USERNAME',
          SK: `USERNAME#${candidate}`,
        }

        const existingMapping = await ddb.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: key,
          }),
        )

        if (!existingMapping.Item || existingMapping.Item.sub === user.sub) {
          finalUsername = candidate
          break
        }

        suffix += 1
        candidate = `${base}${suffix}`

        if (suffix > 1000) {
          throw new Error('Unable to generate unique username')
        }
      }
    } else if (normalizedRequested && normalizedRequested !== existingUsername) {
      // User is changing username: ensure uniqueness
      const key = {
        PK: 'USERNAME',
        SK: `USERNAME#${normalizedRequested}`,
      }

      const existingMapping = await ddb.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: key,
        }),
      )

      if (existingMapping.Item && existingMapping.Item.sub !== user.sub) {
        return {
          statusCode: 409,
          headers: {
            'content-type': 'application/json',
            'access-control-allow-origin': '*',
          },
          body: JSON.stringify({ message: 'Username is already taken' }),
        }
      }

      finalUsername = normalizedRequested
    }

    // Update username mapping if needed
    if (existingUsername && existingUsername !== finalUsername) {
      await ddb.send(
        new DeleteCommand({
          TableName: TABLE_NAME,
          Key: {
            PK: 'USERNAME',
            SK: `USERNAME#${existingUsername}`,
          },
        }),
      )
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: {
          PK: 'USERNAME',
          SK: `USERNAME#${finalUsername}`,
          sub: user.sub,
          email: user.email,
          updatedAt: now,
        },
      }),
    )

    const item = {
      PK: pk,
      SK: sk,
      email: user.email,
      sub: user.sub,
      username: finalUsername,
      displayName: displayName || user.email.split('@')[0],
      avatarUrl,
      statusMessage,
      presence,
      themePreference,
      bio,
      pronouns,
      timezone,
      github,
      twitter,
      website,
      updatedAt: now,
      createdAt: existingItem.createdAt || body.createdAt || now,
    }

    await ddb.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(item),
    }
  } catch (err) {
    console.error('put profile error', err)
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
