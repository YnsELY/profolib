import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import AuthPage from './pages/AuthPage';
import { RequestPage, WaitingPage, SessionPage } from './pages/student';
import { DashboardPage, SessionPage as TeacherSessionPage } from './pages/teacher';
import { AdminLayout, AdminDashboardPage, ValidationsPage, AccountsPage, WalletsPage, RevenuePage } from './pages/admin';

// Redirect authenticated users to their dashboard
const AuthRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (currentUser) {
    // Redirection selon le rôle
    let redirectPath: string;
    switch (currentUser.role) {
      case 'admin':
        redirectPath = '/admin';
        break;
      case 'teacher':
        redirectPath = '/teacher/dashboard';
        break;
      case 'student':
      default:
        redirectPath = '/student/request';
        break;
    }
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public routes - root redirects to auth */}
      <Route path="/" element={<Navigate to="/auth" replace />} />
      <Route
        path="/auth"
        element={
          <AuthRedirect>
            <AuthPage />
          </AuthRedirect>
        }
      />

      {/* Student routes */}
      <Route
        path="/student/request"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <RequestPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/waiting/:requestId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <WaitingPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/session/:requestId"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <SessionPage />
          </ProtectedRoute>
        }
      />

      {/* Teacher routes */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/teacher/session/:requestId"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <TeacherSessionPage />
          </ProtectedRoute>
        }
      />

      {/* Admin routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="validations" element={<ValidationsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="wallets" element={<WalletsPage />} />
        <Route path="revenue" element={<RevenuePage />} />
      </Route>

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
};

export default App;
