"use client";
import Link from 'next/link';
import { Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="text-8xl font-bold text-blue-600 mb-4">404</div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Page not found</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          Sorry, we couldn't find the page you're looking for.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go back
          </Button>
          <Link href="/">
            <Button>
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
