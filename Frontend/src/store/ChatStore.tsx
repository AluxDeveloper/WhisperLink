import { createContext, useContext, useState, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import type { ChatWorkspaceModel, ChatUser, ConversationPreview, RoomMessage } from '../types'
import { chatApi } from '../api/chat.api'
import type { ConversationDto } from '../api/chat.api'
import { mockChatWorkspace } from '../mock/chat.mock'
import * as signalR from '@microsoft/signalr'

const HUB_URL = 'http://localhost:8080/chatHub'

interface ChatContextType extends ChatWorkspaceModel {
  loadConversation: (conversationId: string, title: string, presence: string, avatarText: string, accent: string) => void
  sendMessage: (text: string) => void
}

const ChatContext = createContext<ChatContextType | null>(null)

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

interface BackendUser {
  id: string
  name: string
  email: string
  handle: string
  avatarUrl?: string
}

function getStoredUser(): BackendUser | null {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function backendUserToChatUser(u: BackendUser): ChatUser {
  const initials = u.name
    ? u.name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
    : (u.handle ?? '??').replace('@', '').slice(0, 2).toUpperCase()

  return {
    id: String(u.id),
    name: u.name ?? '',
    handle: u.handle ?? '',
    role: '',
    email: u.email ?? '',
    presence: 'online',
    avatarText: initials,
    accent: 'linear-gradient(135deg, #8a2be2, #ff007f)',
  }
}

function conversationDtoToPreview(dto: ConversationDto): ConversationPreview {
  return {
    id: dto.id,
    section: 'Conversații',
    title: dto.title,
    message: dto.lastMessage,
    time: dto.lastMessageTime
      ? new Date(dto.lastMessageTime).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
      : '',
    tag: '',
    unreadCount: dto.unreadCount,
    avatarText: dto.title ? dto.title.slice(0, 2).toUpperCase() : '??',
    accent: 'linear-gradient(135deg, #8a2be2, #ff007f)',
    presence: 'offline',
  }
}

function messageToRoomMessage(msg: any): RoomMessage {
  return {
    id: String(msg.id),
    authorId: String(msg.senderId ?? msg.authorId),
    text: msg.content ?? msg.text,
    time: new Date(msg.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)

  const [workspace, setWorkspace] = useState<ChatWorkspaceModel>(() => {
    const stored = getStoredUser()
    if (!stored) return mockChatWorkspace
    return {
      ...mockChatWorkspace,
      currentUser: backendUserToChatUser(stored),
      conversations: [],
      activeConversation: {
        ...mockChatWorkspace.activeConversation,
        id: '',
        title: '',
        subtitle: '',
        messages: [],
        participants: [],
      },
    }
  })

  const activeConvIdRef = useRef<string>('')

  useEffect(() => {
    activeConvIdRef.current = workspace.activeConversation.id
  }, [workspace.activeConversation.id])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .build()

    connection.on('ReceiveMessage', (msg: any) => {
      const newMessage = messageToRoomMessage(msg)
      const senderId = String(msg.senderId ?? msg.authorId)

      setWorkspace(prev => {
        const isActiveConv = prev.activeConversation.id === senderId
        return {
          ...prev,
          activeConversation: isActiveConv
            ? { ...prev.activeConversation, messages: [...prev.activeConversation.messages, newMessage] }
            : prev.activeConversation,
          conversations: prev.conversations.map(c =>
            c.id === senderId
              ? { ...c, message: newMessage.text, time: newMessage.time, unreadCount: isActiveConv ? 0 : c.unreadCount + 1 }
              : c
          )
        }
      })
    })

    connection.on('MessageSent', (msg: any) => {
      const newMessage = messageToRoomMessage(msg)
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: [...prev.activeConversation.messages, newMessage],
        },
        conversations: prev.conversations.map(c =>
          c.id === prev.activeConversation.id
            ? { ...c, message: newMessage.text, time: newMessage.time }
            : c
        )
      }))
    })

    connection.on('UserOnline', (userId: string) => {
      setWorkspace(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          c.id === userId ? { ...c, presence: 'online' as const } : c
        )
      }))
    })

    connection.on('UserOffline', (userId: string) => {
      setWorkspace(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          c.id === userId ? { ...c, presence: 'offline' as const } : c
        )
      }))
    })

    connection.start()
      .then(() => console.log('SignalR connected'))
      .catch(err => console.log('SignalR error:', err))

    connectionRef.current = connection

    return () => { connection.stop() }
  }, [])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    chatApi.getConversations(token).then(conversations => {
      const previews: ConversationPreview[] = conversations.map(conversationDtoToPreview)
      setWorkspace(prev => ({ ...prev, conversations: previews }))
    }).catch(() => {})
  }, [])

  function loadConversation(conversationId: string, title: string, presence: string, avatarText: string, accent: string) {
    const token = getToken()
    const stored = getStoredUser()
    const currentUserChat: ChatUser = stored ? backendUserToChatUser(stored) : mockChatWorkspace.currentUser

    const otherUser: ChatUser = {
      id: conversationId,
      name: title,
      handle: '',
      role: '',
      email: '',
      presence: presence as any,
      avatarText,
      accent,
    }

    setWorkspace(prev => ({
      ...prev,
      activeConversation: {
        ...mockChatWorkspace.activeConversation,
        id: conversationId,
        title,
        subtitle: presence === 'online' ? 'Online' : 'Offline',
        messages: [],
        participants: [otherUser, currentUserChat],
        composerHint: 'Scrie un mesaj... (Enter pentru trimite)',
      },
      conversations: prev.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      )
    }))

    chatApi.getMessages(conversationId, token).then(messages => {
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: messages.map(messageToRoomMessage),
        }
      }))
    }).catch(() => {})

    setWorkspace(prev => {
      const exists = prev.conversations.find(c => c.id === conversationId)
      if (exists) return prev
      const newConv: ConversationPreview = {
        id: conversationId,
        section: 'Conversații',
        title,
        message: '',
        time: '',
        tag: '',
        unreadCount: 0,
        avatarText,
        accent,
        presence: presence as any,
      }
      return { ...prev, conversations: [newConv, ...prev.conversations] }
    })
  }

  function sendMessage(text: string) {
    const conversationId = workspace.activeConversation.id
    if (!conversationId) return

    const connection = connectionRef.current
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('SendMessage', parseInt(conversationId), text)
        .catch(() => sendViaRest(text, conversationId))
    } else {
      sendViaRest(text, conversationId)
    }
  }

  function sendViaRest(text: string, conversationId: string) {
    const token = getToken()
    const stored = getStoredUser()
    if (!stored) return

    chatApi.sendMessage({ conversationId, text }, token).then(msg => {
      const newMessage = messageToRoomMessage(msg)
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: [...prev.activeConversation.messages, newMessage],
        },
        conversations: prev.conversations.map(c =>
          c.id === conversationId
            ? { ...c, message: text, time: newMessage.time }
            : c
        )
      }))
    }).catch(() => {})
  }

  return (
    <ChatContext.Provider value={{ ...workspace, loadConversation, sendMessage }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatStore(): ChatContextType {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatStore trebuie folosit în interiorul <ChatProvider>')
  return ctx
}