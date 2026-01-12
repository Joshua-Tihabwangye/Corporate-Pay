import type { ComponentType } from 'react';

import Dashboard from './generated/corporate_pay_a_corporate_dashboard_v_2';
import NotificationsActivity from './generated/corporate_pay_b_notifications_activity_center_v_2';
import CommandCenter from './generated/corporate_pay_c_global_search_command_center_v_2';
import OrgSetup from './generated/corporate_pay_d_organization_profile_program_setup_v_2';
import ModulesEnablement from './generated/corporate_pay_e_modules_marketplaces_enablement_v_2';
import UsersInvites from './generated/corporate_pay_f_users_invitations_v_2';
import GroupsCostCenters from './generated/corporate_pay_g_groups_cost_centers_v_2';
import RolesPermissions from './generated/corporate_pay_h_roles_permissions_admin_governance_v_2';
import PolicyBuilder from './generated/corporate_pay_i_policy_builder_rides_services_purchases_v_2';
import ApprovalWorkflowBuilder from './generated/corporate_pay_j_approval_workflow_builder_v_2';
import ApprovalsInbox from './generated/corporate_pay_k_approvals_inbox_v_2';
import Budgets from './generated/corporate_pay_l_budgets_spend_limits_controls_v_2';
import WalletBilling from './generated/corporate_pay_m_corporate_wallet_credit_line_prepaid_funding_v_2';
import BillingSetup from './generated/corporate_pay_n_billing_setup_invoice_groups_v_2';
import InvoicesStatements from './generated/corporate_pay_o_invoices_statements_v_2';
import CollectionsEnforcement from './generated/corporate_pay_p_collections_reminders_enforcement_v_2';
import TransactionsReconciliation from './generated/corporate_pay_q_transactions_reconciliation_v_2';
import VendorCatalog from './generated/corporate_pay_r_vendor_catalog_management_v_2';
import RFQQuoteRequests from './generated/corporate_pay_s_rfq_quote_requests_v_2';
import OrdersFulfillment from './generated/corporate_pay_t_orders_service_requests_fulfillment_v_2';
import CorporateTravel from './generated/corporate_pay_u_corporate_travel_scheduling_v_2';
import ReportingAnalytics from './generated/corporate_pay_v_reporting_analytics_v_2';
import SustainabilityESG from './generated/corporate_pay_w_sustainability_esg_reporting_v_2';
import IntegrationsDeveloperCenter from './generated/corporate_pay_y_integrations_developer_center_v_2';
import SecurityAuditCompliance from './generated/corporate_pay_z_security_audit_compliance_v_2';
import SupportTools from './generated/corporate_pay_aa_support_evzone_admin_tools_v_2';
import AdminSettingsHub from './generated/corporate_pay_admin_settings_hub_v_2';
import EVCharging from './generated/corporate_pay_ev_charging_scheduling_v_2';

// Auth and public pages
import Login from './generated/corporate_pay_x_1_login_org_selector_sso_ready_v_2';
import MFA from './generated/corporate_pay_x_2_mfa_device_trust_v_2';
import Invite from './generated/corporate_pay_x_3_invite_acceptance_evzone_account_linking_v_2';
import Landing from './generated/corporate_pay_home_landing_page_v_2_fixed';

export type ConsolePageId =
  | 'dashboard'
  | 'notifications_activity'
  | 'command_center'
  | 'org_setup'
  | 'modules_enablement'
  | 'users'
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

