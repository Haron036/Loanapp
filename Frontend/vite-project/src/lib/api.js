import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach JWT Token
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

// Response Interceptor: Handle Token Refresh and 401s
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error("No refresh token");
        
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
        const { token } = response.data;
        
        localStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/**
 * UTILITY FUNCTIONS
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount || 0);
}

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  return new Intl.DateTimeFormat('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }).format(new Date(dateString));
}

export function getCreditScoreCategory(score) {
  if (score >= 800) return { label: 'Excellent', color: 'text-green-600', description: 'Exceptional' };
  if (score >= 740) return { label: 'Very Good', color: 'text-green-500', description: 'Strong' };
  if (score >= 670) return { label: 'Good', color: 'text-blue-500', description: 'Average' };
  if (score >= 580) return { label: 'Fair', color: 'text-yellow-500', description: 'Below average' };
  return { label: 'Poor', color: 'text-red-500', description: 'Poor credit' };
}

/**
 * API MODULES
 */

// Auth Endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
};

// Loan Endpoints (User perspective)
export const loanApi = {
  getAll: () => api.get('/loans'),
  getById: (id) => api.get(`/loans/${id}`),
  getSummary: () => api.get('/loans/summary'),
  getRepayments: (loanId) => api.get(`/loans/${loanId}/repayments`),
  create: (loanData) => api.post('/loans', loanData),
  // These are often called from Admin context as well
  approve: (id, note) => api.put(`/admin/loans/${id}/approve`, { note }),
  reject: (id, note) => api.put(`/admin/loans/${id}/reject`, { note }),
};

// User Endpoints
export const userApi = {
  getProfile: () => api.get('/users/me'),
};

// Admin Endpoints (REQUIRED for Admin.jsx)
export const adminApi = {
  getAllLoans: () => api.get('/admin/loans'),
  getAnalytics: () => api.get('/admin/analytics'),
};

export default api;