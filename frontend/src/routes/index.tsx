import { createBrowserRouter } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/auth/login/LoginPage";
import RegisterPage from "../pages/auth/register/RegisterPage";
import ForgotPasswordPage from "../pages/auth/forgot-password/ForgotPasswordPage";
import UserDashboardPage from "../pages/user/dashboard/UserDashboardPage";
import JournalPage from "../pages/user/journal/JournalPage";
import AnalyticsPage from "../pages/user/analytics/AnalyticsPage";
import UserProfilePage from "../pages/user/profile/UserProfilePage";
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
