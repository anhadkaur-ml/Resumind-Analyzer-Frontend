import axios, { InternalAxiosRequestConfig } from "axios";

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

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
let refreshRequest: Promise<string> | null = null;

function sessionStorageForToken() {
  if (typeof window === "undefined") return null;
  if (localStorage.getItem("refreshToken")) return localStorage;
  if (sessionStorage.getItem("refreshToken")) return sessionStorage;
  return null;
}

async function refreshAccessToken() {
  const storage = sessionStorageForToken();
  const refresh = storage?.getItem("refreshToken");
  if (!storage || !refresh) throw new Error("No refresh token is available.");

  // Use plain Axios here so a failed refresh request cannot recursively enter
  // this response interceptor.
  const { data } = await axios.post<{ access: string }>(
    `${api.defaults.baseURL}/api/auth/token/refresh/`,
    { refresh },
    { timeout: 30_000 },
  );
  storage.setItem("accessToken", data.access);
  return data.access;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config as RetryableConfig | undefined;
    const isRefreshRequest = config?.url?.includes("/api/auth/token/refresh/");
    if (error.response?.status !== 401 || !config || config._retry || isRefreshRequest) {
      return Promise.reject(error);
    }

    config._retry = true;
    try {
      // Concurrent failed requests share one refresh operation instead of
      // invalidating each other with multiple refresh calls.
      refreshRequest ??= refreshAccessToken().finally(() => {
        refreshRequest = null;
      });
      const access = await refreshRequest;
      config.headers.Authorization = `Bearer ${access}`;
      return api(config);
    } catch (refreshError) {
      clearStoredSession();
      return Promise.reject(refreshError);
    }
  },
);

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
