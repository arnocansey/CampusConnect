"use client";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import { Post } from '../types';
import { formatDate, formatNumber } from '../utils';
import { Heart, MessageCircle, Bookmark, Share2, MoreHorizontal, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export function HashtagPage({ tag }: { tag: string }) {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hashtag', tag],
    queryFn: async () => {
      const { data } = await api.get(`/posts/hashtag/${tag}`);
      return data.data;
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/like`);
      return data.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['hashtag', tag] });
      const previous = queryClient.getQueryData(['hashtag', tag]);
      queryClient.setQueryData(['hashtag', tag], (old: any) => ({
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                _count: {
                  ...post._count,
                  likes: post.isLiked ? post._count.likes - 1 : post._count.likes + 1,
                },
              }
            : post
        ),
      }));
      return { previous };
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { data } = await api.post(`/posts/${postId}/save`);
      return data.data;
    },
    onMutate: async (postId) => {
      await queryClient.cancelQueries({ queryKey: ['hashtag', tag] });
      const previous = queryClient.getQueryData(['hashtag', tag]);
      queryClient.setQueryData(['hashtag', tag], (old: any) => ({
        ...old,
        posts: old.posts.map((post: Post) =>
          post.id === postId ? { ...post, isSaved: !post.isSaved } : post
        ),
      }));
      return { previous };
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
        >
          <ArrowLeft className="w-5 h-5 dark:text-white" />
        </button>
        <h1 className="text-xl font-bold dark:text-white">#{tag}</h1>
      </div>

      {/* Posts Feed */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.posts?.length > 0 ? (
        <div className="space-y-4">
          {data.posts.map((post: Post) => (
            <div key={post.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden transition-colors">
              <div className="p-4 flex items-center justify-between">
                <Link href={`/profile/${post.author.username}`} className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {post.author.profilePicture ? (
                      <img src={post.author.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      post.author.fullName?.charAt(0)
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm dark:text-white truncate">{post.author.fullName}</p>
                      {post.author.isVerified && (
                        <svg className="w-4 h-4 text-blue-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{post.author.username} · {formatDate(post.createdAt)}</p>
                  </div>
                </Link>
                <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0">
                  <MoreHorizontal className="w-5 h-5 text-gray-400" />
                </button>
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
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {post.tags.map((t: string) => (
                        <Link key={t} href={`/hashtag/${t}`} className="text-xs text-blue-500 dark:text-blue-400 font-medium hover:underline">#{t}</Link>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {post.videoUrl && (
                <div className="px-4 pb-3">
                  <video src={post.videoUrl} controls className="w-full max-h-96 rounded-xl bg-black" />
                </div>
              )}

              {post.images?.length > 0 && (
                <div className="px-4 pb-3">
                  {post.images.length === 1 ? (
                    <img src={post.images[0]} alt="" className="rounded-xl w-full object-cover max-h-96" />
                  ) : (
                    <div className="grid grid-cols-2 gap-1 rounded-xl overflow-hidden">
                      {post.images.slice(0, 4).map((img: string, idx: number) => (
                        <div key={idx} className="relative">
                          <img src={img} alt="" className="w-full h-40 object-cover" />
                          {idx === 3 && post.images.length > 4 && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <span className="text-white text-2xl font-bold">+{post.images.length - 4}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                <span>{formatNumber(post._count.likes)} likes · {formatNumber(post._count.comments)} comments</span>
              </div>

              <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex items-center gap-1">
                <button
                  onClick={() => likeMutation.mutate(post.id)}
                  className={`flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition ${post.isLiked ? 'text-red-500' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs sm:text-sm font-medium">Like</span>
                </button>
                <Link href={`/post/${post.id}`} className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition text-gray-600 dark:text-gray-300">
                  <MessageCircle className="w-5 h-5" />
                  <span className="text-xs sm:text-sm font-medium">Comment</span>
                </Link>
                <button
                  onClick={() => saveMutation.mutate(post.id)}
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
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No posts found for #{tag}</p>
        </div>
      )}
    </div>
  );
}
