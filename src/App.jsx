import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import DashboardPage from './pages/DashboardPage';
import TeachersPage from './pages/TeachersPage';
import TeacherFormPage from './pages/TeacherFormPage';
import ViewTeacherPage from './pages/ViewTeacherPage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import LeaveFormPage from './pages/LeaveFormPage';
import ProfilePage from './pages/ProfilePage';
import ReportsPage from './pages/ReportsPage'; // Import the ReportsPage
import MainLayout from './components/Layout/MainLayout';

// Simple ProtectedRoute component
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

import { Box, CircularProgress } from '@mui/material';


function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

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
            <Route path="/reports" element={<ReportsPage />} /> {/* Add ReportsPage route */}

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
