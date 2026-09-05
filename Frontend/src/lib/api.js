import axios from "axios";
const API_BASE_URL = '';
export const apiClient = axios.create({ baseURL: '', withCredentials: true, timeout: 60000 });
apiClient.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && typeof window !== 'undefined' && window.location.pathname !== '/login') window.location.assign('/login');
  return Promise.reject(error);
});
/**
 * Standardize and optimize API error messages across all pages and stores.
 * Converts raw Axios/HTTP errors into clear, actionable diagnostics.
 */
export function parseApiError(error, resourceName = "resource") {
  if (!error) return { message: `Failed to load ${resourceName}`, status: null, endpoint: "" };

  const status = error.response?.status || null;
  const endpoint = error.config?.url || "";
  const backendMessage = error.response?.data?.message;

  // 1. Structured JSON message from backend
  if (backendMessage && typeof backendMessage === "string") {
    return {
      message: backendMessage,
      status,
      endpoint,
      code: error.response?.data?.code || null,
      fieldErrors: error.response?.data?.fieldErrors || [],
    };
  }

  // 2. HTTP 404 — Endpoint not deployed or route missing
  if (status === 404) {
    return {
      message: `The ${resourceName} service endpoint (${endpoint || "API"}) is not available on the backend (HTTP 404). Once the backend service is running, records will load automatically.`,
      status: 404,
      endpoint,
      code: "ENDPOINT_NOT_FOUND",
      suggestion: "Verify that the backend REST service is running and exposes this route.",
    };
  }

  // 3. HTTP 500/502/503/504 — Server errors
  if (status && status >= 500) {
    return {
      message: `Backend server error (HTTP ${status}) while requesting ${resourceName}. The backend may be encountering an unhandled exception or restarting.`,
      status,
      endpoint,
      code: "SERVER_ERROR",
      suggestion: "Check backend application logs for stack trace.",
    };
  }

  // 4. Network error / connection refused / timeout
  if (error.code === "ECONNABORTED" || error.code === "ERR_NETWORK" || !error.response) {
    return {
      message: `Unable to connect to the backend server (${API_BASE_URL}). The backend service appears to be offline.`,
      status: 0,
      endpoint,
      code: "NETWORK_ERROR",
      suggestion: `Ensure the backend server is running and accessible at ${API_BASE_URL}.`,
    };
  }

  return {
    message: error.message || `An error occurred while loading ${resourceName}.`,
    status,
    endpoint,
    code: error.code || null,
  };
}
