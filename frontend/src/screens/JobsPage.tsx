"use client";
import { Briefcase, Bell } from 'lucide-react';

export function JobsPage() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6 gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">💼 Jobs & Internships</h1>
          <p className="text-gray-500 dark:text-gray-400 text-xs sm:text-sm mt-1">Find opportunities near you</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 flex items-center justify-center mb-6">
          <Briefcase className="w-10 h-10 text-blue-500 dark:text-blue-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Coming Soon</h2>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6">
          We&apos;re building a job board tailored for university students. Find part-time work, internships, and entry-level opportunities — all verified and campus-approved.
        </p>
        <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 font-medium">
          <Bell className="w-4 h-4" />
          <span>Notify me when it launches</span>
        </div>
      </div>
    </div>
  );
}
