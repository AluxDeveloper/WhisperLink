import { useState, useEffect } from 'react'
import './NewChatView.css'
import { friendsApi } from '../../../api/friends.api'
import type { FriendDto } from '../../../api/friends.api'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

export function NewChatView() {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [users, setUsers] = useState<FriendDto[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    friendsApi.searchUsers('', token)
      .then(data => {
        console.log('users from backend:', JSON.stringify(data))
        setUsers(data)
      })
      .catch((err) => console.log('error:', err))
  }, [])

  const filtered = users.filter((u) =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const selectedUsers = users.filter((u) => selected.includes(u.id))

  const getInitials = (name?: string) =>
    (name ?? '??').split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div className="new-chat">
      <div className="view-header">
        <div className="view-header__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </div>
        <div>
          <h2 className="view-header__title">New Chat</h2>
          <p className="view-header__sub">Select people to start a conversation</p>
        </div>
      </div>

      {selectedUsers.length > 0 && (
        <div className="selected-chips">
          {selectedUsers.map((u) => (
            <button key={u.id} className="chip" onClick={() => toggle(u.id)}>
              <span className="chip__avatar">{getInitials(u.name)}</span>
              <span className="chip__name">{(u.name ?? '?').split(' ')[0]}</span>
              <svg viewBox="0 0 20 20" fill="currentColor" className="chip__remove">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          ))}
        </div>
      )}

      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-bar__icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="search-bar__input"
          type="text"
          placeholder="Search people..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="user-list">
        {filtered.map((user) => {
          const isSelected = selected.includes(user.id)
          return (
            <button
              key={user.id}
              className={`user-row ${isSelected ? 'user-row--selected' : ''}`}
              onClick={() => toggle(user.id)}
            >
              <div className="user-row__avatar">{getInitials(user.name)}</div>
              <div className="user-row__info">
                <span className="user-row__name">{user.name}</span>
                <span className="user-row__role">{user.role ?? ''}</span>
              </div>
              <div className={`user-row__check ${isSelected ? 'user-row__check--on' : ''}`}>
                {isSelected && (
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {selected.length > 0 && (
        <div className="new-chat__footer">
          <button className="start-btn">
            Start Chat
            {selected.length > 1 && <span className="start-btn__count">{selected.length}</span>}
          </button>
        </div>
      )}
    </div>
  )
}