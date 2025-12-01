export function useWebRTC() {
  // TODO: wire to signaling backend + STUN/TURN
  return {
    joinRoom: (_roomId: string) => {},
    leaveRoom: () => {},
  }
}
