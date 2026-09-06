import { apiClient } from '@/lib/api';
export const authService = {
  async login(credentials) { return (await apiClient.post('/api/auth/login', credentials)).data.data.user; },
  async getMe() { return (await apiClient.get('/api/auth/me')).data.data; },
  async logout() { await apiClient.post('/api/auth/logout'); }
};
