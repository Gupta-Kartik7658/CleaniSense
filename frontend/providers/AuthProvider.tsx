"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, signOut, onIdTokenChanged, User as FirebaseUser } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { authService, User } from "../services/auth";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleAuthChange = async (firebaseUser: FirebaseUser | null) => {
    if (!firebaseUser) {
      setUser(null);
      // Remove token cookie for middleware check on server sides
      document.cookie = "cleanisense_token=; path=/; max-age=0; SameSite=Lax";
      setLoading(false);
      return;
    }

    try {
      const token = await firebaseUser.getIdToken();
      // Set token cookie to allow Next.js middleware route intercept checks
      document.cookie = `cleanisense_token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      
      const backendUser = await authService.loginWithFirebase(token);
      setUser(backendUser);
    } catch (error) {
      console.error("Session sync failed with FastAPI backend:", error);
      setUser(null);
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

  const login = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      
      document.cookie = `cleanisense_token=${token}; path=/; max-age=3600; SameSite=Lax; Secure`;
      
      const backendUser = await authService.loginWithFirebase(token);
      setUser(backendUser);
      router.push("/dashboard");
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
      router.push("/login");
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
      value={{ user, loading, login, logout, refreshUser, isAuthenticated }}
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
