import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/login/LoginPage";
import RegisterPage from "../pages/auth/register/RegisterPage";
import ForgotPasswordPage from "../pages/auth/forgot-password/ForgotPasswordPage";
import UserDashboardPage from "../pages/user/dashboard/UserDashboardPage";
import JournalPage from "../pages/user/journal/JournalPage";
import AnalyticsPage from "../pages/user/analytics/AnalyticsPage";
import UserProfilePage from "../pages/user/profile/UserProfilePage";
import SettingsPage from "../pages/user/setting/Setting";
import Step1 from "../pages/user/onboarding/Step1";
import Step2 from "../pages/user/onboarding/Step2";
import Step3 from "../pages/user/onboarding/Step3";
import NotificationsPage from "../pages/user/notifications/NotificationPage";
import ChatBot from "../pages/user/ai-partner/ChatBot";
import FeedbackPage from "../pages/user/feedback/FeedbackPage";
import AdminDashboardPage from "../pages/admin/dashboard/AdminDashboardPage";
import AdminProfilePage from "../pages/admin/profile/AdminProfilePage";
import AdminSetupPinPage from "../pages/admin/setup-pin/AdminSetupPinPage";
import AdminVerifyPinPage from "../pages/admin/verify-pin/AdminVerifyPinPage";
import AnalyticPage from "../pages/admin/analytics/AnalyticsPage";
import HealingContentPage from "../pages/admin/healing/HealingContentPage";
import AdminUserList from "../pages/admin/users/AdminUserList";
import ProtectedRoute from "./ProtectedRoute";

const routes = [
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPasswordPage />,
  },
  {
    path: "/onboarding/step-1",
    element: (
      <ProtectedRoute role="user">
        <Step1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/step-2",
    element: (
      <ProtectedRoute role="user">
        <Step2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/step-3",
    element: (
      <ProtectedRoute role="user">
        <Step3 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/dashboard",
    element: (
      <ProtectedRoute role="user">
        <UserDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/journal",
    element: (
      <ProtectedRoute role="user">
        <JournalPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/analytics",
    element: (
      <ProtectedRoute role="user">
        <AnalyticsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/notifications",
    element: <NotificationsPage />,
  },
  {
    path: "/user/ai-partner",
    element: <ChatBot />,
  },
  {
    path: "/user/feedback",
    element: (
      <ProtectedRoute role="user">
        <FeedbackPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/user/profile",
    element: <UserProfilePage />,
  },
  {
    path: "/user/settings",
    element: (
      <ProtectedRoute role="user">
        <SettingsPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/setup-pin",
    element: <AdminSetupPinPage />,
  },
  {
    path: "/admin/verify-pin",
    element: <AdminVerifyPinPage />,
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute role="admin">
        <AdminDashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/healing-content",
    element: (
      <ProtectedRoute role="admin">
        <HealingContentPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/profile",
    element: <AdminProfilePage />,
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute role="admin">
        <AnalyticPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <ProtectedRoute role="admin">
        <AdminUserList />
      </ProtectedRoute>
    ),
  },
];

export const router = createBrowserRouter(routes);
