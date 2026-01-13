import React from 'react';
import { RouteObject } from 'react-router-dom';

import Login from '../pages/auth/Login';
import MFA from '../pages/auth/MFA';
import Invite from '../pages/auth/Invite';
import { ROUTES } from './paths';

/**
 * Authentication routes - login, MFA, invite flows
 */
export const authRoutes: RouteObject[] = [
    {
        path: ROUTES.AUTH.LOGIN,
        element: React.createElement(Login),
    },
    {
        path: ROUTES.AUTH.MFA,
        element: React.createElement(MFA),
    },
    {
        path: ROUTES.AUTH.INVITE,
        element: React.createElement(Invite),
    },
    {
        path: ROUTES.AUTH.INVITE_TOKEN,
        element: React.createElement(Invite),
    },
];
