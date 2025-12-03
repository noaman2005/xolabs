"use client"

import { useMemo, useState } from 'react'
import type { Task, TaskStatus, TaskPriority } from '../types'

interface TasksPanelProps {
  tasks: Task[]
  isLoading: boolean
  error: string | null
  onCreate: (input: { title: string; description?: string; dueDate?: string; priority?: TaskPriority }) => Promise<any>
  onUpdate: (input: { taskId: string; updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'dueDate' | 'priority'>> }) => Promise<any>
  onDelete: (taskId: string) => Promise<any>
}

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'in-progress', 'done']
const PRIORITY_OPTIONS: TaskPriority[] = ['low', 'medium', 'high']

export function TasksPanel({ tasks, isLoading, error, onCreate, onUpdate, onDelete }: TasksPanelProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | TaskStatus>('all')
  const [dueFilter, setDueFilter] = useState<'all' | 'today' | 'overdue'>('all')

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const title = String(formData.get('title') ?? '').trim()
    const description = String(formData.get('description') ?? '').trim()
    const dueDateRaw = String(formData.get('dueDate') ?? '').trim()
    const priorityRaw = String(formData.get('priority') ?? '').trim().toLowerCase()

    if (!title) return

    const priority = PRIORITY_OPTIONS.includes(priorityRaw as TaskPriority)
      ? (priorityRaw as TaskPriority)
      : undefined

    await onCreate({
      title,
      description: description || undefined,
      dueDate: dueDateRaw || undefined,
      priority,
    })
    form.reset()
  }

  const now = new Date()
  const todayKey = now.toISOString().slice(0, 10)

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false

      if (dueFilter === 'all') return true

      if (!task.dueDate) return false
      const dateKey = new Date(task.dueDate).toISOString().slice(0, 10)

      if (dueFilter === 'today') {
        return dateKey === todayKey
      }

      if (dueFilter === 'overdue') {
        return dateKey < todayKey
      }

      return true
    })
  }, [tasks, statusFilter, dueFilter, todayKey])

  function formatDuePill(task: Task): { label: string; variant: 'default' | 'overdue' | 'today' } | null {
    if (!task.dueDate) return null
    const date = new Date(task.dueDate)
    if (Number.isNaN(date.getTime())) return null
    const key = date.toISOString().slice(0, 10)
    const label = date.toLocaleDateString()
    if (key === todayKey) return { label: `Due today · ${label}`, variant: 'today' }
    if (key < todayKey) return { label: `Overdue · ${label}`, variant: 'overdue' }
    return { label: `Due · ${label}`, variant: 'default' }
  }

  function priorityClasses(priority: TaskPriority | null | undefined): string {
    switch (priority) {
      case 'high':
        return 'bg-red-900/40 text-red-200 border-red-700/60'
      case 'medium':
        return 'bg-amber-900/35 text-amber-100 border-amber-700/60'
      case 'low':
        return 'bg-emerald-900/30 text-emerald-100 border-emerald-700/50'
      default:
        return 'bg-white/5 text-gray-300 border-white/10'
    }
  }

  return (
    <div className="glass-panel smooth-transition flex flex-1 flex-col rounded-none px-4 py-6 lg:rounded-3xl lg:px-8 lg:py-6">
      <div className="mb-4 flex flex-col gap-3 border-b border-white/[0.06] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-100 lg:text-xl">Tasks</h3>
          <p className="text-xs text-gray-500">Track todos for this channel.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-gray-400">
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-500">Status</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[11px] text-gray-200 focus:border-green-500/60 focus:outline-none"
            >
              <option value="all">All</option>
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[10px] uppercase tracking-wide text-gray-500">Due</span>
            <select
              value={dueFilter}
              onChange={(e) => setDueFilter(e.target.value as any)}
              className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 text-[11px] text-gray-200 focus:border-green-500/60 focus:outline-none"
            >
              <option value="all">All</option>
              <option value="today">Today</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg border border-red-500/40 bg-red-900/30 px-3 py-2 text-xs text-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleCreate} className="mb-5 space-y-3 rounded-2xl border border-white/[0.06] bg-black/40 p-3 text-xs lg:p-4">
        <div className="flex flex-col gap-2 lg:flex-row">
          <input
            name="title"
            placeholder="New task title"
            className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-green-500/60 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              name="dueDate"
              type="date"
              className="w-32 rounded-lg border border-white/[0.08] bg-black/40 px-2 py-2 text-[11px] text-gray-100 focus:border-green-500/60 focus:outline-none"
            />
            <select
              name="priority"
              defaultValue=""
              className="w-28 rounded-lg border border-white/[0.08] bg-black/40 px-2 py-2 text-[11px] text-gray-100 focus:border-green-500/60 focus:outline-none"
            >
              <option value="">Priority</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <textarea
          name="description"
          placeholder="Optional description"
          className="w-full rounded-lg border border-white/[0.08] bg-black/40 px-3 py-2 text-xs text-gray-100 placeholder:text-gray-600 focus:border-green-500/60 focus:outline-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-green-500 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-green-500/50"
          >
            Add task
          </button>
        </div>
      </form>

      <div className="flex-1 overflow-y-auto space-y-2 text-sm">
        {isLoading && <div className="text-xs text-gray-500">Loading tasks…</div>}
        {!isLoading && filteredTasks.length === 0 && (
          <div className="text-xs text-gray-600">No tasks match the current filters.</div>
        )}

        {filteredTasks.map((task) => {
          const due = formatDuePill(task)
          return (
            <div
              key={task.taskId}
              className="smooth-transition flex flex-col gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.02] px-3 py-2 hover:bg-white/[0.04]"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="break-words text-xs font-semibold text-gray-100">{task.title}</div>
                  {task.description && (
                    <div className="mt-1 whitespace-pre-wrap break-words text-[11px] text-gray-400">{task.description}</div>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-1 text-[10px] text-gray-400">
                    <span className="rounded-full bg-white/[0.04] px-2 py-0.5 capitalize">Status: {task.status}</span>
                    {task.priority && (
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] capitalize ${priorityClasses(task.priority)}`}
                      >
                        Priority: {task.priority}
                      </span>
                    )}
                    {due && (
                      <span
                        className={
                          'rounded-full px-2 py-0.5 text-[10px]' +
                          (due.variant === 'overdue'
                            ? ' bg-red-900/40 text-red-200 border border-red-700/60'
                            : due.variant === 'today'
                            ? ' bg-amber-900/35 text-amber-100 border border-amber-700/60'
                            : ' bg-white/[0.04] text-gray-300 border border-white/10')
                        }
                      >
                        {due.label}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-row gap-2 sm:flex-col">
                  <select
                    className="rounded-md border border-white/[0.1] bg-black/40 px-2 py-1 text-[10px] text-gray-200 transition hover:bg-white/[0.06]"
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
                    className="rounded-md border border-red-500/40 bg-red-900/40 px-2 py-1 text-[10px] text-red-100 transition hover:bg-red-700/60"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
