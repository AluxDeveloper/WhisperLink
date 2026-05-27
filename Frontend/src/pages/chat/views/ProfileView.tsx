import { useState, useEffect } from 'react'
import './ProfileView.css'
import { userApi } from '../../../api/user.api'

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

export function ProfileView() {
  const [editing, setEditing] = useState(false)
  const [name, setName]     = useState('')
  const [handle, setHandle] = useState('')
  const [role, setRole]     = useState('')
  const [bio, setBio]       = useState('')
  const [email, setEmail]   = useState('')

  useEffect(() => {
    const token = getToken()
    if (!token) return
    userApi.getMe(token).then(user => {
      setName(user.name ?? '')
      setHandle(user.handle ?? '')
      setRole(user.role ?? '')
      setBio('')
      setEmail(user.email ?? '')
    }).catch(() => {})
  }, [])

  function handleSave() {
    const token = getToken()
    if (!token) return
    userApi.updateProfile({ name, handle, role, bio }, token)
      .then(() => setEditing(false))
      .catch(() => {})
  }

  const initials = name
    ? name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
    : '??'

  const ACTIVITY = [
    { id: 'a1', text: 'Ai trimis o cerere de prietenie lui Vlad Dumitru', time: 'Acum 2 ore' },
    { id: 'a2', text: 'Ai început o conversație cu Mara Popa', time: 'Ieri, 14:32' },
    { id: 'a3', text: 'Ți-ai actualizat poza de profil', time: 'Acum 3 zile' },
    { id: 'a4', text: 'Te-ai alăturat grupului „Design Systems"', time: 'Acum 5 zile' },
  ]

  return (
    <div className="profile-view">
      <div className="profile-hero">
        <div className="profile-hero__cover" />
        <div className="profile-hero__body">
          <div className="profile-avatar-wrap">
            <div className="profile-avatar">{initials}</div>
            <span className="profile-status-dot" />
          </div>

          <div className="profile-hero__info">
            {editing ? (
              <input className="profile-edit-input profile-edit-input--name" value={name} onChange={(e) => setName(e.target.value)} />
            ) : (
              <h2 className="profile-name">{name}</h2>
            )}
            {editing ? (
              <input className="profile-edit-input profile-edit-input--handle" value={handle} onChange={(e) => setHandle(e.target.value)} />
            ) : (
              <span className="profile-handle">{handle}</span>
            )}
            {editing ? (
              <input className="profile-edit-input profile-edit-input--role" value={role} onChange={(e) => setRole(e.target.value)} />
            ) : (
              <span className="profile-role">{role}</span>
            )}
          </div>

          <button
            className={`profile-edit-btn ${editing ? 'profile-edit-btn--save' : ''}`}
            onClick={() => editing ? handleSave() : setEditing(true)}
          >
            {editing ? (
              <>
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Salvează
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Editează
              </>
            )}
          </button>
        </div>
      </div>

      <div className="profile-stats">
        {[
          { label: 'Prieteni',    value: '—' },
          { label: 'Conversații', value: '—' },
          { label: 'Mesaje',      value: '—' },
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
          {editing ? (
            <textarea className="profile-edit-textarea" value={bio} onChange={(e) => setBio(e.target.value)} rows={3} />
          ) : (
            <p className="profile-bio">{bio || 'Nicio descriere.'}</p>
          )}
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
              <span className="contact-row__value">Online acum</span>
              <span className="presence-badge">Online</span>
            </div>
          </div>
        </section>

        <section className="profile-section">
          <h3 className="profile-section__title">Activitate recentă</h3>
          <div className="activity-list">
            {ACTIVITY.map((a) => (
              <div key={a.id} className="activity-item">
                <div className="activity-item__dot" />
                <div className="activity-item__body">
                  <p className="activity-item__text">{a.text}</p>
                  <span className="activity-item__time">{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}