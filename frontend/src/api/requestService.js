import axiosClient from './axiosClient';

export const requestService = {
  send: (payload) => axiosClient.post('/requests/send', payload).then((r) => r.data),
  incoming: () => axiosClient.get('/requests/incoming').then((r) => r.data),
  sent: () => axiosClient.get('/requests/sent').then((r) => r.data),
  accept: (id, payload) => axiosClient.post(`/requests/${id}/accept`, payload).then((r) => r.data),
  reject: (id) => axiosClient.post(`/requests/${id}/reject`).then((r) => r.data),
};
