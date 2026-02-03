import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken
        });
        
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

// Utility functions
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
  }).format(amount);
}

export function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatPercent(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 2,
  }).format(value / 100);
}
// Credit score utilities
export function getCreditScoreCategory(score) {
  if (score >= 800) {
    return { 
      label: 'Excellent', 
      color: 'text-green-600',
      description: 'Exceptional credit'
    };
  } else if (score >= 740) {
    return { 
      label: 'Very Good', 
      color: 'text-green-500',
      description: 'Strong credit'
    };
  } else if (score >= 670) {
    return { 
      label: 'Good', 
      color: 'text-blue-500',
      description: 'Average credit'
    };
  } else if (score >= 580) {
    return { 
      label: 'Fair', 
      color: 'text-yellow-500',
      description: 'Below average credit'
    };
  } else {
    return { 
      label: 'Poor', 
      color: 'text-red-500',
      description: 'Poor credit'
    };
  }
}

export function getCreditScoreColor(score) {
  if (score >= 800) return 'text-green-600';
  if (score >= 740) return 'text-green-500';
  if (score >= 670) return 'text-blue-500';
  if (score >= 580) return 'text-yellow-500';
  return 'text-red-500';
}

// Admin-specific API calls
export const adminApi = {
  // Get all loans (admin view)
  getAllLoans: (page = 0, size = 50) => api.get(`/admin/loans?page=${page}&size=${size}`),
  
  // Get admin analytics
  getAnalytics: () => api.get('/admin/analytics'),
  
  // Get monthly applications data
  getMonthlyApplications: (year = new Date().getFullYear()) => 
    api.get(`/admin/analytics/monthly?year=${year}`),
  
  // Get loan status distribution
  getLoanStatusDistribution: () => api.get('/admin/analytics/status-distribution'),
  
  // Get admin stats
  getStats: () => api.get('/admin/stats'),
  
  // Update loan status (admin)
  updateLoanStatus: (loanId, status, notes = '') => 
    api.put(`/admin/loans/${loanId}/status`, { status, notes }),
};


// Dashboard-specific API calls
export const dashboardApi = {
  // Get user dashboard data
  getDashboardData: () => api.get('/users/me/dashboard'),
  
  // Get user loans
  getUserLoans: () => api.get('/loans/my-loans'),
  
  // Get loan repayments
  getLoanRepayments: (loanId) => api.get(`/loans/${loanId}/repayments`),
  
  // Get loan summary
  getLoanSummary: () => api.get('/loans/summary'),
  
  // Get user stats
  getUserStats: () => api.get('/users/me/stats'),
};

export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const loanApi = {
  getAll: () => api.get('/loans'),
  getById: (id) => api.get(`/loans/${id}`),
  create: (loanData) => api.post('/loans', loanData),
  getSummary: () => api.get('/loans/summary'),
  approve: (id, notes) => api.put(`/loans/${id}/approve`, { notes }),
  reject: (id, reason) => api.put(`/loans/${id}/reject`, { reason }),
  disburse: (id) => api.put(`/loans/${id}/disburse`),
  getByStatus: (status, page = 0, size = 20) => 
    api.get(`/loans/status/${status}?page=${page}&size=${size}`),
};

export const userApi = {
  getProfile: () => api.get('/users/me'),
  updateProfile: (userData) => api.put('/users/me', userData),
  changePassword: (data) => api.put('/users/me/change-password', data),
  getUsers: () => api.get('/users'),
};

export default api;