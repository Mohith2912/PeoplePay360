import { create } from "zustand";
import { payslipService } from "@/services/payslipService";
import { parseApiError } from "@/lib/api";

/**
 * Payslip Store — manages both:
 *   1. Global registry (HR_PAYROLL_MANAGER / ADMIN / HR_PAYROLL_USER): GET /api/payslips
 *   2. Personal view (EMPLOYEE): GET /api/payslips/me
 *
 * PDF download: triggers a blob URL in-browser, then revokes it.
 * Email: calls POST /api/payslips/:id/email (payroll manager/admin only).
 *
 * NOTE: Backend enforces ownership for /me and per-ID access when role == EMPLOYEE.
 * Frontend does not perform client-side ownership checks.
 */
export const usePayslipStore = create((set) => ({
  // --- Global registry state ---
  payslips: [],
  total: 0,
  page: 1,
  limit: 20,
  isLoading: false,
  isRetrying: false,
  error: null,
  errorInfo: null,

  // --- Personal /me state ---
  myPayslips: [],
  myTotal: 0,
  myPage: 1,
  isMyLoading: false,
  isMyRetrying: false,
  myError: null,
  myErrorInfo: null,

  // --- Detail state ---
  activePayslip: null,
  isDetailLoading: false,
  isDetailRetrying: false,
  detailError: null,
  detailErrorInfo: null,

  // --- Action states ---
  isPdfDownloading: false,
  pdfError: null,
  isEmailing: false,
  emailError: null,
  emailSuccess: false,

  // ─── GLOBAL REGISTRY ─────────────────────────────────────────────────────────

  fetchPayslips: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      ...(isRetry ? { error: null } : {}),
    });
    try {
      const { payslips, total, page, limit } = await payslipService.getPayslips(filters);
      set({ payslips, total, page, limit, isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "payslips");
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  // ─── PERSONAL /me ────────────────────────────────────────────────────────────

  fetchMyPayslips: async (filters = {}, isRetry = false) => {
    set({
      isMyLoading: !isRetry,
      isMyRetrying: isRetry,
      ...(isRetry ? { myError: null } : {}),
    });
    try {
      const { payslips, total, page } = await payslipService.getMyPayslips(filters);
      set({ myPayslips: payslips, myTotal: total, myPage: page, isMyLoading: false, isMyRetrying: false, myError: null, myErrorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "your payslips");
      set({ myError: parsed.message, myErrorInfo: parsed, isMyLoading: false, isMyRetrying: false });
    }
  },

  // ─── DETAIL ──────────────────────────────────────────────────────────────────

  fetchPayslipById: async (id, isRetry = false) => {
    set({
      isDetailLoading: !isRetry,
      isDetailRetrying: isRetry,
      detailError: null,
      detailErrorInfo: null,
    });
    try {
      const data = await payslipService.getPayslipById(id);
      set({ activePayslip: data, isDetailLoading: false, isDetailRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, `payslip #${id}`);
      set({ detailError: parsed.message, detailErrorInfo: parsed, isDetailLoading: false, isDetailRetrying: false });
    }
  },

  // ─── PDF DOWNLOAD ─────────────────────────────────────────────────────────────

  /**
   * Downloads backend-generated PDF via blob URL.
   * If the backend returns 404/503, falls back to browser print.
   */
  downloadPdf: async (id, filename = "payslip.pdf") => {
    set({ isPdfDownloading: true, pdfError: null });
    try {
      const blob = await payslipService.downloadPdf(id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      set({ isPdfDownloading: false });
    } catch (error) {
      const parsed = parseApiError(error, "PDF download");
      set({ pdfError: parsed.message, isPdfDownloading: false });
      throw new Error(parsed.message);
    }
  },

  // ─── EMAIL ───────────────────────────────────────────────────────────────────

  emailPayslip: async (id) => {
    set({ isEmailing: true, emailError: null, emailSuccess: false });
    try {
      await payslipService.emailPayslip(id);
      set({ isEmailing: false, emailSuccess: true });
    } catch (error) {
      const parsed = parseApiError(error, "send payslip email");
      set({ emailError: parsed.message, isEmailing: false });
      throw new Error(parsed.message);
    }
  },

  // ─── RESET ───────────────────────────────────────────────────────────────────

  clearActivePayslip: () => set({ activePayslip: null, detailError: null, detailErrorInfo: null }),
  clearEmailState: () => set({ emailError: null, emailSuccess: false }),
  clearPdfError: () => set({ pdfError: null }),
  clearListError: () => set({ error: null, errorInfo: null }),
  clearMyError: () => set({ myError: null, myErrorInfo: null }),
}));
