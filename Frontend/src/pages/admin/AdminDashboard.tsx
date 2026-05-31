import { useEffect, useState } from 'react'
import { adminApi } from '../../api/admin.api'
import './AdminDashboard.css'

interface Stats {
  totalUsers: number
  onlineUsers: number
  totalMessages: number
  totalFriendships: number
}

interface UserRow {
  id: string
  name: string
  handle: string
  email: string
  role: string | null
  avatarUrl: string | null
  status: string
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const token = localStorage.getItem('token') || ''

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      const [usersData, statsRes] = await Promise.all([
        adminApi.getAllUsers(token),
        fetch('http://localhost:8080/api/user/stats', {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json())
      ])

      setUsers([...usersData].sort((a: any, b: any) => parseInt(a.id) - parseInt(b.id)))
      setStats({
        totalUsers: usersData.length,
        onlineUsers: usersData.filter((u: UserRow) => u.status === 'online').length,
        totalMessages: statsRes.messages ?? 0,
        totalFriendships: statsRes.friends ?? 0,
      })
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, name: string) => {
    if (!confirm(`Are you sure you want to delete user "${name}"?`)) return
    try {
      await adminApi.deleteUser(parseInt(userId), token)
      setUsers(users.filter(u => u.id !== userId))
      alert('User deleted successfully')
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(u =>
    (u.name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.handle ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return <div className="admin-loading">Loading admin dashboard...</div>
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p className="admin-subtitle">Manage users and view statistics</p>
      </div>

      {stats && (
        <div className="admin-stats">
          <div className="stat-card">
            <div className="stat-value">{stats.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.onlineUsers}</div>
            <div className="stat-label">Online Now</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalMessages}</div>
            <div className="stat-label">Messages Sent</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalFriendships}</div>
            <div className="stat-label">Friendships</div>
          </div>
        </div>
      )}

      <div className="admin-section">
        <div className="section-header">
          <h2>User Management</h2>
          <input
            type="text"
            className="admin-search"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="users-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Handle</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.name ?? '-'}</td>
                  <td className="username-cell">
                    <span className={`status-dot ${user.status === 'online' ? 'online' : 'offline'}`} />
                    {user.handle ?? '-'}
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <span className="role-badge role-user">
                      {user.role ?? 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'online' ? 'online' : 'offline'}`}>
                      {user.status === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td className="actions-cell">
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.id, user.name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}