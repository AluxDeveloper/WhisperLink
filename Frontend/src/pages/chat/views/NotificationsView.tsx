import { useState, useEffect } from 'react'
import './NotificationsView.css'
import { friendsApi } from '../../../api/friends.api'
import type { FriendRequestDto } from '../../../api/friends.api'

type Filter = 'all' | 'messages' | 'mentions' | 'requests'

interface Notification {
  id: string
  type: 'message' | 'mention' | 'request'
  from: string
  initials: string
  text: string
  time: string
  unread: boolean
  requestId?: string
}

function getToken(): string {
  return localStorage.getItem('token') ?? ''
}

function getInitials(name: string): string {
  return (name ?? '??').split(' ').map(w => w[0] ?? '').join('').toUpperCase().slice(0, 2) || '??'
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return 'Yesterday'
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',      label: 'All'      },
  { id: 'messages', label: 'Messages' },
  { id: 'mentions', label: 'Mentions' },
  { id: 'requests', label: 'Requests' },
]

export function NotificationsView() {
  const [filter, setFilter] = useState<Filter>('all')
  const [dismissed, setDismissed] = useState<string[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    const token = getToken()
    if (!token) return

    friendsApi.getPendingRequests(token)
      .then((requests: FriendRequestDto[]) => {
        const notifs: Notification[] = requests.map(r => ({
          id: `req-${r.id}`,
          type: 'request' as const,
          from: r.fromUserId,
          initials: '??',
          text: 'Sent you a friend request.',
          time: timeAgo(r.createdAt),
          unread: true,
          requestId: r.id,
        }))
        setNotifications(notifs)
      })
      .catch(() => {})
  }, [])

  const visible = notifications.filter((n) => {
    if (dismissed.includes(n.id)) return false
    if (filter === 'messages') return n.type === 'message'
    if (filter === 'mentions') return n.type === 'mention'
    if (filter === 'requests') return n.type === 'request'
    return true
  })

  const unreadCount = visible.filter((n) => n.unread).length

  function handleAccept(n: Notification) {
    if (!n.requestId) return
    friendsApi.acceptRequest(n.requestId, getToken())
      .then(() => setDismissed(prev => [...prev, n.id]))
      .catch(() => {})
  }

  function handleDecline(n: Notification) {
    if (!n.requestId) return
    friendsApi.rejectRequest(n.requestId, getToken())
      .then(() => setDismissed(prev => [...prev, n.id]))
      .catch(() => {})
  }

  return (
    <div className="notif-view">
      <div className="view-header">
        <div className="view-header__icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <div className="view-header__text">
          <h2 className="view-header__title">
            Notifications
            {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
          </h2>
          <p className="view-header__sub">Stay updated on your activity</p>
        </div>
        {unreadCount > 0 && (
          <button
            className="mark-read-btn"
            onClick={() =>
              setDismissed(prev => [
                ...prev,
                ...visible.filter(n => n.unread).map(n => n.id),
              ])
            }
          >
            Mark all read
          </button>
        )}
      </div>

      <div className="filter-tabs">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-tab ${filter === f.id ? 'filter-tab--active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="notif-list">
        {visible.length === 0 ? (
          <div className="notif-empty">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>All caught up!</p>
          </div>
        ) : (
          visible.map((n) => (
            <div key={n.id} className={`notif-item ${n.unread ? 'notif-item--unread' : ''}`}>
              <div className="notif-item__avatar">{getInitials(n.from)}</div>
              <div className="notif-item__body">
                <span className="notif-item__from">{n.from}</span>
                <p className="notif-item__text">{n.text}</p>
                <span className="notif-item__time">{n.time}</span>
              </div>
              <div className="notif-item__right">
                {n.unread && <span className="unread-dot" />}
                {n.type === 'request' && (
                  <div className="notif-item__request-btns">
                    <button className="req-btn req-btn--accept" onClick={() => handleAccept(n)}>Accept</button>
                    <button className="req-btn req-btn--decline" onClick={() => handleDecline(n)}>Decline</button>
                  </div>
                )}
                <button
                  className="notif-item__dismiss"
                  title="Dismiss"
                  onClick={() => setDismissed(prev => [...prev, n.id])}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}