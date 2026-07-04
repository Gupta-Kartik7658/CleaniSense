export interface UserPreferenceResponse {
  language: string;
  theme: string;
  notifications_enabled: boolean;
}

export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  profile_picture?: string;
  role: string;
  is_active: boolean;
  preferences: UserPreferenceResponse;
}
