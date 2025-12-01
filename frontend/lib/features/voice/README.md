# Voice Channel Feature

This directory contains the complete implementation of real-time voice channels for XO Labs.

## Structure

```
voice/
├── types.ts              # TypeScript interfaces for voice events, participants, and room state
├── store.ts              # In-memory presence store (connection registry, participant tracking)
├── useWebRTC.ts          # React hook for WebRTC peer connections and signaling
├── components/
│   └── VoiceChannelPanel.tsx  # UI component for voice channel interface
└── README.md             # This file
```

## How It Works

### Backend Signaling (`app/api/voice/signal/route.ts`)

The signaling endpoint handles:
- **Authentication**: Verifies Cognito ID token from Authorization header
- **Connection Registry**: Maintains in-memory store of active connections per room
- **Event Routing**: Broadcasts signaling events (offer, answer, candidate) only to participants in the same room
- **Presence Management**: Tracks join/leave events and participant mute status

**Room Key Format**: `VOICE#${workspaceId}#${channelId}`

### Frontend WebRTC Hook (`useWebRTC.ts`)

The hook manages:
- **Local Media**: Initializes microphone stream with echo cancellation and noise suppression
- **Peer Connections**: Creates RTCPeerConnection per participant with STUN servers
- **Signaling**: Sends/receives SDP offers, answers, and ICE candidates via HTTP POST
- **Mute Control**: Toggles local audio tracks and broadcasts mute status
- **Stream Management**: Attaches remote audio tracks and cleans up on disconnect

**STUN Servers**: Google's public STUN servers (stun.l.google.com, stun1.l.google.com)

### UI Component (`VoiceChannelPanel.tsx`)

Displays:
- Join/Leave controls
- Participant list with mute indicators
- Mute/Unmute button
- Error messages

## Event Types

| Event | Direction | Purpose |
|-------|-----------|---------|
| `join_voice` | Client → Server | Join a voice channel |
| `leave_voice` | Client → Server | Leave a voice channel |
| `offer` | Client → Server → Client | WebRTC SDP offer |
| `answer` | Client → Server → Client | WebRTC SDP answer |
| `candidate` | Client → Server → Client | WebRTC ICE candidate |
| `mute` | Client → Server → Broadcast | User muted microphone |
| `unmute` | Client → Server → Broadcast | User unmuted microphone |
| `user_joined` | Server → Broadcast | User joined the room |
| `user_left` | Server → Broadcast | User left the room |
| `participants_update` | Server → Client | Current participant list |

## Integration with Workspace Page

In `app/dashboard/[workspaceId]/page.tsx`:

1. Check if `activeChannel.type === 'voice'`
2. Import and render `VoiceChannelPanel` instead of text composer
3. Pass `useWebRTC` hook state and methods to the panel
4. Disable text composer for non-text channels

Example:
```tsx
import { useWebRTC } from '@/lib/features/voice/useWebRTC'
import { VoiceChannelPanel } from '@/lib/features/voice/components/VoiceChannelPanel'

// Inside component:
const voiceState = useWebRTC({
  workspaceId,
  channelId: activeChannelId,
  userId: user?.email || '',
  userEmail: user?.email || '',
  authToken: idToken,
})

if (activeChannel?.type === 'voice') {
  return (
    <VoiceChannelPanel
      isConnected={voiceState.isConnected}
      isMuted={voiceState.isMuted}
      participants={voiceState.participants}
      localStream={voiceState.localStream}
      remoteStreams={voiceState.remoteStreams}
      onJoin={voiceState.joinVoice}
      onLeave={voiceState.leaveVoice}
      onToggleMute={voiceState.toggleMute}
      error={voiceState.error}
    />
  )
}
```

## Installation & Setup

1. **Install dependencies** (frontend):
   ```bash
   npm install aws-jwt-verify
   ```

2. **Environment variables** (frontend `.env.local`):
   ```
   NEXT_PUBLIC_COGNITO_USER_POOL_ID=us-east-1_xxxxx
   NEXT_PUBLIC_COGNITO_CLIENT_ID=xxxxx
   ```

3. **For production**: Replace HTTP-based signaling with a custom WebSocket server using the `ws` library or similar.

## Limitations & Future Work

- **HTTP-based signaling**: Current implementation uses HTTP POST for signaling. For production, implement a proper WebSocket server.
- **No TURN server**: Uses only STUN. Add TURN for NAT traversal in production.
- **In-memory store**: Presence is lost on server restart. Consider Redis for persistence.
- **No recording**: Voice calls are not recorded. Add recording capability if needed.
- **No video**: Currently audio-only. Extend to support video streams.

## Testing

1. Open two browser tabs with the same workspace/voice channel
2. Click "Join Voice" in both tabs
3. Verify participants appear in both
4. Test mute/unmute
5. Verify audio is transmitted (use browser DevTools to inspect WebRTC stats)
