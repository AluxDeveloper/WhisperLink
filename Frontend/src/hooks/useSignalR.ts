import { useEffect, useRef } from 'react'
import * as signalR from '@microsoft/signalr'

const HUB_URL = 'http://localhost:8080/chatHub'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

interface SignalRHandlers {
  onReceiveMessage?: (message: any) => void
  onMessageSent?: (message: any) => void
  onUserOnline?: (userId: string) => void
  onUserOffline?: (userId: string) => void
}

export function useSignalR(handlers: SignalRHandlers) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => token,
      })
      .withAutomaticReconnect()
      .build()

    connection.on('ReceiveMessage', (message) => {
      handlers.onReceiveMessage?.(message)
    })

    connection.on('MessageSent', (message) => {
      handlers.onMessageSent?.(message)
    })

    connection.on('UserOnline', (userId: string) => {
      handlers.onUserOnline?.(userId)
    })

    connection.on('UserOffline', (userId: string) => {
      handlers.onUserOffline?.(userId)
    })

    connection.start()
      .then(() => console.log('SignalR connected'))
      .catch((err) => console.log('SignalR error:', err))

    connectionRef.current = connection

    return () => {
      connection.stop()
    }
  }, [])

  return connectionRef
}