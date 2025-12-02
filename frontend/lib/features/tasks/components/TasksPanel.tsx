'use client'

import type { Task, TaskStatus } from '../types'

interface TasksPanelProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  onCreate: (input: { title: string; description?: string }) => Promise<any>
  onUpdate: (input: { taskId: string; updates: Partial<Pick<Task, 'title' | 'description' | 'status'>> }) => Promise<any>
  onDelete: (taskId: string) => Promise<any>
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'done']

export function TasksPanel({ tasks, isLoading, error, onCreate, onUpdate, onDelete }: TasksPanelProps) {
  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    if (!title) return
    await onCreate({ title, description: description || undefined })
    form.reset()
  }

  return (
    <div className="glass-panel smooth-transition flex flex-1 flex-col rounded-0 lg:rounded-3xl px-4 lg:px-8 py-6 animate-fade-in">
      <div className="mb-4 flex flex-col gap-2 border-b border-white/[0.08] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg lg:text-xl font-bold text-gray-100">Tasks</h3>
          <p className="text-xs text-gray-500">Track todos for this channel.</p>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-300">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-4 space-y-2 border-b border-white/[0.08] pb-3 text-sm">
        <input
          name="title"
          placeholder="New task title"
          className="w-full rounded-lg border border-white/[0.1] bg-white/[0.06] px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        <textarea
          name="description"
          placeholder="Optional description"
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="btn-accent px-4 py-1.5 text-xs active:animate-press"
          >
            Add Task
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 text-sm">
        {isLoading && <div className="text-xs text-gray-500">Loading tasks…</div>}
        {!isLoading && tasks.length === 0 && (
          <div className="text-xs text-gray-600">No tasks yet. Add one above.</div>
        )}

        {tasks.map((task) => (
          <div
            key={task.taskId}
            className="smooth-transition group flex flex-col gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 hover:bg-white/[0.06] animate-pop"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-100 break-words">{task.title}</div>
                {task.description && (
                  <div className="text-[11px] text-gray-400 whitespace-pre-wrap break-words mt-1">{task.description}</div>
                )}
                <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-gray-500">
                  <span className="rounded-full bg-white/[0.06] px-2 py-0.5">Status: {task.status}</span>
                  {task.assignedTo && (
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5">Assignee: {task.assignedTo}</span>
                  )}
                  {task.dueDate && (
                    <span className="rounded-full bg-white/[0.06] px-2 py-0.5">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-row gap-2 sm:flex-col">
                <select
                  className="rounded-md border border-white/[0.1] bg-white/[0.06] px-2 py-1 text-[10px] text-gray-200 smooth-transition hover:bg-white/[0.08]"
                  value={task.status}
                  onChange={(e) =>
                    onUpdate({ taskId: task.taskId, updates: { status: e.target.value as TaskStatus } })
                  }
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => onDelete(task.taskId)}
                  className="rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-[10px] text-red-300 hover:bg-red-500/20 smooth-transition active:animate-press"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
