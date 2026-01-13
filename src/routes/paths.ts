/**
 * Centralized Route Path Constants
 * Single source of truth for all URL paths in the application
 */

export const ROUTES = {
    // Public routes
    HOME: '/',
    SIGNIN: '/signin',

    // Auth routes
    AUTH: {
        ROOT: '/auth',
        LOGIN: '/auth/login',
        MFA: '/auth/mfa',
        INVITE: '/auth/invite',
        INVITE_TOKEN: '/auth/invite/:token',
    },

    // Console routes - main dashboard area
    CONSOLE: {
        ROOT: '/console',
        DASHBOARD: '/console/dashboard',
        NOTIFICATIONS: '/console/notifications_activity',
        COMMAND_CENTER: '/console/command_center',
        ORG_SETUP: '/console/org_setup',
        MODULES: '/console/modules_enablement',
        USERS: '/console/users',
        GROUPS: '/console/groups',
        ROLES: '/console/roles_permissions',
        POLICIES: '/console/policies',
        APPROVAL_WORKFLOWS: '/console/approval_workflows',
        APPROVALS_INBOX: '/console/approvals_inbox',
        BUDGETS: '/console/budgets',
        WALLET_BILLING: '/console/wallet_billing',
        BILLING_SETUP: '/console/billing_setup',
        INVOICES: '/console/invoices',
        COLLECTIONS: '/console/collections',
        RECONCILIATION: '/console/reconciliation',
        VENDORS: '/console/vendors',
        RFQ: '/console/rfq',
        FULFILLMENT: '/console/fulfillment',
        TRAVEL: '/console/travel',
        REPORTING: '/console/reporting',
        ESG: '/console/esg',
        INTEGRATIONS: '/console/integrations',
        SECURITY: '/console/security',
        SUPPORT_TOOLS: '/console/support_tools',
        SETTINGS: '/console/settings_hub',
        EV_CHARGING: '/console/ev_charging',
    },

    // QA/Preview routes
    PAGES_PREVIEW: '/pages/:id',
} as const;

// Helper to build console route with page ID
export const getConsoleRoute = (pageId: string, subPageId?: string): string => {
    if (subPageId) {
        return `${ROUTES.CONSOLE.ROOT}/${pageId}/${subPageId}`;
    }
    return `${ROUTES.CONSOLE.ROOT}/${pageId}`;
};

// Helper to build invite route with token
export const getInviteRoute = (token: string): string => {
    return `/auth/invite/${token}`;
};

// Helper to build preview route
export const getPreviewRoute = (id: string): string => {
    return `/pages/${id}`;
};
