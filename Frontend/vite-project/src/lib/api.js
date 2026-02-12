import axios from 'axios';

// ==========================
// BASE AXIOS INSTANCE
// ==========================
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// ==========================
// REQUEST INTERCEPTOR
// ==========================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==========================
// RESPONSE INTERCEPTOR
// ==========================
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      if (window.location.pathname !== '/auth') window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

// ==========================
// AUTH API
// ==========================
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
    return api.post('/auth/logout');
  },
};

// ==========================
// USER API
// ==========================
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

// ==========================
// LOAN API
// ==========================
export const loanApi = {
  create: (loanData) => api.post('/loans/apply', loanData),
  // Matches your RepaymentController: @RequestMapping("/api/repayments")
  payInstallment: (repaymentId, data) => api.post(`/repayments/${repaymentId}/pay`, data),
  getUserLoans: (page = 0, size = 10) => api.get('/loans/my-loans', { params: { page, size } }),
  getById: (id) => api.get(`/loans/${id}`),
  getSummary: () => api.get('/loans/summary'),
  getRepayments: (loanId) => api.get(`/loans/${loanId}/repayments`),
  
  // ADMIN ACTIONS
  approve: (id, data) => api.put(`/loans/${id}/approve`, data), 
  reject: (id, data) => api.put(`/loans/${id}/reject`, data),
  disburse: (id) => api.put(`/loans/${id}/disburse`),
};

// ==========================
// ADMIN API
// ==========================
export const adminApi = {
  registerAdmin: (adminData) => api.post('/admin/register', adminData),
  getDashboardAnalytics: (start, end) => api.get('/analytics/dashboard', { params: { start, end } }),
  getOverviewAnalytics: () => api.get('/analytics/overview'),
  getAllUsers: () => api.get('/admin/users'),
  getAllLoans: (page = 0, size = 50) => api.get('/loans', { params: { page, size } }),
};

// ==========================
// UTILITIES
// ==========================
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-KE', { 
    style: 'currency', 
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount || 0).replace('KES', 'KSh');
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-GB', { 
      year: 'numeric', month: 'short', day: 'numeric' 
    }).format(new Date(dateString));
  } catch (e) { return 'Invalid Date'; }
}

export function getCreditScoreCategory(score) {
  if (!score) return { label: 'N/A', color: 'text-slate-400' };
  if (score >= 700) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 600) return { label: 'Good', color: 'text-blue-500' };
  if (score >= 500) return { label: 'Fair', color: 'text-yellow-500' };
  return { label: 'Poor', color: 'text-red-500' };
}

export default api;