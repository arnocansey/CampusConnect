"use client";
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { Message } from '../types';
import { ArrowLeft, Send, Smile, Paperclip, X, CheckCheck } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const {
    joinConversation,
    leaveConversation,
    sendMessage,
    onNewMessage,
    emitTyping,
    emitStopTyping,
    onUserTyping,
    onUserStopTyping,
    emitReactMessage,
    onMessagesRead,
    onReactionUpdated,
    markRead,
  } = useSocket();

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [typingUsers, setTypingUsers] = useState<{ userId: string; username: string }[]>([]);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);

  // Image upload states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSending, setIsSending] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null!);

  const { data: chatData } = useQuery({
    queryKey: ['messages', conversationId],
    queryFn: async () => {
      const { data } = await api.get(`/messages/conversations/${conversationId}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (chatData) {
      setMessages(chatData.messages);
      setConversation(chatData.conversation);
    }
  }, [chatData]);

  useEffect(() => {
    if (conversationId) {
      joinConversation(conversationId);
      markRead(conversationId);
    }

    const cleanup = onNewMessage((message) => {
      setMessages((prev) => [...prev, message]);
      if (conversationId && message.sender.id !== user?.id) {
        markRead(conversationId);
      }
    });

    const typingCleanup = onUserTyping(({ userId, username }) => {
      if (userId !== user?.id) {
        setTypingUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId, username }];
        });
      }
    });

    const stopTypingCleanup = onUserStopTyping(({ userId }) => {
      setTypingUsers((prev) => prev.filter((u) => u.userId !== userId));
    });

    const readCleanup = onMessagesRead(({ userId, readAt }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.sender.id === userId) return msg;
          const readBy = msg.readBy || [];
          if (new Date(msg.createdAt) <= new Date(readAt) && !readBy.includes(userId)) {
            return {
              ...msg,
              readBy: [...readBy, userId],
            };
          }
          return msg;
        })
      );
    });

    const reactionCleanup = onReactionUpdated(({ messageId, userId, username, emoji, action }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId) return msg;

          const currentReactions = msg.reactions || [];
          if (action === 'remove') {
            return {
              ...msg,
              reactions: currentReactions.filter((r) => r.userId !== userId),
            };
          } else {
            const filteredReactions = currentReactions.filter((r) => r.userId !== userId);
            return {
              ...msg,
              reactions: [
                ...filteredReactions,
                {
                  id: `${messageId}-${userId}`,
                  emoji,
                  userId,
                  user: {
                    id: userId,
                    username,
                    fullName: username,
                  },
                },
              ],
            };
          }
        })
      );
    });

    return () => {
      if (conversationId) {
        leaveConversation(conversationId);
      }
      cleanup();
      typingCleanup();
      stopTypingCleanup();
      readCleanup();
      reactionCleanup();
    };
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if ((messageText.trim() || selectedImage) && conversationId && !isSending) {
      setIsSending(true);
      emitStopTyping(conversationId);

      try {
        if (selectedImage) {
          const formData = new FormData();
          formData.append('conversationId', conversationId);
          formData.append('content', messageText);
          formData.append('image', selectedImage);

          await api.post('/messages/send', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });

          setSelectedImage(null);
          setImagePreview('');
        } else {
          sendMessage(conversationId, messageText);
        }

        setMessageText('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setIsSending(false);
      }
    }
  };

  const handleTyping = (value: string) => {
    setMessageText(value);

    if (conversationId) {
      emitTyping(conversationId);

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(conversationId);
      }, 2000);
    }
  };

  const handleReact = (messageId: string, emoji: string) => {
    if (conversationId) {
      emitReactMessage(conversationId, messageId, emoji);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-2xl mx-auto h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 p-3 flex items-center gap-3">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
          {conversation?.avatar ? (
            <img src={conversation.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            conversation?.name?.charAt(0) || 'C'
          )}
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm dark:text-white">{conversation?.name || 'Chat'}</p>
          <p className="text-xs text-gray-500">
            {typingUsers.length > 0
              ? `${typingUsers.map((u) => u.username).join(', ')} typing...`
              : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.sender.id === user?.id;
          const isRead = message.readBy && message.readBy.length > 0;

          // Group reactions
          const reactionsGrouped = message.reactions?.reduce((acc, current) => {
            const existing = acc.find((r) => r.emoji === current.emoji);
            if (existing) {
              existing.count += 1;
              existing.userIds.push(current.userId);
            } else {
              acc.push({ emoji: current.emoji, count: 1, userIds: [current.userId] });
            }
            return acc;
          }, [] as { emoji: string; count: number; userIds: string[] }[]);

          return (
            <div
              key={message.id}
              className={`flex items-end gap-2 group ${isOwn ? 'flex-row-reverse justify-start' : 'flex-row justify-start'}`}
            >
              {/* Message Bubble container */}
              <div className="max-w-[70%] flex flex-col">
                <div
                  className={`rounded-2xl px-4 py-2 relative ${
                    isOwn
                      ? 'bg-blue-600 text-white rounded-br-md'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-bl-md'
                  }`}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 opacity-70">
                      {message.sender.fullName}
                    </p>
                  )}

                  {message.imageUrl && (
                    <img
                      src={message.imageUrl}
                      alt="Attachment"
                      className="max-w-full rounded-lg mb-2 max-h-60 object-cover cursor-pointer"
                      onClick={() => window.open(message.imageUrl, '_blank')}
                    />
                  )}

                  {message.content && <p className="text-sm break-words">{message.content}</p>}

                  <div className="flex items-center gap-1 justify-end mt-1 text-[9px] opacity-80">
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {isOwn && (
                      <span>
                        <CheckCheck className={`w-3.5 h-3.5 ${isRead ? 'text-emerald-300' : 'text-white/40'}`} />
                      </span>
                    )}
                  </div>
                </div>

                {/* Reactions list */}
                {reactionsGrouped && reactionsGrouped.length > 0 && (
                  <div className={`flex flex-wrap gap-1 mt-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                    {reactionsGrouped.map((react) => {
                      const hasReacted = react.userIds.includes(user?.id || '');
                      return (
                        <button
                          key={react.emoji}
                          onClick={() => handleReact(message.id, react.emoji)}
                          className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border transition ${
                            hasReacted
                              ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-300'
                              : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span>{react.emoji}</span>
                          <span className="font-semibold">{react.count}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reaction trigger menu (visible on hover) */}
              <div className="opacity-0 group-hover:opacity-100 transition-opacity relative pb-1">
                <button
                  onClick={() => setActiveReactionMenu(activeReactionMenu === message.id ? null : message.id)}
                  className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full transition"
                >
                  <Smile className="w-4 h-4" />
                </button>
                {activeReactionMenu === message.id && (
                  <div className={`absolute bottom-full z-10 bg-white dark:bg-gray-900 shadow-xl border border-gray-100 dark:border-gray-800 rounded-full px-2 py-1 flex items-center gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-150 ${isOwn ? 'right-0' : 'left-0'}`}>
                    {['👍', '❤️', '😂', '😮', '😢', '🙏'].map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          handleReact(message.id, emoji);
                          setActiveReactionMenu(null);
                        }}
                        className="hover:scale-125 transition text-base p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Image preview pane */}
      {imagePreview && (
        <div className="bg-gray-50 dark:bg-gray-800/50 p-3 border-t border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <div className="relative w-20 h-20 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shrink-0">
            <img src={imagePreview} alt="Upload preview" className="w-full h-full object-cover" />
            <button
              onClick={handleRemoveImage}
              className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 text-xs text-gray-500 dark:text-gray-400">
            <p className="font-medium truncate text-gray-700 dark:text-gray-300">{selectedImage?.name}</p>
            <p>{((selectedImage?.size || 0) / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 p-3">
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleImageSelect}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
          >
            <Paperclip className="w-5 h-5 text-gray-500" />
          </button>
          <input
            type="text"
            value={messageText}
            onChange={(e) => handleTyping(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white"
          />
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <Smile className="w-5 h-5 text-gray-500" />
          </button>
          <button
            onClick={handleSend}
            disabled={(!messageText.trim() && !selectedImage) || isSending}
            className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
