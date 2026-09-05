import { apiClient } from "@/lib/api";

/**
 * Payslip Service — frontend API client for /api/payslips
 *
 * Expected backend contract (agreed with Mohith):
 *   GET  /api/payslips?page=1&limit=20&payrunId=&employeeId=&department=&month=&year=
 *        -> { data: Payslip[], total: number, page: number, limit: number }
 *   GET  /api/payslips/me?page=1&limit=20
 *        -> { data: Payslip[], total: number, page: number, limit: number }
 *   GET  /api/payslips/:id
 *        -> { data: Payslip } (Backend verifies ownership if role == EMPLOYEE)
 *   GET  /api/payslips/:id/pdf
 *        -> application/pdf blob stream
 *   POST /api/payslips/:id/email
 *        -> 200 { success: true, message: string } (Restricted to HR_PAYROLL_MANAGER / ADMIN)
 */
export const payslipService = {
  getPayslips: async (filters = {}) => {
    const response = await apiClient.get("/api/payslips", { params: filters });
    return {
      payslips: response.data?.data || [],
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      limit: response.data?.limit || 20,
    };
  },

  getMyPayslips: async (filters = {}) => {
    const response = await apiClient.get("/api/payslips/me", { params: filters });
    return {
      payslips: response.data?.data || [],
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      limit: response.data?.limit || 20,
    };
  },

  getPayslipById: async (id) => {
    const response = await apiClient.get(`/api/payslips/${id}`);
    return response.data?.data;
  },

  downloadPdf: async (id) => {
    const response = await apiClient.get(`/api/payslips/${id}/pdf`, {
      responseType: "blob",
    });
    return response.data;
  },

  emailPayslip: async (id) => {
    const response = await apiClient.post(`/api/payslips/${id}/email`);
    return response.data;
  },
};
