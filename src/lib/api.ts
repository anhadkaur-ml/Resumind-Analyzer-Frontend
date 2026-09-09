import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000",
  timeout: 30_000,
});

api.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("accessToken") ?? sessionStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  for (const storage of [localStorage, sessionStorage]) {
    storage.removeItem("accessToken");
    storage.removeItem("refreshToken");
    storage.removeItem("userRole");
  }
}

export function isUnauthorized(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

export function getApiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const data = error.response?.data;
  if (!data || typeof data !== "object") return error.code === "ECONNABORTED" ? "The request timed out. Please try again." : fallback;
  const values = Object.values(data as Record<string, unknown>).flatMap((value) => Array.isArray(value) ? value : [value]);
  const message = values.find((value): value is string => typeof value === "string");
  return message ?? fallback;
}
