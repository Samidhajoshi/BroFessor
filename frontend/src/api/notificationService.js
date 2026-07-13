import axiosClient from './axiosClient';

export const notificationService = {
  getAll:      () => axiosClient.get('/notifications').then(r => r.data),
  unreadCount: () => axiosClient.get('/notifications/unread-count').then(r => r.data),
  markRead:    (id) => axiosClient.post(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => axiosClient.post('/notifications/read-all').then(r => r.data),
};