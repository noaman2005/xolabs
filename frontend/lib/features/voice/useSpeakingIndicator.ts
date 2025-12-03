"use client"

import { useEffect, useRef, useState } from "react"

// Simple speaking detector based on audio level from MediaStreams.
// Returns a map of participantId -> isSpeaking.
export function useSpeakingIndicator(streams: Record<string, MediaStream>) {
  const [speaking, setSpeaking] = useState<Record<string, boolean>>({})

  const audioContextsRef = useRef<Record<string, { ctx: AudioContext; analyser: AnalyserNode; source: MediaStreamAudioSourceNode }>>({})
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    // Clean up removed streams
    Object.keys(audioContextsRef.current).forEach((id) => {
      if (!streams[id]) {
        const entry = audioContextsRef.current[id]
        entry.source.disconnect()
        entry.analyser.disconnect()
        entry.ctx.close()
        delete audioContextsRef.current[id]
      }
    })

    // Attach analysers for new streams
    Object.entries(streams).forEach(([id, stream]) => {
      if (!stream) return
      if (audioContextsRef.current[id]) return

      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)
        audioContextsRef.current[id] = { ctx, analyser, source }
      } catch {
        // ignore if AudioContext fails
      }
    })

    const update = () => {
      const next: Record<string, boolean> = {}
      Object.entries(audioContextsRef.current).forEach(([id, entry]) => {
        const { analyser } = entry
        const data = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(data)
        let sum = 0
        for (let i = 0; i < data.length; i++) sum += data[i]
        const avg = sum / data.length
        // Threshold tuned for voice; may need tweaks
        next[id] = avg > 40
      })
      setSpeaking(next)
      rafRef.current = window.requestAnimationFrame(update)
    }

    if (Object.keys(audioContextsRef.current).length > 0 && rafRef.current === null) {
      rafRef.current = window.requestAnimationFrame(update)
    }

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      Object.values(audioContextsRef.current).forEach(({ ctx, source, analyser }) => {
        source.disconnect()
        analyser.disconnect()
        ctx.close()
      })
      audioContextsRef.current = {}
    }
  }, [streams])

  return speaking
}
