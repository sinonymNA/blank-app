import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000
});

// Products
export const getProducts = () => api.get('/products').then(r => r.data);
export const createProduct = (data) => api.post('/products', data).then(r => r.data);
export const getProduct = (id) => api.get(`/products/${id}`).then(r => r.data);
export const updateProduct = (id, data) => api.patch(`/products/${id}`, data).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);

// Queue
export const getQueue = (params) => api.get('/queue', { params }).then(r => r.data);
export const getUrgentQueue = () => api.get('/queue/urgent').then(r => r.data);
export const getQueueCount = () => api.get('/queue/count').then(r => r.data);
export const approveItem = (id) => api.post(`/queue/approve/${id}`).then(r => r.data);
export const skipItem = (id) => api.post(`/queue/skip/${id}`).then(r => r.data);
export const editItem = (id, body) => api.post(`/queue/edit/${id}`, { body }).then(r => r.data);
export const regenerateItem = (id, feedback) => api.post(`/queue/regenerate/${id}`, { feedback }).then(r => r.data);
export const approveAll = () => api.post('/queue/approve-all').then(r => r.data);

// Analytics
export const getAnalytics = (productId, range) => api.get(`/analytics/${productId}`, { params: { range } }).then(r => r.data);
export const getWeekAnalytics = (productId) => api.get(`/analytics/${productId}/week`).then(r => r.data);
export const getBestContent = (productId) => api.get(`/analytics/${productId}/best`).then(r => r.data);

// Platforms
export const getPlatforms = (productId) => api.get(`/platforms/${productId}`).then(r => r.data);
export const connectPlatform = (data) => api.post('/platforms/connect', data).then(r => r.data);
export const disconnectPlatform = (id) => api.delete(`/platforms/${id}`).then(r => r.data);
export const testPlatform = (id) => api.post(`/platforms/test/${id}`).then(r => r.data);

// Reddit monitors
export const getRedditMonitors = (productId) => api.get(`/platforms/reddit/monitors/${productId}`).then(r => r.data);
export const addRedditMonitor = (data) => api.post('/platforms/reddit/monitors', data).then(r => r.data);
export const removeRedditMonitor = (id) => api.delete(`/platforms/reddit/monitors/${id}`).then(r => r.data);
export const getRedditThreads = () => api.get('/platforms/reddit/threads').then(r => r.data);

// Generate
export const generateBatch = (productId) => api.post('/generate/batch', { product_id: productId }).then(r => r.data);
export const generateRedditReply = (data) => api.post('/generate/reddit-reply', data).then(r => r.data);

export default api;
