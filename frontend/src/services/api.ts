import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Keep these only if you're using Laravel Sanctum authentication
  withCredentials: true,
  withXSRFToken: true,
});

/**
 * Client for endpoints that sit at the application root rather than under /api.
 *
 * Sanctum registers /sanctum/csrf-cookie outside the API prefix, so calling it
 * through `api` would resolve to /api/sanctum/csrf-cookie and 404.
 */
export const apiRoot = axios.create({
  baseURL: BASE_URL.replace(/\/api\/?$/, ""),
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
  withXSRFToken: true,
});

export default api;
