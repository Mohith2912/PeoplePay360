import { create } from "zustand";
import { employeeService } from "@/services/employeeService";
import { parseApiError } from "@/lib/api";

export const useEmployeeStore = create((set) => ({
  employees: [],
  total: 0,
  activeEmployee: null,
  isLoading: false,
  isRetrying: false,
  isSubmitting: false,
  error: null,
  errorInfo: null,
  notFound: false,

  fetchEmployees: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: isRetry ? null : undefined,
    });
    try {
      const { employees, total } = await employeeService.getEmployees(filters);
      set({ employees, total, isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "employees");
      set({
        error: parsed.message,
        errorInfo: parsed,
        isLoading: false,
        isRetrying: false,
      });
    }
  },

  fetchEmployeeById: async (id, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: null,
      errorInfo: null,
      notFound: false,
    });
    try {
      const data = await employeeService.getEmployeeById(id);
      set({ activeEmployee: data, isLoading: false, isRetrying: false });
    } catch (error) {
      // Backend confirms employee doesn't exist via 404 + code "EMPLOYEE_NOT_FOUND"
      const isConfirmedNotFound =
        error.response?.status === 404 &&
        (error.response?.data?.code === "EMPLOYEE_NOT_FOUND" ||
          error.response?.data?.error === "EMPLOYEE_NOT_FOUND");
      const parsed = parseApiError(error, `employee #${id}`);
      set({
        error: parsed.message,
        errorInfo: parsed,
        notFound: isConfirmedNotFound,
        isLoading: false,
        isRetrying: false,
      });
    }
  },

  createEmployee: async (employeeData) => {
    set({ isSubmitting: true, error: null, errorInfo: null });
    try {
      const newEmployee = await employeeService.createEmployee(employeeData);
      set((state) => ({
        employees: [...state.employees, newEmployee],
        total: state.total + 1,
        isSubmitting: false,
      }));
      return newEmployee;
    } catch (error) {
      const parsed = parseApiError(error, "employee creation");
      set({ error: parsed.message, errorInfo: parsed, isSubmitting: false });
      throw error;
    }
  },

  updateEmployee: async (id, employeeData) => {
    set({ isSubmitting: true, error: null, errorInfo: null });
    try {
      const updated = await employeeService.updateEmployee(id, employeeData);
      set((state) => ({
        employees: state.employees.map((e) => (e.id === id ? updated : e)),
        activeEmployee: state.activeEmployee?.id === id ? updated : state.activeEmployee,
        isSubmitting: false,
      }));
      return updated;
    } catch (error) {
      const parsed = parseApiError(error, "employee update");
      set({ error: parsed.message, errorInfo: parsed, isSubmitting: false });
      throw error;
    }
  },

  clearActiveEmployee: () => set({ activeEmployee: null, notFound: false }),
  clearError: () => set({ error: null, errorInfo: null }),
}));
