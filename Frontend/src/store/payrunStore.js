import { create } from "zustand";
import { payrunService } from "@/services/payrunService";
import { parseApiError } from "@/lib/api";

/**
 * Payrun Store — manages payrun list, active payrun lifecycle, and two-stage validation.
 *
 * Key design decisions:
 * - Optimistic locking: every mutation sends `expectedVersion`; 409 triggers auto-refresh.
 * - Two-stage validation: first call may return WARNINGS_REQUIRE_ACKNOWLEDGMENT (422),
 *   prompting the UI to show a warning modal. Second call sets acknowledgeWarnings=true.
 * - `actionLoading` is a keyed map { compute, validate, pay, cancel } to show per-button spinners.
 */
export const usePayrunStore = create((set, get) => ({
  // --- List state ---
  payruns: [],
  total: 0,
  page: 1,
  limit: 20,
  isLoading: false,
  isRetrying: false,
  error: null,
  errorInfo: null,

  // --- Active payrun detail ---
  activePayrun: null,
  isDetailLoading: false,
  isDetailRetrying: false,
  detailError: null,
  detailErrorInfo: null,

  // --- Per-action loading flags (prevent double-clicks) ---
  actionLoading: { compute: false, validate: false, pay: false, cancel: false },

  // --- Warning acknowledgment state (two-stage validation) ---
  pendingWarnings: null, // Array<{ field: string, message: string }> | null
  isAcknowledgmentRequired: false,

  // --- Create modal ---
  isSubmitting: false,
  createError: null,
  createErrorInfo: null,
  createFieldErrors: [],

  // ─── LIST ACTIONS ───────────────────────────────────────────────────────────

  fetchPayruns: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      ...(isRetry ? { error: null } : {}),
    });
    try {
      const { payruns, total, page, limit } = await payrunService.getPayruns(filters);
      set({ payruns, total, page, limit, isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "payruns");
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  // ─── DETAIL ACTIONS ──────────────────────────────────────────────────────────

  fetchPayrunById: async (id, isRetry = false) => {
    set({
      isDetailLoading: !isRetry,
      isDetailRetrying: isRetry,
      detailError: null,
      detailErrorInfo: null,
    });
    try {
      const data = await payrunService.getPayrunById(id);
      set({ activePayrun: data, isDetailLoading: false, isDetailRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, `payrun #${id}`);
      set({ detailError: parsed.message, detailErrorInfo: parsed, isDetailLoading: false, isDetailRetrying: false });
    }
  },

  // ─── CREATE ──────────────────────────────────────────────────────────────────

  createPayrun: async (payrunData) => {
    set({ isSubmitting: true, createError: null, createErrorInfo: null, createFieldErrors: [] });
    try {
      const newPayrun = await payrunService.createPayrun(payrunData);
      set((state) => ({
        payruns: [newPayrun, ...state.payruns],
        total: state.total + 1,
        isSubmitting: false,
      }));
      return newPayrun;
    } catch (error) {
      const parsed = parseApiError(error, "payrun creation");
      const fieldErrors = error.response?.data?.fieldErrors || parsed.fieldErrors || [];
      set({ createError: parsed.message, createErrorInfo: parsed, createFieldErrors: fieldErrors, isSubmitting: false });
      throw error;
    }
  },

  // ─── LIFECYCLE ACTIONS ───────────────────────────────────────────────────────

  /**
   * Compute payrun. Sends expectedVersion for optimistic locking.
   * On 409: auto-refreshes and surfaces a concurrency error.
   */
  computePayrun: async (id) => {
    const { activePayrun } = get();
    const expectedVersion = activePayrun?.version;
    set((state) => ({ actionLoading: { ...state.actionLoading, compute: true } }));
    try {
      const updated = await payrunService.computePayrun(id, expectedVersion);
      set((state) => ({
        activePayrun: updated,
        payruns: state.payruns.map((p) => (p.id === id ? updated : p)),
        actionLoading: { ...state.actionLoading, compute: false },
      }));
      return updated;
    } catch (error) {
      if (error.response?.status === 409) {
        // Concurrent modification — refresh to get latest version
        await get().fetchPayrunById(id, true);
        set((state) => ({ actionLoading: { ...state.actionLoading, compute: false } }));
        throw new Error("This payrun was modified by another user. The latest version has been loaded.");
      }
      const parsed = parseApiError(error, "compute payrun");
      set((state) => ({ actionLoading: { ...state.actionLoading, compute: false } }));
      throw new Error(parsed.message);
    }
  },

  /**
   * Validate payrun (two-stage).
   * Stage 1: may return 422 WARNINGS_REQUIRE_ACKNOWLEDGMENT → sets `pendingWarnings`.
   * Stage 2: called with acknowledgeWarnings=true after user confirms.
   */
  validatePayrun: async (id, acknowledgeWarnings = false) => {
    const { activePayrun } = get();
    const expectedVersion = activePayrun?.version;
    set((state) => ({ actionLoading: { ...state.actionLoading, validate: true }, pendingWarnings: null, isAcknowledgmentRequired: false }));
    try {
      const result = await payrunService.validatePayrun(id, expectedVersion, acknowledgeWarnings);
      // Success: result.data is the updated payrun
      const updated = result.data ?? result;
      set((state) => ({
        activePayrun: updated,
        payruns: state.payruns.map((p) => (p.id === id ? updated : p)),
        actionLoading: { ...state.actionLoading, validate: false },
        pendingWarnings: null,
        isAcknowledgmentRequired: false,
      }));
      return updated;
    } catch (error) {
      set((state) => ({ actionLoading: { ...state.actionLoading, validate: false } }));
      if (error.response?.status === 422) {
        const code = error.response?.data?.code;
        if (code === "WARNINGS_REQUIRE_ACKNOWLEDGMENT") {
          const warnings = error.response?.data?.warnings || [];
          set({ pendingWarnings: warnings, isAcknowledgmentRequired: true });
          // Don't throw — caller uses pendingWarnings state to show modal
          return null;
        }
        // VALIDATION_FAILED — blocking errors
        throw new Error(error.response?.data?.message || "Validation failed with blocking errors.");
      }
      if (error.response?.status === 409) {
        await get().fetchPayrunById(id, true);
        throw new Error("This payrun was modified by another user. The latest version has been loaded.");
      }
      const parsed = parseApiError(error, "validate payrun");
      throw new Error(parsed.message);
    }
  },

  /**
   * Acknowledge warnings and re-run validate with acknowledgeWarnings=true.
   */
  acknowledgeAndValidate: async (id) => {
    set({ pendingWarnings: null, isAcknowledgmentRequired: false });
    return get().validatePayrun(id, true);
  },

  /**
   * Dismiss the warning modal without proceeding.
   */
  dismissWarnings: () => set({ pendingWarnings: null, isAcknowledgmentRequired: false }),

  payPayrun: async (id) => {
    const { activePayrun } = get();
    const expectedVersion = activePayrun?.version;
    set((state) => ({ actionLoading: { ...state.actionLoading, pay: true } }));
    try {
      const updated = await payrunService.payPayrun(id, expectedVersion);
      set((state) => ({
        activePayrun: updated,
        payruns: state.payruns.map((p) => (p.id === id ? updated : p)),
        actionLoading: { ...state.actionLoading, pay: false },
      }));
      return updated;
    } catch (error) {
      set((state) => ({ actionLoading: { ...state.actionLoading, pay: false } }));
      if (error.response?.status === 409) {
        await get().fetchPayrunById(id, true);
        throw new Error("This payrun was modified by another user. The latest version has been loaded.");
      }
      const parsed = parseApiError(error, "mark as paid");
      throw new Error(parsed.message);
    }
  },

  cancelPayrun: async (id) => {
    const { activePayrun } = get();
    const expectedVersion = activePayrun?.version;
    set((state) => ({ actionLoading: { ...state.actionLoading, cancel: true } }));
    try {
      const updated = await payrunService.cancelPayrun(id, expectedVersion);
      set((state) => ({
        activePayrun: updated,
        payruns: state.payruns.map((p) => (p.id === id ? updated : p)),
        actionLoading: { ...state.actionLoading, cancel: false },
      }));
      return updated;
    } catch (error) {
      set((state) => ({ actionLoading: { ...state.actionLoading, cancel: false } }));
      if (error.response?.status === 409) {
        await get().fetchPayrunById(id, true);
        throw new Error("This payrun was modified by another user. The latest version has been loaded.");
      }
      const parsed = parseApiError(error, "cancel payrun");
      throw new Error(parsed.message);
    }
  },

  // ─── RESET ───────────────────────────────────────────────────────────────────

  clearActivePayrun: () => set({ activePayrun: null, detailError: null, detailErrorInfo: null, pendingWarnings: null, isAcknowledgmentRequired: false }),
  clearCreateError: () => set({ createError: null, createErrorInfo: null, createFieldErrors: [] }),
  clearListError: () => set({ error: null, errorInfo: null }),
}));
