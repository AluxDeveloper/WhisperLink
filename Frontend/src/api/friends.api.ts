import { request } from './client'

export interface FriendDto {
  id: string
  name: string
  handle: string
  avatarUrl?: string
  role?: string
  status: 'online' | 'focus' | 'away' | 'offline'
}

export interface FriendRequestDto {
  id: string
  fromUserId: string
  toUserId: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export const friendsApi = {
  getFriends: (token: string) =>
    request<FriendDto[]>('/friends', { token }),

  searchUsers: (query: string, token: string) =>
    request<FriendDto[]>(`/users/search?q=${encodeURIComponent(query)}`, { token }),

  sendRequest: (toUserId: string, token: string) =>
    request<FriendRequestDto>('/friend-requests', {
      method: 'POST',
      body: { toUserId: parseInt(toUserId) },
      token,
    }),

  acceptRequest: (requestId: string, token: string) =>
    request<FriendRequestDto>(`/friend-requests/${requestId}/accept`, {
      method: 'PATCH',
      token,
    }),

  rejectRequest: (requestId: string, token: string) =>
    request<FriendRequestDto>(`/friend-requests/${requestId}/reject`, {
      method: 'PATCH',
      token,
    }),

  removeFriend: (friendId: string, token: string) =>
    request<void>(`/friends/${friendId}`, { method: 'DELETE', token }),

  getPendingRequests: (token: string) =>
  request<FriendRequestDto[]>('/friends/pending', { token }),
}
