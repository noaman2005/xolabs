import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const workspaceId = event.pathParameters?.workspaceId
    const body = event.body ? JSON.parse(event.body) : {}
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null

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

    if (!name) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'name is required' }),
      }
    }

    const existing = await client.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: 'WORKSPACE',
          SK: `WORKSPACE#${workspaceId}`,
        },
      }),
    )

    if (!existing.Item || existing.Item.ownerEmail !== user.email) {
      return {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Workspace not found or access denied' }),
      }
    }

    const now = new Date().toISOString()

    const result = await client.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: 'WORKSPACE',
          SK: `WORKSPACE#${workspaceId}`,
        },
        UpdateExpression: 'SET #name = :name, updatedAt = :updatedAt',
        ExpressionAttributeNames: {
          '#name': 'name',
        },
        ExpressionAttributeValues: {
          ':name': name,
          ':updatedAt': now,
        },
        ReturnValues: 'ALL_NEW',
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify(result.Attributes ?? {}),
    }
  } catch (err) {
    console.error('update workspace error', err)
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
