import type { ConversationPreview } from '../../../types'
import { formatUnreadCount, joinClassNames } from '../../../utils'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: ConversationPreview
  isActive?: boolean
  onSelect?: () => void
  onOpenProfile?: (userId: string, meta: { title: string; presence: string; avatarText: string; accent: string }) => void
}

export function ConversationItem({ conversation, isActive = false, onSelect, onOpenProfile }: ConversationItemProps) {
  const isOnline = conversation.presence === 'online'

  function handleAvatarClick(e: React.MouseEvent) {
    e.stopPropagation()
    onOpenProfile?.(conversation.id, {
      title: conversation.title,
      presence: conversation.presence,
      avatarText: conversation.avatarText,
      accent: conversation.accent,
    })
  }

  return (
    <button
      className={joinClassNames('conv-item', isActive && 'conv-item--active')}
      onClick={onSelect}
    >
      <div className="conv-avatar-wrap" onClick={handleAvatarClick} title="Vezi profil">
        <div className="conv-avatar" style={{ background: conversation.accent }}>
          {conversation.avatarText}
        </div>
        {isOnline && <span className="conv-online-dot" />}
      </div>

      <div className="conv-body">
        <div className="conv-top">
          <span className="conv-name">{conversation.title}</span>
          <span className="conv-time">{conversation.time}</span>
        </div>
        <span className="conv-preview">{conversation.message}</span>
      </div>

      {conversation.unreadCount > 0 && (
        <span className="conv-badge">{formatUnreadCount(conversation.unreadCount)}</span>
      )}
    </button>
  )
}