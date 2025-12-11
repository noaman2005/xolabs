import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, UpdateCommand, GetCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

const TABLE_NAME = process.env.TABLE_NAME as string
const AVATARS_BUCKET = process.env.AVATARS_BUCKET as string

function extractKeyFromUrl(url?: string | null) {
  if (!url || !AVATARS_BUCKET) return null
  try {
    const u = new URL(url)
    const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname
    if (path.startsWith(AVATARS_BUCKET)) {
      return path.replace(`${AVATARS_BUCKET}/`, '')
    }
    return path
  } catch {
    return null
  }
}

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

    const existing = await ddb.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: 'USER', SK: `USER#${user.sub}` },
      }),
    )
    const oldKey = extractKeyFromUrl(existing.Item?.avatarUrl)

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

    if (oldKey) {
      await s3.send(
        new DeleteObjectCommand({
          Bucket: AVATARS_BUCKET,
          Key: oldKey,
        }),
      )
    }

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
