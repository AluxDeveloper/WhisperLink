import { useState, useRef, useEffect } from 'react'
import type { ChatUser, RoomMessage } from '../../../types'
import { joinClassNames } from '../../../utils'
import './Message.css'

interface MessageProps {
  message: RoomMessage
  author: ChatUser
  isOwn?: boolean
  onReply?: (message: RoomMessage) => void
  onEdit?: (messageId: string, newText: string) => void
  onDelete?: (messageId: string) => void
}

function MessageStatus({ status }: { status?: RoomMessage['status'] }) {
  if (!status) return null
  if (status === 'sent') return (
    <svg className="msg-status msg-status--sent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
  if (status === 'delivered') return (
    <svg className="msg-status msg-status--delivered" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="17 6 9 17 4 12" />
      <polyline points="22 6 13 17" />
    </svg>
  )
  if (status === 'seen') return (
    <svg className="msg-status msg-status--seen" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="17 6 9 17 4 12" />
      <polyline points="22 6 13 17" />
    </svg>
  )
  return null
}

export function Message({ message, author, isOwn = false, onReply, onEdit, onDelete }: MessageProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editText, setEditText] = useState(message.text)
  const menuRef = useRef<HTMLDivElement>(null)
  const editRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [menuOpen])

  useEffect(() => {
    if (editing && editRef.current) {
      editRef.current.focus()
      editRef.current.setSelectionRange(editText.length, editText.length)
    }
  }, [editing])

  function handleEditSave() {
    if (editText.trim() && editText.trim() !== message.text) {
      onEdit?.(message.id, editText.trim())
    }
    setEditing(false)
  }

  function handleEditKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleEditSave()
    }
    if (e.key === 'Escape') {
      setEditText(message.text)
      setEditing(false)
    }
  }

  if (message.deleted) {
    return (
      <div className={joinClassNames('msg-row', isOwn && 'msg-row--own')}>
        {!isOwn && (
          <div className="msg-avatar" style={{ background: author.accent }} title={author.name}>
            {author.avatarText}
          </div>
        )}
        <div className="msg-bubble-wrap">
          <div className={joinClassNames('msg-bubble msg-bubble--deleted', isOwn && 'msg-bubble--own')}>
            <p className="msg-text msg-text--deleted">🚫 Mesaj șters</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={joinClassNames('msg-row', isOwn && 'msg-row--own')}
      onMouseLeave={() => setMenuOpen(false)}
    >
      {!isOwn && (
        <div className="msg-avatar" style={{ background: author.accent }} title={author.name}>
          {author.avatarText}
        </div>
      )}

      <div className="msg-bubble-wrap">
        {!isOwn && <span className="msg-author">{author.name}</span>}

        {/* Reply preview */}
        {message.replyTo && (
          <div className={joinClassNames('msg-reply-preview', isOwn && 'msg-reply-preview--own')}>
            <span className="msg-reply-author">{message.replyTo.authorName}</span>
            <span className="msg-reply-text">{message.replyTo.text}</span>
          </div>
        )}

        <div className="msg-bubble-row">
          {/* Action buttons - apar la hover */}
          <div className={joinClassNames('msg-actions', isOwn && 'msg-actions--own')}>
            {/* Reply */}
            <button className="msg-action-btn" title="Răspunde" onClick={() => onReply?.(message)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            {/* More menu */}
            <div className="msg-action-menu-wrap" ref={menuRef}>
              <button className="msg-action-btn" title="Mai multe" onClick={() => setMenuOpen(v => !v)}>
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" />
                </svg>
              </button>
              {menuOpen && (
                <div className={joinClassNames('msg-context-menu', isOwn && 'msg-context-menu--own')}>
                  <button onClick={() => { onReply?.(message); setMenuOpen(false) }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                    Răspunde
                  </button>
                  {isOwn && (
                    <>
                      <button onClick={() => { setEditing(true); setMenuOpen(false) }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        Editează
                      </button>
                      <button className="msg-context-delete" onClick={() => { onDelete?.(message.id); setMenuOpen(false) }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Șterge
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={joinClassNames('msg-bubble', isOwn && 'msg-bubble--own')}>
            {editing ? (
              <div className="msg-edit-wrap">
                <textarea
                  ref={editRef}
                  className="msg-edit-input"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  rows={1}
                />
                <div className="msg-edit-actions">
                  <button className="msg-edit-save" onClick={handleEditSave}>Salvează</button>
                  <button className="msg-edit-cancel" onClick={() => { setEditText(message.text); setEditing(false) }}>Anulează</button>
                </div>
              </div>
            ) : (
              <p className="msg-text">{message.text}</p>
            )}
            <div className="msg-footer">
              {message.edited && <span className="msg-edited">editat</span>}
              <span className="msg-time">{message.time}</span>
              {isOwn && <MessageStatus status={message.status} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}