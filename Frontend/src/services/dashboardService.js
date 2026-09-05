import { apiClient } from "@/lib/api";

export const dashboardService = {
  getDashboard: async (filters) => {
    const response = await apiClient.get("/api/dashboard", { params: filters });
    const data = response.data;
    if (data && "kpis" in data) {
      return data;
    }
    if (data && "data" in data) {
      return data.data;
    }
    throw new Error("Invalid response format from dashboard endpoint");
  },
};
