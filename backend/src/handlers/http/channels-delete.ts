import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, QueryCommand, BatchWriteCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb'
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

    if (!workspaceResult.Item || workspaceResult.Item.ownerEmail !== user.email) {
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

    const messagesResult = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `CHANNEL#${channelId}`,
          ':skPrefix': 'MESSAGE#',
        },
      }),
    )

    const messages = messagesResult.Items ?? []
    if (messages.length > 0) {
      const batches: any[] = []
      for (let i = 0; i < messages.length; i += 25) {
        batches.push(messages.slice(i, i + 25))
      }
      for (const batch of batches) {
        await client.send(
          new BatchWriteCommand({
            RequestItems: {
              [TABLE_NAME]: batch.map((item: any) => ({
                DeleteRequest: {
                  Key: {
                    PK: item.PK,
                    SK: item.SK,
                  },
                },
              })),
            },
          }),
        )
      }
    }

    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `WORKSPACE#${workspaceId}`,
          SK: `CHANNEL#${channelId}`,
        },
      }),
    )

    return {
      statusCode: 204,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: '',
    }
  } catch (err) {
    console.error('delete channel error', err)
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
