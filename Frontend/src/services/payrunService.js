import { apiClient } from "@/lib/api";

/**
 * Payrun Service — frontend API client for /api/payruns
 *
 * Expected backend contract (agreed with Mohith):
 *   GET  /api/payruns?page=1&limit=20&status=&department=&search=
 *        -> { data: Payrun[], total: number, page: number, limit: number }
 *   POST /api/payruns
 *        -> 201 { data: Payrun }
 *   GET  /api/payruns/:id
 *        -> { data: Payrun } (includes version, status, lines, totals)
 *   POST /api/payruns/:id/compute
 *        -> Payload: { expectedVersion: number }
 *        -> 200 { data: Payrun }
 *        -> 409 { code: "CONCURRENT_MODIFICATION", message, currentVersion }
 *   POST /api/payruns/:id/validate
 *        -> Payload: { expectedVersion: number, acknowledgeWarnings?: boolean }
 *        -> 200 { data: Payrun }
 *        -> 422 { code: "WARNINGS_REQUIRE_ACKNOWLEDGMENT", warnings: [...] }
 *        -> 422 { code: "VALIDATION_FAILED", errors: [...] }
 *        -> 409 { code: "CONCURRENT_MODIFICATION", ... }
 *   POST /api/payruns/:id/pay
 *        -> Payload: { expectedVersion: number }
 *        -> 200 { data: Payrun }
 *   POST /api/payruns/:id/cancel
 *        -> Payload: { expectedVersion: number }
 *        -> 200 { data: Payrun }
 */
export const payrunService = {
  getPayruns: async (filters = {}) => {
    const response = await apiClient.get("/api/payruns", { params: filters });
    return {
      payruns: response.data?.data || [],
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      limit: response.data?.limit || 20,
    };
  },

  getPayrunById: async (id) => {
    const response = await apiClient.get(`/api/payruns/${id}`);
    return response.data?.data;
  },

  createPayrun: async (payrunData) => {
    const response = await apiClient.post("/api/payruns", payrunData);
    return response.data?.data;
  },

  computePayrun: async (id, expectedVersion) => {
    const response = await apiClient.post(`/api/payruns/${id}/compute`, {
      expectedVersion,
    });
    return response.data?.data;
  },

  validatePayrun: async (id, expectedVersion, acknowledgeWarnings = false) => {
    const response = await apiClient.post(`/api/payruns/${id}/validate`, {
      expectedVersion,
      acknowledgeWarnings,
    });
    return response.data;
  },

  payPayrun: async (id, expectedVersion) => {
    const response = await apiClient.post(`/api/payruns/${id}/pay`, {
      expectedVersion,
    });
    return response.data?.data;
  },

  cancelPayrun: async (id, expectedVersion) => {
    const response = await apiClient.post(`/api/payruns/${id}/cancel`, {
      expectedVersion,
    });
    return response.data?.data;
  },
};
