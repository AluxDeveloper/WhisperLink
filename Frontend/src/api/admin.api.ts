import { request } from './client'

export interface AdminStats {
  totalUsers: number
  onlineUsers: number
  totalMessages: number
  totalFriendships: number
  timestamp: string
}

export interface AdminUserDto {
  id: number
  username: string
  email: string
  displayName?: string
  handle?: string
  jobRole?: string
  role: string
  presence: string
  createdAt: string
}

export const adminApi = {
  getStats: () =>
    request<AdminStats>('/auth/stats'),

  getAllUsers: (token: string) =>
    request<any[]>('/users', { token }),

  updateUser: (userId: number, data: any, token: string) =>
    request<AdminUserDto>(`/users/${userId}`, { method: 'PUT', body: data, token }),

  deleteUser: (userId: number, token: string) =>
    request<void>(`/users/admin/${userId}`, { method: 'DELETE', token }),
}