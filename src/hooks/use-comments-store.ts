import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Comment } from '@shared/types';
import { api } from '@/lib/api-client';
import { toast } from 'sonner';
type CommentStoreState = {
  comments: Comment[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  dialogOpen: boolean;
  replyToComment: Comment | null;
  activeProjectId: string | null; // For project-specific comments
  lastPollTimestamp: string | null;
};
type CommentStoreActions = {
  fetchComments: (projectId?: string) => Promise<void>;
  createComment: (commentData: {
    text: string;
    parentId?: string | null;
    projectId?: string | null;
    visibleTo?: string[];
  }) => Promise<void>;
  openDialog: (options?: { replyTo?: Comment; projectId?: string }) => void;
  closeDialog: () => void;
  markAsRead: (commentId: string, userId: string | undefined) => Promise<void>;
  initializePolling: () => void;
  pollForNewComments: () => Promise<void>;
};
export const useCommentsStore = create<CommentStoreState & CommentStoreActions>()(
  immer((set, get) => ({
    comments: [],
    isLoading: false,
    isSubmitting: false,
    error: null,
    dialogOpen: false,
    replyToComment: null,
    activeProjectId: null,
    lastPollTimestamp: null,
    initializePolling: () => {
      set({ lastPollTimestamp: new Date().toISOString() });
    },
    pollForNewComments: async () => {
      const { lastPollTimestamp } = get();
      if (!lastPollTimestamp) return;
      try {
        const newComments = await api<Comment[]>(`/api/comments/poll?since=${lastPollTimestamp}`);
        if (newComments.length === 0) return;
        const latestTimestamp = newComments[newComments.length - 1].createdAt;
        set(state => {
          state.lastPollTimestamp = latestTimestamp;
          newComments.forEach(newComment => {
            if (!state.comments.some(c => c.id === newComment.id)) {
              state.comments.push(newComment);
            }
          });
        });
        if (newComments.length > 0) {
          const firstNewComment = newComments[0];
          toast.info(`New comment from ${firstNewComment.authorName}`, {
            description: firstNewComment.text.substring(0, 50) + '...',
          });
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Polling for new comments failed:", errorMessage);
      }
    },
    fetchComments: async (projectId) => {
      set({ isLoading: true, error: null });
      try {
        const url = projectId ? `/api/comments?projectId=${projectId}` : '/api/comments';
        const comments = await api<Comment[]>(url);
        set({ comments, isLoading: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch comments';
        set({ error: errorMessage, isLoading: false });
        toast.error(errorMessage);
      }
    },
    createComment: async (commentData) => {
      set({ isSubmitting: true });
      try {
        const newComment = await api<Comment>('/api/comments', {
          method: 'POST',
          body: JSON.stringify(commentData),
        });
        set((state) => {
          state.comments.push(newComment);
          // After posting, update the poll timestamp to avoid fetching our own comment
          state.lastPollTimestamp = newComment.createdAt;
        });
        toast.success('Comment posted!');
        set({ dialogOpen: false, replyToComment: null, activeProjectId: null, isSubmitting: false });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to post comment';
        toast.error(errorMessage);
        set({ isSubmitting: false });
      }
    },
    openDialog: (options = {}) => {
      set({
        dialogOpen: true,
        replyToComment: options.replyTo || null,
        activeProjectId: options.projectId || null,
      });
    },
    closeDialog: () => {
      set({ dialogOpen: false, replyToComment: null, activeProjectId: null });
    },
    markAsRead: async (commentId, userId) => {
      if (!userId) return;
      const originalComments = get().comments;
      let alreadyRead = false;
      set(state => {
        const comment = state.comments.find(c => c.id === commentId);
        if (comment) {
          if (!comment.readBy.includes(userId)) {
            comment.readBy.push(userId);
          } else {
            alreadyRead = true;
          }
        }
      });
      if (alreadyRead) return;
      try {
        await api<Comment>(`/api/comments/${commentId}/read`, {
          method: 'POST',
        });
      } catch (error) {
        set({ comments: originalComments });
        toast.error('Failed to mark comment as read.');
      }
    },
  }))
);