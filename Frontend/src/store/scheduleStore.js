import { create } from "zustand";
import { scheduleService } from "@/services/scheduleService";
import { parseApiError } from "@/lib/api";

export const useScheduleStore = create((set) => ({
  schedules: [],
  mySchedule: null,
  activeSchedule: null,
  isLoading: false,
  isRetrying: false,
  isSubmitting: false,
  error: null,
  errorInfo: null,

  fetchSchedules: async (filters = {}, isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: isRetry ? null : undefined,
    });
    try {
      const data = await scheduleService.getSchedules(filters);
      set({ schedules: Array.isArray(data) ? data : [], isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "schedules");
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  fetchMySchedule: async (isRetry = false) => {
    set({
      isLoading: !isRetry,
      isRetrying: isRetry,
      error: isRetry ? null : undefined,
    });
    try {
      const data = await scheduleService.getMySchedule();
      set({ mySchedule: data, isLoading: false, isRetrying: false, error: null, errorInfo: null });
    } catch (error) {
      const parsed = parseApiError(error, "your working schedule");
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  fetchScheduleById: async (id, isRetry = false) => {
    set({ isLoading: !isRetry, isRetrying: isRetry, error: null, errorInfo: null });
    try {
      const data = await scheduleService.getScheduleById(id);
      set({ activeSchedule: data, isLoading: false, isRetrying: false });
    } catch (error) {
      const parsed = parseApiError(error, `schedule #${id}`);
      set({ error: parsed.message, errorInfo: parsed, isLoading: false, isRetrying: false });
    }
  },

  createSchedule: async (scheduleData) => {
    set({ isSubmitting: true, error: null, errorInfo: null });
    try {
      const newSchedule = await scheduleService.createSchedule(scheduleData);
      set((state) => ({
        schedules: [...state.schedules, newSchedule],
        isSubmitting: false,
      }));
      return newSchedule;
    } catch (error) {
      const parsed = parseApiError(error, "schedule creation");
      set({ error: parsed.message, errorInfo: parsed, isSubmitting: false });
      throw error;
    }
  },

  updateSchedule: async (id, scheduleData) => {
    set({ isSubmitting: true, error: null, errorInfo: null });
    try {
      const updated = await scheduleService.updateSchedule(id, scheduleData);
      set((state) => ({
        schedules: state.schedules.map((s) => (s.id === id ? updated : s)),
        activeSchedule: state.activeSchedule?.id === id ? updated : state.activeSchedule,
        isSubmitting: false,
      }));
      return updated;
    } catch (error) {
      const parsed = parseApiError(error, "schedule update");
      set({ error: parsed.message, errorInfo: parsed, isSubmitting: false });
      throw error;
    }
  },

  clearActiveSchedule: () => set({ activeSchedule: null }),
  clearError: () => set({ error: null, errorInfo: null }),
}));
