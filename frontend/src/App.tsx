import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { useSaaSStore, applyTheme } from "./store";
import { apiClient } from "./api/apiClient";

import DashboardPage from "./pages/DashboardPage";
import ProjectsPage from "./pages/ProjectsPage";
import TasksPage from "./pages/TasksPage";
import TeamPage from "./pages/TeamPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";

import AppLayout from "./components/layout/AppLayout";
import RequireAuth from "./components/auth/RequireAuth";
import ToastStack from "./components/ui/ToastStack";
import CommandPalette from "./components/ui/CommandPalette";
import { AuthLayout, LoginPage, RegisterPage } from "./components/auth/AuthPages";

export default function App() {
  const authenticatedUser = useSaaSStore((s) => s.user);
  const theme = useSaaSStore((s) => s.theme);
  const userId = authenticatedUser?.id;
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);
  useEffect(() => {
    useSaaSStore.getState().initializeAuth();
  }, []);
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    apiClient("/api/notifications")
      .then((data: any) => {
        if (!cancelled) useSaaSStore.getState().setNotifications(data.notifications ?? []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!authenticatedUser) {
    return (
      <div className="min-h-screen bg-[var(--main-bg)] text-[var(--text)]">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth" element={<AuthLayout />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <ToastStack />
      </div>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/dashboard" element={<RequireAuth protectedContent={<DashboardPage />} />} />
        <Route path="/projects" element={<RequireAuth protectedContent={<ProjectsPage />} />} />
        <Route path="/tasks" element={<RequireAuth protectedContent={<TasksPage />} />} />
        <Route path="/team" element={<RequireAuth protectedContent={<TeamPage />} />} />
        <Route path="/analytics" element={<RequireAuth protectedContent={<AnalyticsPage />} />} />
        <Route path="/notifications" element={<RequireAuth protectedContent={<NotificationsPage />} />} />
        <Route path="/settings" element={<RequireAuth protectedContent={<SettingsPage />} />} />
        <Route path="/login" element={<Navigate to="/dashboard" replace />} />
        <Route path="/register" element={<Navigate to="/dashboard" replace />} />
        <Route path="/auth" element={<Navigate to="/dashboard" replace />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
      <CommandPalette />
      <ToastStack />
    </AppLayout>
  );
}
