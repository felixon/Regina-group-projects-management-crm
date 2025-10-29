import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
type AuthActions = {
  login: (credentials: Pick<User, 'email' | 'password'>) => Promise<boolean>;
  logout: () => void;
  checkSession: () => Promise<void>;
  setUser: (user: User) => void;
};
export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    immer((set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const user = await api<User>('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials),
          });
          set({ user, isAuthenticated: true, isLoading: false });
          toast.success(`Welcome back, ${user.name}!`);
          return true;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          toast.error(errorMessage);
          set({ user: null, isAuthenticated: false, isLoading: false });
          return false;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false });
        toast.info('You have been logged out.');
      },
      checkSession: async () => {
        const { user } = get();
        if (user?.id) {
          try {
            // Re-validate user session with the backend
            const freshUser = await api<User>(`/api/auth/me/${user.id}`);
            set({ user: freshUser, isAuthenticated: true, isLoading: false });
          } catch (error) {
            // Session is invalid (e.g., user deleted)
            set({ user: null, isAuthenticated: false, isLoading: false });
          }
        } else {
          set({ isLoading: false });
        }
      },
      setUser: (user: User) => {
        set({ user });
      }
    })),
    {
      name: 'domaindeck-auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);