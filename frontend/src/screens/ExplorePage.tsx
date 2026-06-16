"use client";
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { Post } from '../types';
import { Search, TrendingUp, Users, FileText } from 'lucide-react';
import Link from 'next/link';

export function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'people' | 'posts'>('trending');

  const { data: trendingData } = useQuery({
    queryKey: ['trending'],
    queryFn: async () => {
      const { data } = await api.get('/posts/feed?sort=likes&order=desc');
      return data.data;
    },
  });

  const { data: searchData } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      const { data } = await api.get(`/users/search?q=${searchQuery}`);
      return data.data;
    },
    enabled: searchQuery.length > 0 && activeTab === 'people',
  });

  const { data: postSearchData } = useQuery({
    queryKey: ['postSearch', searchQuery],
    queryFn: async () => {
      const { data } = await api.get(`/posts/search?q=${searchQuery}`);
      return data.data;
    },
    enabled: searchQuery.length > 0 && activeTab === 'posts',
  });

  const { data: trendingTopics } = useQuery({
    queryKey: ['trendingTopics'],
    queryFn: async () => {
      const { data } = await api.get('/posts/trending');
      return data.data;
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-2 mb-4 transition-colors">
        <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder="Search for people, topics, or posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent flex-1 text-sm focus:outline-none dark:text-white dark:placeholder-gray-500"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 mb-4 transition-colors">
        {[
          { id: 'trending' as const, icon: TrendingUp, label: 'Trending' },
          { id: 'people' as const, icon: Users, label: 'People' },
          { id: 'posts' as const, icon: FileText, label: 'Posts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition ${
              activeTab === tab.id
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4 inline mr-2" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trending Tab */}
      {activeTab === 'trending' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-colors">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Trending Topics</h3>
          <div className="space-y-1">
            {(trendingTopics || [
              { tag: '#MidtermPrep', count: 1243 },
              { tag: '#CampusLife', count: 892 },
              { tag: '#StudyTips', count: 756 },
              { tag: '#TechConference2026', count: 634 },
              { tag: '#CareerFair', count: 521 },
            ]).map((topic: any, i: number) => (
              <div
                key={topic.tag || topic}
                className="flex items-center justify-between py-3 border-b border-gray-50 dark:border-gray-800 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg px-2 cursor-pointer transition"
              >
                <div>
                  <p className="text-blue-600 dark:text-blue-400 font-semibold">{topic.tag || topic}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{topic.count?.toLocaleString() || Math.floor(Math.random() * 1000 + 500)} posts</p>
                </div>
                <span className="bg-gray-100 dark:bg-gray-700 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                  {i + 1}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* People Tab */}
      {activeTab === 'people' && (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 transition-colors">
          <h3 className="font-bold text-lg mb-4 dark:text-white">Suggested People</h3>
          <div className="space-y-3">
            {searchData?.length === 0 && (
              <p className="text-center text-gray-500 dark:text-gray-400 py-4">Search for people above</p>
            )}
            {(searchData || []).map((user: any) => (
              <Link
                key={user.id}
                href={`/profile/${user.username}`}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-bold">
                    {user.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm dark:text-white">{user.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.department || 'University'} · @{user.username}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          {searchQuery.length > 0 ? (
            postSearchData?.length > 0 ? (
              <div className="space-y-3">
                {postSearchData.map((post: Post) => (
                  <Link
                    key={post.id}
                    href={`/post/${post.id}`}
                    className="block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 hover:shadow-md transition"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                        {post.author.profilePicture ? (
                          <img src={post.author.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          post.author.fullName?.charAt(0)
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold dark:text-white truncate">{post.author.fullName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">@{post.author.username}</p>
                      </div>
                    </div>
                    {post.content && (
                      <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-3">{post.content}</p>
                    )}
                    {post.images?.[0] && (
                      <img src={post.images[0]} alt="" className="mt-2 rounded-xl w-full h-40 object-cover" />
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">No posts found for "{searchQuery}"</p>
            )
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {(trendingData?.posts || []).slice(0, 4).map((post: Post) => (
                <Link
                  key={post.id}
                  href={`/post/${post.id}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden hover:shadow-md transition"
                >
                  {post.images?.[0] ? (
                    <img src={post.images[0]} alt="" className="h-32 w-full object-cover" />
                  ) : (
                    <div className="h-32 bg-gradient-to-br from-blue-400 to-purple-500" />
                  )}
                  <div className="p-3">
                    <p className="text-xs font-medium line-clamp-2 dark:text-white">{post.content}</p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">by {post.author.fullName}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
