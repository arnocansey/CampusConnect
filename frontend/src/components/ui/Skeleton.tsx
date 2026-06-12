import React from 'react';

function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
  );
}

export function PostSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm space-y-3">
      <div className="flex items-center space-x-3">
        <SkeletonBlock className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-3 w-1/5" />
        </div>
      </div>
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-5/6" />
      <SkeletonBlock className="h-48 w-full rounded-lg" />
      <div className="flex space-x-4 pt-2">
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-20 rounded-full" />
        <SkeletonBlock className="h-8 w-20 rounded-full" />
      </div>
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      <SkeletonBlock className="h-40 w-full rounded-none" />
      <div className="px-6 pb-6 -mt-12">
        <SkeletonBlock className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-800" />
        <div className="mt-4 space-y-3">
          <SkeletonBlock className="h-6 w-1/3" />
          <SkeletonBlock className="h-4 w-1/4" />
          <SkeletonBlock className="h-4 w-2/3" />
        </div>
        <div className="flex space-x-8 mt-6">
          <div className="space-y-1">
            <SkeletonBlock className="h-5 w-8" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-5 w-8" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
          <div className="space-y-1">
            <SkeletonBlock className="h-5 w-8" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function MarketplaceSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
          <SkeletonBlock className="h-40 w-full rounded-none" />
          <div className="p-3 space-y-2">
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-5 w-1/3" />
            <SkeletonBlock className="h-3 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function NotificationSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <SkeletonBlock className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-4/5" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="space-y-1">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <SkeletonBlock className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex justify-between">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-3 w-1/6" />
            </div>
            <SkeletonBlock className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-white dark:bg-gray-800 rounded-lg">
          <SkeletonBlock className="h-10 w-10 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}
