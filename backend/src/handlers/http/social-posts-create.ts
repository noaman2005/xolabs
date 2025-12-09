import type { APIGatewayProxyHandlerV2 } from 'aws-lambda'
import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { v4 as uuid } from 'uuid'
import { requireUser, UnauthorizedError } from '../../lib/auth/requireUser.js'

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}))
const s3 = new S3Client({})

const TABLE_NAME = process.env.TABLE_NAME as string
const AVATARS_BUCKET = process.env.AVATARS_BUCKET as string | undefined

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = await requireUser(event)
    const body = event.body ? JSON.parse(event.body) : {}

    const title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null
    const caption = typeof body.caption === 'string' && body.caption.trim() ? body.caption.trim() : ''

    if (!title) {
      return {
        statusCode: 400,
        headers: {
          'content-type': 'application/json',
          'access-control-allow-origin': '*',
        },
        body: JSON.stringify({ message: 'title is required' }),
      }
    }

    let imageUrl: string | null = null

    if (AVATARS_BUCKET && body.image && typeof body.image === 'object') {
      const fileNameRaw =
        typeof body.image.fileName === 'string' && body.image.fileName.trim()
          ? (body.image.fileName as string)
          : null
      const contentType =
        typeof body.image.contentType === 'string' && body.image.contentType.trim()
          ? (body.image.contentType as string)
          : null
      const data = typeof body.image.data === 'string' && body.image.data.trim() ? (body.image.data as string) : null

      if (fileNameRaw && contentType && data) {
        const safeFileName = fileNameRaw.replace(/[^a-zA-Z0-9_.-]/g, '_')
        const key = `social/posts/${user.sub}/${Date.now()}-${safeFileName}`
        const buffer = Buffer.from(data, 'base64')

        await s3.send(
          new PutObjectCommand({
            Bucket: AVATARS_BUCKET,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          }),
        )

        imageUrl = `https://${AVATARS_BUCKET}.s3.amazonaws.com/${key}`
      }
    }

    const id = uuid()
    const now = new Date().toISOString()

    const item = {
      PK: 'SOCIAL',
      SK: `POST#${id}`,
      id,
      title,
      caption,
      imageUrl,
      authorSub: user.sub,
      authorEmail: user.email,
      createdAt: now,
      updatedAt: now,
      likeCount: 0,
      commentCount: 0,
    }

    await ddb.send(
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
    console.error('create social post error', err)
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
