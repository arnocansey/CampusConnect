import { useEffect, useCallback, useRef } from 'react';
import { getSocket } from '../services/socket';
import { useAuth } from '../contexts/AuthContext';

export function useSocket() {
  const { user } = useAuth();
  const socketRef = useRef(getSocket());

  useEffect(() => {
    if (user && !socketRef.current.connected) {
      socketRef.current.connect();
    }
  }, [user]);

  const joinConversation = useCallback((conversationId: string) => {
    socketRef.current.emit('join_conversation', conversationId);
  }, []);

  const leaveConversation = useCallback((conversationId: string) => {
    socketRef.current.emit('leave_conversation', conversationId);
  }, []);

  const sendMessage = useCallback((conversationId: string, content: string) => {
    socketRef.current.emit('send_message', { conversationId, content });
  }, []);

  const emitTyping = useCallback((conversationId: string) => {
    socketRef.current.emit('typing', conversationId);
  }, []);

  const emitStopTyping = useCallback((conversationId: string) => {
    socketRef.current.emit('stop_typing', conversationId);
  }, []);

  const markRead = useCallback((conversationId: string) => {
    socketRef.current.emit('mark_read', conversationId);
  }, []);

  const onNewMessage = useCallback((callback: (message: any) => void) => {
    socketRef.current.on('new_message', callback);
    return () => {
      socketRef.current.off('new_message', callback);
    };
  }, []);

  const onUserTyping = useCallback((callback: (data: { userId: string; username: string }) => void) => {
    socketRef.current.on('user_typing', callback);
    return () => {
      socketRef.current.off('user_typing', callback);
    };
  }, []);

  const onUserStopTyping = useCallback((callback: (data: { userId: string }) => void) => {
    socketRef.current.on('user_stop_typing', callback);
    return () => {
      socketRef.current.off('user_stop_typing', callback);
    };
  }, []);

  const onUserOnline = useCallback((callback: (data: { userId: string; isOnline: boolean }) => void) => {
    socketRef.current.on('user_online', callback);
    return () => {
      socketRef.current.off('user_online', callback);
    };
  }, []);

  const emitReactMessage = useCallback((conversationId: string, messageId: string, emoji: string) => {
    socketRef.current.emit('react_message', { conversationId, messageId, emoji });
  }, []);

  const onMessagesRead = useCallback((callback: (data: { conversationId: string; userId: string; readAt: string }) => void) => {
    socketRef.current.on('messages_read', callback);
    return () => {
      socketRef.current.off('messages_read', callback);
    };
  }, []);

  const onReactionUpdated = useCallback((callback: (data: { conversationId: string; messageId: string; userId: string; username: string; emoji: string; action: 'add' | 'remove' }) => void) => {
    socketRef.current.on('message_reaction_updated', callback);
    return () => {
      socketRef.current.off('message_reaction_updated', callback);
    };
  }, []);

  return {
    socket: socketRef.current,
    joinConversation,
    leaveConversation,
    sendMessage,
    emitTyping,
    emitStopTyping,
    markRead,
    onNewMessage,
    onUserTyping,
    onUserStopTyping,
    onUserOnline,
    emitReactMessage,
    onMessagesRead,
    onReactionUpdated,
  };
}
