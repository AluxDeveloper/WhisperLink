import { useState } from 'react'
import type { KeyboardEvent } from 'react'
import type { ActiveConversation, ChatUser } from '../../../types'
import { Avatar } from '../../ui'
import { MessageList } from '../MessageList/MessageList'
import { useChatStore } from '../../../store/ChatStore'
import './ChatWindow.css'

interface ChatWindowProps {
  currentUser: ChatUser
  conversation: ActiveConversation
}

export function ChatWindow({ currentUser, conversation }: ChatWindowProps) {
  const { sendMessage } = useChatStore()
  const leadUser = conversation.participants[0]
  const [draft, setDraft] = useState('')

  function handleSend() {
    if (!draft.trim()) return
    sendMessage(draft.trim())
    setDraft('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isOnline = leadUser?.presence === 'online'

  return (
    <section className="chat-window">
      <header className="cw-header">
        <Avatar
          name={leadUser?.avatarText ?? 'WL'}
          label={conversation.title}
          accent={leadUser?.accent}
          status={leadUser?.presence}
          size="sm"
        />
        <div className="cw-header__info">
          <span className="cw-header__name">{conversation.title}</span>
          <span className={`cw-header__status ${isOnline ? 'cw-header__status--on' : ''}`}>
            {isOnline ? 'Online' : conversation.subtitle}
          </span>
        </div>
        <div className="cw-header__tools">
          <button className="cw-tool" title="Apel vocal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </button>
          <button className="cw-tool" title="Apel video">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button className="cw-tool" title="Caută">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="cw-feed">
        <MessageList
          messages={conversation.messages}
          participants={conversation.participants}
          currentUserId={currentUser.id}
        />
      </div>

      <div className="cw-composer">
        <button className="cw-attach" title="Atașează fișier">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </button>
        <textarea
          className="cw-input"
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={conversation.composerHint}
        />
        <button
          className={`cw-send ${draft.trim() ? 'cw-send--active' : ''}`}
          onClick={handleSend}
          disabled={!draft.trim()}
          title="Trimite"
        >
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
          </svg>
        </button>
      </div>
    </section>
  )
}