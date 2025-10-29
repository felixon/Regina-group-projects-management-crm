import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { User } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import { useAuthStore } from './use-auth-store';
type UsersState = {
  users: Omit<User, 'password'>[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  userFormOpen: boolean;
  deleteUserOpen: boolean;
  selectedUser: Omit<User, 'password'> | null;
};
type UsersActions = {
  fetchUsers: () => Promise<void>;
  createUser: (userData: Omit<User, 'id'>) => Promise<void>;
  updateUser: (userId: string, userData: Partial<Omit<User, 'id'>>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  openUserForm: (user?: Omit<User, 'password'>) => void;
  closeUserForm: () => void;
  openDeleteDialog: (user: Omit<User, 'password'>) => void;
  closeDeleteDialog: () => void;
};
export const useUsersStore = create<UsersState & UsersActions>()(
  immer((set, get) => ({
    users: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
    userFormOpen: false,
    deleteUserOpen: false,
    selectedUser: null,
    fetchUsers: async () => {
      set({ isLoading: true, error: null });
      try {
        const users = await api<Omit<User, 'password'>[]>('/api/users');
        set({ users, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
        set({ error: errorMessage, isLoading: false });
        toast.error(errorMessage);
      }
    },
    createUser: async (userData) => {
      set({ isSubmitting: true });
      try {
        const newUser = await api<Omit<User, 'password'>>('/api/users', {
          method: 'POST',
          body: JSON.stringify(userData),
        });
        set(state => {
          state.users.push(newUser);
        });
        toast.success('User created successfully!');
        get().closeUserForm();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    updateUser: async (userId, userData) => {
      set({ isSubmitting: true });
      try {
        const updatedUser = await api<User>(`/api/users/${userId}`, {
          method: 'PUT',
          body: JSON.stringify(userData),
        });
        set(state => {
          const index = state.users.findIndex(u => u.id === userId);
          if (index !== -1) {
            state.users[index] = updatedUser;
          }
        });
        // If the updated user is the currently logged-in user, update auth store
        const currentAuthUser = useAuthStore.getState().user;
        if (currentAuthUser?.id === userId) {
          useAuthStore.getState().setUser(updatedUser);
        }
        toast.success('User updated successfully!');
        get().closeUserForm();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    deleteUser: async (userId) => {
      set({ isSubmitting: true });
      try {
        await api(`/api/users/${userId}`, { method: 'DELETE' });
        set(state => {
          state.users = state.users.filter(u => u.id !== userId);
        });
        toast.success('User deleted successfully!');
        get().closeDeleteDialog();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
        toast.error(errorMessage);
      } finally {
        set({ isSubmitting: false });
      }
    },
    openUserForm: (user) => {
      set({ userFormOpen: true, selectedUser: user || null });
    },
    closeUserForm: () => {
      set({ userFormOpen: false, selectedUser: null });
    },
    openDeleteDialog: (user) => {
      set({ deleteUserOpen: true, selectedUser: user });
    },
    closeDeleteDialog: () => {
      set({ deleteUserOpen: false, selectedUser: null });
    },
  }))
);