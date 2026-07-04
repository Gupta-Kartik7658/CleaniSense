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
    return api.post("/auth/login", { idToken });
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get("/auth/me");
  },

  logout: async (): Promise<void> => {
    return api.post("/auth/logout");
  },
};
