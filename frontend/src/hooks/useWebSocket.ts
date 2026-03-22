"use client"
import { useEffect, useRef, useState, useCallback } from 'react'
import { WS_URL } from '@/lib/api'

interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp?: string;
}

export function useWebSocket() {
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimer = useRef<NodeJS.Timeout | null>(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(WS_URL)
      wsRef.current = ws

      ws.onopen = () => {
        setIsConnected(true)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          setLastMessage(msg)
        } catch {}
      }

      ws.onclose = () => {
        setIsConnected(false)
        reconnectTimer.current = setTimeout(connect, 3000)
      }

      ws.onerror = () => {
        ws.close()
      }
    } catch {
      reconnectTimer.current = setTimeout(connect, 3000)
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current)
    }
  }, [connect])

  return { lastMessage, isConnected }
}
