import { createContext, useContext, useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import type { ChatWorkspaceModel, ChatUser, ConversationPreview, ActiveConversation, RoomMessage } from '../types'
import { chatApi } from '../api/chat.api'
import type { ConversationDto, MessageDto } from '../api/chat.api'
import { mockChatWorkspace } from '../mock/chat.mock'

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

function messageDtoToRoomMessage(dto: MessageDto): RoomMessage {
  return {
    id: dto.id,
    authorId: dto.authorId,
    text: dto.text,
    time: new Date(dto.createdAt).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' }),
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
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

    // Setează conversația activă imediat cu mesaje goale
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
      }
    }))

    // Încarcă mesajele
    chatApi.getMessages(conversationId, token).then(messages => {
      const roomMessages: RoomMessage[] = messages.map(messageDtoToRoomMessage)
      setWorkspace(prev => ({
        ...prev,
        activeConversation: {
          ...prev.activeConversation,
          messages: roomMessages,
        }
      }))
    }).catch(() => {})
  }

  function sendMessage(text: string) {
    const token = getToken()
    const stored = getStoredUser()
    if (!stored) return

    const conversationId = workspace.activeConversation.id
    if (!conversationId) return

    chatApi.sendMessage({ conversationId, text }, token).then(msg => {
      const newMessage: RoomMessage = messageDtoToRoomMessage(msg)
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