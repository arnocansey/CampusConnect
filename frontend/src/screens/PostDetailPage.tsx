"use client";
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Comment } from '../types';
import { formatDate, formatNumber } from '../utils';
import { UserListModal } from '../components/ui/UserListModal';
import { ArrowLeft, Heart, MessageCircle, Share2, MoreHorizontal, Send, Bookmark, ChevronLeft, ChevronRight, MapPin, Repeat, Flag } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showLikers, setShowLikers] = useState(false);
  const [commentText, setCommentText] = useState('');
  const { user } = useAuth();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', id],
    queryFn: async () => {
      const { data } = await api.get(`/posts/${id}`);
      return data.data;
    },
  });

  useEffect(() => {
    if (id && post) {
      api.post(`/posts/${id}/view`).catch(() => {});
    }
  }, [id, post]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', id], context.previous);
      }
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/posts/${id}/save`);
      return data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previous = queryClient.getQueryData(['post', id]);
      queryClient.setQueryData(['post', id], (old: any) => ({
        ...old,
        isSaved: !old.isSaved,
      }));
      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', id], context.previous);
      }
    },
  });

  const repostMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/posts/${id}/repost`);
      return data.data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previous = queryClient.getQueryData(['post', id]);
      queryClient.setQueryData(['post', id], (old: any) => ({
        ...old,
        isReposted: !old.isReposted,
        shareCount: (old.shareCount || 0) + (old.isReposted ? -1 : 1),
      }));
      return { previous };
    },
    onError: (_err, _postId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', id], context.previous);
      }
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { data } = await api.post('/users/report', {
        contentType: 'POST',
        contentId: post.id,
        reason,
      });
      return data.data;
    },
    onSuccess: () => {
      setShowReportModal(false);
      setSelectedReason('');
      setShowMoreMenu(false);
      toast.success('Report submitted');
    },
    onError: () => {
      toast.error('Failed to submit report');
    },
  });

  const voteMutation = useMutation({
    mutationFn: async (optionId: string) => {
      const { data } = await api.post(`/posts/${id}/vote`, { optionId });
      return data.data;
    },
    onMutate: async (optionId) => {
      await queryClient.cancelQueries({ queryKey: ['post', id] });
      const previous = queryClient.getQueryData(['post', id]);
      queryClient.setQueryData(['post', id], (old: any) => {
        if (!old?.poll) return old;
        const prevVote = old.poll.userVote;
        const newVote = prevVote === optionId ? null : optionId;
        return {
          ...old,
          poll: {
            ...old.poll,
            userVote: newVote,
            options: old.poll.options.map((opt: any) => ({
              ...opt,
              _count: {
                votes:
                  opt._count.votes
                  + (opt.id === optionId ? (prevVote === optionId ? -1 : 1) : (prevVote === optionId ? -1 : 0)),
              },
            })),
          },
        };
      });
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['post', id], context.previous);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['post', id] });
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
      <div className="max-w-4xl mx-auto p-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3" />
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          </div>
      </div>
    );
  }

  if (!post) return null;

  return (
    <>
    <div className="max-w-4xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => window.history.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition">
            <ArrowLeft className="w-5 h-5 dark:text-white" />
          </button>
          <h1 className="text-xl font-bold dark:text-white">Post</h1>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
          <div className="p-4 flex items-center justify-between">
            <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 min-w-0">
              {post.author.profilePicture ? (
                <img src={post.author.profilePicture} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm">
                  {post.author.fullName?.charAt(0)}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm dark:text-white">{post.author.fullName}</p>
                  {post.author.isVerified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-gray-500">@{post.author.username} · {formatDate(post.createdAt)}</p>
              </div>
            </Link>
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
              >
                <MoreHorizontal className="w-5 h-5 text-gray-400" />
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 top-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50 min-w-[160px]">
                  <button
                    onClick={() => { setShowReportModal(true); setShowMoreMenu(false); }}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                  >
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              )}
            </div>
          </div>

          {post.location && (
            <div className="px-4 pb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <span className="text-xs text-gray-500 dark:text-gray-400">{post.location}</span>
            </div>
          )}

          {post.content && (
            <div className="px-4 pb-3">
              <p className="text-sm leading-relaxed dark:text-white whitespace-pre-wrap">{post.content}</p>
            </div>
          )}

          {post.tags && post.tags.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-blue-500 text-sm">#{tag}</span>
              ))}
            </div>
          )}

          {post.videoUrl && (
            <div className="px-4 pb-3">
              <video src={post.videoUrl} controls className="w-full max-h-[500px] rounded-xl bg-black" />
            </div>
          )}

          {post.images && post.images.length > 0 && (
            <div className="relative">
              <div className="overflow-hidden">
                <img
                  src={post.images[currentImageIndex]}
                  alt=""
                  className="w-full max-h-[500px] object-cover"
                />
              </div>
              {post.images.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((i) => Math.max(0, i - 1))}
                    disabled={currentImageIndex === 0}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 disabled:opacity-30"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((i) => Math.min(post.images.length - 1, i + 1))}
                    disabled={currentImageIndex === post.images.length - 1}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 disabled:opacity-30"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/50 text-white text-xs px-2 py-1 rounded-full">
                    {currentImageIndex + 1} / {post.images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {(post as any).poll && (
            <div className="px-4 pb-3 space-y-2">
              {(() => {
                const poll = (post as any).poll;
                const totalVotes = poll.options.reduce((sum: number, opt: any) => sum + (opt._count?.votes || 0), 0);
                const pollClosed = poll.expiresAt && new Date(poll.expiresAt) < new Date();
                return (
                  <>
                    {poll.options.map((option: any) => {
                      const pct = totalVotes > 0 ? Math.round((option._count.votes / totalVotes) * 100) : 0;
                      const isSelected = poll.userVote === option.id;
                      return (
                        <button
                          key={option.id}
                          onClick={() => !pollClosed && voteMutation.mutate(option.id)}
                          disabled={pollClosed}
                          className={`w-full text-left rounded-xl border px-4 py-3 text-sm transition relative overflow-hidden ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          } ${pollClosed ? 'cursor-default' : 'cursor-pointer'}`}
                        >
                          {totalVotes > 0 && (
                            <div
                              className={`absolute inset-0 transition-all duration-500 ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}
                              style={{ width: `${pct}%` }}
                            />
                          )}
                          <div className="relative flex items-center justify-between">
                            <span className="dark:text-white font-medium">{option.text}</span>
                            {totalVotes > 0 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold">{pct}%</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                      {formatNumber(totalVotes)} vote{totalVotes !== 1 ? 's' : ''}
                      {pollClosed && ' · Poll closed'}
                    </p>
                  </>
                );
              })()}
            </div>
          )}

          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-3">
              {post._count.likes > 0 && (
                <button
                  onClick={() => setShowLikers(true)}
                  className="hover:underline"
                >
                  ❤️ {formatNumber(post._count.likes)}
                </button>
              )}
              <span>💬 {formatNumber(post._count.comments)}</span>
              {(post.shareCount ?? 0) > 0 && (
                <span>🔁 {formatNumber(post.shareCount!)}</span>
              )}
              {(post.viewCount ?? 0) > 0 && (
                <span>👁️ {formatNumber(post.viewCount!)}</span>
              )}
            </div>
          </div>

          <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
            <button
              onClick={() => likeMutation.mutate()}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm font-medium">Like</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
              <MessageCircle className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-medium">Comment</span>
            </button>
            <button
              onClick={() => repostMutation.mutate()}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isReposted ? 'text-green-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Repeat className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-medium">Repost</span>
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isSaved ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-300'}`}
            >
              <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
              <span className="text-xs sm:text-sm font-medium">Save</span>
            </button>
            <button className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
              <Share2 className="w-5 h-5" />
              <span className="text-xs sm:text-sm font-medium">Share</span>
            </button>
          </div>
        </div>

        {/* Comment Input */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 mb-4">
          <div className="flex items-center gap-3">
            {user?.profilePicture ? (
              <img src={user.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                {user?.fullName?.charAt(0) || 'U'}
              </div>
            )}
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full px-4 py-2 text-sm focus:outline-none dark:text-white dark:placeholder-gray-400"
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
              <div className="flex items-start gap-3">
                {comment.author.profilePicture ? (
                  <img src={comment.author.profilePicture} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center text-white text-xs font-bold">
                    {comment.author.fullName?.charAt(0)}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm dark:text-white">{comment.author.fullName}</p>
                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm mt-1 dark:text-white">{comment.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <UserListModal
        isOpen={showLikers}
        onClose={() => setShowLikers(false)}
        title="Liked by"
        type="likers"
        postId={id}
      />

      {showReportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="text-lg font-semibold dark:text-white mb-1">Report Post</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Select a reason for reporting this post.</p>
            <div className="space-y-2">
              {(['SPAM', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'MISINFORMATION', 'OTHER'] as const).map((reason) => (
                <button
                  key={reason}
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full text-left px-4 py-2.5 rounded-xl text-sm transition border ${
                    selectedReason === reason
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-600 text-red-700 dark:text-red-400'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white'
                  }`}
                >
                  {reason.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => { setShowReportModal(false); setSelectedReason(''); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 dark:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={() => { if (selectedReason) reportMutation.mutate(selectedReason); }}
                disabled={!selectedReason || reportMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
              >
                {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
