import { useEffect } from 'react';
import { useMessagingStore } from '@/hooks/use-messaging-store';
export function AppInitializer() {
  const initializePolling = useMessagingStore(s => s.initializePolling);
  const pollForNewMessages = useMessagingStore(s => s.pollForNewMessages);
  useEffect(() => {
    initializePolling();
    const intervalId = setInterval(() => {
      pollForNewMessages();
    }, 15000); // Poll every 15 seconds
    // Cleanup interval on component unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [initializePolling, pollForNewMessages]);
  return null; // This component does not render anything
}