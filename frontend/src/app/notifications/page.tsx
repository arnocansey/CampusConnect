"use client";

import { NotificationsPage } from '@/screens/NotificationsPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <NotificationsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
