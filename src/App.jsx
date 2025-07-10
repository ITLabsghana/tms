import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import TeachersPage from './pages/TeachersPage';
import TeacherFormPage from './pages/TeacherFormPage';
import ViewTeacherPage from './pages/ViewTeacherPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import LeaveFormPage from './pages/LeaveFormPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage';
// UserManagementPage import removed
import MainLayout from './components/Layout/MainLayout';
import { Box, CircularProgress } from '@mui/material';

// AdminRoute component - Will be removed if not used by any other route
// For now, let's assume it might be used later, so we keep it, but the /admin/users route is gone.
// If no other admin routes are planned, we can remove AdminRoute as well.
const AdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (profile?.role !== 'admin') {
    return <Navigate to="/dashboard" replace state={{ error: "Access Denied" }} />;
  }
  return children;
};


// Simple ProtectedRoute component (remains the same)
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><CircularProgress /></Box>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/teachers/add" element={<TeacherFormPage />} />
            <Route path="/teachers/edit/:id" element={<TeacherFormPage />} />
            <Route path="/teachers/view/:id" element={<ViewTeacherPage />} />
            <Route path="/leave" element={<LeaveManagementPage />} />
            <Route path="/leave/add" element={<LeaveFormPage />} />
            <Route path="/leave/edit/:id" element={<LeaveFormPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/reports" element={<ReportsPage />} />

            {/* <Route path="/admin/users" element={<AdminRoute><UserManagementPage /></AdminRoute>} /> Removed User Management Route */}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
