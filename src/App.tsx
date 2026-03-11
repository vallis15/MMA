import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components';
import { Dashboard, Gym, Arena, Rankings, Registration, Login, AdminLogin, FighterProfile, SkillTree, CreateFighter } from './pages';
import { FighterProvider, useFighter } from './context/FighterContext';
import { FightProvider } from './context/FightContext';
import { NotificationProvider } from './context/NotificationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { MusicProvider } from './context/MusicContext';
import { NotificationCenter } from './components/NotificationCenter';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoadingScreen } from './components/LoadingScreen';
import { useState, useEffect, useCallback } from 'react';
import { SplashScreen } from './components/SplashScreen';
import './index.css';

// ─── Character Gate ───────────────────────────────────────────────────────────
// Prevents access to game routes until the character creation flow is complete.

function CharacterGate({ children }: { children: React.ReactNode }) {
  const { fighter, fighterLoading } = useFighter();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // A fighter is considered "created" if:
  //   • has_character is explicitly true (DB flag or visual_config present)
  // If has_character is explicitly FALSE (admin reset), ALWAYS redirect.
  // If has_character is null/undefined (column not in DB yet), fall back to name.
  const hasRealFighter =
    fighter.has_character === true ||
    (
      fighter.has_character == null &&
      fighter.name !== 'Undefined' &&
      fighter.name !== 'Fighter' &&
      fighter.name !== ''
    );

  useEffect(() => {
    if (authLoading || fighterLoading || !user) return;
    if (!hasRealFighter && location.pathname !== '/create-fighter') {
      navigate('/create-fighter', { replace: true });
    }
  }, [hasRealFighter, fighterLoading, authLoading, user, navigate, location.pathname]);

  if (authLoading || fighterLoading) return <LoadingScreen message="Loading fighter..." />;
  if (!user || !hasRealFighter) return null;
  return <>{children}</>;
}

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
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <Dashboard />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/gym"
        element={
          <ProtectedRoute>
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <Gym />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/arena"
        element={
          <ProtectedRoute>
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <Arena />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/rankings"
        element={
          <ProtectedRoute>
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <Rankings />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <FighterProfile />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />

      <Route
        path="/skills"
        element={
          <ProtectedRoute>
            <CharacterGate>
              <Layout activeTab={activeTab} onTabChange={setActiveTab}>
                <SkillTree />
              </Layout>
              <NotificationCenter />
            </CharacterGate>
          </ProtectedRoute>
        }
      />

      {/* Character Creation – bypasses CharacterGate, no Layout sidebar */}
      <Route
        path="/create-fighter"
        element={
          <ProtectedRoute>
            <CreateFighter />
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
  const [loading, setLoading] = useState(true);
  const handleSplashComplete = useCallback(() => setLoading(false), []);

  return (
    <MusicProvider>
      {loading && <SplashScreen onComplete={handleSplashComplete} />}
      <Router>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <FighterProvider>
              <FightProvider>
                <AppContent />
              </FightProvider>
            </FighterProvider>
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
      </Router>
    </MusicProvider>
  );
}

export default App;
