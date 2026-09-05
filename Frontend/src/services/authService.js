import { apiClient } from "@/lib/api";

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post("/api/auth/login", credentials);
    const data = response.data;
    if (data && "token" in data && "user" in data) {
      return data;
    }
    if (data && "data" in data) {
      return data.data;
    }
    throw new Error("Invalid response format from login endpoint");
  },

  getMe: async () => {
    const response = await apiClient.get("/api/auth/me");
    const data = response.data;
    if (data && "id" in data && "role" in data) {
      return data;
    }
    if (data && "user" in data) {
      return data.user;
    }
    if (data && "data" in data) {
      return data.data;
    }
    throw new Error("Invalid response format from me endpoint");
  },

  logout: async () => {
    try {
      await apiClient.post("/api/auth/logout");
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("peoplepay_token");
        localStorage.removeItem("peoplepay_user");
      }
    }
  },
};
