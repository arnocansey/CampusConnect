"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Notification } from '../types';
import { formatDate } from '../utils';
import { Bell, Check } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data } = await api.get('/notifications');
      return data.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await api.put('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return '❤️';
      case 'COMMENT':
        return '💬';
      case 'FOLLOW':
        return '👤';
      case 'MESSAGE':
        return '✉️';
      case 'EVENT':
        return '📅';
      case 'MARKETPLACE':
        return '🛍️';
      case 'GROUP':
        return '👥';
      default:
        return '🔔';
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">🔔 Notifications</h1>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => markAllReadMutation.mutate()}
        >
          <Check className="w-4 h-4 mr-1" />
          Mark all read
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {notificationsData?.notifications?.map((notification: Notification) => (
            <div
              key={notification.id}
              className={`rounded-2xl p-4 border transition ${
                notification.isRead
                  ? 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <p className="text-sm dark:text-white">{notification.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatDate(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full flex-shrink-0 mt-2" />
                )}
              </div>
            </div>
          ))}

          {notificationsData?.notifications?.length === 0 && (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No notifications yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
