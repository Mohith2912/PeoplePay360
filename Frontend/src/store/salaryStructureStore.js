import { create } from "zustand";
import { salaryStructureService } from "@/services/salaryStructureService";
import { parseApiError } from "@/lib/api";

export const useSalaryStructureStore = create((set) => ({
  structures: [],
  total: 0,
  page: 1,
  limit: 20,
  activeStructure: null,
  isLoading: false,
  isRetrying: false,
  isSubmitting: false,
  isPreviewLoading: false,
  previewResult: null,
  previewError: null,
  error: null,
  errorInfo: null,
  fieldErrors: [],

  fetchSalaryStructures: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: isRetry ? null : undefined,
    });
    try {
      const { structures, total, page, limit } =
        await salaryStructureService.getSalaryStructures(filters);
      set({
        structures,
        total,
        page,
        limit,
        isLoading: false,
        isRetrying: false,
        error: null,
        errorInfo: null,
      });
    } catch (error) {
      const parsed = parseApiError(error, "salary structures");
      set({
        error: parsed.message,
        errorInfo: parsed,
        isLoading: false,
        isRetrying: false,
      });
    }
  },

  fetchSalaryStructureById: async (id, isRetry = false) => {
    set({ isLoading: !isRetry, isRetrying: isRetry, error: null, errorInfo: null });
    try {
      const data = await salaryStructureService.getSalaryStructureById(id);
      set({ activeStructure: data, isLoading: false, isRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, `salary structure #${id}`);
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  createSalaryStructure: async (structureData) => {
    set({ isSubmitting: true, error: null, errorInfo: null, fieldErrors: [] });
    try {
      const newStructure = await salaryStructureService.createSalaryStructure(structureData);
      set((state) => ({
        structures: [...state.structures, newStructure],
        total: state.total + 1,
        isSubmitting: false,
      }));
      return newStructure;
    } catch (error) {
      const parsed = parseApiError(error, "salary structure creation");
      const fieldErrors = error.response?.data?.fieldErrors || parsed.fieldErrors || [];
      set({ error: parsed.message, errorInfo: parsed, fieldErrors, isSubmitting: false });
      throw error;
    }
  },

  updateSalaryStructure: async (id, structureData) => {
    set({ isSubmitting: true, error: null, errorInfo: null, fieldErrors: [] });
    try {
      const updated = await salaryStructureService.updateSalaryStructure(id, structureData);
      set((state) => ({
        structures: state.structures.map((s) => (s.id === id ? updated : s)),
        activeStructure: state.activeStructure?.id === id ? updated : state.activeStructure,
        isSubmitting: false,
      }));
      return updated;
    } catch (error) {
      const parsed = parseApiError(error, "salary structure update");
      const fieldErrors = error.response?.data?.fieldErrors || parsed.fieldErrors || [];
      set({ error: parsed.message, errorInfo: parsed, fieldErrors, isSubmitting: false });
      throw error;
    }
  },

  /**
   * Request live calculation preview from Mohith's backend engine.
   */
  previewSalaryStructure: async (previewData) => {
    set({ isPreviewLoading: true, previewError: null });
    try {
      const result = await salaryStructureService.previewSalaryStructure(previewData);
      set({ previewResult: result, isPreviewLoading: false, previewError: null });
      return result;
    } catch (error) {
      const parsed = parseApiError(error, "calculation preview");
      set({
        previewResult: null,
        previewError: parsed.message,
        isPreviewLoading: false,
      });
      throw error;
    }
  },

  clearActiveStructure: () => set({ activeStructure: null }),
  clearPreview: () => set({ previewResult: null, previewError: null }),
  clearError: () => set({ error: null, errorInfo: null, fieldErrors: [] }),
}));
