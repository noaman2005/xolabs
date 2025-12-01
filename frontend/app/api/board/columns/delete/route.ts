import { NextRequest, NextResponse } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { assertWorkspaceMember, deleteColumn, getBoard } from '../../../../../lib/features/board/dynamodb'
import { boardStore } from '../../../../../lib/features/board/store'
import type { BoardEvent } from '../../../../../lib/features/board/types'

const USER_POOL_ID =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ??
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL
const USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error('NEXT_PUBLIC_COGNITO_USER_POOL_ID/NEXT_PUBLIC_COGNITO_USER_POOL and NEXT_PUBLIC_COGNITO_CLIENT_ID must be set')
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: USER_POOL_CLIENT_ID,
})

async function requireUser(request: NextRequest): Promise<{ email: string; sub: string }> {
  const header = request.headers.get('authorization') || request.headers.get('Authorization')
  if (!header || !header.startsWith('Bearer ')) {
    throw Object.assign(new Error('Missing Authorization header'), { statusCode: 401 })
  }
  const token = header.slice('Bearer '.length)
  try {
    const payload = await verifier.verify(token)
    const email = typeof payload.email === 'string' ? payload.email : undefined
    if (!email) {
      throw new Error('Token missing email claim')
    }
    return { email, sub: payload.sub as string }
  } catch (err) {
    console.error('token verification failed', err)
    throw Object.assign(new Error('Invalid token'), { statusCode: 401 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const channelId = searchParams.get('channelId')
    const columnId = searchParams.get('columnId')

    if (!workspaceId || !channelId || !columnId) {
      return NextResponse.json(
        { error: 'workspaceId, channelId and columnId are required' },
        { status: 400 },
      )
    }

    await assertWorkspaceMember(workspaceId, user.email)

    await deleteColumn({ workspaceId, channelId, columnId })

    const roomKey = `BOARD#${workspaceId}#${channelId}`
    const baseEvent: Omit<BoardEvent, 'type'> = {
      workspaceId,
      channelId,
      timestamp: Date.now(),
    }

    boardStore.enqueueEvent(roomKey, {
      ...baseEvent,
      type: 'column_deleted',
    })

    const { columns, cards } = await getBoard(workspaceId, channelId)
    boardStore.enqueueEvent(roomKey, {
      ...baseEvent,
      type: 'board_snapshot',
      columns,
      cards,
    })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err: any) {
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500
    const message = err?.message || 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}
