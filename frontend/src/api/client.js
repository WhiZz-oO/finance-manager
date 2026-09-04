import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fm_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
)

export default api

// ── Auth ──────────────────────────────────────────────
export const authApi = {
  login: (username, password) => {
    const form = new URLSearchParams()
    form.append('username', username)
    form.append('password', password)
    return api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
  },
  me: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
}

// ── Accounts ──────────────────────────────────────────
export const accountsApi = {
  list: () => api.get('/accounts/'),
  create: (data) => api.post('/accounts/', data),
  update: (id, data) => api.patch(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
}

// ── Transactions ──────────────────────────────────────
export const transactionsApi = {
  list: (params) => api.get('/transactions/', { params }),
  get: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions/', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
}

// ── Transfers ─────────────────────────────────────────
export const transfersApi = {
  list: () => api.get('/transfers/'),
  create: (data) => api.post('/transfers/', data),
  delete: (id) => api.delete(`/transfers/${id}`),
}

// ── Categories ────────────────────────────────────────
export const categoriesApi = {
  list: (type) => api.get('/categories/', { params: type ? { type } : {} }),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// ── Analytics ─────────────────────────────────────────
export const analyticsApi = {
  summary: (params) => api.get('/analytics/summary', { params }),
  monthly: (year) => api.get('/analytics/monthly', { params: { year } }),
  weekly: (year, month) => api.get('/analytics/weekly', { params: { year, month } }),
  byCategory: (params) => api.get('/analytics/by-category', { params }),
  cashFlow: (months) => api.get('/analytics/cash-flow', { params: { months } }),
}

// ── Budgets ───────────────────────────────────────────
export const budgetsApi = {
  list: (params) => api.get('/budgets/', { params }),
  create: (data) => api.post('/budgets/', data),
  update: (id, data) => api.patch(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// ── Receipts ──────────────────────────────────────────
export const receiptsApi = {
  upload: (transactionId, file) => {
    const form = new FormData()
    form.append('file', file)
    return api.post(`/receipts/upload/${transactionId}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  forTransaction: (txnId) => api.get(`/receipts/transaction/${txnId}`),
  fileUrl: (receiptId) => `/api/receipts/file/${receiptId}`,
  delete: (id) => api.delete(`/receipts/${id}`),
}

// ── Backup ────────────────────────────────────────────
export const backupApi = {
  list: () => api.get('/backup/list'),
  create: () => api.post('/backup/create'),
  restore: (id) => api.post(`/backup/restore/${id}`),
  integrity: () => api.get('/backup/integrity'),
}

// ── Export ────────────────────────────────────────────
export const exportApi = {
  excel: (month, year) => api.get('/export/excel', {
    params: { month, year },
    responseType: 'blob',
  }),
}
