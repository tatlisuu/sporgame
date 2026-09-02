import { create } from 'zustand';
import { UserPublic, loginApi, registerApi, logoutApi } from '../api/auth';
import { saveTokens, clearTokens, getAccessToken, getRefreshToken } from '../storage/secureStore';
import { setOnUnauthorizedCallback } from '../api/client';
import { disconnectMatchmakingSocket } from '../socket/matchmakingSocket';

interface AuthState {
  user: UserPublic | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  loginAsDemo: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => {
  setOnUnauthorizedCallback(() => {
    disconnectMatchmakingSocket();
    set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
  });

  return {
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,

    clearError: () => set({ error: null }),

    loginAsDemo: () => {
      set({
        user: {
          id: 'demo_user_001',
          username: 'apex_athlete',
          email: 'athlete@sporgame.com',
          followersCount: 342,
          followingCount: 128,
          eloProfiles: {
            RUNNING: 1540,
            CYCLING: 1380,
            SWIMMING: 1250,
          },
          createdAt: new Date().toISOString(),
        },
        accessToken: 'demo_jwt_token',
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    },

    restoreSession: async () => {
      try {
        set({ isLoading: true });
        const token = await getAccessToken();
        const refreshToken = await getRefreshToken();

        if (token && refreshToken) {
          set({ accessToken: token, isAuthenticated: true, isLoading: false });
        } else {
          set({ accessToken: null, isAuthenticated: false, isLoading: false });
        }
      } catch (err) {
        set({ accessToken: null, isAuthenticated: false, isLoading: false });
      }
    },

    login: async (email, password) => {
      try {
        set({ isLoading: true, error: null });
        const data = await loginApi({ email, password });
        await saveTokens(data.accessToken, data.refreshToken);

        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err: any) {
        const message = err.response?.data?.error || err.message || 'Login failed';
        set({ error: message, isLoading: false });
        return false;
      }
    },

    register: async (username, email, password) => {
      try {
        set({ isLoading: true, error: null });
        const data = await registerApi({ username, email, password });
        await saveTokens(data.accessToken, data.refreshToken);

        set({
          user: data.user,
          accessToken: data.accessToken,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        });
        return true;
      } catch (err: any) {
        const message = err.response?.data?.error || err.message || 'Registration failed';
        set({ error: message, isLoading: false });
        return false;
      }
    },

    logout: async () => {
      try {
        await logoutApi();
      } catch {
      } finally {
        await clearTokens();
        disconnectMatchmakingSocket();
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false, error: null });
      }
    },
  };
});
