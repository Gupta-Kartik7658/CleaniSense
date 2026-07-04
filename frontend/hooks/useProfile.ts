import { useState, useCallback } from "react";
import { useAuth } from "../providers/AuthProvider";
import { profileService } from "../services/profile";
import { UserPreferenceResponse } from "../types/profile";

export function useProfile() {
  const { profileData, setProfileData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = useCallback(async (name: string, profilePicture?: string) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await profileService.updateProfile({ name, profile_picture: profilePicture });
      setProfileData(updated);
      return updated;
    } catch (err: any) {
      setError(err.message || "Failed to update profile settings.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [setProfileData]);

  const updatePreferences = useCallback(async (prefs: Partial<UserPreferenceResponse>) => {
    setLoading(true);
    setError(null);
    try {
      const updatedPrefs = await profileService.updatePreferences(prefs);
      // Immediately sync with cached profileData in AuthProvider context
      if (profileData) {
        setProfileData({
          ...profileData,
          preferences: updatedPrefs
        });
      }
      return updatedPrefs;
    } catch (err: any) {
      setError(err.message || "Failed to save preferences.");
      throw err;
    } finally {
      setLoading(false);
    }
  }, [profileData, setProfileData]);

  return {
    profile: profileData,
    preferences: profileData?.preferences || null,
    loading,
    error,
    updateProfile,
    updatePreferences
  };
}
