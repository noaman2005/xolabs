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
      <div className="glass-panel smooth-transition flex flex-col items-center justify-center rounded-0 lg:rounded-3xl px-4 lg:px-8 py-8 lg:py-12 text-center animate-fade-in">
        <div className="mb-4 text-base lg:text-lg font-semibold text-gray-100">Join Voice Channel</div>
        <p className="mb-6 max-w-sm text-xs lg:text-sm text-gray-500">
          Click below to join the voice channel and connect with other participants.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs lg:text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          onClick={onJoin}
          disabled={isLoading}
          className="btn-accent px-6 lg:px-8 py-2 lg:py-3 text-sm active:animate-press disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Joining…' : '🔊 Join Voice'}
        </button>
      </div>
    )
  }

  return (
    <div className="glass-panel smooth-transition flex flex-col rounded-0 lg:rounded-3xl px-4 lg:px-8 py-6 animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base lg:text-lg font-bold text-gray-100">Voice Channel Active</h3>
          <p className="text-xs text-gray-600 mt-1">{participants.length} participant(s)</p>
        </div>
        <button
          onClick={onLeave}
          className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-xs lg:text-sm text-red-400 hover:bg-red-500/20 hover:text-red-300 smooth-transition active:animate-press"
        >
          Leave
        </button>
      </div>

      {/* Participants Grid */}
      <div className="mb-6 grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
        {uniqueParticipants.map((participant) => {
          const isMuted = participant.isMuted
          const firstLetter = participant.email.charAt(0).toUpperCase()

          return (
            <div
              key={participant.connectionId}
              className={
                'smooth-transition flex flex-col items-center rounded-xl border p-3 text-center animate-pop ' +
                (isMuted
                  ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                  : 'border-green-500/60 bg-green-500/5 shadow-[0_0_18px_rgba(34,197,94,0.5)] hover:bg-green-500/10')
              }
            >
              <div
                className={
                  'mb-2 flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ' +
                  (isMuted
                    ? 'bg-white/[0.08] text-gray-300'
                    : 'bg-gradient-to-br from-green-500/40 to-green-500/20 text-white')
                }
              >
                {firstLetter}
              </div>
              <p className="text-[10px] font-semibold text-gray-300 break-all line-clamp-2">{participant.email}</p>
              <div className="mt-2 flex items-center justify-center gap-1 text-[10px]">
                <span className={isMuted ? 'text-red-400' : 'text-green-300'}>
                  {isMuted ? '🔇' : '🎙️'}
                </span>
                <span className="text-gray-500">{isMuted ? 'Muted' : 'Live'}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-2 items-center justify-center border-t border-white/[0.08] pt-4 sm:flex-row">
        <button
          onClick={onToggleMute}
          className={`smooth-transition rounded-lg px-4 lg:px-6 py-2 text-xs lg:text-sm font-medium active:animate-press ${
            isMuted
              ? 'bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300'
              : 'bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20'
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
