import { request } from './client'

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  name: string
  email: string
  password: string
}

export interface AuthResponse {
  token: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    handle: string
    avatarUrl?: string
  }
}

export const authApi = {
  login: (data: LoginPayload) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  register: (data: RegisterPayload) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  logout: (token: string) =>
    request<void>('/auth/logout', { method: 'POST', token }),

  refreshToken: (refreshToken: string) =>
    request<{ token: string }>('/auth/refresh', {
      method: 'POST',
      body: { refreshToken },
    }),
}