import React from 'react';
import { RouteObject } from 'react-router-dom';

import Console from '../pages/Console';
import PagePreview from '../pages/PagePreview';
import { ROUTES } from './paths';

/**
 * Console routes - main dashboard area with dynamic page loading
 */
export const consoleRoutes: RouteObject[] = [
    {
        path: ROUTES.CONSOLE.ROOT,
        element: React.createElement(Console),
    },
    {
        path: `${ROUTES.CONSOLE.ROOT}/:pageId`,
        element: React.createElement(Console),
    },
    {
        path: `${ROUTES.CONSOLE.ROOT}/:pageId/:subPageId`,
        element: React.createElement(Console),
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
