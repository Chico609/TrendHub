/**
 * @file src/App.tsx
 * @description TrendHub - Main application entry point
 * Social network for trends and creative challenges
 * Implements: Auth, Feed, Communities (CRUD), Posts, Chat, Profiles, Dark/Light Mode
 *
 * Stack: Vite + React + TypeScript + Tailwind CSS + Supabase + Shadcn/ui
 * @author TrendHub Engineering
 * @version 1.0.0
 */

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/components/ui/toast";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Layout } from "@/components/Layout";

// Auth pages
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ForgotPasswordPage from "@/pages/auth/ForgotPasswordPage";

// App pages
import FeedPage from "@/pages/FeedPage";
import ExplorePage from "@/pages/ExplorePage";
import CommunitiesPage from "@/pages/CommunitiesPage";
import CommunityDetailPage from "@/pages/CommunityDetailPage";
import ChatPage from "@/pages/ChatPage";
import NotificationsPage from "@/pages/NotificationsPage";
import NewPostPage from "@/pages/NewPostPage";
import ProfilePage from "@/pages/ProfilePage";

/**
 * AppLayout wraps authenticated pages with the main Layout component
 */
function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <Layout>{children}</Layout>
    </ProtectedRoute>
  );
}

/**
 * Root application component with complete routing structure
 */
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected routes — all wrapped with ProtectedRoute + Layout */}
            <Route
              path="/feed"
              element={
                <AppLayout>
                  <FeedPage />
                </AppLayout>
              }
            />
            <Route
              path="/explore"
              element={
                <AppLayout>
                  <ExplorePage />
                </AppLayout>
              }
            />
            <Route
              path="/communities"
              element={
                <AppLayout>
                  <CommunitiesPage />
                </AppLayout>
              }
            />
            <Route
              path="/communities/:id"
              element={
                <AppLayout>
                  <CommunityDetailPage />
                </AppLayout>
              }
            />
            <Route
              path="/chat"
              element={
                <AppLayout>
                  <ChatPage />
                </AppLayout>
              }
            />
            <Route
              path="/notifications"
              element={
                <AppLayout>
                  <NotificationsPage />
                </AppLayout>
              }
            />
            <Route
              path="/post/new"
              element={
                <AppLayout>
                  <NewPostPage />
                </AppLayout>
              }
            />
            {/* Own profile */}
            <Route
              path="/profile"
              element={
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              }
            />
            {/* Other user profile */}
            <Route
              path="/user/:userId"
              element={
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              }
            />

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/feed" replace />} />
            <Route path="*" element={<Navigate to="/feed" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
