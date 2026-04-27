import { createBrowserRouter, Navigate } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import AuthLayout from '@/layouts/AuthLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import MeetingsListPage from '@/pages/meetings/MeetingsListPage';
import MeetingDetailPage from '@/pages/meetings/MeetingDetailPage';
import CreateMeetingPage from '@/pages/meetings/CreateMeetingPage';
import LiveMeetingPage from '@/pages/meetings/LiveMeetingPage';
import UsersPage from '@/pages/admin/UsersPage';
import AnalyticsPage from '@/pages/admin/AnalyticsPage';
import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { index: true, element: <Navigate to="/dashboard" replace /> },
              { path: 'dashboard', element: <DashboardPage /> },
              { path: 'meetings', element: <MeetingsListPage /> },
              { path: 'meetings/new', element: <CreateMeetingPage /> },
              { path: 'meetings/:id', element: <MeetingDetailPage /> },
              { path: 'meetings/:id/live', element: <LiveMeetingPage /> },
              { path: 'admin/users', element: <UsersPage /> },
              { path: 'admin/analytics', element: <AnalyticsPage /> },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
