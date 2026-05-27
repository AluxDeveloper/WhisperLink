import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import './SettingsView.css'
import { userApi } from '../../../api/user.api'

interface Toggle {
  id: string
  label: string
  description: string
  on: boolean
}

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem('user')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function SettingsView() {
  const [activeSection, setActiveSection] = useState('profile')

  const [toggles, setToggles] = useState<Toggle[]>([
    { id: 'notif-msg',     label: 'Message notifications',  description: 'Get alerted for new messages',          on: true  },
    { id: 'notif-mention', label: 'Mention notifications',  description: 'Get alerted when someone mentions you', on: true  },
    { id: 'notif-request', label: 'Friend requests',        description: 'Get alerted for new friend requests',   on: true  },
    { id: 'notif-sound',   label: 'Notification sounds',    description: 'Play sounds for alerts',                on: false },
    { id: 'priv-online',   label: 'Show online status',     description: "Others can see when you're online",     on: true  },
    { id: 'priv-read',     label: 'Read receipts',          description: "Show when you've read messages",        on: true  },
    { id: 'priv-profile',  label: 'Public profile',         description: 'Anyone can search and find you',        on: false },
  ])

  const flip = (id: string) =>
    setToggles((prev) =>
      prev.map((t) => (t.id === id ? { ...t, on: !t.on } : t)),
    )

  const SECTIONS = [
    { id: 'profile',       label: 'Profile',       icon: 'person'  },
    { id: 'notifications', label: 'Notifications', icon: 'bell'    },
    { id: 'privacy',       label: 'Privacy',       icon: 'lock'    },
    { id: 'appearance',    label: 'Appearance',    icon: 'palette' },
  ]

  return (
    <div className="settings-view">
      <div className="settings-sidebar">
        <div className="view-header" style={{ padding: '0 0 20px' }}>
          <div className="view-header__icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="view-header__title">Settings</h2>
            <p className="view-header__sub">Manage your workspace</p>
          </div>
        </div>

        <nav className="settings-nav">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              className={`settings-nav__item ${activeSection === s.id ? 'settings-nav__item--active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <SectionIcon id={s.icon} />
              {s.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="settings-content">
        {activeSection === 'profile'       && <ProfileSection />}
        {activeSection === 'notifications' && (
          <ToggleSection
            title="Notifications"
            items={toggles.filter((t) => t.id.startsWith('notif'))}
            onToggle={flip}
          />
        )}
        {activeSection === 'privacy' && (
          <ToggleSection
            title="Privacy"
            items={toggles.filter((t) => t.id.startsWith('priv'))}
            onToggle={flip}
          />
        )}
        {activeSection === 'appearance' && <AppearanceSection />}
      </div>
    </div>
  )
}

function SectionIcon({ id }: { id: string }) {
  const icons: Record<string, ReactNode> = {
    person: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    bell: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    lock: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
    ),
    palette: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  }
  return <span className="section-icon">{icons[id]}</span>
}

function ProfileSection() {
  const stored = getStoredUser()
  const [name, setName] = useState(stored?.name ?? '')
  const [handle, setHandle] = useState(stored?.handle ?? '')
  const [role, setRole] = useState(stored?.role ?? '')
  const [email, setEmail] = useState(stored?.email ?? '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token) return
    userApi.getMe(token).then(user => {
      setName(user.name ?? '')
      setHandle(user.handle ?? '')
      setRole(user.role ?? '')
      setEmail(user.email ?? '')
    }).catch(() => {})
  }, [])

  function handleSave() {
    const token = getToken()
    if (!token) return
    userApi.updateProfile({ name, handle, role }, token)
      .then(updated => {
        const current = getStoredUser()
        localStorage.setItem('user', JSON.stringify({ ...current, ...updated }))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
      })
      .catch(() => {})
  }

  const initials = name
  ? name.split(' ').map((w: string) => w[0] ?? '').join('').toUpperCase().slice(0, 2)
  : '??'

  return (
    <div className="settings-panel">
      <h3 className="panel-title">Profile</h3>
      <div className="profile-preview">
        <div className="profile-preview__avatar">{initials}</div>
        <div className="profile-preview__info">
          <span className="profile-preview__name">{name}</span>
          <span className="profile-preview__handle">{handle}</span>
        </div>
        <button className="change-avatar-btn">Change Avatar</button>
      </div>
      <div className="settings-fields">
        <div className="field">
          <label className="field__label">Display Name</label>
          <input className="field__input" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label">Handle</label>
          <input className="field__input" value={handle} onChange={e => setHandle(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label">Role</label>
          <input className="field__input" value={role} onChange={e => setRole(e.target.value)} />
        </div>
        <div className="field">
          <label className="field__label">Email</label>
          <input className="field__input" type="email" value={email} disabled />
        </div>
      </div>
      <button className="save-btn" onClick={handleSave}>
        {saved ? 'Saved!' : 'Save Changes'}
      </button>
    </div>
  )
}

function ToggleSection({
  title,
  items,
  onToggle,
}: {
  title: string
  items: Toggle[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="settings-panel">
      <h3 className="panel-title">{title}</h3>
      <div className="toggle-list">
        {items.map((item) => (
          <div key={item.id} className="toggle-row">
            <div className="toggle-row__info">
              <span className="toggle-row__label">{item.label}</span>
              <span className="toggle-row__desc">{item.description}</span>
            </div>
            <button
              className={`toggle ${item.on ? 'toggle--on' : ''}`}
              onClick={() => onToggle(item.id)}
              aria-pressed={item.on}
            >
              <span className="toggle__knob" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

function AppearanceSection() {
  const THEMES = [
    { id: 'purple-pulse', label: 'Purple Pulse', active: true  },
    { id: 'ocean-dark',   label: 'Ocean Dark',   active: false },
    { id: 'midnight',     label: 'Midnight',     active: false },
  ]
  return (
    <div className="settings-panel">
      <h3 className="panel-title">Appearance</h3>
      <p className="panel-desc">Choose your workspace theme</p>
      <div className="theme-grid">
        {THEMES.map((t) => (
          <div key={t.id} className={`theme-card ${t.active ? 'theme-card--active' : ''}`}>
            <div className={`theme-swatch theme-swatch--${t.id}`} />
            <span className="theme-card__label">{t.label}</span>
            {t.active && (
              <span className="theme-card__check">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}