import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Landing from './pages/Landing';
import Console from './pages/Console';
import Login from './pages/auth/Login';
import MFA from './pages/auth/MFA';
import Invite from './pages/auth/Invite';
import PagePreview from './pages/PagePreview';
import SignInPage from './pages/generated/sign_in_page';

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/signin" element={<SignInPage />} />

      {/* Console routes - AppShell handles internal navigation */}
      <Route path="/console" element={<Console />} />
      <Route path="/console/:pageId" element={<Console />} />
      <Route path="/console/:pageId/:subPageId" element={<Console />} />

      {/* Standalone access/onboarding flows */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/mfa" element={<MFA />} />
      <Route path="/auth/invite" element={<Invite />} />
      <Route path="/auth/invite/:token" element={<Invite />} />

      {/* QA: preview any generated page without the AppShell */}
      <Route path="/pages/:id" element={<PagePreview />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

