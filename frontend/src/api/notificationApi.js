import axiosInstance from './axiosInstance'

export const notificationApi = {
  getAll:      ()   => axiosInstance.get('/api/notifications'),
  getCount:    ()   => axiosInstance.get('/api/notifications/count'),
  generate:    ()   => axiosInstance.get('/api/notifications/generate'),
  markRead:    (id) => axiosInstance.put(`/api/notifications/${id}/read`),
  markAllRead: ()   => axiosInstance.put('/api/notifications/read-all'),
}