import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
const api = axios.create({
  baseURL: 'http://localhost:8080/api', // No trailing slash
  headers: { 'Content-Type': 'application/json' },
});
// --- INTERCEPTORS ---

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standard session expiry handling
    if (error.response?.status === 401) {
      localStorage.clear();
      if (window.location.pathname !== '/auth') {
        window.location.href = '/auth';
      }
    }
    return Promise.reject(error);
  }
);

// --- API MODULES (Named Exports) ---

/**
 * Auth operations for standard users
 */
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => {
    localStorage.clear();
    return api.post('/auth/logout');
  },
};

/**
 * Management and Analytics operations
 */
export const adminApi = {
  // NEW: Handles the special Bootstrap/Admin-only registration
  registerAdmin: (adminData) => api.post('/admin/register', adminData),
  
  // Analytics endpoints
  getDashboardAnalytics: (start, end) => api.get('/analytics/dashboard', { 
    params: { start, end } 
  }),
  getOverviewAnalytics: () => api.get('/analytics/overview'),
  
  // User Management
  getAllUsers: () => api.get('/admin/users'),
  
  // Loan Pipeline Management
  getAllLoans: (page = 0, size = 50) => api.get('/loans', { 
    params: { page, size } 
  }),
};

/**
 * Loan application and lifecycle operations
 */
export const loanApi = {
  getAll: () => api.get('/loans'),
  getById: (id) => api.get(`/loans/${id}`),
  create: (loanData) => api.post('/loans', loanData),
  
  // Manual Admin decision endpoints
  approve: (id, notes) => api.put(`/loans/${id}/approve`, { notes }),
  reject: (id, reason) => api.put(`/loans/${id}/reject`, { reason }),
  disburse: (id) => api.put(`/loans/${id}/disburse`),
};

/**
 * User profile operations
 */
export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (data) => api.put('/users/me', data),
};

// --- UTILITIES (Named Exports) ---

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD' 
  }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    return new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }).format(new Date(dateString));
  } catch (e) {
    return 'Invalid Date';
  }
}

export function getCreditScoreCategory(score) {
  if (!score) return { label: 'N/A', color: 'text-slate-400' };
  if (score >= 740) return { label: 'Excellent', color: 'text-green-600' };
  if (score >= 670) return { label: 'Good', color: 'text-blue-500' };
  if (score >= 580) return { label: 'Fair', color: 'text-yellow-500' };
  return { label: 'Poor', color: 'text-red-500' };
}

export default api;