// ============================================================
// App.js - Root Component with Routing
// ============================================================

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './assets/css/global.css';

import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

// Pages
import LoginPage       from './pages/LoginPage';
import SignupPage      from './pages/SignupPage';
import DashboardPage   from './pages/DashboardPage';
import ResumePage      from './pages/ResumePage';
import ChatbotPage     from './pages/ChatbotPage';
import InterviewPage   from './pages/InterviewPage';
import InternshipPage  from './pages/InternshipPage';
import SkillGapPage    from './pages/SkillGapPage';
import ProfilePage     from './pages/ProfilePage';
import AdminPage       from './pages/AdminPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import NotFoundPage       from './pages/NotFoundPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';

// Layout
import AppLayout from './components/Common/AppLayout';

// ─── Protected Route ─────────────────────────────────────
function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Public Route (redirect if logged in) ────────────────
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="flex-center" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── Routes ──────────────────────────────────────────────
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/signup"          element={<PublicRoute><SignupPage /></PublicRoute>} />
      <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
      <Route path="/reset-password"  element={<ResetPasswordPage />} />
      <Route path="/"                element={<Navigate to="/dashboard" replace />} />

      {/* Protected (inside App Layout) */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard"   element={<DashboardPage />} />
        <Route path="/resume"      element={<ResumePage />} />
        <Route path="/chatbot"     element={<ChatbotPage />} />
        <Route path="/interview"   element={<InterviewPage />} />
        <Route path="/internships" element={<InternshipPage />} />
        <Route path="/skill-gap"   element={<SkillGapPage />} />
        <Route path="/profile"     element={<ProfilePage />} />
        <Route path="/admin"       element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        } />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// ─── Root App ─────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <ToastContainer
            position="top-right"
            autoClose={3500}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss={false}
            pauseOnHover
            theme="colored"
          />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}