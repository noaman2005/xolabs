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

    const channelsResult = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk AND begins_with(SK, :skPrefix)',
        ExpressionAttributeValues: {
          ':pk': `WORKSPACE#${workspaceId}`,
          ':skPrefix': 'CHANNEL#',
        },
      }),
    )

    const channels = channelsResult.Items ?? []

    for (const ch of channels) {
      const channelId = ch.id
      if (!channelId) continue

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

      const messageItems = messagesResult.Items ?? []
      if (messageItems.length > 0) {
        const batches: any[] = []
        for (let i = 0; i < messageItems.length; i += 25) {
          batches.push(messageItems.slice(i, i + 25))
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
            PK: ch.PK,
            SK: ch.SK,
          },
        }),
      )
    }

    await client.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: 'WORKSPACE',
          SK: `WORKSPACE#${workspaceId}`,
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
    console.error('delete workspace error', err)
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
