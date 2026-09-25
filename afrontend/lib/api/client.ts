/**
 * Axios client with JWT auth & silent refresh.
 *
 * - Attaches Bearer token to every request.
 * - On 401, tries a single `/auth/refresh` before redirecting to /login.
 * - Three instances: one for the main backend, one for ML-service-1, one for scheme-service.
 */

import axios, { type InternalAxiosRequestConfig } from "axios";
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from "@/lib/auth";

/* ── Base URLs ── */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const ML1_BASE = process.env.NEXT_PUBLIC_ML1_URL || "http://localhost:8001";
const ML2_BASE = process.env.NEXT_PUBLIC_ML2_URL || "http://localhost:8002";
const SCHEME_BASE = process.env.NEXT_PUBLIC_SCHEME_URL || "http://localhost:8003";

/* ── Helpers ── */

function attachToken(config: InternalAxiosRequestConfig) {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((p) => {
    if (error) p.reject(error);
    else p.resolve(token!);
  });
  failedQueue = [];
}

function addRefreshInterceptor(instance: ReturnType<typeof axios.create>) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status !== 401 || originalRequest._retry) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(instance(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_BASE}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        setTokens(data.access_token, data.refresh_token);
        processQueue(null, data.access_token);

        originalRequest.headers.Authorization = `Bearer ${data.access_token}`;
        return instance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
  );
}

import { useBackendStatus } from "@/store/backend-status-store";

/* ── Client instances ── */

/** Main backend (port 8000) — auth + financial twin CRUD. */
export const api = axios.create({ baseURL: API_BASE });
api.interceptors.request.use(attachToken);
api.interceptors.response.use(
  (response) => {
    // If backend responded successfully, update connection state
    useBackendStatus.getState().setConnected(true);
    return response;
  },
  (error) => {
    if (error.code === "ERR_NETWORK" || !error.response) {
      useBackendStatus.getState().setConnected(false, error.message || "Network Error");
    }
    return Promise.reject(error);
  }
);
addRefreshInterceptor(api);

/** ML Service 1 (port 8001) — health score. No auth required. */
export const mlApi = axios.create({ baseURL: ML1_BASE });

/** ML Service 2 (port 8002) — IndicTrans2 offline translation. No auth required. */
export const ml2Api = axios.create({ baseURL: ML2_BASE });

/** Scheme Service (port 8003) — scheme matching. No auth required. */
export const schemeApi = axios.create({ baseURL: SCHEME_BASE });
