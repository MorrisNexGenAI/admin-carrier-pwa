// ==================== src/services/apiClient.js ====================
import axios from 'axios';

const DJANGO_URL = import.meta.env.VITE_DJANGO_URL || 'https://studycompanions-fzrm.onrender.com';

export const apiClient = axios.create({
  baseURL: DJANGO_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for Django session cookies
  timeout: 30000,
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - clearing session');
      localStorage.removeItem('admin_session');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;


