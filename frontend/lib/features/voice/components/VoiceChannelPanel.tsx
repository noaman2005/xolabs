"use client"

import { useEffect, useMemo, useRef } from 'react'
import type { VoiceParticipant } from '../types'
import { useSpeakingIndicator } from '../useSpeakingIndicator'

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

  const speakingMap = useSpeakingIndicator(remoteStreams)

  if (!isConnected) {
    return (
      <div className="glass-panel smooth-transition flex flex-col rounded-0 px-4 py-6 lg:rounded-3xl lg:px-8 lg:py-8">
        <div className="mb-4 text-center">
          <div className="mb-2 text-base font-semibold text-gray-100 lg:text-lg">Join voice channel</div>
          <p className="mx-auto mb-4 max-w-sm text-xs text-gray-500 lg:text-sm">
            Connect with others in this channel using your microphone. You can leave or mute anytime.
          </p>
        </div>

        {participants.length > 0 && (
          <div className="mb-4">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">Currently in channel</p>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {uniqueParticipants.map((participant) => {
                const firstLetter = participant.email.charAt(0).toUpperCase()
                return (
                  <div
                    key={participant.connectionId}
                    className="flex flex-col items-center gap-1 text-center"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.06] text-sm font-semibold text-gray-100">
                      {firstLetter}
                    </div>
                    <span className="line-clamp-1 w-full truncate text-[10px] text-gray-400">{participant.email}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 max-w-sm rounded-lg border border-red-500/40 bg-red-900/40 px-4 py-2 text-xs text-red-100 lg:text-sm">
            {error}
          </div>
        )}

        <div className="mt-2 flex justify-center">
          <button
            onClick={onJoin}
            disabled={isLoading}
            className="rounded-lg bg-green-500 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-green-400 disabled:cursor-not-allowed disabled:bg-green-500/50 lg:px-8 lg:py-3"
          >
            {isLoading ? "Joining…" : "Join voice"}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-panel smooth-transition flex flex-1 flex-col rounded-0 px-4 py-6 lg:rounded-3xl lg:px-8 lg:py-6">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-white/[0.08] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-100 lg:text-base">Voice connected</h3>
          <p className="mt-1 text-[11px] text-gray-500">{participants.length} participant(s)</p>
        </div>
        <button
          onClick={onLeave}
          className="rounded-lg border border-red-500/40 bg-red-900/40 px-3 py-1.5 text-[11px] text-red-100 transition hover:bg-red-700/60 lg:text-xs"
        >
          Disconnect
        </button>
      </div>

      {/* Participants grid with large circles */}
      <div className="mb-4 flex-1 overflow-y-auto rounded-2xl border border-white/[0.06] bg-black/40 p-4 text-xs">
        {uniqueParticipants.length === 0 && (
          <div className="text-[11px] text-gray-500">No one is in this voice channel yet.</div>
        )}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {uniqueParticipants.map((participant) => {
            const isMuted = participant.isMuted
            const firstLetter = participant.email.charAt(0).toUpperCase()
            const isSpeaking = speakingMap[participant.connectionId]

            return (
              <div key={participant.connectionId} className="flex flex-col items-center text-center">
                <div
                  className={
                    'smooth-transition relative flex h-16 w-16 items-center justify-center rounded-full border-2 text-base font-semibold ' +
                    (isMuted
                      ? 'border-white/15 bg-white/[0.06] text-gray-300'
                      : isSpeaking
                      ? 'border-green-400 bg-green-600/80 text-white shadow-[0_0_0_3px_rgba(34,197,94,0.5)]'
                      : 'border-green-500/40 bg-green-700/80 text-white')
                  }
                >
                  {firstLetter}
                </div>
                <div className="mt-2 flex flex-col items-center gap-0.5">
                  <span className="line-clamp-1 w-full truncate text-[11px] text-gray-100">{participant.email}</span>
                  <span className="text-[10px] text-gray-500">
                    {isMuted ? 'Muted' : isSpeaking ? 'Speaking' : 'Listening'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-end gap-3 border-t border-white/[0.08] pt-3 text-[11px]">
        <button
          onClick={onToggleMute}
          className={`rounded-lg px-3 py-1.5 text-[11px] font-medium transition lg:px-4 lg:text-xs ${
            isMuted
              ? 'border border-red-500/40 bg-red-900/40 text-red-100 hover:bg-red-700/60'
              : 'border border-green-500/40 bg-green-900/30 text-green-100 hover:bg-green-700/60'
          }`}
        >
          {isMuted ? 'Unmute' : 'Mute'}
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
