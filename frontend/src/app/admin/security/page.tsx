"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { formatDate } from '@/utils';
import {
  Shield,
  Monitor,
  LogOut,
  Smartphone,
  Laptop,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface Session {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  ip: string;
  device: string;
  browser: string;
  lastActive: string;
  createdAt: string;
}

interface SecurityLog {
  id: string;
  user: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  action: string;
  ip: string;
  timestamp: string;
  details?: string;
}

function getDeviceIcon(device: string) {
  const lower = device.toLowerCase();
  if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
    return <Smartphone className="w-4 h-4" />;
  }
  if (lower.includes('windows') || lower.includes('mac') || lower.includes('linux')) {
    return <Laptop className="w-4 h-4" />;
  }
  return <Globe className="w-4 h-4" />;
}

export default function AdminSecurityPage() {
  const [activeSection, setActiveSection] = useState<'sessions' | 'logs'>('sessions');
  const queryClient = useQueryClient();

  const { data: sessionsData, isLoading: sessionsLoading } = useQuery({
    queryKey: ['admin-security-sessions'],
    queryFn: async () => {
      const { data } = await api.get('/admin/security/sessions');
      return data.data;
    },
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['admin-security-logs'],
    queryFn: async () => {
      const { data } = await api.get('/admin/security/logs');
      return data.data;
    },
  });

  const forceLogoutMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const { data } = await api.delete(`/admin/security/sessions/${sessionId}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-security-sessions'] });
      toast.success('Session terminated');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to terminate session');
    },
  });

  const sessions: Session[] = sessionsData?.sessions || [];
  const logs: SecurityLog[] = logsData?.logs || [];
  const isLoading = activeSection === 'sessions' ? sessionsLoading : logsLoading;

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Security</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Monitor active sessions and review security logs
        </p>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
        <button
          onClick={() => setActiveSection('sessions')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
            activeSection === 'sessions'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Monitor className="w-4 h-4" />
          Active Sessions
          <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-2 py-0.5 rounded-full">
            {sessions.length}
          </span>
        </button>
        <button
          onClick={() => setActiveSection('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition flex items-center gap-2 ${
            activeSection === 'logs'
              ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          Security Logs
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/6" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Active Sessions */}
          {activeSection === 'sessions' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">IP Address</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Device</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Last Active</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((session) => (
                      <tr
                        key={session.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
                              {session.user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-xs">
                                {session.user.fullName}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs">
                                @{session.user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                            {session.ip}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-xs">
                            {getDeviceIcon(session.device)}
                            <span className="max-w-[150px] truncate">{session.device}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">
                            {formatDate(session.lastActive)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => forceLogoutMutation.mutate(session.id)}
                            disabled={forceLogoutMutation.isPending}
                          >
                            <LogOut className="w-3.5 h-3.5 mr-1" />
                            Force Logout
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <Monitor className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No active sessions</p>
                </div>
              )}
            </div>
          )}

          {/* Security Logs */}
          {activeSection === 'logs' && (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800">
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">User</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Action</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">IP Address</th>
                      <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-xs font-bold">
                              {log.user.fullName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white text-xs">
                                {log.user.fullName}
                              </p>
                              <p className="text-gray-500 dark:text-gray-500 text-xs">
                                @{log.user.username}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                            {log.ip}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-gray-500 dark:text-gray-500 text-xs">
                            {formatDate(log.timestamp)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {logs.length === 0 && (
                <div className="text-center py-12">
                  <Shield className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No security logs found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
