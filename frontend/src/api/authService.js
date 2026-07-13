import axiosClient from './axiosClient';

export const authService = {
  register: (payload) => axiosClient.post('/auth/register', payload).then((r) => r.data),
  login: (payload) => axiosClient.post('/auth/login', payload).then((r) => r.data),
  profile: () => axiosClient.get('/auth/profile').then((r) => r.data),
};
