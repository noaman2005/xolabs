'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { VoiceEvent, VoiceEventType, VoiceParticipant } from './types'

const SIGNAL_URL = '/api/voice/signal'
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

interface UseWebRTCOptions {
  workspaceId: string
  channelId: string
  userId: string
  userEmail: string
  authToken: string
}

export function useWebRTC(options: UseWebRTCOptions) {
  const { workspaceId, channelId, userId, userEmail, authToken } = options

  const [participants, setParticipants] = useState<VoiceParticipant[]>([])
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isMuted, setIsMuted] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({})
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const connectionIdRef = useRef<string>(`${userId}-${Date.now()}`)
  const offersSentRef = useRef<Set<string>>(new Set())

  const sendSignalEvent = useCallback(
    async (type: VoiceEventType, payload?: Record<string, any>, targetConnectionId?: string) => {
      try {
        const data = targetConnectionId
          ? { ...(payload ?? {}), targetConnectionId }
          : payload

        await fetch(SIGNAL_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            workspaceId,
            channelId,
            connectionId: connectionIdRef.current,
            type,
            data,
          }),
        })
      } catch (err) {
        console.error(`sendSignalEvent:${type}`, err)
      }
    },
    [authToken, channelId, workspaceId],
  )

  const initializeLocalStream = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      localStreamRef.current = stream
      setLocalStream(stream)
      setError(null)

      return stream
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to access microphone'
      setError(message)
      console.error('getUserMedia error:', err)
      return null
    }
  }, [])

  const createPeerConnection = useCallback(
    (remoteConnectionId: string): RTCPeerConnection => {
      if (peerConnectionsRef.current[remoteConnectionId]) {
        return peerConnectionsRef.current[remoteConnectionId]
      }

      const peerConnection = new RTCPeerConnection({ iceServers: STUN_SERVERS })

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => {
          peerConnection.addTrack(track, localStreamRef.current!)
        })
      }

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0]
        setRemoteStreams((prev) => ({ ...prev, [remoteConnectionId]: stream }))
      }

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignalEvent('candidate', { candidate: event.candidate }, remoteConnectionId)
        }
      }

      peerConnection.onconnectionstatechange = () => {
        if (['failed', 'disconnected', 'closed'].includes(peerConnection.connectionState)) {
          peerConnection.close()
          delete peerConnectionsRef.current[remoteConnectionId]
          offersSentRef.current.delete(remoteConnectionId)
        }
      }

      peerConnectionsRef.current[remoteConnectionId] = peerConnection
      return peerConnection
    },
    [sendSignalEvent],
  )

  const makeOfferTo = useCallback(
    async (remoteConnectionId: string) => {
      if (remoteConnectionId === connectionIdRef.current) return
      if (offersSentRef.current.has(remoteConnectionId)) return

      const peerConnection = createPeerConnection(remoteConnectionId)

      try {
        const offer = await peerConnection.createOffer()
        await peerConnection.setLocalDescription(offer)
        await sendSignalEvent('offer', { sdp: offer.sdp }, remoteConnectionId)
        offersSentRef.current.add(remoteConnectionId)
      } catch (err) {
        console.error('makeOfferTo error', err)
      }
    },
    [createPeerConnection, sendSignalEvent],
  )

  const handleOffer = useCallback(
    async (event: VoiceEvent) => {
      const remoteConnectionId = event.connectionId
      if (!remoteConnectionId || remoteConnectionId === connectionIdRef.current) return

      const peerConnection = createPeerConnection(remoteConnectionId)
      const sdp = event.data?.sdp
      if (!sdp) return

      try {
        await peerConnection.setRemoteDescription({ type: 'offer', sdp })
        const answer = await peerConnection.createAnswer()
        await peerConnection.setLocalDescription(answer)
        await sendSignalEvent('answer', { sdp: answer.sdp }, remoteConnectionId)
        offersSentRef.current.add(remoteConnectionId)
      } catch (err) {
        console.error('handleOffer error', err)
      }
    },
    [createPeerConnection, sendSignalEvent],
  )

  const handleAnswer = useCallback(async (event: VoiceEvent) => {
    const remoteConnectionId = event.connectionId
    if (!remoteConnectionId) return

    const peerConnection = peerConnectionsRef.current[remoteConnectionId]
    if (!peerConnection) return

    const sdp = event.data?.sdp
    if (!sdp) return

    try {
      await peerConnection.setRemoteDescription({ type: 'answer', sdp })
    } catch (err) {
      console.error('handleAnswer error', err)
    }
  }, [])

  const handleCandidate = useCallback((event: VoiceEvent) => {
    const remoteConnectionId = event.connectionId
    const candidate = event.data?.candidate
    if (!remoteConnectionId || !candidate) return

    const peerConnection = peerConnectionsRef.current[remoteConnectionId]
    if (!peerConnection) return

    peerConnection.addIceCandidate(new RTCIceCandidate(candidate)).catch((err) => {
      console.error('addIceCandidate error', err)
    })
  }, [])

  const handleParticipantsUpdate = useCallback(
    (event: VoiceEvent) => {
      const nextParticipants = Array.isArray(event.data) ? event.data : []
      setParticipants(nextParticipants)
      nextParticipants.forEach((participant) => {
        if (participant.connectionId === connectionIdRef.current) return
        if (!peerConnectionsRef.current[participant.connectionId]) {
          createPeerConnection(participant.connectionId)
          makeOfferTo(participant.connectionId)
        }
      })
    },
    [createPeerConnection, makeOfferTo],
  )

  const handleEvent = useCallback(
    (event: VoiceEvent) => {
      switch (event.type) {
        case 'participants_update':
          handleParticipantsUpdate(event)
          break
        case 'offer':
          handleOffer(event)
          break
        case 'answer':
          handleAnswer(event)
          break
        case 'candidate':
          handleCandidate(event)
          break
        case 'user_joined':
          if (event.connectionId && event.connectionId !== connectionIdRef.current) {
            makeOfferTo(event.connectionId)
          }
          break
        case 'user_left': {
          const remoteConnectionId = event.data?.connectionId || event.connectionId
          if (remoteConnectionId) {
            const peerConnection = peerConnectionsRef.current[remoteConnectionId]
            if (peerConnection) {
              peerConnection.close()
              delete peerConnectionsRef.current[remoteConnectionId]
              offersSentRef.current.delete(remoteConnectionId)
            }
          }
          break
        }
        case 'mute':
        case 'unmute': {
          const remoteConnectionId = event.data?.connectionId || event.connectionId
          if (remoteConnectionId) {
            setParticipants((current) =>
              current.map((participant) =>
                participant.connectionId === remoteConnectionId
                  ? { ...participant, isMuted: event.data?.isMuted ?? participant.isMuted }
                  : participant,
              ),
            )
          }
          break
        }
        default:
          break
      }
    },
    [createPeerConnection, handleAnswer, handleCandidate, handleOffer, handleParticipantsUpdate, makeOfferTo],
  )

  const pollEvents = useCallback(async () => {
    try {
      const url = `${SIGNAL_URL}?workspaceId=${encodeURIComponent(workspaceId)}&channelId=${encodeURIComponent(
        channelId,
      )}&connectionId=${encodeURIComponent(connectionIdRef.current)}`

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to poll signaling events')
      }

      const payload = await response.json()
      const events: VoiceEvent[] = Array.isArray(payload.events) ? payload.events : []
      events.forEach((event) => handleEvent(event))
    } catch (err) {
      console.error('pollEvents error', err)
    }
  }, [authToken, channelId, handleEvent, workspaceId])

  const connectSignaling = useCallback(async () => {
    try {
      const stream = await initializeLocalStream()
      if (!stream) {
        setError('Failed to initialize microphone')
        return
      }

      const response = await fetch(SIGNAL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          type: 'join_voice',
          workspaceId,
          channelId,
          connectionId: connectionIdRef.current,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to join voice channel')
      }

      const { participants: initialParticipants } = await response.json()
      handleParticipantsUpdate({
        type: 'participants_update',
        workspaceId,
        channelId,
        userId,
        connectionId: connectionIdRef.current,
        timestamp: Date.now(),
        data: initialParticipants || [],
      })

      setIsConnected(true)
      setError(null)

      pollEvents()
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
      pollIntervalRef.current = setInterval(pollEvents, 2500)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect to voice channel'
      setError(message)
      console.error('connectSignaling error:', err)
    }
  }, [authToken, channelId, handleParticipantsUpdate, pollEvents, workspaceId, userId, initializeLocalStream])

  const leaveVoice = useCallback(async () => {
    try {
      await sendSignalEvent('leave_voice')

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
        pollIntervalRef.current = null
      }

      Object.values(peerConnectionsRef.current).forEach((pc) => pc.close())
      peerConnectionsRef.current = {}
      offersSentRef.current.clear()

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop())
        localStreamRef.current = null
      }

      setLocalStream(null)
      setRemoteStreams({})
      setIsConnected(false)
      setIsMuted(false)
    } catch (err) {
      console.error('leaveVoice error:', err)
    }
  }, [sendSignalEvent])

  const toggleMute = useCallback(async () => {
    if (!localStreamRef.current) return

    const nextMutedState = !isMuted
    localStreamRef.current.getAudioTracks().forEach((track) => {
      track.enabled = !nextMutedState
    })

    setIsMuted(nextMutedState)
    await sendSignalEvent(nextMutedState ? 'mute' : 'unmute', { isMuted: nextMutedState })
  }, [isMuted, sendSignalEvent])

  useEffect(() => {
    return () => {
      if (isConnected) {
        leaveVoice()
      }
    }
  }, [isConnected, leaveVoice])

  return {
    participants,
    localStream,
    remoteStreams,
    isMuted,
    isConnected,
    error,
    joinVoice: connectSignaling,
    leaveVoice,
    toggleMute,
  }
}
