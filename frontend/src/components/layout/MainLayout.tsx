"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useGlobalNotifications } from '../../hooks/useGlobalNotifications';
import { useSiteSettings } from '../../hooks/useSiteSettings';
import { AIChatWidget } from '../support/AIChatWidget';
import { ConstructionBanner } from '../ui/ConstructionBanner';
// import { TawkWidget } from '../support/TawkWidget';
import api from '../../services/api';
import {
  Home,
  Search,
  ShoppingBag,
  MessageSquare,
  Bell,
  LogOut,
  Menu,
  X,
  BookOpen,
  Users,
  Building,
  Briefcase,
  Calendar,
  Megaphone,
  Crown,
  Store,
  DollarSign,
  RotateCw,
} from 'lucide-react';

const navItems = [
  { path: '/feed', icon: Home, label: 'Home' },
  { path: '/explore', icon: Search, label: 'Explore' },
  { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { path: '/my-shop', icon: Store, label: 'My Shop' },
  { path: '/earnings', icon: DollarSign, label: 'Earnings' },
  { path: '/notes', icon: BookOpen, label: 'Notes Hub' },
  { path: '/groups', icon: Users, label: 'Study Groups' },
  { path: '/hostels', icon: Building, label: 'Hostel Finder' },
  { path: '/jobs', icon: Briefcase, label: 'Jobs & Internships' },
  { path: '/events', icon: Calendar, label: 'Campus Events' },
  { path: '/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/messages', icon: MessageSquare, label: 'Messages' },
  { path: '/notifications', icon: Bell, label: 'Notifications' },
  { path: '/subscriptions', icon: Crown, label: 'Subscriptions' },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useGlobalNotifications();
  const { siteName, logoUrl } = useSiteSettings();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.profile-dropdown-container')) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data: notificationData } = useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: async () => {
      const { data } = await api.get('/notifications?limit=1');
      return data.data;
    },
    refetchInterval: 30000,
  });

  const unreadCount = notificationData?.unreadCount || 0;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 transition-colors">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-10 h-10 rounded-xl object-contain" />
            ) : (
              <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm">
                CC
              </div>
            )}
            <span className="font-bold text-lg hidden sm:block dark:text-white">{siteName}</span>
          </Link>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => {
                if ('caches' in window) {
                  caches.keys().then((names) => {
                    for (let name of names) {
                      caches.delete(name);
                    }
                  }).catch(() => {});
                }
                window.location.reload();
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
              title="Refresh App"
            >
              <RotateCw className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <Link
              href="/notifications"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition relative"
            >
              <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>

            {/* Profile Dropdown */}
            <div className="relative profile-dropdown-container">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0 border border-gray-200 dark:border-gray-700 hover:opacity-90 transition focus:outline-none"
              >
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0)
                )}
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl py-1 z-50 transition-all">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800">
                    <p className="font-semibold text-sm truncate dark:text-white">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                  </div>
                  <Link
                    href={`/profile/${user?.username}`}
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/edit-profile"
                    onClick={() => setDropdownOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Edit Profile
                  </Link>
                  <button
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition md:hidden"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
          </div>
        </div>
      </header>

      <ConstructionBanner />

      <div className="flex flex-1">
        {/* Sidebar - Desktop */}
        <aside className="hidden md:block sticky top-[57px] w-64 h-[calc(100vh-57px)] shrink-0 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 p-4 overflow-y-auto transition-colors">
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Link
              href={`/profile/${user?.username}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                ) : (
                  user?.fullName?.charAt(0)
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate dark:text-white">{user?.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
              </div>
            </Link>

            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-2"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>

        {/* Mobile Sidebar */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl p-4 transition-colors">
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href={`/profile/${user?.username}`}
                  onClick={() => setSidebarOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                    {user?.profilePicture ? (
                      <img src={user.profilePicture} alt="" className="w-full h-full object-cover" />
                    ) : (
                      user?.fullName?.charAt(0)
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate dark:text-white">{user?.fullName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">@{user?.username}</p>
                  </div>
                </Link>

                <button
                  onClick={() => {
                    logout();
                    setSidebarOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition mt-2"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 pb-20 md:pb-0">
          {children}
        </main>
      </div>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 px-2 py-2 z-40 md:hidden transition-colors">
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {navItems.filter(item => ['Home', 'Explore', 'Marketplace', 'Notes Hub', 'Messages'].includes(item.label)).map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 transition ${
                  isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                <item.icon
                  className={`w-6 h-6 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`}
                />
                <span
                  className={`text-[10px] ${
                    isActive ? 'font-semibold text-blue-600 dark:text-blue-400' : 'font-medium text-gray-400 dark:text-gray-500'
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* AI Support Chat Widget */}
      <AIChatWidget />

      {/* Tawk.to Live Chat (enable when ready) */}
      {/* <TawkWidget /> */}
    </div>
  );
}
