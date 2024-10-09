import { create } from "zustand";
import axios, { AxiosError } from "axios";

const API_URL = import.meta.env.MODE === "development" ? "http://localhost:8080/api/auth" : "/api/auth";

axios.defaults.withCredentials = true;

interface User {
  // Define user properties here
  id: string;
  email: string;
  name: string;
  // Add other relevant properties
}

type AuthStore = {
  user: any;
  isAuthenticated: boolean;
  error: string | null;
  isLoading: boolean;
  isCheckingAuth: boolean;
  message: string | null;

  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyEmail: (code: string, email: string) => Promise<{ user: any }>;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
};

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  error: null,
  isLoading: false,
  isCheckingAuth: true,
  message: null,

  signup: async (email: string, password: string, name: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<{ user: User }>(`${API_URL}/signup`, { email, password, name });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
    } catch (error) {
      if (error instanceof AxiosError) {
        set({ error: error.response?.data?.message || "Error signing up", isLoading: false });
      } else {
        set({ error: "An unexpected error occurred", isLoading: false });
      }
      throw error;
    }
  },

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<{ user: User }>(`${API_URL}/login`, { email, password });
      set({
        isAuthenticated: true,
        user: response.data.user,
        error: null,
        isLoading: false,
      });
    } catch (error) {
      if (error instanceof AxiosError) {
        set({ error: error.response?.data?.message || "Error logging in", isLoading: false });
      } else {
        set({ error: "An unexpected error occurred", isLoading: false });
      }
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await axios.post(`${API_URL}/logout`);
      set({ user: null, isAuthenticated: false, error: null, isLoading: false });
    } catch (error) {
      set({ error: "Error logging out", isLoading: false });
      throw error;
    }
  },

  verifyEmail: async (code: string, email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<{ user: User }>(`${API_URL}/verify-email`, { verificationToken: code, email });
      set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        set({ error: error.response?.data?.message || "Error verifying email", isLoading: false });
      } else {
        set({ error: "An unexpected error occurred", isLoading: false });
      }
      throw error;
    }
  },

  checkAuth: async () => {
    set({ isCheckingAuth: true, error: null });
    try {
      const response = await axios.get<{ user: User }>(`${API_URL}/check-auth`);
      set({ user: response.data.user, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
			if (error instanceof AxiosError) {
				set({ error: error.response?.data?.message || "Error checking authentication", isCheckingAuth: false });
			} else {
				set({ error: "An unexpected error occurred", isCheckingAuth: false });
			}
    }
  },

  forgotPassword: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<{ message: string }>(`${API_URL}/forgot-password`, { email });
      set({ message: response.data.message, isLoading: false });
    } catch (error) {
      if (error instanceof AxiosError) {
        set({
          isLoading: false,
          error: error.response?.data?.message || "Error sending reset password email",
        });
      } else {
        set({ isLoading: false, error: "An unexpected error occurred" });
      }
      throw error;
    }
  },

  resetPassword: async (token: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post<{ message: string }>(`${API_URL}/reset-password/${token}`, { password });
      set({ message: response.data.message, isLoading: false });
    } catch (error) {
      if (error instanceof AxiosError) {
        set({
          isLoading: false,
          error: error.response?.data?.message || "Error resetting password",
        });
      } else {
        set({ isLoading: false, error: "An unexpected error occurred" });
      }
      throw error;
    }
  },
}));