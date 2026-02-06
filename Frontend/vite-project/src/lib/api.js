import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- INTERCEPTORS (Auth Logic) ---
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// --- API MODULES ---

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.clear();
    return api.post('/auth/logout');
  },
};

export const adminApi = {
  getAnalytics: (startDate, endDate) => api.get('/analytics/dashboard', { 
    params: { startDate, endDate } 
  }),
  getAllLoans: (page = 0, size = 20) => api.get('/loans', {
    params: { page, size }
  }), 
  getAllUsers: () => api.get('/admin/dashboard/users'),
  getUser: (id) => api.get(`/admin/dashboard/users/${id}`),
};

export const loanApi = {
  getAll: () => api.get('/loans'),
  getById: (id) => api.get(`/loans/${id}`),
  getSummary: () => api.get('/loans/summary'),
  getRepayments: (id) => api.get(`/loans/${id}/repayments`), // Added for Dashboard.jsx
  create: (loanData) => api.post('/loans', loanData),
  
  // Admin Actions
  approve: (id, notes) => api.put(`/loans/${id}/approve`, { notes }),
  reject: (id, reason) => api.put(`/loans/${id}/reject`, { reason }),
  disburse: (id) => api.put(`/loans/${id}/disburse`),
};

/**
 * User Specific Endpoints 
 * This fixes the "does not provide an export named 'userApi'" error
 */
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

// --- UTILITIES ---

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', month: 'short', day: 'numeric' 
  }).format(new Date(dateString));
}

export function getCreditScoreCategory(score) {
  if (score >= 740) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 670) return { label: 'Good', color: 'text-blue-500' };
  if (score >= 580) return { label: 'Fair', color: 'text-yellow-500' };
  return { label: 'Poor', color: 'text-red-500' };
}

export default api;