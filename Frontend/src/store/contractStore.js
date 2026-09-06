import { create } from "zustand";
import { contractService } from "@/services/contractService";
import { parseApiError } from "@/lib/api";

export const useContractStore = create((set) => ({
  contracts: [],
  total: 0,
  activeContract: null,
  isLoading: false,
  isRetrying: false,
  isSubmitting: false,
  error: null,
  errorInfo: null,
  fieldErrors: [], // backend field-level validation errors

  fetchContracts: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: isRetry ? null : undefined,
    });
    try {
      const { contracts, total } = await contractService.getContracts(filters);
      set({ contracts, total, isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "contracts");
      set({
        error: parsed.message,
        errorInfo: parsed,
        isLoading: false,
        isRetrying: false,
      });
    }
  },

  fetchContractById: async (id, isRetry = false) => {
    set({ isLoading: !isRetry, isRetrying: isRetry, error: null, errorInfo: null });
    try {
      const data = await contractService.getContractById(id);
      set({ activeContract: data, isLoading: false, isRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, `contract #${id}`);
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  fetchContractsByEmployee: async (employeeId, isRetry = false) => {
    set({ isLoading: !isRetry, isRetrying: isRetry, error: null, errorInfo: null });
    try {
      const data = await contractService.getContractsByEmployee(employeeId);
      set({ contracts: Array.isArray(data) ? data : [], isLoading: false, isRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, "employee contracts");
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  createContract: async (contractData) => {
    set({ isSubmitting: true, error: null, errorInfo: null, fieldErrors: [] });
    try {
      const newContract = await contractService.createContract(contractData);
      set((state) => ({
        contracts: [...state.contracts, newContract],
        total: state.total + 1,
        isSubmitting: false,
      }));
      return newContract;
    } catch (error) {
      const parsed = parseApiError(error, "contract creation");
      const fieldErrors = error.response?.data?.fieldErrors || parsed.fieldErrors || [];
      set({ error: parsed.message, errorInfo: parsed, fieldErrors, isSubmitting: false });
      throw error;
    }
  },

  updateContract: async (id, contractData) => {
    set({ isSubmitting: true, error: null, errorInfo: null, fieldErrors: [] });
    try {
      const updated = await contractService.updateContract(id, contractData);
      set((state) => ({
        contracts: state.contracts.map((c) => (c.id === id ? updated : c)),
        activeContract: state.activeContract?.id === id ? updated : state.activeContract,
        isSubmitting: false,
      }));
      return updated;
    } catch (error) {
      const parsed = parseApiError(error, "contract update");
      const fieldErrors = error.response?.data?.fieldErrors || parsed.fieldErrors || [];
      set({ error: parsed.message, errorInfo: parsed, fieldErrors, isSubmitting: false });
      throw error;
    }
  },

  clearActiveContract: () => set({ activeContract: null }),
  clearError: () => set({ error: null, errorInfo: null, fieldErrors: [] }),
}));
