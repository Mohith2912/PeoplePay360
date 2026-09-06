import { apiClient } from "@/lib/api";

/**
 * Contract Service — frontend API client for /api/contracts
 *
 * Expected backend response shapes (agreed with Mohith):
 *   GET  /api/contracts?employeeId=&status=&page=1&limit=20
 *        -> { data: Contract[], total: number }
 *   GET  /api/contracts/:id
 *        -> { data: Contract }
 *   GET  /api/employees/:id/contracts
 *        -> { data: Contract[] }
 *   POST /api/contracts
 *        -> 201 { data: Contract }
 *        -> 400 { code: "OVERLAPPING_CONTRACT", message, fieldErrors? } on conflict
 *   PUT  /api/contracts/:id
 *        -> 200 { data: Contract }
 *   All errors: { code: string, message: string, fieldErrors?: { field: string, message: string }[] }
 *
 * Contract field reference:
 *   Required (POST): employeeId, wage, startDate, status
 *   Optional (POST): endDate, scheduleId, structureId
 *   wage:        number (INR, no trailing currency symbol — backend stores raw number)
 *   startDate:   "YYYY-MM-DD"
 *   endDate:     "YYYY-MM-DD" | null (open-ended if null)
 *   status:      "DRAFT" | "ACTIVE" | "ENDED" | "CANCELLED"
 *   scheduleId:  number | null (foreign key to working schedule)
 *   structureId: number | null (foreign key to salary structure — valid IDs fetched from GET /api/salary-structures)
 *
 * DB relationships (confirmed with Poshika):
 *   Employee 1 --< Contract (one employee, many contracts over time)
 *   Contract  >-- WorkingSchedule
 *   Contract  >-- SalaryStructure
 *   Only ONE contract may have status=ACTIVE per employee at any time.
 */
export const contractService = {
  getContracts: async (filters = {}) => {
    const response = await apiClient.get("/api/contracts", { params: filters });
    return {
      contracts: response.data?.data || [],
      total: response.data?.total || 0,
    };
  },

  getContractById: async (id) => {
    const response = await apiClient.get(`/api/contracts/${id}`);
    return response.data?.data;
  },

  getContractsByEmployee: async (employeeId) => {
    const response = await apiClient.get(`/api/employees/${employeeId}/contracts`);
    return response.data?.data || [];
  },

  createContract: async (contractData) => {
    const response = await apiClient.post("/api/contracts", contractData);
    return response.data?.data;
  },

  updateContract: async (id, contractData) => {
    const response = await apiClient.put(`/api/contracts/${id}`, contractData);
    return response.data?.data;
  },
};
