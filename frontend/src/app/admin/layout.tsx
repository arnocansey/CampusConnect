"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ShoppingBag,
  BookOpen,
  UsersRound,
  Building,
  Briefcase,
  CalendarDays,
  BarChart3,
  Shield,
  FileText,
  Megaphone,
  Settings,
  Menu,
  X,
  LogOut,
  ChevronLeft,
} from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/universities', icon: GraduationCap, label: 'Universities' },
  { path: '/admin/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { path: '/admin/notes', icon: BookOpen, label: 'Notes' },
  { path: '/admin/groups', icon: UsersRound, label: 'Groups' },
  { path: '/admin/hostels', icon: Building, label: 'Hostels' },
  { path: '/admin/jobs', icon: Briefcase, label: 'Jobs' },
  { path: '/admin/events', icon: CalendarDays, label: 'Events' },
  { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { path: '/admin/security', icon: Shield, label: 'Security' },
  { path: '/admin/audit', icon: FileText, label: 'Audit' },
  { path: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!loading && !isLoginPage && (!user || user.role !== 'ADMIN')) {
      router.replace('/admin/login');
    }
  }, [user, loading, isLoginPage, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (loading || !user || user.role !== 'ADMIN') {
    return <LoadingSpinner />;
  }

  const isActive = (item: (typeof navItems)[number]) => {
    if (item.exact) return pathname === item.path;
    return pathname === item.path || pathname.startsWith(item.path + '/');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-gray-100 dark:border-gray-800">
        <Link href="/admin" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-bg flex items-center justify-center text-white font-bold text-sm">
            AH
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm dark:text-white">UniHub Admin</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500">Management Panel</p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              href={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition ${
                active
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'
              }`}
            >
              <item.icon className={`w-[18px] h-[18px] shrink-0 ${active ? 'text-blue-600 dark:text-blue-400' : ''}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <Link
          href="/feed"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
        >
          <ChevronLeft className="w-[18px] h-[18px] shrink-0" />
          <span>Back to Site</span>
        </Link>

        <div className="flex items-center gap-3 px-3 py-2.5 mt-1">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
            {user?.fullName?.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-xs truncate dark:text-white">{user?.fullName}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:flex-col fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-900 border-r border-gray-100 dark:border-gray-800 z-40 transition-colors">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-72 bg-white dark:bg-gray-900 shadow-2xl transition-colors">
            <button
              onClick={() => setSidebarOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
            <SidebarContent />
          </div>
        </div>
      )}

      {/* Top Bar - Mobile */}
      <div className="md:hidden sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 flex items-center justify-between transition-colors">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg gradient-bg flex items-center justify-center text-white font-bold text-[10px]">
            AH
          </div>
          <span className="font-bold text-sm dark:text-white">Admin</span>
        </div>
        <div className="w-9" />
      </div>

      {/* Main Content */}
      <main className="md:ml-64 min-h-screen transition-colors">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
