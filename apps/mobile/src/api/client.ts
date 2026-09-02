import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { Platform } from 'react-native';
import { getAccessToken, getRefreshToken, saveTokens, clearTokens } from '../storage/secureStore';

// ── Cloud & Local Configuration ──────────────────────────────────────────────
// Update this URL with your deployed Render/Railway service URL:
export const CLOUD_API_URL = 'https://sporgame-api-production.up.railway.app';

const LOCAL_DEV_URL = Platform.select({
  web: 'http://localhost:3000',
  default: 'http://192.168.1.208:3000',
});

// Set to true to route all mobile traffic to Cloud, or false for local dev.
// In production builds (__DEV__ === false), it defaults to CLOUD_API_URL.
export const USE_CLOUD_API = true;

export const API_HOST =
  process.env.EXPO_PUBLIC_API_URL ||
  (USE_CLOUD_API || !__DEV__ ? CLOUD_API_URL : LOCAL_DEV_URL);

export const API_BASE_URL = `${API_HOST}/api/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

let onUnauthorizedCallback: (() => void) | null = null;

export function setOnUnauthorizedCallback(callback: () => void) {
  onUnauthorizedCallback = callback;
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          throw new Error('NO_REFRESH_TOKEN');
        }

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        await saveTokens(accessToken, newRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return apiClient(originalRequest);
      } catch (refreshError) {
        await clearTokens();
        if (onUnauthorizedCallback) {
          onUnauthorizedCallback();
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
