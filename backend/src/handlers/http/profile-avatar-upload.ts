import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

const TABLE_NAME = process.env.TABLE_NAME as string
const AVATARS_BUCKET = process.env.AVATARS_BUCKET as string

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}

    const fileNameRaw = typeof body.fileName === 'string' ? body.fileName : null
    const contentType = typeof body.contentType === 'string' ? body.contentType : null
    const data = typeof body.data === 'string' ? body.data : null

    if (!fileNameRaw || !contentType || !data) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'fileName, contentType, and data are required' }),
      }
    }

    const safeFileName = fileNameRaw.replace(/[^a-zA-Z0-9_.-]/g, '_')
    const key = `users/${user.sub}/${Date.now()}-${safeFileName}`

    const buffer = Buffer.from(data, 'base64')

    await s3.send(
      new PutObjectCommand({
        Bucket: AVATARS_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      }),
    )

    const avatarUrl = `https://${AVATARS_BUCKET}.s3.amazonaws.com/${key}`
    const now = new Date().toISOString()

    const pk = 'USER'
    const sk = `USER#${user.sub}`

    await ddb.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: { PK: pk, SK: sk },
        UpdateExpression: 'SET avatarUrl = :avatarUrl, updatedAt = :updatedAt',
        ExpressionAttributeValues: {
          ':avatarUrl': avatarUrl,
          ':updatedAt': now,
        },
      }),
    )

    return {
      statusCode: 200,
      headers: {
        'content-type': 'application/json',
        'access-control-allow-origin': '*',
      },
      body: JSON.stringify({ avatarUrl }),
    }
  } catch (err) {
    console.error('upload profile avatar error', err)
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
