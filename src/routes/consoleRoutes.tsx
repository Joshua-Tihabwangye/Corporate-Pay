import React from 'react';
import { RouteObject } from 'react-router-dom';

import Console from '../pages/Console';
import PagePreview from '../pages/PagePreview';
import { ROUTES } from './paths';
import ProtectedRoute from '../components/ProtectedRoute';
import WalletSwitcher from '../pages/generated/corporate_pay_wallet_switcher';
import AccessRequest from '../pages/generated/corporate_pay_access_request';
import EntityManager from '../pages/generated/corporate_pay_entity_manager';
import KYBManager from '../pages/generated/corporate_pay_kyb_manager';
import ModuleManager from '../pages/generated/corporate_pay_module_manager';
import ModuleSettings from '../pages/generated/corporate_pay_module_settings';
import GoLiveChecklist from '../pages/generated/corporate_pay_go_live_checklist';
import CorpayIssuedBudgets from '../pages/generated/corporate_pay_issued_budgets';

import OrganizationProfileSetup from '../pages/generated/corporate_pay_organization_profile_setup';
import UsersInvitations from '../pages/generated/corporate_pay_users_invitations';
import GroupsCostCenters from '../pages/generated/corporate_pay_groups_cost_centers';
import RolesPermissions from '../pages/generated/corporate_pay_roles_permissions_governance';
import PolicyBuilder from '../pages/generated/corporate_pay_policy_builder_rides_services';
import ApprovalWorkflow from '../pages/generated/corporate_pay_approval_workflow';
import Budgets from '../pages/generated/corporate_pay_budgets_spend_limits_controls';
import BillingSetup from '../pages/generated/corporate_pay_billing_setup_invoice';
import Reporting from '../pages/generated/corporate_pay_reporting_analytics';
import Sustainability from '../pages/generated/corporate_pay_sustainability_reporting';
import Integrations from '../pages/generated/corporate_pay_integrations_developer_center';
import Security from '../pages/generated/corporate_pay_security_audit_compliance';
import SupportTools from '../pages/generated/corporate_pay__support_admin_tool';
import AdminSettings from '../pages/generated/corporate_pay_admin_settings';

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
    {
        path: "/console/wallet-switch",
        element: <ProtectedRoute><WalletSwitcher /></ProtectedRoute>,
    },
    {
        path: "/console/access-request",
        element: <ProtectedRoute><AccessRequest /></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/entities",
        element: <ProtectedRoute><EntityManager /></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/kyb",
        element: <ProtectedRoute><KYBManager /></ProtectedRoute>,
    },
    {
        path: "/console/settings/modules",
        element: <ProtectedRoute><ModuleManager /></ProtectedRoute>,
    },
    {
        path: "/console/settings/modules/:moduleId",
        element: <ProtectedRoute><ModuleSettings /></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/go-live",
        element: <ProtectedRoute><GoLiveChecklist /></ProtectedRoute>,
    },
    {
        path: "/console/admin",
        element: <ProtectedRoute><AdminSettings /></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/setup",
        element: <ProtectedRoute><OrganizationProfileSetup /></ProtectedRoute>,
    },
    {
        path: "/console/settings/users",
        element: <ProtectedRoute><UsersInvitations /></ProtectedRoute>,
    },
    {
        path: "/console/settings/groups",
        element: <ProtectedRoute><GroupsCostCenters /></ProtectedRoute>,
    },
    {
        path: "/console/settings/roles",
        element: <ProtectedRoute><RolesPermissions /></ProtectedRoute>,
    },
    {
        path: "/console/settings/policies",
        element: <ProtectedRoute><PolicyBuilder /></ProtectedRoute>,
    },
    {
        path: "/console/settings/approvals/workflows",
        element: <ProtectedRoute><ApprovalWorkflow /></ProtectedRoute>,
    },
    {
        path: "/console/settings/budgets",
        element: <ProtectedRoute><Budgets /></ProtectedRoute>,
    },
    {
        path: "/console/settings/budgets-issued",
        element: <ProtectedRoute><CorpayIssuedBudgets /></ProtectedRoute>,
    },
    {
        path: "/console/settings/billing",
        element: <ProtectedRoute><BillingSetup /></ProtectedRoute>,
    },
    {
        path: "/console/reports",
        element: <ProtectedRoute><Reporting /></ProtectedRoute>,
    },
    {
        path: "/console/reports/esg",
        element: <ProtectedRoute><Sustainability /></ProtectedRoute>,
    },
    {
        path: "/console/settings/integrations",
        element: <ProtectedRoute><Integrations /></ProtectedRoute>,
    },
    {
        path: "/console/settings/security",
        element: <ProtectedRoute><Security /></ProtectedRoute>,
    },
    {
        path: "/console/settings/support-tools",
        element: <ProtectedRoute><SupportTools /></ProtectedRoute>,
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
