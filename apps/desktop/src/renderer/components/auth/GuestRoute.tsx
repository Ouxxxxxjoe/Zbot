import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useAuth } from '@/contexts/AuthContext';

export function GuestRoute() {
  const { mode, isInitializing, enterLocalMode } = useAuth();

  useEffect(() => {
    if (isInitializing || mode !== 'signed-out' || !enterLocalMode) return;
    void enterLocalMode();
  }, [enterLocalMode, isInitializing, mode]);

  if (isInitializing || mode === 'signed-out') return null;
  if (mode === 'cloud' || mode === 'local') return <Navigate to="/" replace />;
  return <Outlet />;
}
