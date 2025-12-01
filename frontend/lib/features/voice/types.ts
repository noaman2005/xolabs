export type VoiceEventType =
  | 'join_voice'
  | 'leave_voice'
  | 'offer'
  | 'answer'
  | 'candidate'
  | 'mute'
  | 'unmute'
  | 'user_joined'
  | 'user_left'
  | 'participants_update'

export interface VoiceEvent {
  type: VoiceEventType
  userId: string
  workspaceId: string
  channelId: string
  connectionId?: string
  data?: any
  timestamp: number
}

export interface VoiceParticipant {
  userId: string
  email: string
  connectionId: string
  isMuted: boolean
  joinedAt: number
}

export interface VoiceRoomState {
  workspaceId: string
  channelId: string
  participants: Record<string, VoiceParticipant>
  localStream: MediaStream | null
  remoteStreams: Record<string, MediaStream>
  peerConnections: Record<string, RTCPeerConnection>
  isMuted: boolean
  isConnected: boolean
}

