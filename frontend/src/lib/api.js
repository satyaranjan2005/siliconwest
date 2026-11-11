import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create configured Axios instance
export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('silicon_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to extract data and normalize error responses
api.interceptors.response.use(
  (response) => {
    // If returning a blob or non-JSON data, return data directly
    return response.data;
  },
  (error) => {
    const errorData = error.response?.data || {};
    const message = errorData.error || errorData.message || error.message || 'API request failed';
    const enhancedError = new Error(message);
    enhancedError.status = error.response?.status;
    enhancedError.data = errorData;
    enhancedError.originalError = error;
    return Promise.reject(enhancedError);
  }
);

// Reusable fetchApi wrapper for backwards compatibility
export async function fetchApi(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  let data = options.body;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Keep as string if not valid JSON
    }
  }

  return api.request({
    url: endpoint,
    method,
    data,
    headers: options.headers,
    ...options,
  });
}

// Authentication APIs
export const authApi = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
  verifyEmail: (email, code, extra = {}) => api.post('/auth/verify-email', { email, code, ...extra }),
  updateProfile: (data) => api.patch('/auth/profile', data),
  resendVerification: (email) => api.post('/auth/resend-verification', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
  getMe: () => api.get('/auth/me'),
};

// Clubs APIs
export const clubsApi = {
  list: (params = {}) => api.get('/clubs', { params }),
  getBySlug: (slug) => api.get(`/clubs/${slug}`),
  create: (data) => api.post('/clubs', data),
  update: (id, data) => api.put(`/clubs/${id}`, data),
  archive: (id) => api.delete(`/clubs/${id}`),
  delete: (id) => api.delete(`/clubs/${id}?permanent=true`),
  restore: (id) => api.post(`/clubs/${id}/restore`),
  applyMembership: (slug, data) => api.post(`/clubs/${slug}/apply`, data),
};

// Events APIs
export const eventsApi = {
  list: (params = {}) => api.get('/events', { params }),
  getBySlug: (slug) => api.get(`/events/${slug}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  getRegistrations: (id, params = {}) => api.get(`/events/${id}/registrations`, { params }),
  getDashboardRegistrations: () => api.get('/events/dashboard/registrations'),
  exportRegistrationsUrl: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return `${API_BASE}/events/${id}/export${qs ? `?${qs}` : ''}`;
  },
  downloadExport: (id, params = {}) => api.get(`/events/${id}/export`, { params, responseType: 'blob' }),
};

// Registrations APIs
export const registrationsApi = {
  create: (data) => api.post('/registrations', data),
  getMy: () => api.get('/registrations/my'),
  cancel: (id) => api.patch(`/registrations/${id}/cancel`),
  updateStatus: (id, status) => api.patch(`/registrations/${id}/status`, { status }),
};

// Users APIs
export const usersApi = {
  search: (query) => api.get('/users/search', { params: { q: query } }),
};

// Team Invitations APIs
export const invitationsApi = {
  getMy: () => api.get('/invitations/my'),
  send: (data) => api.post('/invitations', data),
  respond: (id, action) => api.patch(`/invitations/${id}/respond`, { action }),
};

// Admin APIs
export const adminApi = {
  getUsers: (params = {}) => api.get('/admin/users', { params }),
  createUser: (data) => api.post('/admin/users', data),
  toggleUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.patch(`/admin/users/${id}/role`, { role }),
  createAssignment: (userId, clubId) => api.post('/admin/assignments', { userId, clubId }),
  deleteAssignment: (id) => api.delete(`/admin/assignments/${id}`),
  getAllRegistrations: (params = {}) => api.get('/admin/registrations', { params }),
};

// Stats APIs
export const statsApi = {
  getDashboard: () => api.get('/stats/dashboard'),
};

export const apiClient = api;
export default api;
