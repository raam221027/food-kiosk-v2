import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Keep these only if you're using Laravel Sanctum authentication
  withCredentials: true,
  withXSRFToken: true,
});

export default api;