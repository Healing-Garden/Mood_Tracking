import { createBrowserRouter } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/login/LoginPage';
import RegisterPage from '../pages/register/RegisterPage';
import ForgotPasswordPage from '../pages/forgot-password/ForgotPasswordPage';
import OnboardingPage from '../pages/user/OnboardingPage';
import DashboardPage from '../pages/user/DashboardPage';
import JournalPage from '../pages/journal/JournalPage';
import AnalyticsPage from '../pages/analytics/AnalyticsPage';
import ProfilePage from '../pages/user/ProfilePage';
import AdminDashboard from '../pages/admin/AdminDashboard';
import AdminProfilePage from '../pages/admin/AdminProfilePage';

const routes = [
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
  },
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },
  {
    path: '/app',
    element: <AppLayout />,
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'journal',
        element: <JournalPage />,
      },
      {
        path: 'analytics',
        element: <AnalyticsPage />,
      },
      {
        path: 'profile',
        element: <ProfilePage />,
      },
    ],
  },
  {
    path: '/admin',
    element: <AppLayout isAdmin />,
    children: [
      {
        path: 'dashboard',
        element: <AdminDashboard />,
      },
      {
        path: 'profile',
        element: <AdminProfilePage />,
      },
    ],
  },
] 

export const router = createBrowserRouter(routes);