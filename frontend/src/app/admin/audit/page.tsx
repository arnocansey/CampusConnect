"use client";

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { formatDate } from '@/utils';
import {
  ClipboardList,
  Filter,
  X,
  ChevronRight,
} from 'lucide-react';

interface AuditLog {
  id: string;
  admin: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  action: string;
  target: string;
  details?: string;
  ipAddress?: string;
  timestamp: string;
}

const ACTION_TYPES = [
  'USER_BAN',
  'USER_UNBAN',
  'USER_ROLE_CHANGE',
  'POST_DELETE',
  'COMMENT_DELETE',
  'GROUP_DELETE',
  'SETTINGS_CHANGE',
  'ANNOUNCEMENT_CREATE',
  'ANNOUNCEMENT_DELETE',
  'REPORT_RESOLVE',
  'REPORT_DISMISS',
  'SECURITY_ACTION',
];

export default function AdminAuditPage() {
  const [adminFilter, setAdminFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const { data: auditData, isLoading } = useQuery({
    queryKey: ['admin-audit', adminFilter, actionFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (adminFilter) params.append('adminId', adminFilter);
      if (actionFilter) params.append('action', actionFilter);
      const { data } = await api.get(`/admin/audit?${params}`);
      return data.data;
    },
  });

  const logs: AuditLog[] = auditData?.logs || [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Track all administrative actions across the platform
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Admin ID
            </label>
            <input
              type="text"
              placeholder="Filter by admin ID..."
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
            >
              <option value="">All Actions</option>
              {ACTION_TYPES.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Table */}
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Admin</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Action</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Target</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Details</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Timestamp</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400"></th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {log.admin.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                          {log.admin.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 dark:text-gray-400 text-xs max-w-[150px] truncate block">
                        {log.target}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-gray-500 dark:text-gray-500 text-xs max-w-[200px] truncate">
                        {log.details || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-500 dark:text-gray-500 text-xs">
                        {formatDate(log.timestamp)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {logs.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No audit logs found</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Audit Log Entry</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Admin</label>
                <div className="flex items-center gap-2 mt-1">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                    {selectedLog.admin.fullName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedLog.admin.fullName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      @{selectedLog.admin.username}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Action</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {selectedLog.action.replace(/_/g, ' ')}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Target</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">{selectedLog.target}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Details</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedLog.details || 'No additional details'}
                  </p>
                </div>
              </div>
              {selectedLog.ipAddress && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">IP Address</label>
                  <p className="text-sm text-gray-900 dark:text-white font-mono mt-1">
                    {selectedLog.ipAddress}
                  </p>
                </div>
              )}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Timestamp</label>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
