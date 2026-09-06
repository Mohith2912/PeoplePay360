import { apiClient } from "@/lib/api";

/**
 * Schedule Service — frontend API client for /api/schedules
 * Expected backend response shape:
 *   GET list:  { data: [{ id, name, lines: [{ day, startTime, endTime, breakDuration }] }] }
 *   GET me:    { data: { id, name, lines: [...] } }
 *   GET one:   { data: { id, name, lines: [...] } }
 *   POST/PUT:  { data: createdOrUpdatedSchedule }
 *   Errors:    { code, message, fieldErrors? }
 */
export const scheduleService = {
  /**
   * Fetch all schedules (HR/Admin) or own schedule (EMPLOYEE).
   * Backend distinguishes visibility by the caller's role from the JWT.
   */
  getSchedules: async (filters = {}) => {
    const response = await apiClient.get("/api/schedules", { params: filters });
    return response.data?.data || [];
  },

  /**
   * Fetch the authenticated employee's own assigned schedule.
   * Endpoint: GET /api/schedules/me
   */
  getMySchedule: async () => {
    const response = await apiClient.get("/api/schedules/me");
    return response.data?.data || null;
  },

  getScheduleById: async (id) => {
    const response = await apiClient.get(`/api/schedules/${id}`);
    return response.data?.data || null;
  },

  /**
   * Create a new schedule.
   * Required payload: { name: string, lines: [{ day: string, startTime: string, endTime: string, breakDuration: number }] }
   * day: "MON"|"TUE"|"WED"|"THU"|"FRI"|"SAT"|"SUN"
   * startTime/endTime: "HH:MM" (24h)
   * breakDuration: minutes (integer)
   */
  createSchedule: async (scheduleData) => {
    const response = await apiClient.post("/api/schedules", scheduleData);
    return response.data?.data || response.data;
  },

  /**
   * Update an existing schedule.
   * Endpoint: PUT /api/schedules/:id
   */
  updateSchedule: async (id, scheduleData) => {
    const response = await apiClient.put(`/api/schedules/${id}`, scheduleData);
    return response.data?.data || response.data;
  },
};
