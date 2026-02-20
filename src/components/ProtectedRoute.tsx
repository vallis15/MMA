import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireAdmin = false }) => {
  const { user, loading, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Use useEffect for all navigation to avoid React warnings
  useEffect(() => {
    if (loading) {
      console.log('🔵 [PROTECTED ROUTE] Still loading auth state...');
      return; // Don't navigate while loading
    }

    console.log('🔵 [PROTECTED ROUTE] Auth check:', { requireAdmin, isAdmin, hasUser: !!user });

    // Admin-only routes: allow if isAdmin is true, even if user is null
    if (requireAdmin && isAdmin) {
      console.log('✅ [PROTECTED ROUTE] Admin access granted via isAdmin flag');
      return;
    }

    // Not authenticated
    if (!user) {
      console.log('❌ [PROTECTED ROUTE] No user, redirecting to /login');
      navigate('/login', { replace: true });
      return;
    }

    // Admin only - but no isAdmin flag
    if (requireAdmin && !isAdmin) {
      console.log('❌ [PROTECTED ROUTE] Admin required but isAdmin=' + isAdmin + ', redirecting to /');
      navigate('/', { replace: true });
      return;
    }

    console.log('✅ [PROTECTED ROUTE] Access allowed, rendering children');
  }, [user, loading, isAdmin, requireAdmin, navigate]);

  // Loading state
  if (loading) {
    return <LoadingScreen message="Initializing your fighter profile..." />;
  }

  // Admin-only routes: allow if isAdmin is true, even if user is null
  if (requireAdmin && isAdmin) {
    return <>{children}</>;
  }

  // Not authenticated and not admin - show loading while redirecting
  if (!user) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  // Admin required but no isAdmin flag - show loading while redirecting
  if (requireAdmin && !isAdmin) {
    return <LoadingScreen message="Access denied. Redirecting..." />;
  }

  return <>{children}</>;
};
