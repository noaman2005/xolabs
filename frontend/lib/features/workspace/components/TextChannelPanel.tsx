"use client"

import { Smile, Paperclip } from "lucide-react"

export type TextChannelPanelProps = {
  messages: any[] | null | undefined
  isLoading: boolean
  messageText: string
  setMessageText: (value: string) => void
  onSend: () => void
  isSending: boolean
}

export function TextChannelPanel({
  messages,
  isLoading,
  messageText,
  setMessageText,
  onSend,
  isSending,
}: TextChannelPanelProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Message list */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {isLoading && (
          <div className="text-xs text-gray-500">Loading messages…</div>
        )}
        {!isLoading && (!messages || (Array.isArray(messages) && messages.length === 0)) && (
          <div className="flex h-full items-center justify-center text-center">
            <div className="text-sm text-gray-500">
              No messages yet. Start the conversation!
            </div>
          </div>
        )}
        {!isLoading &&
          Array.isArray(messages) &&
          messages.map((msg: any) => (
            <div
              key={msg.SK ?? msg.id}
              className="smooth-transition group rounded-2xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 hover:border-green-500/30 hover:bg-white/[0.06] sm:px-4 sm:py-3"
            >
              <div className="mb-1 flex items-center gap-2 text-xs text-gray-500 sm:mb-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.08] text-[11px] text-gray-300">
                    {(msg.authorEmail as string | undefined)?.[0]?.toUpperCase() ?? "?"}
                  </div>
                  <span className="font-semibold text-gray-300">{msg.authorEmail ?? "unknown"}</span>
                </div>
                <span>
                  {msg.createdAt
                    ? new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : ""}
                </span>
              </div>
              <div className="whitespace-pre-line rounded-2xl bg-white/[0.03] px-3 py-2 text-sm text-gray-100 sm:px-4 sm:py-2">
                {msg.text}
              </div>
            </div>
          ))}
      </div>

      {/* Message composer fixed to bottom of panel */}
      <form
        className="mt-auto space-y-2 border-t border-white/[0.06] pt-3 sm:space-y-3 sm:pt-4"
        onSubmit={(e) => {
          e.preventDefault()
          onSend()
        }}
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <div className="relative flex-1">
            <textarea
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your message…"
              className="smooth-transition h-20 w-full resize-none rounded-2xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-600 focus:border-green-500/50 focus:outline-none focus:ring-1 focus:ring-green-500/30 sm:h-16 sm:px-4 sm:py-3"
            />
            <div className="pointer-events-none absolute bottom-2 right-3 flex items-center gap-2 text-[10px] text-gray-500 sm:bottom-2.5 sm:right-4">
              <span className="pointer-events-auto cursor-pointer rounded-md bg-white/[0.06] p-1">
                <Smile className="h-3.5 w-3.5" />
              </span>
              <span className="pointer-events-auto cursor-pointer rounded-md bg-white/[0.06] p-1">
                <Paperclip className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
          <button
            type="submit"
            className="btn-accent flex h-10 items-center justify-center rounded-2xl px-5 text-sm disabled:cursor-not-allowed disabled:opacity-50 sm:h-11 sm:px-6"
            disabled={!messageText.trim() || isSending}
          >
            {isSending ? "Sending…" : "Send"}
          </button>
        </div>
        <p className="text-[10px] text-gray-600 sm:text-xs">
          Press <kbd className="rounded bg-white/[0.1] px-1.5 py-0.5">Enter</kbd> to send
        </p>
      </form>
    </div>
  )
}
