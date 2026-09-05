import { apiClient } from "@/lib/api";

/**
 * Employee Service — frontend API client for /api/employees
 *
 * Expected backend response shapes (agreed with Mohith):
 *   GET  /api/employees?search=&department=&page=1&limit=20
 *        -> { data: Employee[], total: number, page: number, limit: number }
 *   GET  /api/employees/:id
 *        -> { data: Employee }
 *        -> 404 with { code: "EMPLOYEE_NOT_FOUND", message: string } if not found
 *   POST /api/employees
 *        -> 201 { data: Employee }    (id is backend-generated; do NOT send id in payload)
 *   PUT  /api/employees/:id
 *        -> 200 { data: Employee }
 *   All errors: { code: string, message: string, fieldErrors?: { field: string, message: string }[] }
 *
 * Employee field reference:
 *   Required (POST): name, email, department, jobPosition, employmentStatus, employeeType
 *   Optional (POST): phone, managerId, dateOfJoining, scheduleId
 *   employmentStatus: "ACTIVE" | "NOTICE_PERIOD" | "TERMINATED"
 *   employeeType:     "FULL_TIME" | "PART_TIME" | "CONTRACTOR"
 *   id: backend-generated, never sent in POST payload
 */
export const employeeService = {
  getEmployees: async (filters = {}) => {
    const response = await apiClient.get("/api/employees", { params: filters });
    // Returns { employees, total } for pagination support
    return {
      employees: response.data?.data || [],
      total: response.data?.total || 0,
    };
  },

  getEmployeeById: async (id) => {
    // May throw with error.response.status === 404 and error.response.data.code === "EMPLOYEE_NOT_FOUND"
    const response = await apiClient.get(`/api/employees/${id}`);
    return response.data?.data;
  },

  createEmployee: async (employeeData) => {
    // Never include 'id' in payload — backend generates it
    const { id, ...payload } = employeeData;
    const response = await apiClient.post("/api/employees", payload);
    return response.data?.data;
  },

  updateEmployee: async (id, employeeData) => {
    const response = await apiClient.put(`/api/employees/${id}`, employeeData);
    return response.data?.data;
  },
};
