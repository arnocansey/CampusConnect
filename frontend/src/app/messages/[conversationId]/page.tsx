"use client";

import { ChatPage } from '@/screens/ChatPage';
import { ProtectedRoute } from '@/components/layout/RouteProtection';

export default function Page() {
  return (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  );
}
