import axiosInstance from './axiosInstance'

export const cashApi = {
  getTodaySession:    ()           => axiosInstance.get('/api/cash/session/today'),
  openSession:        (data)       => axiosInstance.post('/api/cash/session/open', data),
  closeSession:       (id, data)   => axiosInstance.post(`/api/cash/session/${id}/close`, data),
  getSessions:        ()           => axiosInstance.get('/api/cash/sessions'),
  getOperations:      (sessionId)  => axiosInstance.get('/api/cash/operations', {
                                        params: { session_id: sessionId }
                                      }),
  addOperation:       (data)       => axiosInstance.post('/api/cash/operations', data),
  validateOperation:  (id)         => axiosInstance.put(`/api/cash/operations/${id}/validate`),
  rejectOperation:    (id)         => axiosInstance.put(`/api/cash/operations/${id}/reject`),
  getSummary:         ()           => axiosInstance.get('/api/cash/summary'),
  getDailyReport:     (date)       => axiosInstance.get(`/api/cash/report/${date}`),
}