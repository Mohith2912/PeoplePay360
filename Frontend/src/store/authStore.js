import { create } from "zustand";
import { authService } from "@/services/authService";

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setUser: (user) => {
    set({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
    if (typeof window !== "undefined") {
      if (user) {
        localStorage.setItem("peoplepay_user", JSON.stringify(user));
      } else {
        localStorage.removeItem("peoplepay_user");
      }
    }
  },

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { token, user } = await authService.login(credentials);
      if (typeof window !== "undefined") {
        localStorage.setItem("peoplepay_token", token);
        localStorage.setItem("peoplepay_user", JSON.stringify(user));
      }
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Authentication failed. Please check your credentials or backend status.";
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
      });
      throw new Error(errorMessage);
    }
  },

  fetchCurrentUser: async () => {
    set({ isLoading: true, error: null });
    if (typeof window === "undefined") {
      set({ isLoading: false });
      return;
    }

    const token = localStorage.getItem("peoplepay_token");
    if (!token) {
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      return;
    }

    try {
      const user = await authService.getMe();
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch {
      localStorage.removeItem("peoplepay_token");
      localStorage.removeItem("peoplepay_user");
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("peoplepay_token");
        localStorage.removeItem("peoplepay_user");
      }
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
