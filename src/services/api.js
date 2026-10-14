import axios from 'axios'

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    'https://employee-leave-payroll-backend.onrender.com/api',
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('authToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  response => response,
  error => {
    const token = sessionStorage.getItem('authToken')
    const url = error?.config?.url || ''

    if (
      error?.response?.status === 401 &&
      token &&
      !url.includes('/auth/login')
    ) {
      window.dispatchEvent(new Event('auth-expired'))
    }

    return Promise.reject(error)
  },
)

export const employeeApi = {
  list: () => api.get('/employees'),
  get: id => api.get(`/employees/${id}`),
  create: employee => api.post('/employees', employee),
  update: (id, employee) => api.put(`/employees/${id}`, employee),
  remove: id => api.delete(`/employees/${id}`),
}

export const leaveApi = {
  list: () => api.get('/leaves'),
  review: (id, status) => api.patch(`/leaves/${id}`, { status }),
}

export const employeePortalApi = {
  myLeaves: () => api.get('/me/leaves'),
  applyLeave: payload => api.post('/me/leaves', payload),
  attendance: () => api.get('/me/attendance'),
  checkIn: () => api.post('/me/attendance/check-in'),
  checkOut: () => api.post('/me/attendance/check-out'),
}

export default api
