import type { ChatUser, RoomMessage } from '../../../types'
import { Message } from '../Message/Message'
import { useChatStore } from '../../../store/ChatStore'
import './MessageList.css'

interface MessageListProps {
  messages: RoomMessage[]
  participants: ChatUser[]
  currentUserId: string
  onReply?: (message: RoomMessage) => void
}

export function MessageList({ messages, participants, currentUserId, onReply }: MessageListProps) {
  const { editMessage, deleteMessage } = useChatStore()

  return (
    <div className="message-stream">
      {messages.map((message) => {
        const author = participants.find((item) => item.id === message.authorId)
        if (!author) return null
        return (
          <Message
            key={message.id}
            message={message}
            author={author}
            isOwn={message.authorId === currentUserId}
            onReply={onReply}
            onEdit={editMessage}
            onDelete={deleteMessage}
          />
        )
      })}
    </div>
  )
}