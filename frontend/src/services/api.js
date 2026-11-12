import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token
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

export const authService = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: () => {
    localStorage.removeItem('token');
  },
};

export const smsService = {
  parseSMS: (smsData) => api.post('/api/sms/parse', smsData),
  getTransactions: () => api.get('/api/transactions'),
};

export const analyticsService = {
  getHealthScore: () => api.get('/api/analytics/health-score'),
  getSummary: () => api.get('/api/analytics/summary'),
};

export const advisorService = {
  chat: (message, language) => api.post('/api/advisor/chat', { message, language }),
};

export const intentService = {
  classify: (query, language, currentRoute = null) => 
    api.post('/api/intent/classify', { query, language, current_route: currentRoute }),
  getHelp: (query, currentRoute, language = 'en') => 
    api.post('/api/intent/help', { query, current_route: currentRoute, language }),
  getFeatures: () => api.get('/api/intent/features'),
};

export default api;
