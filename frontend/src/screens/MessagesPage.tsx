"use client";
import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '../services/api';
import { Conversation } from '../types';
import { formatDate } from '../utils';
import { Search, MessageSquare, Plus, X, Users } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function MessagesPage() {
  const router = useRouter();
  const [showNewChat, setShowNewChat] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'chats' | 'requests'>('chats');

  const { data: conversationsData, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: async () => {
      const { data } = await api.get('/messages/conversations');
      return data.data;
    },
  });

  const { data: searchResults } = useQuery({
    queryKey: ['userSearch', userSearch],
    queryFn: async () => {
      if (!userSearch || userSearch.length < 2) return [];
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(userSearch)}&limit=10`);
      return data.data;
    },
    enabled: showNewChat && userSearch.length >= 2,
  });

  const createConversationMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data } = await api.post('/messages/conversations', { userId });
      return data.data;
    },
    onSuccess: (conversation) => {
      setShowNewChat(false);
      setUserSearch('');
      router.push(`/messages/${conversation.id}`);
    },
  });

  return (
    <div className="max-w-7xl mx-auto p-4 flex gap-6">
      <div className="flex-1 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Messages</h1>
          <Button size="icon" onClick={() => setShowNewChat(true)}>
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Search */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2 mb-4 transition-colors">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search messages..."
            className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-gray-200 dark:border-gray-800 mb-4">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'chats'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chats
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Requests
          </button>
        </div>

        {/* Conversations List */}
        {isLoading ? (
          <div className="space-y-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : activeTab === 'chats' ? (
          <div className="space-y-1">
            {conversationsData?.map((conversation: Conversation) => (
              <button
                key={conversation.id}
                onClick={() => router.push(`/messages/${conversation.id}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition text-left"
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold">
                    {conversation.avatar ? (
                      <img src={conversation.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      conversation.name?.charAt(0) || 'U'
                    )}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm dark:text-white">{conversation.name || 'Unknown'}</p>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">
                      {conversation.lastMessage?.createdAt ? formatDate(conversation.lastMessage.createdAt) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {conversation.lastMessage?.content || 'No messages yet'}
                  </p>
                </div>
                {conversation.unreadCount > 0 && (
                  <span className="bg-blue-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold shrink-0">
                    {conversation.unreadCount}
                  </span>
                )}
              </button>
            ))}

            {conversationsData?.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No conversations yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Start a conversation with your classmates</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No message requests</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Requests from people you don't follow will appear here</p>
          </div>
        )}

        {/* New Conversation Modal */}
        {showNewChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg dark:text-white">New Conversation</h3>
                <button onClick={() => { setShowNewChat(false); setUserSearch(''); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name or username..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
                  autoFocus
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {searchResults?.length > 0 ? (
                  searchResults.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => createConversationMutation.mutate(u.id)}
                      disabled={createConversationMutation.isPending}
                      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition text-left"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          u.fullName?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm dark:text-white">{u.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{u.username}</p>
                      </div>
                    </button>
                  ))
                ) : userSearch.length >= 2 ? (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">No users found</p>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">Type at least 2 characters to search</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
