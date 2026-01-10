import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Landing from './pages/Landing';
import Console from './pages/Console';
import Login from './pages/auth/Login';
import MFA from './pages/auth/MFA';
import Invite from './pages/auth/Invite';
import PagePreview from './pages/PagePreview';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/console" element={<Console />} />

      {/* Standalone access/onboarding flows (also embedded in the console shell) */}
      <Route path="/auth/login" element={<Login />} />
      <Route path="/auth/mfa" element={<MFA />} />
      <Route path="/auth/invite" element={<Invite />} />

      {/* QA: preview any generated page without the AppShell */}
      <Route path="/pages/:id" element={<PagePreview />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
