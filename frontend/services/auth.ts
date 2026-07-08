import api from "../lib/api";

export interface User {
  id: string;
  firebase_uid: string;
  email: string;
  name: string | null;
  profile_picture: string | null;
  role: "citizen" | "admin" | "super_admin" | "municipality_admin" | "municipality_officer";
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
  loginWithFirebase: async (idToken: string, requestedRole?: string): Promise<User> => {
    return api.post("/auth/login", { idToken, role: requestedRole });
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get("/auth/me");
  },

  logout: async (): Promise<void> => {
    return api.post("/auth/logout");
  },
};
