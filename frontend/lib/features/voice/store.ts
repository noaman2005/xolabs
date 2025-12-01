import type { VoiceParticipant, VoiceEvent } from './types'

/**
 * In-memory store for voice channel presence and signaling.
 * Structure: ROOM = `VOICE#${workspaceId}#${channelId}`
 * participants[ROOM] = { connectionId → VoiceParticipant }
 */

interface VoiceRoom {
  participants: Record<string, VoiceParticipant>
  createdAt: number
}

class VoiceStore {
  private rooms: Map<string, VoiceRoom> = new Map()
  private connectionToRoom: Map<string, string> = new Map()
  private eventQueues: Map<string, VoiceEvent[]> = new Map()

  /**
   * Register a participant in a room
   */
  registerParticipant(
    workspaceId: string,
    channelId: string,
    connectionId: string,
    participant: VoiceParticipant
  ): void {
    const room = this.getRoomKey(workspaceId, channelId)
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, {
        participants: {},
        createdAt: Date.now(),
      })
    }

    const roomData = this.rooms.get(room)!
    roomData.participants[connectionId] = participant
    this.connectionToRoom.set(connectionId, room)
    this.ensureQueue(connectionId)
  }

  /**
   * Unregister a participant from a room
   */
  unregisterParticipant(connectionId: string): { room: string; participant: VoiceParticipant } | null {
    const room = this.connectionToRoom.get(connectionId)
    if (!room) return null

    const roomData = this.rooms.get(room)
    if (!roomData) return null

    const participant = roomData.participants[connectionId]
    delete roomData.participants[connectionId]
    this.connectionToRoom.delete(connectionId)
    this.eventQueues.delete(connectionId)

    // Clean up empty rooms
    if (Object.keys(roomData.participants).length === 0) {
      this.rooms.delete(room)
    }

    return { room, participant }
  }

  /**
   * Get all participants in a room
   */
  getParticipants(workspaceId: string, channelId: string): VoiceParticipant[] {
    const room = this.getRoomKey(workspaceId, channelId)
    const roomData = this.rooms.get(room)
    if (!roomData) return []
    return Object.values(roomData.participants)
  }

  /**
   * Get a specific participant
   */
  getParticipant(workspaceId: string, channelId: string, connectionId: string): VoiceParticipant | null {
    const room = this.getRoomKey(workspaceId, channelId)
    const roomData = this.rooms.get(room)
    if (!roomData) return null
    return roomData.participants[connectionId] || null
  }

  /**
   * Get all connections in a room (excluding a specific connection)
   */
  getConnectionsInRoom(workspaceId: string, channelId: string, excludeConnectionId?: string): string[] {
    const room = this.getRoomKey(workspaceId, channelId)
    const roomData = this.rooms.get(room)
    if (!roomData) return []
    
    return Object.keys(roomData.participants).filter(
      (connId) => !excludeConnectionId || connId !== excludeConnectionId
    )
  }

  enqueueEventForRoom(
    workspaceId: string,
    channelId: string,
    event: VoiceEvent,
    excludeConnectionId?: string
  ) {
    const connectionIds = this.getConnectionsInRoom(workspaceId, channelId, excludeConnectionId)
    connectionIds.forEach((connId) => this.enqueueEvent(connId, event))
  }

  enqueueEvent(connectionId: string, event: VoiceEvent) {
    this.ensureQueue(connectionId)
    this.eventQueues.get(connectionId)!.push(event)
  }

  dequeueEvents(connectionId: string): VoiceEvent[] {
    this.ensureQueue(connectionId)
    const events = this.eventQueues.get(connectionId) ?? []
    this.eventQueues.set(connectionId, [])
    return events
  }

  private ensureQueue(connectionId: string) {
    if (!this.eventQueues.has(connectionId)) {
      this.eventQueues.set(connectionId, [])
    }
  }

  /**
   * Get the room for a connection
   */
  getRoomForConnection(connectionId: string): { workspaceId: string; channelId: string } | null {
    const room = this.connectionToRoom.get(connectionId)
    if (!room) return null
    
    const match = room.match(/^VOICE#(.+)#(.+)$/)
    if (!match) return null
    
    return {
      workspaceId: match[1],
      channelId: match[2],
    }
  }

  /**
   * Update participant mute status
   */
  updateParticipantMute(workspaceId: string, channelId: string, connectionId: string, isMuted: boolean): void {
    const room = this.getRoomKey(workspaceId, channelId)
    const roomData = this.rooms.get(room)
    if (!roomData) return
    
    const participant = roomData.participants[connectionId]
    if (participant) {
      participant.isMuted = isMuted
    }
  }

  private getRoomKey(workspaceId: string, channelId: string): string {
    return `VOICE#${workspaceId}#${channelId}`
  }
}

// Singleton instance
export const voiceStore = new VoiceStore()
