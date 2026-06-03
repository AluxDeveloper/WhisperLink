export type PresenceState = 'online' | 'focus' | 'away' | 'offline'

export type ViewId = 'chat' | 'new-chat' | 'search' | 'notifications' | 'settings' | 'friends' | 'add-friend' | 'profile'

export interface ChatUser {
  id: string
  name: string
  handle: string
  role: string
  email: string
  presence: PresenceState
  avatarText: string
  accent: string
}

export interface QuickAction {
  id: string
  label: string
  note: string
  tone: 'primary' | 'surface'
}

export interface SideStat {
  id: string
  label: string
  value: string
}

export interface ConversationPreview {
  id: string
  section: string
  title: string
  message: string
  time: string
  tag: string
  unreadCount: number
  avatarText: string
  accent: string
  presence: PresenceState
  pinned?: boolean
}

export interface RoomMessage {
  id: string
  authorId: string
  text: string
  time: string
  badge?: string
  status?: 'sent' | 'delivered' | 'seen'
  replyTo?: {
    id: string
    authorName: string
    text: string
  }
  edited?: boolean
  deleted?: boolean
}

export interface SharedFile {
  id: string
  name: string
  meta: string
}

export interface InsightCard {
  id: string
  title: string
  value: string
  note: string
}

export interface ActiveConversation {
  id: string
  title: string
  subtitle: string
  topic: string
  statusLabel: string
  participantCount: number
  participants: ChatUser[]
  highlights: string[]
  messages: RoomMessage[]
  files: SharedFile[]
  insights: InsightCard[]
  composerHint: string
}

export interface ChatWorkspaceModel {
  brandName: string
  brandCaption: string
  currentUser: ChatUser
  sideStats: SideStat[]
  actionButtons: QuickAction[]
  conversations: ConversationPreview[]
  activeConversation: ActiveConversation
}