import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/hooks/use-auth-store';
import { useMessagingStore } from '@/hooks/use-messaging-store';
import { useCommentsStore } from '@/hooks/use-comments-store';
import { Loader2 } from 'lucide-react';
import { CommentFormDialog } from './CommentFormDialog';
export function ProtectedRoute() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  const isLoading = useAuthStore(s => s.isLoading);
  useEffect(() => {
    useAuthStore.getState().checkSession();
  }, []);
  // Initialize message polling
  useEffect(() => {
    if (isAuthenticated) {
      useMessagingStore.getState().initializePolling();
      const intervalId = setInterval(() => {
        useMessagingStore.getState().pollForNewMessages();
      }, 15000);
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);
  // Initialize comment polling
  useEffect(() => {
    if (isAuthenticated) {
      useCommentsStore.getState().initializePolling();
      const intervalId = setInterval(() => {
        useCommentsStore.getState().pollForNewComments();
      }, 12000); // Poll slightly different interval
      return () => clearInterval(intervalId);
    }
  }, [isAuthenticated]);
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return (
    <>
      <CommentFormDialog />
      <Outlet />
    </>
  );
}