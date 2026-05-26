import { request } from './client'

export interface UserProfileDto {
  id: string
  name: string
  handle: string
  email: string
  bio?: string
  role?: string
  avatarUrl?: string
  status: 'online' | 'focus' | 'away' | 'offline'
}

export interface UpdateProfilePayload {
  name?: string
  handle?: string
  bio?: string
  role?: string
  avatarUrl?: string
}

export const userApi = {
  getMe: (token: string) =>
    request<UserProfileDto>('/users/me', { token }),

  getUser: (userId: string, token: string) =>
    request<UserProfileDto>(`/users/${userId}`, { token }),

  updateProfile: (data: UpdateProfilePayload, token: string) =>
    request<UserProfileDto>('/users/me', { method: 'PATCH', body: data, token }),

  updateStatus: (status: 'online' | 'focus' | 'away' | 'offline', token: string) =>
    request<void>('/users/me/status', { method: 'PATCH', body: { status }, token }),
}