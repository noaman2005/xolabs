import { NextRequest, NextResponse } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import type { VoiceEvent, VoiceParticipant } from '../../../../lib/features/voice/types'
import {
  registerParticipant,
  unregisterParticipant,
  listParticipants,
  updateParticipantMute,
  enqueueEvent,
  enqueueEventForRoom,
  dequeueEvents,
  getRoomForConnection,
} from '../../../../lib/features/voice/dynamodb'

const USER_POOL_ID =
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ??
  process.env.NEXT_PUBLIC_COGNITO_USER_POOL
const USER_POOL_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID

if (!USER_POOL_ID || !USER_POOL_CLIENT_ID) {
  throw new Error('NEXT_PUBLIC_COGNITO_USER_POOL_ID and NEXT_PUBLIC_COGNITO_CLIENT_ID must be set')
}

const verifier = CognitoJwtVerifier.create({
  userPoolId: USER_POOL_ID,
  tokenUse: 'id',
  clientId: USER_POOL_CLIENT_ID,
})

/**
 * Verify Cognito token from Authorization header
 */
async function verifyToken(authHeader: string | null): Promise<{ email: string; sub: string } | null> {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice('Bearer '.length)

  try {
    const payload = await verifier.verify(token)
    const email = typeof payload.email === 'string' ? payload.email : undefined
    if (!email) return null

    return {
      email,
      sub: payload.sub as string,
    }
  } catch (err) {
    console.error('token verification failed', err)
    return null
  }
}

async function broadcastToRoom(
  workspaceId: string,
  channelId: string,
  event: VoiceEvent,
  excludeConnectionId?: string,
): Promise<void> {
  await enqueueEventForRoom(workspaceId, channelId, event, excludeConnectionId)
}

async function sendEventToConnection(connectionId: string | undefined, event: VoiceEvent): Promise<void> {
  if (!connectionId) return
  await enqueueEvent(connectionId, event)
}

async function broadcastParticipantsUpdate(
  workspaceId: string,
  channelId: string,
  excludeConnectionId?: string,
): Promise<void> {
  const participants = await listParticipants(workspaceId, channelId)
  await broadcastToRoom(
    workspaceId,
    channelId,
    {
      type: 'participants_update',
      userId: 'system',
      workspaceId,
      channelId,
      data: participants,
      timestamp: Date.now(),
    },
    excludeConnectionId,
  )
}

/**
 * Handle WebSocket upgrade request
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const workspaceId = searchParams.get('workspaceId')
  const channelId = searchParams.get('channelId')
  const connectionId = searchParams.get('connectionId')
  const authHeader = request.headers.get('authorization')

  if (!workspaceId || !channelId || !connectionId) {
    return NextResponse.json(
      { error: 'workspaceId, channelId, and connectionId are required' },
      { status: 400 }
    )
  }

  const user = await verifyToken(authHeader)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const room = await getRoomForConnection(connectionId)
  if (!room || room.workspaceId !== workspaceId || room.channelId !== channelId) {
    return NextResponse.json(
      { error: 'Connection not registered in this room' },
      { status: 403 }
    )
  }

  const events = await dequeueEvents(connectionId)
  return NextResponse.json({ success: true, events })
}

/**
 * Handle signaling events (POST for HTTP-based signaling as fallback)
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const body = await request.json()

  const { workspaceId, channelId, type, data, connectionId } = body

  // Verify token
  const user = await verifyToken(authHeader)
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Validate inputs
  if (!workspaceId || !channelId || !type) {
    return NextResponse.json(
      { error: 'workspaceId, channelId, and type are required' },
      { status: 400 }
    )
  }

  const event: VoiceEvent = {
    type: type as any,
    userId: user.sub,
    workspaceId,
    channelId,
    connectionId,
    data,
    timestamp: Date.now(),
  }

  // Handle different event types
  switch (type) {
    case 'join_voice': {
      const participant: VoiceParticipant = {
        userId: user.sub,
        email: user.email,
        connectionId: connectionId || user.sub,
        isMuted: false,
        joinedAt: Date.now(),
      }

      await registerParticipant({ workspaceId, channelId, participant })

      // Broadcast user joined
      await broadcastToRoom(workspaceId, channelId, {
        type: 'user_joined',
        userId: user.sub,
        workspaceId,
        channelId,
        data: participant,
        timestamp: Date.now(),
      })

      await broadcastParticipantsUpdate(workspaceId, channelId)

      // Send current participants to the joining user
      const participants = await listParticipants(workspaceId, channelId)
      return NextResponse.json({
        success: true,
        participants,
      })
    }

    case 'leave_voice': {
      const targetConnectionId = connectionId || user.sub
      const result = await unregisterParticipant(targetConnectionId)

      if (result) {
        // Broadcast user left
        await broadcastToRoom(workspaceId, channelId, {
          type: 'user_left',
          userId: user.sub,
          workspaceId,
          channelId,
          data: result.participant,
          timestamp: Date.now(),
        })

        await broadcastParticipantsUpdate(workspaceId, channelId, targetConnectionId)
      }

      return NextResponse.json({ success: true })
    }

    case 'offer':
    case 'answer':
    case 'candidate': {
      // Relay signaling data to specific peer
      const targetConnectionId = data?.targetConnectionId
      await sendEventToConnection(targetConnectionId, event)
      return NextResponse.json({ success: true })
    }

    case 'mute':
    case 'unmute': {
      const isMuted = type === 'mute'
      await updateParticipantMute(workspaceId, channelId, connectionId || user.sub, isMuted)

      // Broadcast mute status change
      await broadcastToRoom(workspaceId, channelId, {
        type: isMuted ? 'mute' : 'unmute',
        userId: user.sub,
        workspaceId,
        channelId,
        data: { isMuted },
        timestamp: Date.now(),
      })

      await broadcastParticipantsUpdate(workspaceId, channelId)

      return NextResponse.json({ success: true })
    }

    case 'participants_update': {
      const participants = await listParticipants(workspaceId, channelId)
      return NextResponse.json({ success: true, participants })
    }

    default:
      return NextResponse.json(
        { error: 'Unknown event type' },
        { status: 400 }
      )
  }
}
