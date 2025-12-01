import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { v4 as uuid } from 'uuid'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}
    const name = typeof body.name === 'string' && body.name.trim() ? body.name.trim() : null

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

    const id = uuid()
    const now = new Date().toISOString()
    const item = {
      PK: 'WORKSPACE',
      SK: `WORKSPACE#${id}`,
      id,
      name,
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
    console.error('create workspace error', err)
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
