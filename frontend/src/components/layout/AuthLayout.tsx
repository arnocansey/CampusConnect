import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSiteSettings } from '../../hooks/useSiteSettings';

export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { siteName, logoUrl } = useSiteSettings();

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-bg items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-6 overflow-hidden">
            {logoUrl ? (
              <img src={logoUrl} alt={siteName} className="w-full h-full object-contain" />
            ) : (
              <span className="text-3xl font-bold">CC</span>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-4">{siteName}</h1>
          <p className="text-xl text-white/90 mb-8">Learn. Connect. Trade.</p>
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">📚 Notes Hub</p>
              <p className="text-sm text-white/80">Share academic resources</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">🛍️ Marketplace</p>
              <p className="text-sm text-white/80">Buy & sell with classmates</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">👥 Study Groups</p>
              <p className="text-sm text-white/80">Collaborate & learn together</p>
            </div>
            <div className="bg-white/10 rounded-xl p-4">
              <p className="font-semibold">💼 Jobs</p>
              <p className="text-sm text-white/80">Find opportunities</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 relative">
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 dark:bg-gray-900 transition text-xs font-semibold text-gray-700 dark:text-gray-300"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        <div className="w-full max-w-md mt-12 lg:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}
