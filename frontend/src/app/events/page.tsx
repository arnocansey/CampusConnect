"use client";

import { EventsPage } from '@/screens/EventsPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';
import { MainLayout } from '@/components/layout/MainLayout';

export default function Page() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <EventsPage />
      </MainLayout>
    </ProtectedRoute>
  );
}
