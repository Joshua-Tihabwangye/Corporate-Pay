import type { ComponentType } from 'react';

import Dashboard from './generated/corporate_pay_dashboard';
import NotificationsActivity from './generated/corporate_pay_notifications_center';
import CommandCenter from './generated/corporate_pay_global_search';
import OrgSetup from './generated/corporate_pay_organization_profile_setup';
import ModulesEnablement from './generated/corporate_pay_modules_marketplaces';
import UsersInvites from './generated/corporate_pay_users_invitations';
import GroupsCostCenters from './generated/corporate_pay_groups_cost_centers';
import RolesPermissions from './generated/corporate_pay_roles_permissions_governance';
import PolicyBuilder from './generated/corporate_pay_policy_builder_rides_services';
import ApprovalWorkflowBuilder from './generated/corporate_pay_approval_workflow';
import ApprovalsInbox from './generated/corporate_pay_approvals_inbox';
import UserProfileDetail from './generated/corporate_pay_user_profile_detail';
import UserEditProfile from './generated/corporate_pay_user_edit_profile';
import UserSecuritySettings from './generated/corporate_pay_user_security_settings';
import UserPermissionsEdit from './generated/corporate_pay_user_permissions_edit';
import UserActivityLog from './generated/corporate_pay_user_activity_log';
import RoleEdit from './generated/corporate_pay_role_edit';
import Budgets from './generated/corporate_pay_budgets_spend_limits_controls';
import WalletBilling from './generated/corporate_pay_corporate_wallet_credit_line_prepaid_funding';
import BillingSetup from './generated/corporate_pay_billing_setup_invoice';
import InvoicesStatements from './generated/corporate_pay_invoices_statements';
import CollectionsEnforcement from './generated/corporate_pay_collections_reminders';
import TransactionsReconciliation from './generated/corporate_pay_transactions_reconciliation';
import VendorCatalog from './generated/corporate_pay_vendor_catalog_management';
import RFQQuoteRequests from './generated/corporate_pay_quote_requests';
import OrdersFulfillment from './generated/corporate_pay_orders_service_requests';
import CorporateTravel from './generated/corporate_pay_corporate_travel_scheduling';
import ReportingAnalytics from './generated/corporate_pay_reporting_analytics';
import SustainabilityESG from './generated/corporate_pay_sustainability_reporting';
import IntegrationsDeveloperCenter from './generated/corporate_pay_integrations_developer_center';
import SecurityAuditCompliance from './generated/corporate_pay_security_audit_compliance';
import SupportTools from './generated/corporate_pay__support_admin_tool';
import AdminSettingsHub from './generated/corporate_pay_admin_settings';
import EVCharging from './generated/corporate_pay_ev_charging_scheduling';

// Auth and public pages
import Login from './generated/corporate_pay_login_org_selector_sso_ready';
import MFA from './generated/corporate_pay_mfa_device_trust';
import Invite from './generated/corporate_pay_invite_acceptance';
import Landing from './generated/corporate_pay_home_landing_page';

export type ConsolePageId =
  | 'dashboard'
  | 'notifications_activity'
  | 'command_center'
  | 'org_setup'
  | 'modules_enablement'
  | 'users'
  | 'user_profile'
  | 'user_edit'
  | 'user_security'
  | 'user_permissions'
  | 'user_activity'
  | 'role_edit'
  | 'groups'
  | 'roles_permissions'
  | 'policies'
  | 'approval_workflows'
  | 'approvals_inbox'
  | 'budgets'
  | 'wallet_billing'
  | 'billing_setup'
  | 'invoices'
  | 'collections'
  | 'reconciliation'
  | 'vendors'
  | 'rfq'
  | 'fulfillment'
  | 'travel'
  | 'reporting'
  | 'esg'
  | 'integrations'
  | 'security'
  | 'support_tools'
  | 'settings_hub'
  | 'ev_charging';

export type AuthPageId = 'login' | 'mfa' | 'invite';

export type PublicPageId = 'landing';

export type AllPageId = ConsolePageId | AuthPageId | PublicPageId;

export const consolePages: Record<ConsolePageId, ComponentType> = {
  dashboard: Dashboard,
  notifications_activity: NotificationsActivity,
  command_center: CommandCenter,
  org_setup: OrgSetup,
  modules_enablement: ModulesEnablement,
  users: UsersInvites,
  user_profile: UserProfileDetail,
  user_edit: UserEditProfile,
  user_security: UserSecuritySettings,
  user_permissions: UserPermissionsEdit,
  user_activity: UserActivityLog,
  role_edit: RoleEdit,
  groups: GroupsCostCenters,
  roles_permissions: RolesPermissions,
  policies: PolicyBuilder,
  approval_workflows: ApprovalWorkflowBuilder,
  approvals_inbox: ApprovalsInbox,
  budgets: Budgets,
  wallet_billing: WalletBilling,
  billing_setup: BillingSetup,
  invoices: InvoicesStatements,
  collections: CollectionsEnforcement,
  reconciliation: TransactionsReconciliation,
  vendors: VendorCatalog,
  rfq: RFQQuoteRequests,
  fulfillment: OrdersFulfillment,
  travel: CorporateTravel,
  reporting: ReportingAnalytics,
  esg: SustainabilityESG,
  integrations: IntegrationsDeveloperCenter,
  security: SecurityAuditCompliance,
  support_tools: SupportTools,
  settings_hub: AdminSettingsHub,
  ev_charging: EVCharging
};

export const authPages: Record<AuthPageId, ComponentType> = {
  login: Login,
  mfa: MFA,
  invite: Invite
};

export const publicPages: Record<PublicPageId, ComponentType> = {
  landing: Landing
};

// Combined registry for all pages
export const allPages: Record<AllPageId, ComponentType> = {
  ...consolePages,
  ...authPages,
  ...publicPages
};

