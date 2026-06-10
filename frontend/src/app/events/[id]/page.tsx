"use client";

import { EventDetailPage } from '@/screens/EventDetailPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <EventDetailPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
