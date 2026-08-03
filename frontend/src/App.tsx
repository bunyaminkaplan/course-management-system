import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ForumPage from './pages/ForumPage';
import ThreadPage from './pages/ThreadPage';
import LogsPage from './pages/LogsPage';

// Route guards to protect pages
const ProtectedRoute: React.FC<{ children: React.ReactNode; allowedRoles?: string[] }> = ({ 
  children, 
  allowedRoles 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Dynamic dashboard loader based on user role at root path
const RoleDashboardLoader: React.FC = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  switch (user.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'INSTRUCTOR':
      return <InstructorDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Main Dashboard Root */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <RoleDashboardLoader />
                </ProtectedRoute>
              } 
            />

            {/* Student Sub-routes */}
            <Route 
              path="/assignments" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/attendance" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/practice-exams" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT']}>
                  <StudentDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Instructor Sub-routes */}
            <Route 
              path="/instructor-sessions" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor-assignments" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/instructor-practice-exams" 
              element={
                <ProtectedRoute allowedRoles={['INSTRUCTOR']}>
                  <InstructorDashboard />
                </ProtectedRoute>
              } 
            />

            {/* Forum Sub-routes */}
            <Route 
              path="/forum" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR']}>
                  <ForumPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/forum/thread/:id" 
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'INSTRUCTOR']}>
                  <ThreadPage />
                </ProtectedRoute>
              } 
            />

            {/* Admin Sub-routes */}
            <Route 
              path="/admin-classrooms" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-schedule" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin-logs" 
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <LogsPage />
                </ProtectedRoute>
              } 
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
