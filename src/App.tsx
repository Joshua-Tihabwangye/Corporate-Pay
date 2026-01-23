import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import {
  ROUTES,
  publicRoutes,
  authRoutes,
  consoleRoutes,
  previewRoutes
} from './routes';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
      {/* Public routes */}
      {publicRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Console routes - AppShell handles internal navigation */}
      {consoleRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Standalone access/onboarding flows */}
      {authRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* QA: preview any generated page without the AppShell */}
      {previewRoutes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}

      {/* Fallback */}
      <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
    </Routes>
    </AuthProvider>
  );
}
