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
import GroupMembers from '../pages/generated/corporate_pay_group_members';
import CostCenterEdit from '../pages/generated/corporate_pay_cost_center_edit';
import Simulation from '../pages/generated/corporate_pay_simulation';

import OrganizationProfileSetup from '../pages/generated/corporate_pay_organization_profile_setup';
import UsersInvitations from '../pages/generated/corporate_pay_users_invitations';
import UserProfileDetail from '../pages/generated/corporate_pay_user_profile_detail';
import UserEditProfile from '../pages/generated/corporate_pay_user_edit_profile';
import UserSecuritySettings from '../pages/generated/corporate_pay_user_security_settings';
import UserPermissionsEdit from '../pages/generated/corporate_pay_user_permissions_edit';
import UserActivityLog from '../pages/generated/corporate_pay_user_activity_log';
import RoleEdit from '../pages/generated/corporate_pay_role_edit';
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
import SecurityAuditDetail from '../pages/generated/corporate_pay_security_audit_detail';
import SecurityDeviceDetail from '../pages/generated/corporate_pay_security_device_detail';
import SecurityLoginDetail from '../pages/generated/corporate_pay_security_login_detail';
import SecurityKeyDetail from '../pages/generated/corporate_pay_security_key_detail';
import SecurityForensicsDetail from '../pages/generated/corporate_pay_security_forensics_detail';
import PolicyEdit from '../pages/generated/corporate_pay_policy_edit';
import PolicyScenarios from '../pages/generated/corporate_pay_policy_scenarios';
import ReceiptDrawer from '../pages/generated/corporate_pay_receipt_drawer';

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
        element: <ProtectedRoute><Console><WalletSwitcher /></Console></ProtectedRoute>,
    },
    {
        path: "/console/access-request",
        element: <ProtectedRoute><Console><AccessRequest /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/entities",
        element: <ProtectedRoute><Console><EntityManager /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/kyb",
        element: <ProtectedRoute><Console><KYBManager /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/modules",
        element: <ProtectedRoute><Console><ModuleManager /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/modules/:moduleId",
        element: <ProtectedRoute><Console><ModuleSettings /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/go-live",
        element: <ProtectedRoute><Console><GoLiveChecklist /></Console></ProtectedRoute>,
    },
    {
        path: "/console/admin",
        element: <ProtectedRoute><Console><AdminSettings /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/simulate",
        element: <ProtectedRoute><Console><Simulation /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/org/setup",
        element: <ProtectedRoute><Console><OrganizationProfileSetup /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/users",
        element: <ProtectedRoute><Console><UsersInvitations /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users",
        element: <ProtectedRoute><Console><UsersInvitations /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users/:userId",
        element: <ProtectedRoute><Console><UserProfileDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users/:userId/edit",
        element: <ProtectedRoute><Console><UserEditProfile /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users/:userId/security",
        element: <ProtectedRoute><Console><UserSecuritySettings /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users/:userId/permissions",
        element: <ProtectedRoute><Console><UserPermissionsEdit /></Console></ProtectedRoute>,
    },
    {
        path: "/console/users/:userId/activity",
        element: <ProtectedRoute><Console><UserActivityLog /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/groups",
        element: <ProtectedRoute><Console><GroupsCostCenters /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/groups/:groupId/members",
        element: <ProtectedRoute><Console><GroupMembers /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/groups/cost-centers/:costCenterId/edit",
        element: <ProtectedRoute><Console><CostCenterEdit /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/roles",
        element: <ProtectedRoute><Console><RolesPermissions /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/roles/:roleName/edit",
        element: <ProtectedRoute><Console><RoleEdit /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/policies",
        element: <ProtectedRoute><Console><PolicyBuilder /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/policies/:policyId/edit",
        element: <ProtectedRoute><Console><PolicyEdit /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/policies/scenarios",
        element: <ProtectedRoute><Console><PolicyScenarios /></Console></ProtectedRoute>,
    },
    {
        path: "/console/receipt/:id",
        element: <ProtectedRoute><Console><ReceiptDrawer /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/approvals/workflows",
        element: <ProtectedRoute><Console><ApprovalWorkflow /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/budgets",
        element: <ProtectedRoute><Console><Budgets /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/budgets-issued",
        element: <ProtectedRoute><Console><CorpayIssuedBudgets /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/billing",
        element: <ProtectedRoute><Console><BillingSetup /></Console></ProtectedRoute>,
    },
    {
        path: "/console/reports",
        element: <ProtectedRoute><Console><Reporting /></Console></ProtectedRoute>,
    },
    {
        path: "/console/reports/esg",
        element: <ProtectedRoute><Console><Sustainability /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/integrations",
        element: <ProtectedRoute><Console><Integrations /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security",
        element: <ProtectedRoute><Console><Security /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security/audit/:id",
        element: <ProtectedRoute><Console><SecurityAuditDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security/devices/:id",
        element: <ProtectedRoute><Console><SecurityDeviceDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security/logins/:id",
        element: <ProtectedRoute><Console><SecurityLoginDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security/keys/:keyId",
        element: <ProtectedRoute><Console><SecurityKeyDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/security/forensics/:id",
        element: <ProtectedRoute><Console><SecurityForensicsDetail /></Console></ProtectedRoute>,
    },
    {
        path: "/console/settings/support-tools",
        element: <ProtectedRoute><Console><SupportTools /></Console></ProtectedRoute>,
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
