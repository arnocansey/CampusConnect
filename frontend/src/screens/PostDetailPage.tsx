"use client";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Comment } from '../types';
import { formatDate, formatNumber } from '../utils';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, Send } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState('');

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data.data;
    },
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}/comments`);
      return data.data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/posts/${id}/like`);
      return data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previous = queryClient.getQueryData(['post', id]);
      queryClient.setQueryData(['post', id], (old: any) => ({
        ...old,
        isLiked: !old.isLiked,
        _count: { ...old._count, likes: old.isLiked ? old._count.likes - 1 : old._count.likes + 1 },
      }));
      return { previous };
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data } = await api.post(`/posts/${id}/comments`, { content });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      setCommentText('');
      toast.success('Comment added!');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="bg-white rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gray-200" />
              <div className="h-4 bg-gray-200 rounded w-1/4" />
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Post</h1>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
        <div className="p-4 flex items-center justify-between">
          <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
              {post.author.fullName?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm">{post.author.fullName}</p>
                {post.author.isVerified && (
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="text-xs text-gray-500">@{post.author.username} · {formatDate(post.createdAt)}</p>
            </div>
          </Link>
          <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <MoreHorizontal className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {post.content && (
          <div className="px-4 pb-3">
            <p className="text-sm leading-relaxed">{post.content}</p>
          </div>
        )}

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
          <span>❤️ {formatNumber(post._count.likes)} · 💬 {formatNumber(post._count.comments)}</span>
        </div>

        <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <button
            onClick={() => likeMutation.mutate()}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isLiked ? 'text-red-500' : 'text-gray-600'}`}
          >
            <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600">
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      </div>

      {/* Comment Input */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
            Y
          </div>
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && commentText.trim()) {
                commentMutation.mutate(commentText);
              }
            }}
          />
          <button
            onClick={() => commentText.trim() && commentMutation.mutate(commentText)}
            disabled={!commentText.trim()}
            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Comments */}
      <div className="space-y-3">
        {commentsData?.comments?.map((comment: Comment) => (
          <div key={comment.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                {comment.author.fullName?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{comment.author.fullName}</p>
                  <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
