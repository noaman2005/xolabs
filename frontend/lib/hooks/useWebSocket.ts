import { useEffect, useRef, useState } from 'react'

const WS_URL = process.env.NEXT_PUBLIC_WS_URL

export function useWebSocket() {
  const socketRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!WS_URL) return
    const ws = new WebSocket(WS_URL)
    socketRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)

    return () => ws.close()
  }, [])

  const send = (data: unknown) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return
    socketRef.current.send(JSON.stringify(data))
  }

  return { connected, send }
}
