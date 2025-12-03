import { NextRequest, NextResponse } from 'next/server'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { createTask, assertWorkspaceMember } from '../../../../lib/features/tasks/dynamodb'
import { taskStore } from '../../../../lib/features/tasks/store'
import type { TaskEvent, TaskPriority } from '../../../../lib/features/tasks/types'

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

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser(request)
    const body = await request.json()
    const { workspaceId, channelId, title, description, assignedTo, dueDate, priority } = body ?? {}

    if (!workspaceId || !channelId || !title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { error: 'workspaceId, channelId and title are required' },
        { status: 400 },
      )
    }

    await assertWorkspaceMember(workspaceId, user.email)

    let normalizedPriority: TaskPriority | undefined
    if (typeof priority === 'string') {
      const lower = priority.toLowerCase()
      if (lower === 'low' || lower === 'medium' || lower === 'high') {
        normalizedPriority = lower as TaskPriority
      }
    }

    const task = await createTask({
      workspaceId,
      channelId,
      title: title.trim(),
      description: typeof description === 'string' ? description : undefined,
      assignedTo: typeof assignedTo === 'string' ? assignedTo : undefined,
      dueDate: typeof dueDate === 'string' ? dueDate : undefined,
      priority: normalizedPriority,
    })

    taskStore.upsertTask(task)

    const roomKey = `TASKS#${workspaceId}#${channelId}`
    const baseEvent: Omit<TaskEvent, 'type'> = {
      workspaceId,
      channelId,
      timestamp: Date.now(),
    }

    taskStore.enqueueEvent(roomKey, {
      ...baseEvent,
      type: 'task_created',
      task,
    })
    taskStore.enqueueEvent(roomKey, {
      ...baseEvent,
      type: 'tasks_snapshot',
      tasks: [task],
    })

    return NextResponse.json(task, { status: 201 })
  } catch (err: any) {
    const status = typeof err?.statusCode === 'number' ? err.statusCode : 500
    const message = err?.message || 'Internal error'
    return NextResponse.json({ error: message }, { status })
  }
}
