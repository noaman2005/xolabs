import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb'
import { requireUser } from '../../lib/auth/requireUser.js'

const client = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const TABLE_NAME = process.env.TABLE_NAME as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const result = await client.send(
      new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        FilterExpression: 'ownerEmail = :owner OR contains(#members, :owner)',
        ExpressionAttributeValues: {
          ':pk': 'WORKSPACE',
          ':owner': user.email,
        },
        ExpressionAttributeNames: {
          '#members': 'members',
        },
        Limit: 50,
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
    console.error('list workspaces error', err)
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
