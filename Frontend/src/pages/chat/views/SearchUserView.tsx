import { useState, useEffect } from 'react'
import './SearchUserView.css'
import { friendsApi } from '../../../api/friends.api'
import type { FriendDto } from '../../../api/friends.api'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

const STATUS_LABELS: Record<string, string> = {
  online:  'Online',
  focus:   'Focus mode',
  away:    'Away',
  offline: 'Offline',
}

export function SearchUserView() {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<FriendDto[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return
    friendsApi.searchUsers('', token)
      .then(setUsers)
      .catch(() => {})
  }, [])

  const results = query.trim()
    ? users.filter(
        (u) =>
          (u.name ?? '').toLowerCase().includes(query.toLowerCase()) ||
          (u.role ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : users

  const getInitials = (name?: string) =>
    (name ?? '??').split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??'

  return (
    <div className="search-view">
      <div className="view-header">
        <div className="view-header__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <div>
          <h2 className="view-header__title">Search Users</h2>
          <p className="view-header__sub">Find people and start a conversation</p>
        </div>
      </div>

      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-bar__icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="search-bar__input"
          type="text"
          placeholder="Search by name or role..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
        {query && (
          <button className="search-bar__clear" onClick={() => setQuery('')}>
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {query && (
        <p className="search-count">
          {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
        </p>
      )}

      <div className="user-cards">
        {results.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-card__avatar-wrap">
              <div className="user-card__avatar">{getInitials(user.name)}</div>
              <span className={`user-card__dot user-card__dot--${user.status ?? 'offline'}`} />
            </div>
            <div className="user-card__info">
              <span className="user-card__name">{user.name ?? ''}</span>
              <span className="user-card__role">{user.role ?? ''}</span>
              <span className="user-card__status">{STATUS_LABELS[user.status ?? 'offline'] ?? 'Offline'}</span>
            </div>
            <div className="user-card__actions">
              <button className="card-btn card-btn--ghost" onClick={() => friendsApi.sendRequest(user.id, getToken()).catch(() => {})}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Friend
              </button>
              <button className="card-btn card-btn--accent">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Message
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}