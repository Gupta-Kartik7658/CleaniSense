import api from "../lib/api";
import { ProfileResponse, UserPreferenceResponse } from "../types/profile";

export const profileService = {
  getProfile(signal?: AbortSignal): Promise<ProfileResponse> {
    return api.get("/profile", { signal });
  },

  updateProfile(payload: { name: string; profile_picture?: string }, signal?: AbortSignal): Promise<ProfileResponse> {
    return api.put("/profile", payload, { signal });
  },

  getPreferences(signal?: AbortSignal): Promise<UserPreferenceResponse> {
    return api.get("/profile/preferences", { signal });
  },

  updatePreferences(payload: Partial<UserPreferenceResponse>, signal?: AbortSignal): Promise<UserPreferenceResponse> {
    return api.put("/profile/preferences", payload, { signal });
  }
};
