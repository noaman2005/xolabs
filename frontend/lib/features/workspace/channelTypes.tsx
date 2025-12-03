export type ChannelType = 'text' | 'voice' | 'tasks' | 'board'

export const CHANNEL_TYPE_META: Record<ChannelType, { label: string; description: string; icon: string }> = {
  text: {
    label: 'Text',
    description: 'Send messages, images, files, memos.',
    icon: '#',
  },
  voice: {
    label: 'Voice',
    description: 'Drop into audio/video standups.',
    icon: '',
  },
  tasks: {
    label: 'Tasks',
    description: 'Kanban-style lists & assignments.',
    icon: '',
  },
  board: {
    label: 'Board',
    description: 'Freeform visual collaboration.',
    icon: '',
  },
}

export function ChannelTypeBadge({ type }: { type: ChannelType }) {
  const meta = CHANNEL_TYPE_META[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] uppercase tracking-wide text-gray-400">
      <span>{meta.icon}</span>
      {meta.label}
    </span>
  )
}
