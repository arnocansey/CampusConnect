"use client";

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/services/api';
import { formatDate } from '@/utils';
import {
  Megaphone,
  Plus,
  Trash2,
  X,
  Users,
  Building,
  GraduationCap,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'ALL' | 'UNIVERSITY' | 'DEPARTMENT' | 'ROLE';
  targeting?: string;
  createdBy: {
    id: string;
    username: string;
    fullName: string;
  };
  createdAt: string;
}

const TYPE_OPTIONS = [
  { label: 'All Users', value: 'ALL', icon: Globe },
  { label: 'University', value: 'UNIVERSITY', icon: GraduationCap },
  { label: 'Department', value: 'DEPARTMENT', icon: Building },
  { label: 'Role', value: 'ROLE', icon: Users },
];

const TYPE_STYLES: Record<string, string> = {
  ALL: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  UNIVERSITY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  DEPARTMENT: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  ROLE: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function AdminAnnouncementsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<Announcement['type']>('ALL');
  const [targeting, setTargeting] = useState('');
  const queryClient = useQueryClient();

  const { data: announcementsData, isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: async () => {
      const { data } = await api.get('/admin/announcements');
      return data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (newAnnouncement: { title: string; message: string; type: string; targeting?: string }) => {
      const { data } = await api.post('/admin/announcements', newAnnouncement);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      setShowCreateForm(false);
      setTitle('');
      setMessage('');
      setType('ALL');
      setTargeting('');
      toast.success('Announcement created');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create announcement');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/admin/announcements/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-announcements'] });
      toast.success('Announcement deleted');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete announcement');
    },
  });

  const announcements: Announcement[] = announcementsData?.announcements || [];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    createMutation.mutate({
      title,
      message,
      type,
      targeting: targeting || undefined,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Create and manage platform-wide announcements
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-1" />
          New Announcement
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Announcement</h2>
            <button
              onClick={() => setShowCreateForm(false)}
              className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Title *</label>
              <Input
                type="text"
                placeholder="Announcement title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Message *</label>
              <textarea
                placeholder="Write your announcement message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-transparent p-2.5 dark:text-white focus:outline-none"
                rows={4}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Audience Type *</label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setType(opt.value as Announcement['type'])}
                        className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs font-medium transition ${
                          type === opt.value
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Targeting (Optional)</label>
                <Input
                  type="text"
                  placeholder={
                    type === 'DEPARTMENT'
                      ? 'e.g. Computer Science'
                      : type === 'ROLE'
                      ? 'e.g. STUDENT, MODERATOR'
                      : type === 'UNIVERSITY'
                      ? 'e.g. Main Campus'
                      : 'Leave empty for all'
                  }
                  value={targeting}
                  onChange={(e) => setTargeting(e.target.value)}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
              <Button variant="ghost" type="button" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Announcement'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Announcements List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 hover:shadow-md transition"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Megaphone className="w-4 h-4 text-blue-500" />
                    <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                      {announcement.title}
                    </h3>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_STYLES[announcement.type]}`}>
                      {announcement.type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 whitespace-pre-wrap">
                    {announcement.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-500">
                    {announcement.targeting && (
                      <span>Target: {announcement.targeting}</span>
                    )}
                    <span>By {announcement.createdBy.fullName}</span>
                    <span>{formatDate(announcement.createdAt)}</span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 ml-4"
                  onClick={() => {
                    if (confirm('Delete this announcement?')) {
                      deleteMutation.mutate(announcement.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-12">
              <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No announcements yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
