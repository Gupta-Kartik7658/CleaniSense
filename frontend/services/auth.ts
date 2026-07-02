import api from "../lib/api";

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  profile_picture: string | null;
  role: "citizen" | "admin";
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export const authService = {
  loginWithFirebase: async (idToken: string): Promise<User> => {
    const response = await api.post<ApiResponseEnvelope<User>>("/auth/login", {
      idToken,
    });
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<ApiResponseEnvelope<User>>("/auth/me");
    return response.data.data;
  },

  logout: async (): Promise<void> => {
    await api.post<ApiResponseEnvelope<null>>("/auth/logout");
  },
};
