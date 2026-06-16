"use client";
import { Users, Bell } from 'lucide-react';

export function GroupsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">👥 Study Groups</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">Collaborate and learn together</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/30 dark:to-blue-900/30 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-green-500 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          Create and join course-specific study groups. Share notes, schedule sessions, and collaborate with classmates — all in one place.
        </p>
        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 font-medium">
          <Bell className="w-4 h-4" />
          <span>Notify me when it launches</span>
        </div>
      </div>
    </div>
  );
}
