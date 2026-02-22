import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components';
import { Dashboard, Gym, Arena, Rankings, Registration, Login, AdminLogin } from './pages';
import { FighterProvider } from './context/FighterContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { NotificationCenter } from './components/NotificationCenter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { useState } from 'react';
import './index.css';

function AppContent() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/register" element={<Registration />} />
      <Route path="/login" element={<Login />} />
      <Route path="/admin-login" element={<AdminLogin />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              <Dashboard />
            </Layout>
            <NotificationCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/gym"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              <Gym />
            </Layout>
            <NotificationCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/arena"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              <Arena />
            </Layout>
            <NotificationCenter />
          </ProtectedRoute>
        }
      />
      <Route
        path="/rankings"
        element={
          <ProtectedRoute>
            <Layout activeTab={activeTab} onTabChange={setActiveTab}>
              <Rankings />
            </Layout>
            <NotificationCenter />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes */}
      <Route
        path="/admin-vallis"
        element={
          <ProtectedRoute requireAdmin>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <FighterProvider>
              <AppContent />
            </FighterProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
