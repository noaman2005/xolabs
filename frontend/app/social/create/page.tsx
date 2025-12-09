"use client"

import { useState } from "react"

import { useAuth } from "../../../lib/hooks/useAuth"

type ChatMessage = {
  id: string
  role: "user" | "assistant"
  content: string
}

export default function SocialCreatePage() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m1",
      role: "assistant",
      content: "This will become your AI copilot for social posts. For now, it\'s just a local playground.",
    },
  ])
  const [input, setInput] = useState("")

  return (
    <>
      <section className="glass-panel grid min-h-[420px] gap-4 rounded-2xl border border-white/10 bg-gradient-to-br from-black/85 via-slate-900/80 to-indigo-950/60 p-4 text-sm md:grid-cols-[minmax(0,1.6fr),minmax(0,1.1fr)] md:p-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-gray-100">Social Copilot</h2>
              <p className="text-[11px] text-gray-400">Ask AI to help you draft posts, captions, and ideas.</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.12] text-xs font-semibold text-gray-100">
              {user?.email?.[0]?.toUpperCase() ?? "U"}
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-white/10 bg-black/60 p-3 text-xs shadow-inner">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-medium text-gray-300">Chat</p>
              <span className="text-[10px] text-gray-500">AI replies are mocked for now</span>
            </div>
            <div className="flex h-[260px] flex-col gap-2 overflow-y-auto pr-1">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12px] leading-snug ${
                      msg.role === "user" ? "bg-accent text-black" : "bg-white/[0.06] text-gray-100"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>

            <form
              className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2"
              onSubmit={(e) => {
                e.preventDefault()
                const trimmed = input.trim()
                if (!trimmed) return
                const userMsg: ChatMessage = {
                  id: `u-${Date.now()}`,
                  role: "user",
                  content: trimmed,
                }
                const assistantMsg: ChatMessage = {
                  id: `a-${Date.now()}`,
                  role: "assistant",
                  content: "(AI draft preview will appear here once integrated with the backend.)",
                }
                setMessages((curr) => [...curr, userMsg, assistantMsg])
                setInput("")
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for ideas, hooks, or caption suggestions..."
                className="flex-1 rounded-full border border-white/12 bg-black/70 px-3 py-2 text-[11px] text-gray-100 placeholder:text-gray-500 focus:border-accent focus:outline-none"
              />
              <button
                type="submit"
                className="smooth-transition rounded-full bg-accent px-3 py-1.5 text-[11px] font-semibold text-black disabled:cursor-not-allowed disabled:opacity-60"
                disabled={!input.trim()}
              >
                Send
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-white/8 bg-black/70 p-3 text-xs">
          <p className="text-[11px] font-semibold text-gray-200">How you'll use this</p>
          <ul className="list-disc space-y-1 pl-4 text-[11px] text-gray-400">
            <li>Generate post title & caption ideas tailored to your workspace.</li>
            <li>Refine drafts before sharing them on the main Social feed.</li>
            <li>Experiment with different tones (casual, professional, playful, etc.).</li>
          </ul>
          <p className="mt-2 text-[10px] text-gray-500">
            This page is frontend-only for now. Later we'll plug it into an AI backend and let you one-click
            send drafts into your Social feed composer.
          </p>
        </div>
      </section>
    </>
  )
}
