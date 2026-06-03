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
  sendMessage: (text: string, replyToId?: string) => void
  editMessage: (messageId: string, newText: string) => void
  deleteMessage: (messageId: string) => void
  onNewMessage: (handler: (msg: any) => void) => () => void
  onUserOnline: (handler: (userId: string) => void) => () => void
  onUserOffline: (handler: (userId: string) => void) => () => void
  typingUsers: Record<string, boolean>
  sendTyping: (isTyping: boolean) => void
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
    unreadCount: 0,
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
    status: 'sent',
    edited: msg.isEdited ?? false,
    deleted: msg.isDeleted ?? false,
    replyTo: msg.replyTo ? {
      id: String(msg.replyTo.id),
      authorName: msg.replyTo.senderName ?? '',
      text: msg.replyTo.content ?? '',
    } : undefined,
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const connectionRef = useRef<signalR.HubConnection | null>(null)
  const messageHandlersRef = useRef<Set<(msg: any) => void>>(new Set())
  const userOnlineHandlersRef = useRef<Set<(userId: string) => void>>(new Set())
  const userOfflineHandlersRef = useRef<Set<(userId: string) => void>>(new Set())
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [typingUsers, setTypingUsers] = useState<Record<string, boolean>>({})

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
      messageHandlersRef.current.forEach(h => h(msg))
      setTypingUsers(prev => ({ ...prev, [senderId]: false }))
      setWorkspace(prev => {
        const activeId = String(prev.activeConversation.id)
        const isActiveConv = activeId === senderId
        return {
          ...prev,
          activeConversation: isActiveConv
            ? { ...prev.activeConversation, messages: [...prev.activeConversation.messages, newMessage] }
            : prev.activeConversation,
          conversations: prev.conversations.map(c =>
            String(c.id) === senderId
              ? { ...c, message: newMessage.text, time: newMessage.time, unreadCount: isActiveConv ? 0 : (c.unreadCount ?? 0) + 1 }
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
          String(c.id) === String(prev.activeConversation.id)
            ? { ...c, message: newMessage.text, time: newMessage.time }
            : c
        )
      }))
    })

    connection.on('MessageDelivered', (messageId: string) => {
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: prev.activeConversation.messages.map(m =>
            m.id === messageId ? { ...m, status: 'delivered' as const } : m
          )
        }
      }))
    })

    connection.on('MessageSeen', (messageId: string) => {
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: prev.activeConversation.messages.map(m =>
            m.id === messageId ? { ...m, status: 'seen' as const } : m
          )
        }
      }))
    })

    connection.on('MessageEdited', (data: { messageId: string, newContent: string }) => {
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: prev.activeConversation.messages.map(m =>
            m.id === String(data.messageId) ? { ...m, text: data.newContent, edited: true } : m
          )
        }
      }))
    })

    connection.on('MessageDeleted', (messageId: string) => {
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: prev.activeConversation.messages.map(m =>
            m.id === String(messageId) ? { ...m, deleted: true, text: 'Mesaj șters' } : m
          )
        }
      }))
    })

    connection.on('UserTyping', (userId: string) => {
      setTypingUsers(prev => ({ ...prev, [userId]: true }))
    })

    connection.on('UserStoppedTyping', (userId: string) => {
      setTypingUsers(prev => ({ ...prev, [userId]: false }))
    })

    connection.on('UserOnline', (userId: string) => {
      userOnlineHandlersRef.current.forEach(h => h(userId))
      setWorkspace(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          String(c.id) === String(userId) ? { ...c, presence: 'online' as const } : c
        )
      }))
    })

    connection.on('UserOffline', (userId: string) => {
      userOfflineHandlersRef.current.forEach(h => h(userId))
      setWorkspace(prev => ({
        ...prev,
        conversations: prev.conversations.map(c =>
          String(c.id) === String(userId) ? { ...c, presence: 'offline' as const } : c
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

  function onNewMessage(handler: (msg: any) => void) {
    messageHandlersRef.current.add(handler)
    return () => { messageHandlersRef.current.delete(handler) }
  }

  function onUserOnline(handler: (userId: string) => void) {
    userOnlineHandlersRef.current.add(handler)
    return () => { userOnlineHandlersRef.current.delete(handler) }
  }

  function onUserOffline(handler: (userId: string) => void) {
    userOfflineHandlersRef.current.add(handler)
    return () => { userOfflineHandlersRef.current.delete(handler) }
  }

  function sendTyping(isTyping: boolean) {
    const connection = connectionRef.current
    const conversationId = workspace.activeConversation.id
    if (!connection || connection.state !== signalR.HubConnectionState.Connected || !conversationId) return

    if (isTyping) {
      connection.invoke('StartTyping', parseInt(conversationId)).catch(() => {})
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      typingTimerRef.current = setTimeout(() => {
        connection.invoke('StopTyping', parseInt(conversationId)).catch(() => {})
      }, 3000)
    } else {
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current)
      connection.invoke('StopTyping', parseInt(conversationId)).catch(() => {})
    }
  }

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

  function sendMessage(text: string, replyToId?: string) {
    const conversationId = workspace.activeConversation.id
    if (!conversationId) return
    sendTyping(false)
    const connection = connectionRef.current
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('SendMessage', parseInt(conversationId), text, replyToId ? parseInt(replyToId) : null)
        .catch(() => sendViaRest(text, conversationId))
    } else {
      sendViaRest(text, conversationId)
    }
  }

  function editMessage(messageId: string, newText: string) {
    const connection = connectionRef.current
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('EditMessage', parseInt(messageId), newText).catch(() => {})
    }
    // Optimistic update
    setWorkspace(prev => ({
      ...prev,
      activeConversation: {
        ...prev.activeConversation,
        messages: prev.activeConversation.messages.map(m =>
          m.id === messageId ? { ...m, text: newText, edited: true } : m
        )
      }
    }))
  }

  function deleteMessage(messageId: string) {
    const connection = connectionRef.current
    if (connection && connection.state === signalR.HubConnectionState.Connected) {
      connection.invoke('DeleteMessage', parseInt(messageId)).catch(() => {})
    }
    // Optimistic update
    setWorkspace(prev => ({
      ...prev,
      activeConversation: {
        ...prev.activeConversation,
        messages: prev.activeConversation.messages.map(m =>
          m.id === messageId ? { ...m, deleted: true, text: 'Mesaj șters' } : m
        )
      }
    }))
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
    <ChatContext.Provider value={{
      ...workspace,
      loadConversation,
      sendMessage,
      editMessage,
      deleteMessage,
      onNewMessage,
      onUserOnline,
      onUserOffline,
      typingUsers,
      sendTyping,
    }}>
      {children}
    </ChatContext.Provider>
  )
}

export function useChatStore(): ChatContextType {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChatStore trebuie folosit în interiorul <ChatProvider>')
  return ctx
}