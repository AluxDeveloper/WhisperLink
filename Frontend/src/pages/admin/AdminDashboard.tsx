import { useEffect, useState } from 'react'
import { adminApi, type AdminUserDto } from '../../api/admin.api'
import './AdminDashboard.css'

interface Stats {
  totalUsers: number
  onlineUsers: number
  totalMessages: number
  totalFriendships: number
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [users, setUsers] = useState<AdminUserDto[]>([])
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

      setUsers(usersData)
      setStats({
        totalUsers: usersData.length,
        onlineUsers: usersData.filter((u: AdminUserDto) => u.presence === 'online').length,
        totalMessages: statsRes.messages ?? 0,
        totalFriendships: statsRes.friends ?? 0,
      })
    } catch (error) {
      console.error('Failed to load admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return
    try {
      await adminApi.deleteUser(userId, token)
      setUsers(users.filter(u => u.id !== userId))
      alert('User deleted successfully')
    } catch (error) {
      alert('Failed to delete user')
    }
  }

  const filteredUsers = users.filter(u =>
    (u.username ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.displayName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
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
                <th>Username</th>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td className="username-cell">
                    <span className={`status-dot ${user.presence === 'online' ? 'online' : 'offline'}`} />
                    {user.username}
                  </td>
                  <td>{user.email}</td>
                  <td>{user.displayName ?? '-'}</td>
                  <td>
                    <span className={`role-badge role-${(user.role ?? 'user').toLowerCase()}`}>
                      {user.role ?? 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.presence === 'online' ? 'online' : 'offline'}`}>
                      {user.presence === 'online' ? 'Online' : 'Offline'}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button
                      className="btn-delete"
                      onClick={() => handleDeleteUser(user.id, user.username)}
                      disabled={user.role === 'Admin'}
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