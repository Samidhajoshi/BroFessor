import axiosClient from './axiosClient';

export const userService = {
  getAll:        ()        => axiosClient.get('/users').then(r => r.data),
  getById:       (id)      => axiosClient.get(`/users/${id}`).then(r => r.data),
  getReviews:    (id)      => axiosClient.get(`/users/${id}/reviews`).then(r => r.data),
  search:        (skillWanted) =>
    axiosClient.get('/users/search', { params: { skillWanted } }).then(r => r.data),
  searchByName:  (name) =>
    axiosClient.get('/users/search-by-name', { params: { name } }).then(r => r.data),
  updateProfile: (payload) => axiosClient.put('/users/profile', payload).then(r => r.data),

  uploadPhoto: (file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosClient.post('/users/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  addSkill:    (skillName, type) =>
    axiosClient.post('/users/skills', { skillName, type }).then(r => r.data),
  removeSkill: (skillId) =>
    axiosClient.delete(`/users/skills/${skillId}`).then(r => r.data),
};