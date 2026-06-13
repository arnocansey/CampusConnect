import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSocket } from './useSocket';
import toast from 'react-hot-toast';

export function useGlobalNotifications() {
  const queryClient = useQueryClient();
  const { onNotificationCreated, onNewMessage, onConversationUpdated } = useSocket();

  useEffect(() => {
    const cleanupNotification = onNotificationCreated((notification) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
      toast(notification.content, {
        icon: '🔔',
        duration: 4000,
      });
    });

    const cleanupMessage = onNewMessage(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    const cleanupConversation = onConversationUpdated(() => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    });

    return () => {
      cleanupNotification();
      cleanupMessage();
      cleanupConversation();
    };
  }, [onNotificationCreated, onNewMessage, onConversationUpdated, queryClient]);
}
