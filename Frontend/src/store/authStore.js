import { create } from 'zustand';
import { authService } from '@/services/authService';
let restoring;
export const useAuthStore = create(set => ({
  user: null, isAuthenticated: false, isLoading: false, hasCheckedSession: false, error: null,
  setUser: user => set({user, isAuthenticated: !!user, isLoading: false, hasCheckedSession: true}),
  clearError: () => set({error: null}),
  async login(credentials) {
    set({isLoading:true,error:null});
    try { const user = await authService.login(credentials); set({user,isAuthenticated:true,isLoading:false,hasCheckedSession:true}); }
    catch(error) { set({user:null,isAuthenticated:false,isLoading:false,hasCheckedSession:true,error:error.response?.data?.message || 'Unable to sign in.'}); throw error; }
  },
  async fetchCurrentUser() {
    if (restoring) return restoring;
    set({isLoading:true});
    restoring = authService.getMe().then(user => set({user,isAuthenticated:true,isLoading:false,hasCheckedSession:true})).catch(() => set({user:null,isAuthenticated:false,isLoading:false,hasCheckedSession:true})).finally(() => { restoring = null; });
    return restoring;
  },
  async logout() { await authService.logout(); set({user:null,isAuthenticated:false,isLoading:false,hasCheckedSession:true,error:null}); window.location.assign('/login'); }
}));
