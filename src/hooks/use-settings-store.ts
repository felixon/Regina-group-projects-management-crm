import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppSettings, ColumnVisibility, TableColumn, SmtpSettings } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
const defaultSettings: AppSettings = {
  appName: 'DomainDeck',
  appLogoUrl: null,
  smtp: {
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: true,
  },
  columns: {
    nomDuProjet: true,
    status: true,
    domainExpiry: true,
    domainRegistration: true,
    cost: true,
    startDate: true,
    completedDate: true,
    actions: true,
  },
  reminder: {
    defaultEmails: '',
    startMonthsBefore: 3,
    frequency: 'weekly',
  }
};
type SettingsState = {
  settings: AppSettings;
  isLoading: boolean;
  isSubmitting: boolean;
  isTestingSmtp: boolean;
  error: string | null;
};
type SettingsActions = {
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: AppSettings) => Promise<void>;
  setColumnVisibility: (column: TableColumn, visible: boolean) => void;
  testSmtpSettings: (smtp: SmtpSettings, testEmail: string) => Promise<void>;
};
export const useSettingsStore = create<SettingsState & SettingsActions>()(
  persist(
    immer((set, get) => ({
      settings: defaultSettings,
      isLoading: true,
      isSubmitting: false,
      isTestingSmtp: false,
      error: null,
      fetchSettings: async () => {
        set({ isLoading: true, error: null });
        try {
          const settings = await api<AppSettings>('/api/settings');
          // Merge remote settings with local, local takes precedence for columns
          const localState = get().settings;
          set({
            settings: {
              ...localState,
              ...settings,
            },
            isLoading: false,
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to fetch settings';
          set({ error: errorMessage, isLoading: false });
          toast.error(errorMessage);
        }
      },
      updateSettings: async (newSettings) => {
        set({ isSubmitting: true });
        try {
          const updatedSettings = await api<AppSettings>('/api/settings', {
            method: 'POST',
            body: JSON.stringify(newSettings),
          });
          set(state => {
            state.settings = { ...state.settings, ...updatedSettings };
            state.isSubmitting = false;
          });
          toast.success('Settings updated successfully!');
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to update settings';
          set({ error: errorMessage, isSubmitting: false });
          toast.error(errorMessage);
        }
      },
      setColumnVisibility: (column, visible) => {
        set((state) => {
          state.settings.columns[column] = visible;
        });
      },
      testSmtpSettings: async (smtp, testEmail) => {
        set({ isTestingSmtp: true });
        try {
          const result = await api<{ message: string }>('/api/settings/test-smtp', {
            method: 'POST',
            body: JSON.stringify({ smtp, testEmail }),
          });
          toast.success('SMTP Test Simulated', { description: result.message });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to test SMTP settings';
          toast.error(errorMessage);
        } finally {
          set({ isTestingSmtp: false });
        }
      },
    })),
    {
      name: 'domaindeck-settings-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        settings: {
          // Only persist UI preferences, not sensitive data like SMTP
          appName: state.settings.appName,
          appLogoUrl: state.settings.appLogoUrl,
          columns: state.settings.columns,
          smtp: defaultSettings.smtp,
          reminder: state.settings.reminder,
        },
      }),
    }
  )
);