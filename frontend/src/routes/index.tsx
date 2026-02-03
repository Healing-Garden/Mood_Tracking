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
import Step4 from "../pages/user/onboarding/Step4";
import Step5 from "../pages/user/onboarding/Step5";
import AdminDashboardPage from "../pages/admin/dashboard/AdminDashboardPage";
import AdminProfilePage from "../pages/admin/profile/AdminProfilePage";
import AdminSetupPinPage from "../pages/admin/setup-pin/AdminSetupPinPage";
import AdminVerifyPinPage from "../pages/admin/verify-pin/AdminVerifyPinPage";
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
    path: "/onboarding/Step1",
    element: (
      <ProtectedRoute role="user">
        <Step1 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/Step2",
    element: (
      <ProtectedRoute role="user">
        <Step2 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/Step3",
    element: (
      <ProtectedRoute role="user">
        <Step3 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/Step4",
    element: (
      <ProtectedRoute role="user">
        <Step4 />
      </ProtectedRoute>
    ),
  },
  {
    path: "/onboarding/Step5",
    element: (
      <ProtectedRoute role="user">
        <Step5 />
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
    element: <JournalPage />,
  },
  {
    path: "/user/analytics",
    element: <AnalyticsPage />,
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
    path: "/admin/profile",
    element: <AdminProfilePage />,
  },
];

export const router = createBrowserRouter(routes);
