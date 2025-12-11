import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { DynamoDBClient } from "@aws-sdk/client-dynamodb"
import { DynamoDBDocumentClient, GetCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb"
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3"
import { CognitoJwtVerifier } from "aws-jwt-verify"

const TABLE_NAME = process.env.TABLE_NAME
const BUCKET = process.env.PROJECTS_BUCKET

const region = process.env.AWS_REGION || process.env.NEXT_PUBLIC_AWS_REGION

const ddbClient = DynamoDBDocumentClient.from(
  new DynamoDBClient({
    region,
    credentials:
      process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
        ? {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined,
  })
)

const s3Client =
  BUCKET && region
    ? new S3Client({
        region,
        credentials:
          process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
            ? {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
              }
            : undefined,
      })
    : null

function getUserId(request: Request) {
  const userId =
    request.headers.get("x-user-id") ||
    request.headers.get("x-user-email") ||
    request.headers.get("x-user") ||
    request.headers.get("x-forwarded-user")
  return userId
}

const verifier =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL && process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID
    ? CognitoJwtVerifier.create({
        userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL,
        tokenUse: "id",
        clientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID,
      })
    : null

async function getAuthUser(request: Request) {
  // Check cookies first (matches POST route behavior)
  try {
    const store = await cookies()
    const idToken = store.get("idToken")?.value
    if (idToken && verifier) {
      try {
        const payload = await verifier.verify(idToken)
        return { id: payload.sub, email: (payload.email as string) || payload.sub }
      } catch (err) {
        console.warn("cookie token verify failed", err)
      }
    }
    const session =
      store.get("__Secure-next-auth.session-token")?.value || store.get("next-auth.session-token")?.value
    if (session) {
      return { id: session, email: session }
    }
    const gh = store.get("GITHUB_TOKEN")?.value
    if (gh) {
      return { id: gh, email: gh }
    }
  } catch (err) {
    console.warn("cookie read failed", err)
  }

  // Fallback to Authorization header
  const auth = request.headers.get("authorization") || ""
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null
  if (token && verifier) {
    try {
      const payload = await verifier.verify(token)
      return { id: payload.sub, email: (payload.email as string) || payload.sub }
    } catch (err) {
      console.warn("token verify failed", err)
    }
  }

  const legacy = getUserId(request)
  return legacy ? { id: legacy, email: legacy } : null
}

async function uploadDataUrl(dataUrl: string, key: string) {
  if (!s3Client || !BUCKET) return dataUrl
  if (!dataUrl.startsWith("data:")) return dataUrl
  const matches = dataUrl.match(/^data:(.+);base64,(.*)$/)
  if (!matches) return dataUrl
  const contentType = matches[1]
  const base64 = matches[2]
  const buffer = Buffer.from(base64, "base64")
  await s3Client.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  )
  return `https://${BUCKET}.s3.${region}.amazonaws.com/${key}`
}

function extractKeyFromUrl(url?: string) {
  if (!url || !BUCKET) return null
  try {
    const u = new URL(url)
    const path = u.pathname.startsWith("/") ? u.pathname.slice(1) : u.pathname
    if (path.startsWith(BUCKET)) {
      // in case path contains bucket
      return path.replace(`${BUCKET}/`, "")
    }
    return path
  } catch {
    return null
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!TABLE_NAME) {
    return NextResponse.json({ error: "Missing TABLE_NAME env" }, { status: 500 })
  }
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  const existing = await ddbClient.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: {
        PK: `PROJECT#${user.id}`,
        SK: `PROJECT#${id}`,
      },
    })
  )

  if (!existing.Item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let body: any = {}
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const title = typeof body.title === "string" ? body.title.trim() : ""
  const description = typeof body.description === "string" ? body.description.trim() : ""
  const projectUrl = typeof body.projectUrl === "string" ? body.projectUrl.trim() : ""
  if (!title || !description || !projectUrl) {
    return NextResponse.json({ error: "title, description, projectUrl are required" }, { status: 400 })
  }

  const createdAt = existing.Item.createdAt || new Date().toISOString()
  const updatedAt = new Date().toISOString()

  const coverImage = typeof body.coverImage === "string" ? body.coverImage : undefined
  const screenshots = Array.isArray(body.screenshots) ? body.screenshots : []

  const coverUrl = coverImage ? await uploadDataUrl(coverImage, `projects/${user.id}/${id}/cover`) : undefined
  const screenshotUrls = await Promise.all(
    screenshots.map(async (img: string, idx: number) => uploadDataUrl(img, `projects/${user.id}/${id}/ss-${idx}`))
  )

  const item = {
    PK: `PROJECT#${user.id}`,
    SK: `PROJECT#${id}`,
    id,
    title,
    description,
    tags: Array.isArray(body.tags) ? body.tags : [],
    techStack: Array.isArray(body.techStack) ? body.techStack : [],
    projectUrl,
    githubUrl: typeof body.githubUrl === "string" ? body.githubUrl : undefined,
    createdAt,
    updatedAt,
    coverImage: coverUrl,
    screenshots: screenshotUrls,
    status: body.status === "Completed" ? "Completed" : "In progress",
    features: Array.isArray(body.features) ? body.features : [],
    links: Array.isArray(body.links) ? body.links : [],
    notes: typeof body.notes === "string" ? body.notes : undefined,
    progress: typeof body.progress === "number" ? Math.max(0, Math.min(100, body.progress)) : undefined,
  }

  try {
    await ddbClient.send(
      new PutCommand({
        TableName: TABLE_NAME,
        Item: item,
      })
    )
    return NextResponse.json(item, { status: 200 })
  } catch (err) {
    console.error("update project error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!TABLE_NAME) {
    return NextResponse.json({ error: "Missing TABLE_NAME env" }, { status: 500 })
  }
  const user = await getAuthUser(request)
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { id } = await params
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 })
  }

  try {
    const existing = await ddbClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PROJECT#${user.id}`,
          SK: `PROJECT#${id}`,
        },
      })
    )
    if (!existing.Item) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const coverKey = extractKeyFromUrl(existing.Item.coverImage)
    const screenshotKeys = Array.isArray(existing.Item.screenshots)
      ? existing.Item.screenshots.map((s: string) => extractKeyFromUrl(s)).filter(Boolean)
      : []

    await ddbClient.send(
      new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `PROJECT#${user.id}`,
          SK: `PROJECT#${id}`,
        },
      })
    )

    if (s3Client && BUCKET) {
      if (coverKey) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: coverKey,
          })
        )
      }
      for (const key of screenshotKeys) {
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET,
            Key: key as string,
          })
        )
      }
    }

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error("delete project error", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
