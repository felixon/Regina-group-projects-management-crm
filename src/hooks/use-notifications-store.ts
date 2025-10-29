import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
import type { Notification } from '@/components/NotificationCard';
type NotificationsState = {
  isSending: Record<string, boolean>; // Map of projectId to sending status
};
type NotificationsActions = {
  sendReminder: (notification: Notification) => Promise<void>;
};
export const useNotificationsStore = create<NotificationsState & NotificationsActions>()(
  immer((set) => ({
    isSending: {},
    sendReminder: async (notification) => {
      set((state) => {
        state.isSending[notification.projectId] = true;
      });
      try {
        const result = await api<{ message: string }>('/api/reminders/send', {
          method: 'POST',
          body: JSON.stringify({
            recipientEmails: notification.recipientEmails,
            subject: notification.emailSubject,
            body: notification.emailBody,
          }),
        });
        toast.success('Reminder Sent!', {
          description: result.message,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to send reminder.';
        toast.error(errorMessage);
      } finally {
        set((state) => {
          delete state.isSending[notification.projectId];
        });
      }
    },
  }))
);