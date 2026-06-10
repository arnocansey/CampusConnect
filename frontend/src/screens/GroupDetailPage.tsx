"use client";
import { useParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Users, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const { data: group, isLoading } = useQuery({
    queryKey: ['group', id],
    queryFn: async () => {
      const { data } = await api.get(`/groups/${id}`);
      return data.data;
    },
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/groups/${id}/join`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Joined group!');
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/groups/${id}/leave`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group', id] });
      toast.success('Left group');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4 animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
        <div className="bg-white rounded-2xl p-6">
          <div className="h-12 bg-gray-200 rounded mb-4" />
          <div className="h-4 bg-gray-200 rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (!group) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Study Group</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl">
            {group.name.substring(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{group.name}</h2>
            <p className="text-sm text-gray-500">{group._count.members} members</p>
          </div>
        </div>

        {group.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-4">{group.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mb-4">
          {group.course && (
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs px-3 py-1 rounded-full">
              {group.course}
            </span>
          )}
          {group.department && (
            <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs px-3 py-1 rounded-full">
              {group.department}
            </span>
          )}
          {group.level && (
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs px-3 py-1 rounded-full">
              Level {group.level}
            </span>
          )}
        </div>

        {group.isMember ? (
          <div className="flex gap-2">
            <Button className="flex-1">
              <MessageSquare className="w-4 h-4 mr-2" />
              Chat
            </Button>
            <Button variant="outline" onClick={() => leaveMutation.mutate()}>
              Leave
            </Button>
          </div>
        ) : (
          <Button className="w-full" onClick={() => joinMutation.mutate()}>
            <Users className="w-4 h-4 mr-2" />
            Join Group
          </Button>
        )}
      </div>

      {/* Members */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
        <h3 className="font-semibold mb-3">Members ({group._count.members})</h3>
        <div className="space-y-3">
          {group.members?.slice(0, 10).map((member: { id: string; role: string; user: { fullName: string; username: string } }) => (
            <div key={member.id} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                {member.user.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">{member.user.fullName}</p>
                <p className="text-xs text-gray-500">@{member.user.username}</p>
              </div>
              {member.role !== 'MEMBER' && (
                <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                  {member.role}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
