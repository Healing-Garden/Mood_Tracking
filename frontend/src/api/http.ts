import axios from "axios";
import type {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";

interface FailedQueueItem {
  resolve: (value: AxiosResponse) => void;
  reject: (reason?: AxiosError) => void;
}

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8080/api",
  timeout: 10000,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: FailedQueueItem[] = [];

const processQueue = (error: AxiosError | null, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token as unknown as AxiosResponse);
    }
  });
  failedQueue = [];
};

// Gắn access token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.data instanceof FormData && config.headers) {
    delete (config.headers as any)["Content-Type"];
  }
  return config;
});

// Handle refresh token
http.interceptors.response.use(
  (res) => res.data,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<AxiosResponse>((resolve, reject) => {
        failedQueue.push({
          resolve: () => resolve(http(original)),
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const res = await axios.post<{ accessToken: string }>(
        `${http.defaults.baseURL}/auth/refresh-token`,
        {},
        { withCredentials: true }
      );

      const newToken = res.data.accessToken;
      localStorage.setItem("access_token", newToken);

      processQueue(null, newToken);

      original.headers.Authorization = `Bearer ${newToken}`;
      return http(original);
    } catch (err) {
      processQueue(err as AxiosError, null);
      localStorage.removeItem("access_token");
      window.location.href = "/login";
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  }
);

export default http;
