import axios from "axios";
import { auth } from "./firebase";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject the active Firebase ID token into request headers
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      try {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error("Error retrieving Firebase ID token for request:", error);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to unwrap response data centrally and map HTTP errors
api.interceptors.response.use(
  (response) => {
    // If the response envelope matches standard StandardResponseModel, return nested data
    if (response.data && response.data.success !== undefined) {
      return response.data.data;
    }
    return response.data;
  },
  (error) => {
    // If request was canceled, let it propagate unmodified so hooks can recognize it
    if (axios.isCancel(error)) {
      return Promise.reject(error);
    }

    // Centralized error mapping based on HTTP status codes and backend envelopes
    const status = error.response?.status;
    let message = "An unexpected error occurred. Please try again.";
    
    if (error.response?.data && error.response.data.message) {
      message = error.response.data.message;
    } else if (status === 401) {
      message = "Your session has expired or is invalid. Please log in again.";
    } else if (status === 403) {
      message = "You do not have permission to access this resource.";
    } else if (status === 404) {
      message = "Requested resource not found.";
    } else if (status === 422) {
      message = "Input validation failed. Please check your submitted details.";
    } else if (status >= 500) {
      message = "A server error occurred. Please try again later.";
    }

    const appError = new Error(message);
    (appError as any).status = status;
    (appError as any).details = error.response?.data?.error?.details || [];
    
    // Gracefully resolve network/auth errors from background prefetch calls
    // to prevent Next.js dev overlay from showing on non-critical data loads
    if (error.code === 'ERR_NETWORK' || !status) {
      console.warn("[CleaniSense] Backend offline or unreachable.");
      return Promise.resolve({ error: true, incidents: [], users: [], total: 0 } as any);
    }

    if (status === 401 || status === 403) {
      // Auth-related failures during background/prefetch loads — resolve with empty payload
      // so UI can fall back to mock data without triggering the dev error overlay
      console.warn(`[CleaniSense] Auth required (${status}) for background request. Using fallback data.`);
      return Promise.resolve({ error: true, authError: true, incidents: [], users: [], total: 0 } as any);
    }
    
    return Promise.reject(appError);
  }
);

export default api;
