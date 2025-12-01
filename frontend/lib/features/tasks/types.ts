export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  taskId: string
  workspaceId: string
  channelId: string
  title: string
  description?: string
  status: TaskStatus
  assignedTo?: string | null
  dueDate?: string | null
  createdAt: string
  updatedAt: string
}

export type TaskEventType = 'task_created' | 'task_updated' | 'task_deleted' | 'tasks_snapshot'

export interface TaskEvent {
  type: TaskEventType
  workspaceId: string
  channelId: string
  task?: Task
  tasks?: Task[]
  timestamp: number
}
