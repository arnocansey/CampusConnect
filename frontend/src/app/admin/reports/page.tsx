"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { formatDate } from '@/utils';
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

type ReportStatus = 'PENDING' | 'REVIEWED' | 'RESOLVED';

interface Report {
  id: string;
  reporter: {
    id: string;
    username: string;
    fullName: string;
    profilePicture?: string;
  };
  contentType: string;
  reason: string;
  description?: string;
  status: ReportStatus;
  contentPreview?: string;
  contentId: string;
  createdAt: string;
}

const STATUS_TABS: { label: string; value: ReportStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Reviewed', value: 'REVIEWED' },
  { label: 'Resolved', value: 'RESOLVED' },
];

const STATUS_STYLES: Record<ReportStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  REVIEWED: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportStatus | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState('');
  const [reasonFilter, setReasonFilter] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('');
  const [viewingReport, setViewingReport] = useState<Report | null>(null);
  const queryClient = useQueryClient();

  const { data: reportsData, isLoading } = useQuery({
    queryKey: ['admin-reports', activeTab, statusFilter, reasonFilter, contentTypeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.append('status', activeTab);
      if (statusFilter) params.append('status', statusFilter);
      if (reasonFilter) params.append('reason', reasonFilter);
      if (contentTypeFilter) params.append('contentType', contentTypeFilter);
      const { data } = await api.get(`/admin/reports?${params}`);
      return data.data;
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await api.put(`/admin/reports/${reportId}/resolve`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report resolved');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to resolve report');
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (reportId: string) => {
      const { data } = await api.put(`/admin/reports/${reportId}/dismiss`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      toast.success('Report dismissed');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to dismiss report');
    },
  });

  const reports: Report[] = reportsData?.reports || [];

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          Review and manage user-reported content
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-6 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
              activeTab === tab.value
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Filters</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <select
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
          >
            <option value="">All Reasons</option>
            <option value="SPAM">Spam</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="INAPPROPRIATE">Inappropriate</option>
            <option value="MISINFORMATION">Misinformation</option>
            <option value="OTHER">Other</option>
          </select>
          <select
            value={contentTypeFilter}
            onChange={(e) => setContentTypeFilter(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
          >
            <option value="">All Content Types</option>
            <option value="POST">Post</option>
            <option value="COMMENT">Comment</option>
            <option value="MESSAGE">Message</option>
            <option value="PROFILE">Profile</option>
            <option value="GROUP">Group</option>
            <option value="MARKETPLACE">Marketplace</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white dark:bg-gray-800 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="REVIEWED">Reviewed</option>
            <option value="RESOLVED">Resolved</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      {isLoading ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="p-6 space-y-4">
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
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Reporter</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden md:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Reason</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Content Preview</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Status</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400 hidden lg:table-cell">Created</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr
                    key={report.id}
                    className="border-b border-gray-50 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                          {report.reporter.fullName.charAt(0)}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white text-xs">
                          {report.reporter.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {report.contentType}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-600 dark:text-gray-400 text-xs">
                        {report.reason}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <p className="text-gray-600 dark:text-gray-400 text-xs max-w-[200px] truncate">
                        {report.contentPreview || 'No preview available'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[report.status]}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-gray-500 dark:text-gray-500 text-xs">
                        {formatDate(report.createdAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                          onClick={() => setViewingReport(report)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {report.status !== 'RESOLVED' && (
                          <>
                            <button
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20 transition"
                              onClick={() => resolveMutation.mutate(report.id)}
                              disabled={resolveMutation.isPending}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              className="h-9 w-9 inline-flex items-center justify-center rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                              onClick={() => dismissMutation.mutate(report.id)}
                              disabled={dismissMutation.isPending}
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {reports.length === 0 && (
            <div className="text-center py-12">
              <AlertTriangle className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No reports found</p>
            </div>
          )}
        </div>
      )}

      {/* View Report Modal */}
      {viewingReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-lg w-full border border-gray-100 dark:border-gray-800 p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setViewingReport(null)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Report Details</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reporter</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {viewingReport.reporter.fullName} (@{viewingReport.reporter.username})
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Content Type</label>
                <p className="text-sm text-gray-900 dark:text-white">{viewingReport.contentType}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Reason</label>
                <p className="text-sm text-gray-900 dark:text-white">{viewingReport.reason}</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Description</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {viewingReport.description || 'No description provided'}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Content Preview</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {viewingReport.contentPreview || 'No preview available'}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Status</label>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium mt-1 ${STATUS_STYLES[viewingReport.status]}`}>
                  {viewingReport.status}
                </span>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Created</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(viewingReport.createdAt)}</p>
              </div>
              {viewingReport.status !== 'RESOLVED' && (
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <Button
                    variant="ghost"
                    onClick={() => dismissMutation.mutate(viewingReport.id)}
                    disabled={dismissMutation.isPending}
                  >
                    Dismiss
                  </Button>
                  <Button
                    onClick={() => {
                      resolveMutation.mutate(viewingReport.id);
                      setViewingReport(null);
                    }}
                    disabled={resolveMutation.isPending}
                  >
                    Resolve
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
