import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { requireUser } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const workspaceId = event.pathParameters?.workspaceId
    const body = event.body ? JSON.parse(event.body) : {}
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null
    const allowedTypes = ['text', 'voice', 'tasks', 'board']
    const type = typeof body.type === 'string' && allowedTypes.includes(body.type) ? body.type : 'text'

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

    if (!workspace || workspace.ownerEmail !== user.email) {
      return {
        statusCode: 403,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'Workspace not found or access denied' }),
      }
    }

    const id = uuid()
    const now = new Date().toISOString()

    const item = {
      PK: `WORKSPACE#${workspaceId}`,
      SK: `CHANNEL#${id}`,
      id,
      workspaceId,
      name,
      type,
      ownerEmail: user.email,
      createdAt: now,
      updatedAt: now,
    }

    await client.send(
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
    console.error('create channel error', err)
    return {
      statusCode: 500,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ message: 'Internal error' }),
    }
  }
}
