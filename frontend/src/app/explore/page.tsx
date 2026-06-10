"use client";

import { ExplorePage } from '@/screens/ExplorePage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <ExplorePage />
      </MainLayout>
    </ProtectedRoute>
  );
}
