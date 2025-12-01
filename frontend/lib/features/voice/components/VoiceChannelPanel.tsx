'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { VoiceParticipant } from '../types'

interface VoiceChannelPanelProps {
  isConnected: boolean
  isMuted: boolean
  participants: VoiceParticipant[]
  localStream: MediaStream | null
  remoteStreams: Record<string, MediaStream>
  onJoin: () => Promise<void>
  onLeave: () => Promise<void>
  onToggleMute: () => Promise<void>
  isLoading?: boolean
  error?: string | null
}

export function VoiceChannelPanel({
  isConnected,
  isMuted,
  participants,
  localStream,
  remoteStreams,
  onJoin,
  onLeave,
  onToggleMute,
  isLoading = false,
  error = null,
}: VoiceChannelPanelProps) {
  const localAudioRef = useRef<HTMLAudioElement>(null)
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement | null>>({})

  const uniqueParticipants = useMemo(() => {
    const seen = new Set<string>()
    return participants.filter((participant) => {
      if (seen.has(participant.userId)) {
        return false
      }
      seen.add(participant.userId)
      return true
    })
  }, [participants])

  // Attach local stream
  useEffect(() => {
    if (localAudioRef.current && localStream) {
      localAudioRef.current.srcObject = localStream
    }
  }, [localStream])

  // Attach remote streams to rendered audio elements
  useEffect(() => {
    Object.entries(remoteStreams).forEach(([participantId, stream]) => {
      const audio = remoteAudioRefs.current[participantId]
      if (audio && stream) {
        if (audio.srcObject !== stream) {
          audio.srcObject = stream
        }
      }
    })
  }, [remoteStreams])

  if (!isConnected) {
    return (
      <div className="glass-panel smooth-transition flex flex-col items-center justify-center rounded-3xl px-8 py-12 text-center">
        <div className="mb-4 text-lg font-semibold text-gray-100">Join Voice Channel</div>
        <p className="mb-6 max-w-sm text-sm text-gray-500">
          Click below to join the voice channel and connect with other participants.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={onJoin}
          disabled={isLoading}
          className="btn-accent px-8 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Joining…' : '🔊 Join Voice'}
        </button>
      </div>
    )
  }

  return (
    <div className="glass-panel smooth-transition flex flex-col rounded-3xl px-8 py-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between border-b border-white/[0.08] pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-100">Voice Channel Active</h3>
          <p className="text-xs text-gray-600 mt-1">{participants.length} participant(s)</p>
        </div>
        <button
          onClick={onLeave}
          className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 smooth-transition"
        >
          Leave
        </button>
      </div>

      {/* Participants Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {uniqueParticipants.map((participant) => (
          <div
            key={participant.connectionId}
            className="flex flex-col items-center rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4"
          >
            <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-green-500/30 to-green-600/20 ring-1 ring-green-500/40">
              <span className="text-lg font-semibold text-green-400">
                {participant.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-300 text-center break-all">{participant.email}</p>
            <div className="mt-2 flex items-center gap-1">
              {participant.isMuted ? (
                <span className="text-[10px] text-red-400">🔇 Muted</span>
              ) : (
                <span className="text-[10px] text-green-400">🔊 Active</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 border-t border-white/[0.08] pt-4">
        <button
          onClick={onToggleMute}
          className={`smooth-transition rounded-lg px-6 py-2 text-sm font-medium ${
            isMuted
              ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300'
              : 'bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 hover:text-green-300'
          }`}
        >
          {isMuted ? '🔇 Unmute' : '🔊 Mute'}
        </button>
      </div>

      {/* Hidden audio elements */}
      <audio ref={localAudioRef} muted autoPlay playsInline />
      {Object.entries(remoteStreams).map(([participantId, stream]) => (
        <audio
          key={participantId}
          ref={(el) => {
            remoteAudioRefs.current[participantId] = el
            if (el && stream && el.srcObject !== stream) {
              el.srcObject = stream
            }
          }}
          autoPlay
          playsInline
        />
      ))}
    </div>
  )
}
