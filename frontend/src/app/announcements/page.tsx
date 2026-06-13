"use client";

import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';
import { AnnouncementsPage } from '@/screens/AnnouncementsPage';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <AnnouncementsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
