import { create } from "zustand";
import type { Profile, Organisation } from "@/types";
import * as authService from "@/services/auth";

interface AuthState {
  // État
  profile: Profile | null;
  organisation: Organisation | null;
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    organisationId: string;
  }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  clearError: () => void;
  setUser: (user: any | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  organisation: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,
  error: null,

  setUser: (user) => set({ user }),

  initialize: async () => {
    set({ isLoading: true, error: null });

    const user = await authService.getCurrentUser();
    if (!user) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    const profileResult = await authService.getMyProfile();
    const orgResult = await authService.getMyOrganisation();

    set({
      profile: profileResult.data,
      organisation: orgResult.data,
      isAuthenticated: !!profileResult.data,
      isLoading: false,
    });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });

    const result = await authService.login(email, password);
    if (result.error) {
      set({ isLoading: false, error: result.error });
      return false;
    }

    // Charger profil et organisation après login
    await get().initialize();
    return true;
  },

  signup: async (params) => {
    set({ isLoading: true, error: null });

    const result = await authService.signup(params);
    if (result.error) {
      set({ isLoading: false, error: result.error });
      return false;
    }

    set({ isLoading: false });
    return true;
  },

  logout: async () => {
    await authService.logout();
    set({
      profile: null,
      organisation: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshProfile: async () => {
    const profileResult = await authService.getMyProfile();
    if (profileResult.data) {
      set({ profile: profileResult.data });
    }
  },

  clearError: () => set({ error: null }),
}));
