import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Conversation, Message, User, NewMessageNotification } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
type MessagingState = {
  conversations: Conversation[];
  currentThread: Message[];
  activeConversation: Conversation | (Partial<Conversation> & { otherUser: Omit<User, 'password'> }) | null;
  isSheetOpen: boolean;
  isLoadingConversations: boolean;
  isLoadingThread: boolean;
  isSending: boolean;
  unreadCount: number;
  messageText: string;
  lastPollTimestamp: string | null;
};
type MessagingActions = {
  fetchConversations: () => Promise<void>;
  fetchThread: (otherUserId: string) => Promise<void>;
  sendMessage: () => Promise<void>;
  markAsRead: (otherUserId: string) => Promise<void>;
  openSheet: () => void;
  closeSheet: () => void;
  setActiveConversation: (conversation: Conversation | (Partial<Conversation> & { otherUser: Omit<User, 'password'> }) | null) => void;
  fetchUnreadCount: () => Promise<void>;
  setMessageText: (text: string) => void;
  initializePolling: () => void;
  pollForNewMessages: () => Promise<void>;
};
export const useMessagingStore = create<MessagingState & MessagingActions>()(
  immer((set, get) => ({
    conversations: [],
    currentThread: [],
    activeConversation: null,
    isSheetOpen: false,
    isLoadingConversations: false,
    isLoadingThread: false,
    isSending: false,
    unreadCount: 0,
    messageText: '',
    lastPollTimestamp: null,
    initializePolling: () => {
      set({ lastPollTimestamp: new Date().toISOString() });
    },
    pollForNewMessages: async () => {
      const { lastPollTimestamp, isSheetOpen, activeConversation } = get();
      if (!lastPollTimestamp) return;
      try {
        const notifications = await api<NewMessageNotification[]>(`/api/messages/poll?since=${lastPollTimestamp}`);
        if (notifications.length === 0) return;
        const latestTimestamp = notifications[notifications.length - 1].message.createdAt;
        set({ lastPollTimestamp: latestTimestamp });
        const groupedBySender: Record<string, NewMessageNotification[]> = {};
        notifications.forEach(n => {
          if (!groupedBySender[n.sender.id]) {
            groupedBySender[n.sender.id] = [];
          }
          groupedBySender[n.sender.id].push(n);
        });
        Object.values(groupedBySender).forEach(senderGroup => {
          const sender = senderGroup[0].sender;
          const messageCount = senderGroup.length;
          // Suppress toast if the conversation is already open
          if (isSheetOpen && activeConversation?.otherUser.id === sender.id) {
            // Just add messages to the current thread if it's the active one
            set(state => {
              const newMessages = senderGroup.map(n => n.message);
              state.currentThread.push(...newMessages);
            });
            get().markAsRead(sender.id); // Mark as read immediately
            return;
          }
          const toastMessage = messageCount > 1
            ? `${messageCount} new messages from ${sender.name}`
            : senderGroup[0].message.text;
          toast.message(toastMessage, {
            description: `From: ${sender.name}`,
            action: {
              label: 'View',
              onClick: () => {
                get().openSheet();
                const existingConvo = get().conversations.find(c => c.otherUser.id === sender.id);
                if (existingConvo) {
                  get().setActiveConversation(existingConvo);
                } else {
                  // Create a transient conversation to open the thread
                  get().setActiveConversation({ otherUser: sender });
                }
              },
            },
          });
        });
        // Update global unread count and conversations list
        get().fetchUnreadCount();
        get().fetchConversations();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Polling for new messages failed:", errorMessage);
      }
    },
    fetchUnreadCount: async () => {
      try {
        const { count } = await api<{ count: number }>('/api/notifications/messages/unread');
        set({ unreadCount: count });
      } catch (error) {
        console.error("Failed to fetch unread message count:", error);
      }
    },
    fetchConversations: async () => {
      set({ isLoadingConversations: true });
      try {
        const conversations = await api<Conversation[]>('/api/messages/conversations');
        set({ conversations, isLoadingConversations: false });
      } catch (error) {
        toast.error('Failed to load conversations.');
        set({ isLoadingConversations: false });
      }
    },
    fetchThread: async (otherUserId) => {
      set({ isLoadingThread: true, currentThread: [] });
      try {
        const thread = await api<Message[]>(`/api/messages/thread/${otherUserId}`);
        set({ currentThread: thread, isLoadingThread: false });
        get().markAsRead(otherUserId);
      } catch (error) {
        toast.error('Failed to load message thread.');
        set({ isLoadingThread: false });
      }
    },
    sendMessage: async () => {
      const { messageText, activeConversation } = get();
      if (!messageText.trim() || !activeConversation) return;
      set({ isSending: true });
      try {
        const newMessage = await api<Message>('/api/messages', {
          method: 'POST',
          body: JSON.stringify({ text: messageText, receiverId: activeConversation.otherUser.id }),
        });
        set(state => {
          state.currentThread.push(newMessage);
          state.messageText = ''; // Clear text on success
        });
        // If this was a new conversation, fetch conversations again to update the list
        if (!get().conversations.some(c => c.otherUser.id === activeConversation.otherUser.id)) {
          get().fetchConversations();
        }
      } catch (error) {
        toast.error('Failed to send message.');
      } finally {
        set({ isSending: false });
      }
    },
    markAsRead: async (otherUserId) => {
      try {
        await api('/api/messages/read', {
          method: 'POST',
          body: JSON.stringify({ otherUserId }),
        });
        set(state => {
          const convo = state.conversations.find(c => c.otherUser.id === otherUserId);
          if (convo) {
            state.unreadCount -= convo.unreadCount;
            convo.unreadCount = 0;
          }
        });
      } catch (error) {
        console.error("Failed to mark messages as read:", error);
      }
    },
    openSheet: () => set({ isSheetOpen: true }),
    closeSheet: () => set({ isSheetOpen: false, activeConversation: null, currentThread: [], messageText: '' }),
    setActiveConversation: (conversation) => {
      set({ activeConversation: conversation });
      if (conversation) {
        get().fetchThread(conversation.otherUser.id);
      } else {
        set({ currentThread: [] });
      }
    },
    setMessageText: (text) => {
      set({ messageText: text });
    },
  }))
);