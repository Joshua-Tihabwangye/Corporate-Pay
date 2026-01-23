import React from 'react';
import { RouteObject } from 'react-router-dom';

import Console from '../pages/Console';
import PagePreview from '../pages/PagePreview';
import { ROUTES } from './paths';
import ProtectedRoute from '../components/ProtectedRoute';

/**
 * Console routes - main dashboard area with dynamic page loading
 */
export const consoleRoutes: RouteObject[] = [
    {
        path: ROUTES.CONSOLE.ROOT,
        element: <ProtectedRoute>{React.createElement(Console)}</ProtectedRoute>,
    },
    {
        path: `${ROUTES.CONSOLE.ROOT}/:pageId`,
        element: <ProtectedRoute>{React.createElement(Console)}</ProtectedRoute>,
    },
    {
        path: `${ROUTES.CONSOLE.ROOT}/:pageId/:subPageId`,
        element: <ProtectedRoute>{React.createElement(Console)}</ProtectedRoute>,
    },
];

/**
 * Preview routes - QA access to generated pages without AppShell
 */
export const previewRoutes: RouteObject[] = [
    {
        path: ROUTES.PAGES_PREVIEW,
        element: React.createElement(PagePreview),
    },
];
