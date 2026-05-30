import type { ConversationPreview } from '../../../types'
import { formatUnreadCount, joinClassNames } from '../../../utils'
import './ConversationItem.css'

interface ConversationItemProps {
  conversation: ConversationPreview
  isActive?: boolean
  onSelect?: () => void
}

export function ConversationItem({ conversation, isActive = false, onSelect }: ConversationItemProps) {
  const isOnline = conversation.presence === 'online'

  return (
    <button
      className={joinClassNames('conv-item', isActive && 'conv-item--active')}
      onClick={onSelect}
    >
      <div className="conv-avatar-wrap">
        <div
          className="conv-avatar"
          style={{ background: conversation.accent }}
        >
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