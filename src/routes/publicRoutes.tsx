import React from 'react';
import { RouteObject } from 'react-router-dom';

import Landing from '../pages/Landing';
import SignInPage from '../pages/generated/sign_in_page';
import { ROUTES } from './paths';

/**
 * Public routes - accessible without authentication
 */
export const publicRoutes: RouteObject[] = [
    {
        path: ROUTES.HOME,
        element: React.createElement(Landing),
    },
    {
        path: ROUTES.SIGNIN,
        element: React.createElement(SignInPage),
    },
];
