"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut, onIdTokenChanged, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { authService, User } from "../services/auth";
import { profileService } from "../services/profile";
import { ProfileResponse } from "../types/profile";

interface AuthContextType {
  user: User | null;
  profileData: ProfileResponse | null;
  setProfileData: React.Dispatch<React.SetStateAction<ProfileResponse | null>>;
  loading: boolean;
  login: (requestedRole?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const syncSessionRef = useRef<Promise<void> | null>(null);

  const syncSessionWithBackend = async (firebaseUser: FirebaseUser, requestedRole?: string) => {
    if (syncSessionRef.current) {
      await syncSessionRef.current;
      return;
    }

    syncSessionRef.current = (async () => {
      const token = await firebaseUser.getIdToken();
      document.cookie = `cleanisense_token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;

      const backendUser = await authService.loginWithFirebase(token, requestedRole);
      setUser(backendUser);
      const profile = await profileService.getProfile();
      setProfileData(profile);
    })();

    try {
      await syncSessionRef.current;
    } finally {
      syncSessionRef.current = null;
    }
  };

  const handleAuthChange = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      setProfileData(null);
      document.cookie = "cleanisense_token=; path=/; max-age=0; SameSite=Lax";
      setLoading(false);
      return;
    }

    if (syncSessionRef.current) {
      await syncSessionRef.current;
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      await syncSessionWithBackend(firebaseUser);
    } catch (error) {
      console.error("Session sync failed with FastAPI backend:", error);
      setUser(null);
      setProfileData(null);
      document.cookie = "cleanisense_token=; path=/; max-age=0; SameSite=Lax";
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, handleAuthChange);
    return () => unsubscribe();
  }, []);

  const login = async (requestedRole?: string) => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      
      const token = await result.user.getIdToken();
      document.cookie = `cleanisense_token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;

      const backendUser = await authService.loginWithFirebase(token, requestedRole);
      setUser(backendUser);
      const profile = await profileService.getProfile();
      setProfileData(profile);
      
      if (backendUser && (
        backendUser.role === 'admin' ||
        backendUser.role === 'super_admin' ||
        backendUser.role === 'municipality_admin' ||
        backendUser.role === 'municipality_officer'
      )) {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Authentication popup login failed:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.warn("Backend logout cleanup warning:", error);
    } finally {
      await signOut(auth);
      setUser(null);
      document.cookie = "cleanisense_token=; path=/; max-age=0; SameSite=Lax";
      router.push("/");
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const updatedUser = await authService.getCurrentUser();
      setUser(updatedUser);
    } catch (error) {
      console.error("Failed to refresh user database profile:", error);
    }
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, profileData, setProfileData, loading, login, logout, refreshUser, isAuthenticated }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
