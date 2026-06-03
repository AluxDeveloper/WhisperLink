import { useState, useEffect } from 'react'
import './ProfileView.css'
import './UserProfileView.css'
import { userApi } from '../../../api/user.api'
import { friendsApi } from '../../../api/friends.api'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

interface UserProfileViewProps {
  userId: string
  onStartChat?: () => void
  onBack?: () => void
}

export function UserProfileView({ userId, onStartChat, onBack }: UserProfileViewProps) {
  const [name, setName]     = useState('')
  const [handle, setHandle] = useState('')
  const [role, setRole]     = useState('')
  const [bio, setBio]       = useState('')
  const [email, setEmail]   = useState('')
  const [status, setStatus] = useState('offline')
  const [stats, setStats]   = useState({ friends: 0, conversations: 0, messages: 0 })
  const [activity, setActivity] = useState<{ id: string; text: string; time: string }[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token || !userId) return

    userApi.getUser(userId, token).then((user: any) => {
      setName(user.name ?? '')
      setHandle(user.handle ?? '')
      setRole(user.role ?? '')
      setBio(user.bio ?? '')
      setEmail(user.email ?? '')
      setStatus(user.status ?? 'offline')
    }).catch(() => {})

    fetch(`http://localhost:8080/api/users/stats/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(r => r.json()).then((data: any) => {
      setStats({ friends: data.friends ?? 0, conversations: data.conversations ?? 0, messages: data.messages ?? 0 })
    }).catch(() => {})

    friendsApi.getFriends(token).then((friends: any[]) => {
      const acts = friends.slice(0, 4).map((f, i) => ({
        id: `friend-${i}`,
        text: `Prieten cu ${f.name}`,
        time: 'Recent'
      }))
      setActivity(acts)
    }).catch(() => {})
  }, [userId])

  const initials = name
    ? name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
    : '??'

  const isOnline = status === 'online'

  return (
    <div className="profile-view">
      <div className="profile-hero">
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            {isOnline && <span className="profile-status-dot" />}
          </div>

          <div className="profile-hero__info">
            <h2 className="profile-name">{name}</h2>
            <span className="profile-handle">{handle}</span>
            {role && <span className="profile-role">{role}</span>}
          </div>

          <div className="user-profile-actions">
            <button className="user-profile-btn user-profile-btn--message" onClick={onStartChat}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Trimite mesaj
            </button>
            {onBack && (
              <button className="user-profile-btn" onClick={onBack}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Înapoi
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="profile-stats">
        {[
          { label: 'Prieteni',    value: String(stats.friends) },
          { label: 'Conversații', value: String(stats.conversations) },
          { label: 'Mesaje',      value: String(stats.messages) },
        ].map((s) => (
          <div key={s.label} className="profile-stat">
            <span className="profile-stat__value">{s.value}</span>
            <span className="profile-stat__label">{s.label}</span>
          </div>
        ))}
      </div>

      <div className="profile-content">
        <section className="profile-section">
          <h3 className="profile-section__title">Despre mine</h3>
          <p className="profile-bio">{bio || 'Nicio descriere.'}</p>
        </section>

        <section className="profile-section">
          <h3 className="profile-section__title">Contact</h3>
          <div className="profile-contact-list">
            <div className="contact-row">
              <span className="contact-row__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </span>
              <span className="contact-row__value">{email}</span>
            </div>
            <div className="contact-row">
              <span className="contact-row__icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </span>
              <span className="contact-row__value">{isOnline ? 'Online acum' : 'Offline'}</span>
              <span className={`presence-badge ${isOnline ? '' : 'presence-badge--offline'}`}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h3 className="profile-section__title">Activitate recentă</h3>
          <div className="activity-list">
            {activity.length === 0 ? (
              <p className="profile-bio">Nicio activitate recentă.</p>
            ) : (
              activity.map((a) => (
                <div key={a.id} className="activity-item">
                  <div className="activity-item__dot" />
                  <div className="activity-item__body">
                    <p className="activity-item__text">{a.text}</p>
                    <span className="activity-item__time">{a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}