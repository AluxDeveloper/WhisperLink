import { useState, useEffect } from 'react'
import './AddFriendView.css'
import { friendsApi } from '../../../api/friends.api'
import type { FriendDto, FriendRequestDto } from '../../../api/friends.api'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

function getInitials(name: string): string {
  return (name ?? '??').split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return 'Ieri'
}

export function AddFriendView() {
  const [search, setSearch] = useState('')
  const [suggestions, setSuggestions] = useState<FriendDto[]>([])
  const [pending, setPending] = useState<FriendRequestDto[]>([])
  const [sent, setSent] = useState<Set<string>>(new Set())

  useEffect(() => {
    const token = getToken()
    if (!token) return

    friendsApi.searchUsers('', token)
      .then(setSuggestions)
      .catch(() => {})

    friendsApi.getPendingRequests(token)
      .then(setPending)
      .catch(() => {})
  }, [])

  const filtered = suggestions.filter(
    (u) =>
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.handle ?? '').toLowerCase().includes(search.toLowerCase()),
  )

  function sendRequest(id: string) {
    friendsApi.sendRequest(id, getToken())
      .then(() => setSent(prev => new Set(prev).add(id)))
      .catch(() => {})
  }

  function cancelRequest(requestId: string) {
    friendsApi.rejectRequest(requestId, getToken())
      .then(() => setPending(prev => prev.filter(r => r.id !== requestId)))
      .catch(() => {})
  }

  return (
    <div className="add-friend-view">
      <div className="view-header">
        <div className="view-header__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <div>
          <h2 className="view-header__title">Adaugă Prieteni</h2>
          <p className="view-header__sub">Caută și conectează-te cu alți utilizatori</p>
        </div>
      </div>

      <div className="search-bar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="search-bar__icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="search-bar__input"
          type="text"
          placeholder="Caută după nume sau @handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {pending.length > 0 && (
        <section className="add-section">
          <h3 className="add-section__title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Cereri trimise
          </h3>
          <div className="pending-list">
            {pending.map((req) => (
              <div key={req.id} className="pending-card">
                <div className="pending-card__avatar" style={{ background: 'linear-gradient(135deg, #8a2be2, #ff007f)' }}>
                  {getInitials(req.toUserId)}
                </div>
                <div className="pending-card__info">
                  <span className="pending-card__name">{req.toUserId}</span>
                </div>
                <div className="pending-card__right">
                  <span className="pending-card__time">{timeAgo(req.createdAt)}</span>
                  <button className="pending-cancel-btn" onClick={() => cancelRequest(req.id)}>Anulează</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="add-section">
        <h3 className="add-section__title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
          Persoane recomandate
        </h3>

        <div className="suggestions-grid">
          {filtered.map((user) => {
            const isSent = sent.has(user.id)
            return (
              <div key={user.id} className="suggestion-card">
                <div className="suggestion-card__avatar" style={{ background: 'linear-gradient(135deg, #8a2be2, #ff007f)' }}>
                  {getInitials(user.name)}
                </div>
                <div className="suggestion-card__info">
                  <span className="suggestion-card__name">{user.name}</span>
                  <span className="suggestion-card__handle">{user.handle}</span>
                  <span className="suggestion-card__role">{user.role ?? ''}</span>
                </div>
                <button
                  className={`add-btn ${isSent ? 'add-btn--sent' : ''}`}
                  onClick={() => !isSent && sendRequest(user.id)}
                >
                  {isSent ? (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Cerere trimisă
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                      Adaugă prieten
                    </>
                  )}
                </button>
              </div>
            )
          })}

          {filtered.length === 0 && (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <p>Niciun utilizator găsit</p>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}