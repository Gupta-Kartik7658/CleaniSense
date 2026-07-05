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
    // Centralized error mapping based on HTTP status codes and backend envelopes
    const status = error.response?.status;
    let message = "An unexpected error occurred. Please try again.";
    
    if (status === 422) {
      const details = error.response?.data?.error?.details;
      if (Array.isArray(details) && details.length > 0) {
        message = details
          .map((d: { field?: string; message?: string }) =>
            `${d.field ?? "field"}: ${d.message ?? "invalid"}`
          )
          .join(" · ");
      } else {
        message = "Input validation failed. Please check your submitted details.";
      }
    } else if (error.response?.data?.message) {
      message = error.response.data.message;
    } else if (status === 401) {
      message = "Your session has expired or is invalid. Please log in again.";
    } else if (status === 403) {
      message = "You do not have permission to access this resource.";
    } else if (status === 404) {
      message = "Requested resource not found.";
    } else if (status >= 500) {
      message = "A server error occurred. Please try again later.";
    }

    const appError = new Error(message);
    (appError as any).status = status;
    (appError as any).details = error.response?.data?.error?.details || [];
    
    return Promise.reject(appError);
  }
);

export default api;
