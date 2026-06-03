import { useState } from 'react'
import type { ConversationPreview } from '../../../types'
import { ConversationItem } from '../ConversationItem/ConversationItem'
import { useChatStore } from '../../../store/ChatStore'
import './ConversationList.css'

interface ConversationListProps {
  conversations: ConversationPreview[]
  activeConversationId: string
  onOpenProfile?: (userId: string, meta: { title: string; presence: string; avatarText: string; accent: string }) => void
}

export function ConversationList({ conversations, activeConversationId, onOpenProfile }: ConversationListProps) {
  const [search, setSearch] = useState('')
  const { loadConversation } = useChatStore()

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSelect(conversation: ConversationPreview) {
    loadConversation(
      conversation.id,
      conversation.title,
      conversation.presence,
      conversation.avatarText,
      conversation.accent,
    )
  }

  return (
    <section className="conv-list-panel">
      <div className="conv-list-header">
        <h2 className="conv-list-title">Mesaje</h2>
        <span className="conv-list-count">{conversations.length}</span>
      </div>

      <div className="conv-search-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="conv-search-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="conv-search-input"
          type="text"
          placeholder="Caută..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="conv-list">
        {filtered.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            conversation={conversation}
            isActive={conversation.id === activeConversationId}
            onSelect={() => handleSelect(conversation)}
            onOpenProfile={onOpenProfile}
          />
        ))}
        {filtered.length === 0 && (
          <p className="conv-list-empty">Nicio conversație găsită</p>
        )}
      </div>
    </section>
  )
}