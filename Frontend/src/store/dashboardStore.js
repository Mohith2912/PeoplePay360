import { create } from "zustand";
import { dashboardService } from "@/services/dashboardService";

export const useDashboardStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,

  fetchDashboard: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      const data = await dashboardService.getDashboard(filters);
      set({ data, isLoading: false, error: null });
    } catch (err) {
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Unable to load dashboard data. Backend endpoint /api/dashboard is not ready or returned an error.";
      set({
        isLoading: false,
        error: errorMessage,
      });
    }
  },

  clearError: () => set({ error: null }),
}));
