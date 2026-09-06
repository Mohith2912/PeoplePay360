import { apiClient } from "@/lib/api";

/**
 * Salary Structure Service — frontend API client for /api/salary-structures
 *
 * Expected backend contract (agreed with Mohith):
 *   GET  /api/salary-structures?page=1&limit=20&status=&search=
 *        -> { data: SalaryStructure[], total: number, page: number, limit: number }
 *   GET  /api/salary-structures/:id
 *        -> { data: SalaryStructure }
 *   POST /api/salary-structures
 *        -> 201 { data: SalaryStructure }
 *   PUT  /api/salary-structures/:id
 *        -> 200 { data: SalaryStructure }
 *   POST /api/salary-structures/preview
 *        -> 200 { data: { grossEarnings, totalDeductions, netPay, items: [...] } }
 *
 * All errors: { code: string, message: string, fieldErrors?: { field: string, message: string }[] }
 */
export const salaryStructureService = {
  getSalaryStructures: async (filters = {}) => {
    const response = await apiClient.get("/api/salary-structures", { params: filters });
    return {
      structures: response.data?.data || [],
      total: response.data?.total || 0,
      page: response.data?.page || 1,
      limit: response.data?.limit || 20,
    };
  },

  getSalaryStructureById: async (id) => {
    const response = await apiClient.get(`/api/salary-structures/${id}`);
    return response.data?.data;
  },

  createSalaryStructure: async (structureData) => {
    const response = await apiClient.post("/api/salary-structures", structureData);
    return response.data?.data;
  },

  updateSalaryStructure: async (id, structureData) => {
    const response = await apiClient.put(`/api/salary-structures/${id}`, structureData);
    return response.data?.data;
  },

  /**
   * Request live calculation preview from Mohith's backend engine.
   * Zero math is evaluated client-side.
   * @param {Object} previewData - { rules: [...], sampleWage: number }
   */
  previewSalaryStructure: async (previewData) => {
    const response = await apiClient.post("/api/salary-structures/preview", previewData);
    return response.data?.data;
  },
};
