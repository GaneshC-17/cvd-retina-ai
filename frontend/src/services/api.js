import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authRegister = (data) => API.post('/auth/register', data);
export const authLogin = (data) => API.post('/auth/login', data);
export const authGetMe = () => API.get('/auth/me');
export const authUpdateProfile = (data) => API.put('/auth/profile', data);
export const authChangePassword = (data) => API.put('/auth/change-password', data);
export const authForgotPassword = (data) => API.post('/auth/forgot-password', data);
export const authResetPassword = (data) => API.post('/auth/reset-password', data);

// Predictions endpoints
export const uploadAndPredict = (formData) => API.post('/predict', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
});
export const getPredictionHistory = (params) => API.get('/history', { params });
export const getDashboardStats = () => API.get('/dashboard');

// Patient Management endpoints
export const searchPatients = (query) => API.get('/patients/search', { params: { query } });
export const createPatient = (data) => API.post('/patients', data);
export const getPatientProfile = (patientId) => API.get(`/patients/${patientId}`);
export const exportPatientHistoryPdf = (patientId) => API.get(`/patients/${patientId}/export`, { responseType: 'blob' });
export const getScanDetails = (scanId) => API.get(`/scan/${scanId}`);

// Admin endpoints
export const adminGetUsers = () => API.get('/admin/users');
export const adminDeleteUser = (userId) => API.delete(`/admin/users/${userId}`);
export const adminGetPredictions = () => API.get('/admin/predictions');
export const adminDeletePrediction = (predId) => API.delete(`/admin/predictions/${predId}`);

export default API;

