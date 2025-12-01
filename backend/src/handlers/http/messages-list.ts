import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const workspaceId = event.pathParameters?.workspaceId
    const channelId = event.pathParameters?.channelId

    if (!workspaceId || !channelId) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'workspaceId and channelId are required' }),
      }
    }

    const workspaceResult = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: 'WORKSPACE',
          SK: `WORKSPACE#${workspaceId}`,
        },
      }),
    )

    const workspace = workspaceResult.Item as any | undefined
    const members: string[] = Array.isArray(workspace?.members)
      ? workspace!.members.map((m: any) => String(m).toLowerCase())
      : []
    const isOwner = workspace?.ownerEmail === user.email
    const isMember = members.includes(user.email.toLowerCase())

    if (!workspace || (!isOwner && !isMember)) {
      return {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Workspace not found or access denied' }),
      }
    }

    const channelResult = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `WORKSPACE#${workspaceId}`,
          SK: `CHANNEL#${channelId}`,
        },
      }),
    )

    if (!channelResult.Item) {
      return {
        statusCode: 404,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Channel not found' }),
      }
    }

    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `CHANNEL#${channelId}`,
          ':skPrefix': 'MESSAGE#',
        },
        ScanIndexForward: true,
        Limit: 100,
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(result.Items ?? []),
    }
  } catch (err) {
    console.error('list messages error', err)
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
