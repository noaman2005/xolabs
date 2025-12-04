import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const workspaceId = event.pathParameters?.workspaceId

    if (!workspaceId) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'workspaceId is required' }),
      }
    }

    const workspaceRes = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: 'WORKSPACE', SK: `WORKSPACE#${workspaceId}` },
      }),
    )

    const workspace = workspaceRes.Item as any | undefined
    if (!workspace) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Workspace not found' }),
      }
    }

    const ownerEmail = String(workspace.ownerEmail || '').toLowerCase()
    const members: string[] = Array.isArray(workspace.members)
      ? workspace.members.map((m: any) => String(m).toLowerCase())
      : []

    const userEmail = String(user.email || '').toLowerCase()
    const isOwner = ownerEmail === userEmail
    const isMember = members.includes(userEmail)
    if (!isOwner && !isMember) {
      return {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Workspace access denied' }),
      }
    }

    const emailsSet = new Set<string>()
    if (ownerEmail) emailsSet.add(ownerEmail)
    for (const m of members) {
      if (m) emailsSet.add(m)
    }

    const emails = Array.from(emailsSet)

    const membersWithProfiles = await Promise.all(
      emails.map(async (email) => {
        const profileRes = await client.send(
          new GetCommand({
            TableName: TABLE_NAME,
            Key: { PK: 'USER', SK: `USER_EMAIL#${email}` },
          }),
        )

        const profile = profileRes.Item as any | undefined
        if (!profile) {
          return {
            email,
            displayName: email.split('@')[0],
            username: email.split('@')[0].toLowerCase(),
            avatarUrl: null as string | null,
            presence: 'offline' as 'online' | 'idle' | 'dnd' | 'offline',
          }
        }

        const presence: 'online' | 'idle' | 'dnd' | 'offline' =
          profile.presence === 'online' ||
          profile.presence === 'idle' ||
          profile.presence === 'dnd' ||
          profile.presence === 'offline'
            ? profile.presence
            : 'offline'

        return {
          email,
          displayName:
            typeof profile.displayName === 'string' && profile.displayName.trim()
              ? profile.displayName
              : email.split('@')[0],
          username:
            typeof profile.username === 'string' && profile.username.trim()
              ? profile.username
              : email.split('@')[0].toLowerCase(),
          avatarUrl: typeof profile.avatarUrl === 'string' ? (profile.avatarUrl as string) : null,
          presence,
        }
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(membersWithProfiles),
    }
  } catch (err) {
    console.error('workspace members error', err)
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
