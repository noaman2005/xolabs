import type { Task, TaskEvent } from './types'

interface TaskRoom {
  tasks: Map<string, Task>
  createdAt: number
}

export class TaskStore {
  private rooms: Map<string, TaskRoom> = new Map()
  private eventQueues: Map<string, TaskEvent[]> = new Map()

  private getRoomKey(workspaceId: string, channelId: string): string {
    return `TASKS#${workspaceId}#${channelId}`
  }

  private ensureRoom(workspaceId: string, channelId: string): TaskRoom {
    const key = this.getRoomKey(workspaceId, channelId)
    if (!this.rooms.has(key)) {
      this.rooms.set(key, {
        tasks: new Map(),
        createdAt: Date.now(),
      })
    }
    return this.rooms.get(key) as TaskRoom
  }

  upsertTask(task: Task): void {
    const room = this.ensureRoom(task.workspaceId, task.channelId)
    room.tasks.set(task.taskId, task)
  }

  deleteTask(workspaceId: string, channelId: string, taskId: string): void {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return
    room.tasks.delete(taskId)
  }

  getTasks(workspaceId: string, channelId: string): Task[] {
    const key = this.getRoomKey(workspaceId, channelId)
    const room = this.rooms.get(key)
    if (!room) return []
    return Array.from(room.tasks.values())
  }

  enqueueEvent(roomConnectionKey: string, event: TaskEvent): void {
    if (!this.eventQueues.has(roomConnectionKey)) {
      this.eventQueues.set(roomConnectionKey, [])
    }
    this.eventQueues.get(roomConnectionKey)!.push(event)
  }

  dequeueEvents(roomConnectionKey: string): TaskEvent[] {
    if (!this.eventQueues.has(roomConnectionKey)) {
      this.eventQueues.set(roomConnectionKey, [])
    }
    const events = this.eventQueues.get(roomConnectionKey) ?? []
    this.eventQueues.set(roomConnectionKey, [])
    return events
  }
}

export const taskStore = new TaskStore()
