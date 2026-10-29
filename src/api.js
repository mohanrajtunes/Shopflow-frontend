import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: API_URL });

// Before every request: attach the access token if we have one
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// After every response: if the token expired (401), refresh it once and retry
let refreshing = null;

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const refresh = localStorage.getItem("refresh");
    const isAuthCall = original?.url?.includes("/api/token/");

    if (error.response?.status === 401 && refresh && !original._retry && !isAuthCall) {
      original._retry = true;
      try {
        refreshing = refreshing || axios.post(`${API_URL}/api/token/refresh/`, { refresh });
        const { data } = await refreshing;
        refreshing = null;
        localStorage.setItem("access", data.access);
        if (data.refresh) localStorage.setItem("refresh", data.refresh); // your API rotates refresh tokens
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch {
        refreshing = null;
        localStorage.clear();
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// Turns any API error into a readable message
export function errorText(err) {
  const d = err.response?.data;
  if (!d) return "Network error. Is the API running?";
  if (typeof d === "string") return d;
  if (d.detail) return d.detail;
  if (d.error) return d.error;
  return Object.entries(d)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(" ") : v}`)
    .join(" | ");
}

export default api;
