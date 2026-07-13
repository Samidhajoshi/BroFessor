import axiosClient from './axiosClient';

export const chatService = {
  createRoom:  (sessionRequestId) =>
    axiosClient.post('/chat/room/create', null, { params: { sessionRequestId } }).then(r => r.data),
  getRoom:     (roomId)  => axiosClient.get(`/chat/room/${roomId}`).then(r => r.data),
  getRooms:    ()        => axiosClient.get('/chat/rooms').then(r => r.data),
  getMessages: (roomId)  => axiosClient.get(`/chat/messages/${roomId}`).then(r => r.data),
  markRead:    (roomId)  => axiosClient.post(`/chat/read/${roomId}`).then(r => r.data),
  presence:    ()        => axiosClient.get('/chat/presence').then(r => r.data),
};
