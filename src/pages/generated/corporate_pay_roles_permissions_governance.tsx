import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  Eye,
  FileText,
  KeyRound,
  Layers,
  Lock,
  Plus,
  Save,
  Search,
  Shield,
  Sparkles,
  Ticket,
  Trash2,
  User,
  Users,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type ServiceModule =
  | "E-Commerce"
  | "EVs & Charging"
  | "Rides & Logistics"
  | "School & E-Learning"
  | "Medical & Health Care"
  | "Travel & Tourism"
  | "Green Investments"
  | "FaithHub"
  | "Virtual Workspace"
  | "Finance & Payments"
  | "Other Service Module";

type Marketplace =
  | "MyLiveDealz"
  | "ServiceMart"
  | "EVmart"
  | "GadgetMart"
  | "LivingMart"
  | "StyleMart"
  | "EduMart"
  | "HealthMart"
  | "PropertyMart"
  | "GeneratMart"
  | "ExpressMart"
  | "FaithMart"
  | "Other Marketplace";

type SystemRoleName =
  | "Admin"
  | "Manager"
  | "Accountant"
  | "User"
  | "Approver"
  | "Travel Coordinator"
  | "EVzone Support";

type RoleType = "System" | "Custom";

type AdjustLevel = "none" | "request" | "approve";

type PermissionAreas = {
  dashboard: boolean;
  users: boolean;
  groups: boolean;
  orgSetup: boolean;
  policies: boolean;
  approvals: boolean;
  billing: boolean;
  invoices: boolean;
  integrations: boolean;
  reports: boolean;
  security: boolean;
};

type PermissionActions = {
  createRFQ: boolean;
  issueBudget: boolean;
  approveSpend: boolean;
  exportReports: boolean;
  toggleSupportMode: boolean;
  adjustInvoice: AdjustLevel;
  changeCreditLimit: AdjustLevel;
};

type PermissionSet = {
  modules: Record<ServiceModule, boolean>;
  marketplaces: Record<Marketplace, boolean>;
  areas: PermissionAreas;
  actions: PermissionActions;
};

type RoleScope = {
  orgAdminScope: boolean;
  evzoneSupportScope: boolean;
  noSilentActions: boolean;
};

type RoleDef = {
  id: string;
  name: string;
  type: RoleType;
  base?: SystemRoleName;
  description: string;
  active: boolean;
  scope: RoleScope;
  perms: PermissionSet;
  updatedAt: number;
};

type DelegationRule = {
  id: string;
  enabled: boolean;
  fromRole: SystemRoleName | string; // can be custom
  delegateRole: SystemRoleName | string;
  startDate: string;
  endDate: string;
  appliesTo: {
    approvals: boolean;
    rfqs: boolean;
    invoices: boolean;
  };
  reason: string;
  createdAt: number;
};

type DualControlCfg = {
  enabled: boolean;
  requireReason: boolean;
  creditChange: {
    enabled: boolean;
    thresholdUGX: number;
    requireTwoApprovers: boolean;
    requesterRoles: string[];
    approverRoles: string[];
  };
  invoiceAdjust: {
    enabled: boolean;
    thresholdUGX: number;
    requireTwoApprovers: boolean;
    requesterRoles: string[];
    approverRoles: string[];
  };
};

type Toast = {
  id: string;
  title: string;
  message?: string;
  kind: "success" | "warn" | "error" | "info";
};

type TabId = "Roles" | "Delegation" | "Dual-control" | "Simulation";

type TemplateId =
  | "admin_full"
  | "manager_ops"
  | "accountant_strict"
  | "approver_min"
  | "travel_coordinator"
  | "support_view_only"
  | "hospital_compliance";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeAgo(ts: number) {
  const d = Date.now() - ts;
  const m = Math.floor(d / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        map[tone]
      )}
    >
      {label}
    </span>
  );
}

function Button({
  variant = "outline",
  className,
  children,
  onClick,
  disabled,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary:
      "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent:
      "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline:
      "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  const style =
    variant === "primary"
      ? { background: EVZ.green }
      : variant === "accent"
        ? { background: EVZ.orange }
        : undefined;

  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      style={style}
      className={cn(
        base,
        variants[variant],
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
  );
}

function Toggle({
  enabled,
  onChange,
  label,
  description,
  disabled,
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4",
        disabled && "opacity-60"
      )}
    >
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? (
          <div className="mt-1 text-xs text-slate-600">{description}</div>
        ) : null}
      </div>
      <button
        type="button"
        disabled={disabled}
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled
            ? "border-emerald-300 bg-emerald-200"
            : "border-slate-200 bg-white",
          disabled && "cursor-not-allowed"
        )}
        onClick={() => !disabled && onChange(!enabled)}
        aria-label={label}
      >
        <span
          className={cn(
            "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
            enabled ? "left-[22px]" : "left-1"
          )}
        />
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = "text",
  required,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  const bad = !!required && !value.trim();
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">
          {label}
          {required ? <span className="text-rose-600"> *</span> : null}
        </div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : bad
              ? "border-rose-300 bg-white text-slate-900 focus:ring-rose-100"
              : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
      {bad ? <div className="mt-1 text-xs text-rose-600">Required</div> : null}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  hint,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "920px",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Drawer({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[14vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[560px]"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-xs text-slate-600">{subtitle}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-full min-h-0 overflow-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
            ) : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(460px,calc(100vw-2rem))] space-y-2">
      <AnimatePresence initial={false}>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700",
                  t.kind === "warn" && "bg-amber-50 text-amber-800",
                  t.kind === "error" && "bg-rose-50 text-rose-700",
                  t.kind === "info" && "bg-blue-50 text-blue-700"
                )}
              >
                {t.kind === "warn" || t.kind === "error" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">{t.title}</div>
                {t.message ? (
                  <div className="mt-0.5 text-sm text-slate-600">{t.message}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
                onClick={() => onDismiss(t.id)}
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function buildEmptyPerms(
  modules: ServiceModule[],
  marketplaces: Marketplace[]
): PermissionSet {
  const ms: Record<ServiceModule, boolean> = {} as any;
  modules.forEach((m) => (ms[m] = false));

  const mk: Record<Marketplace, boolean> = {} as any;
  marketplaces.forEach((m) => (mk[m] = false));

  return {
    modules: ms,
    marketplaces: mk,
    areas: {
      dashboard: true,
      users: false,
      groups: false,
      orgSetup: false,
      policies: false,
      approvals: false,
      billing: false,
      invoices: false,
      integrations: false,
      reports: false,
      security: false,
    },
    actions: {
      createRFQ: false,
      issueBudget: false,
      approveSpend: false,
      exportReports: false,
      toggleSupportMode: false,
      adjustInvoice: "none",
      changeCreditLimit: "none",
    },
  };
}

function mergePerms(base: PermissionSet, patch: Partial<PermissionSet>): PermissionSet {
  const next = deepClone(base);
  if (patch.modules) next.modules = { ...next.modules, ...patch.modules };
  if (patch.marketplaces) next.marketplaces = { ...next.marketplaces, ...patch.marketplaces };
  if (patch.areas) next.areas = { ...next.areas, ...patch.areas };
  if (patch.actions) next.actions = { ...next.actions, ...patch.actions };
  return next;
}

function diffPerms(a: PermissionSet, b: PermissionSet, modules: ServiceModule[], marketplaces: Marketplace[]): string[] {
  const out: string[] = [];
  modules.forEach((m) => {
    if (a.modules[m] !== b.modules[m]) out.push(`Module ${m}: ${a.modules[m] ? "On" : "Off"} → ${b.modules[m] ? "On" : "Off"}`);
  });
  marketplaces.forEach((m) => {
    if (a.marketplaces[m] !== b.marketplaces[m]) out.push(`Marketplace ${m}: ${a.marketplaces[m] ? "On" : "Off"} → ${b.marketplaces[m] ? "On" : "Off"}`);
  });

  (Object.keys(a.areas) as Array<keyof PermissionAreas>).forEach((k) => {
    if (a.areas[k] !== b.areas[k]) out.push(`Area ${k}: ${a.areas[k] ? "On" : "Off"} → ${b.areas[k] ? "On" : "Off"}`);
  });

  (Object.keys(a.actions) as Array<keyof PermissionActions>).forEach((k) => {
    if (a.actions[k] !== b.actions[k]) out.push(`Action ${k}: ${String(a.actions[k])} → ${String(b.actions[k])}`);
  });

  return out;
}

function systemTemplate(
  id: TemplateId,
  modules: ServiceModule[],
  marketplaces: Marketplace[]
): { name: string; description: string; permsPatch: Partial<PermissionSet>; scopePatch?: Partial<RoleScope> } {
  const allModules: Record<ServiceModule, boolean> = {} as any;
  modules.forEach((m) => (allModules[m] = true));

  const allMkt: Record<Marketplace, boolean> = {} as any;
  marketplaces.forEach((m) => (allMkt[m] = true));

  const noneMkt: Record<Marketplace, boolean> = {} as any;
  marketplaces.forEach((m) => (noneMkt[m] = false));

  const baseAreasAll: PermissionAreas = {
    dashboard: true,
    users: true,
    groups: true,
    orgSetup: true,
    policies: true,
    approvals: true,
    billing: true,
    invoices: true,
    integrations: true,
    reports: true,
    security: true,
  };

  switch (id) {
    case "admin_full":
      return {
        name: "Admin full access",
        description: "Full access across modules, billing, integrations, and security.",
        permsPatch: {
          modules: allModules,
          marketplaces: allMkt,
          areas: baseAreasAll,
          actions: {
            createRFQ: true,
            issueBudget: true,
            approveSpend: true,
            exportReports: true,
            toggleSupportMode: true,
            adjustInvoice: "approve",
            changeCreditLimit: "approve",
          },
        },
        scopePatch: { orgAdminScope: true, evzoneSupportScope: false, noSilentActions: true },
      };

    case "manager_ops":
      return {
        name: "Manager (operations)",
        description: "Operational access, approvals, and reporting. No sensitive finance adjustments.",
        permsPatch: {
          modules: {
            ...Object.fromEntries(modules.map((m) => [m, false])) as any,
            "Rides & Logistics": true,
            "Travel & Tourism": true,
            "Virtual Workspace": true,
            "E-Commerce": true,
          },
          marketplaces: {
            ...noneMkt,
            MyLiveDealz: true,
            ServiceMart: true,
            EVmart: true,
            ExpressMart: true,
          },
          areas: {
            dashboard: true,
            users: false,
            groups: false,
            orgSetup: false,
            policies: true,
            approvals: true,
            billing: false,
            invoices: false,
            integrations: false,
            reports: true,
            security: false,
          },
          actions: {
            createRFQ: true,
            issueBudget: true,
            approveSpend: true,
            exportReports: true,
            toggleSupportMode: false,
            adjustInvoice: "none",
            changeCreditLimit: "none",
          },
        },
      };

    case "accountant_strict":
      return {
        name: "Accountant (strict)",
        description: "Billing, invoices, and reports. Finance adjustments require dual-control.",
        permsPatch: {
          modules: {
            ...Object.fromEntries(modules.map((m) => [m, false])) as any,
            "Finance & Payments": true,
            "E-Commerce": true,
            "Rides & Logistics": true,
            "EVs & Charging": true,
          },
          marketplaces: {
            ...noneMkt,
            MyLiveDealz: true,
            ServiceMart: true,
            EVmart: true,
          },
          areas: {
            dashboard: true,
            users: false,
            groups: true,
            orgSetup: false,
            policies: false,
            approvals: true,
            billing: true,
            invoices: true,
            integrations: true,
            reports: true,
            security: false,
          },
          actions: {
            createRFQ: false,
            issueBudget: false,
            approveSpend: false,
            exportReports: true,
            toggleSupportMode: false,
            adjustInvoice: "request",
            changeCreditLimit: "request",
          },
        },
      };

    case "approver_min":
      return {
        name: "Approver minimal",
        description: "Approvals inbox only plus limited reporting.",
        permsPatch: {
          modules: {
            ...Object.fromEntries(modules.map((m) => [m, false])) as any,
            "Rides & Logistics": true,
            "E-Commerce": true,
            "Finance & Payments": true,
          },
          marketplaces: {
            ...noneMkt,
            MyLiveDealz: true,
            ServiceMart: true,
          },
          areas: {
            dashboard: true,
            users: false,
            groups: false,
            orgSetup: false,
            policies: false,
            approvals: true,
            billing: false,
            invoices: false,
            integrations: false,
            reports: true,
            security: false,
          },
          actions: {
            createRFQ: false,
            issueBudget: false,
            approveSpend: true,
            exportReports: false,
            toggleSupportMode: false,
            adjustInvoice: "none",
            changeCreditLimit: "none",
          },
        },
      };

    case "travel_coordinator":
      return {
        name: "Travel coordinator",
        description: "Book and manage rides, create RFQs for travel services, limited purchases.",
        permsPatch: {
          modules: {
            ...Object.fromEntries(modules.map((m) => [m, false])) as any,
            "Rides & Logistics": true,
            "Travel & Tourism": true,
            "E-Commerce": true,
          },
          marketplaces: {
            ...noneMkt,
            ServiceMart: true,
            ExpressMart: true,
          },
          areas: {
            dashboard: true,
            users: false,
            groups: false,
            orgSetup: false,
            policies: false,
            approvals: true,
            billing: false,
            invoices: false,
            integrations: false,
            reports: false,
            security: false,
          },
          actions: {
            createRFQ: true,
            issueBudget: false,
            approveSpend: false,
            exportReports: false,
            toggleSupportMode: false,
            adjustInvoice: "none",
            changeCreditLimit: "none",
          },
        },
      };

    case "support_view_only":
      return {
        name: "Support view-only",
        description: "EVzone support can view. No silent actions. Write actions must be requested and visible.",
        permsPatch: {
          modules: allModules,
          marketplaces: allMkt,
          areas: {
            dashboard: true,
            users: true,
            groups: true,
            orgSetup: true,
            policies: true,
            approvals: true,
            billing: true,
            invoices: true,
            integrations: true,
            reports: true,
            security: true,
          },
          actions: {
            createRFQ: false,
            issueBudget: false,
            approveSpend: false,
            exportReports: true,
            toggleSupportMode: false,
            adjustInvoice: "request",
            changeCreditLimit: "request",
          },
        },
        scopePatch: { orgAdminScope: false, evzoneSupportScope: true, noSilentActions: true },
      };

    case "hospital_compliance":
      return {
        name: "Hospital compliance pack",
        description: "Stricter access for health care related spend. More approvals required.",
        permsPatch: {
          modules: {
            ...Object.fromEntries(modules.map((m) => [m, false])) as any,
            "Medical & Health Care": true,
            "Rides & Logistics": true,
            "Finance & Payments": true,
            "Virtual Workspace": true,
            "E-Commerce": true,
          },
          marketplaces: {
            ...noneMkt,
            HealthMart: true,
            ServiceMart: true,
            MyLiveDealz: true,
          },
          areas: {
            dashboard: true,
            users: true,
            groups: true,
            orgSetup: true,
            policies: true,
            approvals: true,
            billing: true,
            invoices: true,
            integrations: false,
            reports: true,
            security: true,
          },
          actions: {
            createRFQ: true,
            issueBudget: true,
            approveSpend: true,
            exportReports: true,
            toggleSupportMode: false,
            adjustInvoice: "request",
            changeCreditLimit: "request",
          },
        },
      };

    default:
      return {
        name: "Template",
        description: "",
        permsPatch: {},
      };
  }
}

function hasSupportWriteRestriction(role: RoleDef) {
  return role.scope.evzoneSupportScope && role.scope.noSilentActions;
}

function canAction(role: RoleDef, action: keyof PermissionActions): boolean {
  const v = role.perms.actions[action];
  if (typeof v === "boolean") return v;
  return v !== "none";
}

function canArea(role: RoleDef, area: keyof PermissionAreas): boolean {
  return !!role.perms.areas[area];
}

function canModule(role: RoleDef, m: ServiceModule): boolean {
  return !!role.perms.modules[m];
}

function canMarketplace(role: RoleDef, m: Marketplace): boolean {
  return !!role.perms.marketplaces[m];
}

function isSensitiveAction(action: "changeCreditLimit" | "adjustInvoice") {
  return action === "changeCreditLimit" || action === "adjustInvoice";
}

function rolesWithAdjust(roles: RoleDef[], key: "changeCreditLimit" | "adjustInvoice", level: AdjustLevel) {
  return roles.filter((r) => r.active && r.perms.actions[key] === level);
}

export default function CorporatePayRolesPermissionsGovernanceV2() {
  const SERVICE_MODULES: ServiceModule[] = [
    "E-Commerce",
    "EVs & Charging",
    "Rides & Logistics",
    "School & E-Learning",
    "Medical & Health Care",
    "Travel & Tourism",
    "Green Investments",
    "FaithHub",
    "Virtual Workspace",
    "Finance & Payments",
    "Other Service Module",
  ];

  const MARKETPLACES: Marketplace[] = [
    "MyLiveDealz",
    "ServiceMart",
    "EVmart",
    "GadgetMart",
    "LivingMart",
    "StyleMart",
    "EduMart",
    "HealthMart",
    "PropertyMart",
    "GeneratMart",
    "ExpressMart",
    "FaithMart",
    "Other Marketplace",
  ];

  const SYSTEM_ROLES: SystemRoleName[] = [
    "Admin",
    "Manager",
    "Accountant",
    "User",
    "Approver",
    "Travel Coordinator",
    "EVzone Support",
  ];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<TabId>("Roles");

  // Support-mode gate (two-admin model)
  const [supportModeEnabled, setSupportModeEnabled] = useState(true);
  const [supportToggleOpen, setSupportToggleOpen] = useState<"enable" | "disable" | null>(null);
  const [supportToggleReason, setSupportToggleReason] = useState("");

  const basePerms = useMemo(() => buildEmptyPerms(SERVICE_MODULES, MARKETPLACES), [SERVICE_MODULES, MARKETPLACES]);

  const seedRoles = useMemo<RoleDef[]>(() => {
    const now = Date.now();

    const mkRole = (
      name: SystemRoleName | string,
      type: RoleType,
      description: string,
      permsPatch: Partial<PermissionSet>,
      scope: RoleScope,
      base?: SystemRoleName
    ): RoleDef => {
      return {
        id: uid("role"),
        name,
        type,
        base,
        description,
        active: true,
        scope,
        perms: mergePerms(basePerms, permsPatch),
        updatedAt: now - Math.floor(Math.random() * 14) * 24 * 60 * 60 * 1000,
      };
    };

    return [
      mkRole(
        "Admin",
        "System",
        "Org admin role with broad access.",
        systemTemplate("admin_full", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: true, evzoneSupportScope: false, noSilentActions: true },
        "Admin"
      ),
      mkRole(
        "Manager",
        "System",
        "Manager role for operational oversight.",
        systemTemplate("manager_ops", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Manager"
      ),
      mkRole(
        "Accountant",
        "System",
        "Finance role for billing and reporting.",
        systemTemplate("accountant_strict", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Accountant"
      ),
      mkRole(
        "Approver",
        "System",
        "Approver role for approvals and escalations.",
        systemTemplate("approver_min", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Approver"
      ),
      mkRole(
        "Travel Coordinator",
        "System",
        "Books travel and coordinates rides.",
        systemTemplate("travel_coordinator", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Travel Coordinator"
      ),
      mkRole(
        "User",
        "System",
        "Standard user. Uses EVzone apps, CorporatePay appears at checkout.",
        {
          modules: {
            "Rides & Logistics": true,
            "E-Commerce": true,
            "Finance & Payments": true,
          } as any,
          marketplaces: {
            MyLiveDealz: true,
            ServiceMart: true,
          } as any,
          areas: {
            dashboard: true,
            approvals: false,
            reports: false,
          } as any,
          actions: {
            createRFQ: false,
            issueBudget: false,
            approveSpend: false,
            exportReports: false,
            toggleSupportMode: false,
            adjustInvoice: "none",
            changeCreditLimit: "none",
          },
        },
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "User"
      ),
      mkRole(
        "EVzone Support",
        "System",
        "Support-only role. No silent actions.",
        systemTemplate("support_view_only", SERVICE_MODULES, MARKETPLACES).permsPatch,
        { orgAdminScope: false, evzoneSupportScope: true, noSilentActions: true },
        "EVzone Support"
      ),
      // custom examples
      mkRole(
        "Senior Accountant",
        "Custom",
        "Custom role. Can approve invoice adjustments under dual-control.",
        {
          areas: {
            dashboard: true,
            invoices: true,
            billing: true,
            reports: true,
            approvals: true,
          } as any,
          actions: {
            exportReports: true,
            adjustInvoice: "approve",
            changeCreditLimit: "request",
          } as any,
          modules: {
            "Finance & Payments": true,
            "E-Commerce": true,
          } as any,
          marketplaces: {
            MyLiveDealz: true,
            EVmart: true,
          } as any,
        },
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Accountant"
      ),
      mkRole(
        "Procurement Approver",
        "Custom",
        "Approver focused on RFQs and purchases.",
        {
          areas: {
            dashboard: true,
            approvals: true,
            reports: true,
          } as any,
          actions: {
            approveSpend: true,
            createRFQ: true,
          } as any,
          modules: {
            "E-Commerce": true,
            "Rides & Logistics": true,
          } as any,
          marketplaces: {
            MyLiveDealz: true,
            ServiceMart: true,
          } as any,
        },
        { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
        "Approver"
      ),
    ];
  }, [basePerms, SERVICE_MODULES, MARKETPLACES]);

  const [roles, setRoles] = useState<RoleDef[]>(seedRoles);
  const [roleQ, setRoleQ] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState<string>(seedRoles[0]?.id || "");

  const selectedRole = useMemo(() => roles.find((r) => r.id === selectedRoleId) || null, [roles, selectedRoleId]);

  // Role templates
  const templates = useMemo(() => {
    const items: Array<{ id: TemplateId; name: string; description: string }> = [
      { id: "admin_full", name: "Admin full access", description: "Full access across modules and security." },
      { id: "manager_ops", name: "Manager operations", description: "Operational access with approvals and reporting." },
      { id: "accountant_strict", name: "Accountant strict", description: "Billing and invoices. Sensitive actions require dual-control." },
      { id: "approver_min", name: "Approver minimal", description: "Approvals focused." },
      { id: "travel_coordinator", name: "Travel coordinator", description: "Rides and travel programs." },
      { id: "support_view_only", name: "Support view-only", description: "Support-only. No silent actions." },
      { id: "hospital_compliance", name: "Hospital compliance pack", description: "More approvals for sensitive categories." },
    ];
    return items;
  }, []);

  const [applyTemplateId, setApplyTemplateId] = useState<TemplateId>("manager_ops");
  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDiff, setTemplateDiff] = useState<string[]>([]);

  // Permission simulation (view as role)
  const [simRoleId, setSimRoleId] = useState<string>(seedRoles[0]?.id || "");
  const simRole = useMemo(() => roles.find((r) => r.id === simRoleId) || null, [roles, simRoleId]);
  const [simModule, setSimModule] = useState<ServiceModule>("E-Commerce");
  const [simMarketplace, setSimMarketplace] = useState<Marketplace>("MyLiveDealz");

  // Dual-control configuration
  const [dual, setDual] = useState<DualControlCfg>(() => ({
    enabled: true,
    requireReason: true,
    creditChange: {
      enabled: true,
      thresholdUGX: 5000000,
      requireTwoApprovers: true,
      requesterRoles: ["Accountant", "Admin"],
      approverRoles: ["Admin", "Senior Accountant"],
    },
    invoiceAdjust: {
      enabled: true,
      thresholdUGX: 1000000,
      requireTwoApprovers: true,
      requesterRoles: ["Accountant", "Admin"],
      approverRoles: ["Admin", "Senior Accountant"],
    },
  }));

  // Delegation
  const [delegations, setDelegations] = useState<DelegationRule[]>(() => {
    const now = Date.now();
    return [
      {
        id: "DL-001",
        enabled: true,
        fromRole: "Approver",
        delegateRole: "Procurement Approver",
        startDate: "2026-01-07",
        endDate: "2026-01-21",
        appliesTo: { approvals: true, rfqs: true, invoices: false },
        reason: "Out-of-office coverage for procurement approvals.",
        createdAt: now - 4 * 24 * 60 * 60 * 1000,
      },
    ];
  });

  const [delegationModalOpen, setDelegationModalOpen] = useState(false);
  const [delegationDraft, setDelegationDraft] = useState<DelegationRule | null>(null);

  // Custom role create/edit
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [roleDraft, setRoleDraft] = useState<RoleDef | null>(null);

  // Publish / audit confirm
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditTitle, setAuditTitle] = useState("");
  const [auditReason, setAuditReason] = useState("");
  const [auditAck, setAuditAck] = useState(false);
  const [auditSecondRequired, setAuditSecondRequired] = useState(false);
  const [auditSecondRole, setAuditSecondRole] = useState("");
  const [auditAction, setAuditAction] = useState<null | (() => void)>(null);

  const openAudit = (opts: {
    title: string;
    secondRequired?: boolean;
    defaultSecondRole?: string;
    action: () => void;
  }) => {
    setAuditTitle(opts.title);
    setAuditReason("");
    setAuditAck(false);
    setAuditSecondRequired(!!opts.secondRequired);
    setAuditSecondRole(opts.defaultSecondRole || "");
    setAuditAction(() => opts.action);
    setAuditOpen(true);
  };

  const confirmAudit = () => {
    if (auditReason.trim().length < 8 || !auditAck) {
      toast({ title: "Reason required", message: "Provide a clear reason and confirm acknowledgement.", kind: "warn" });
      return;
    }
    if (auditSecondRequired && !auditSecondRole) {
      toast({ title: "Second approver required", message: "Select a second approver role.", kind: "warn" });
      return;
    }
    auditAction?.();
    setAuditOpen(false);
  };

  // Role list
  const filteredRoles = useMemo(() => {
    const q = roleQ.trim().toLowerCase();
    return roles
      .filter((r) => (q ? `${r.name} ${r.type} ${r.base || ""}`.toLowerCase().includes(q) : true))
      .sort((a, b) => {
        const aSys = a.type === "System" ? 0 : 1;
        const bSys = b.type === "System" ? 0 : 1;
        if (aSys !== bSys) return aSys - bSys;
        return a.name.localeCompare(b.name);
      });
  }, [roles, roleQ]);

  const roleNames = useMemo(() => roles.map((r) => r.name), [roles]);

  // Apply template
  const previewTemplate = () => {
    if (!selectedRole) return;
    const tmpl = systemTemplate(applyTemplateId, SERVICE_MODULES, MARKETPLACES);
    const nextPerms = mergePerms(selectedRole.perms, tmpl.permsPatch);
    const diffs = diffPerms(selectedRole.perms, nextPerms, SERVICE_MODULES, MARKETPLACES);
    setTemplateDiff(diffs);
    setTemplateModalOpen(true);
  };

  const applyTemplate = () => {
    if (!selectedRole) return;
    const tmpl = systemTemplate(applyTemplateId, SERVICE_MODULES, MARKETPLACES);

    const nextPerms = mergePerms(selectedRole.perms, tmpl.permsPatch);
    const nextScope = tmpl.scopePatch ? { ...selectedRole.scope, ...tmpl.scopePatch } : selectedRole.scope;

    openAudit({
      title: `Apply template: ${tmpl.name}`,
      secondRequired: false,
      action: () => {
        setRoles((prev) =>
          prev.map((r) =>
            r.id === selectedRole.id
              ? { ...r, perms: nextPerms, scope: nextScope, updatedAt: Date.now() }
              : r
          )
        );
        toast({ title: "Template applied", message: tmpl.name, kind: "success" });
      },
    });

    setTemplateModalOpen(false);
  };

  // Create custom role
  const openCreateRole = () => {
    const now = Date.now();
    const draft: RoleDef = {
      id: uid("role"),
      name: "",
      type: "Custom",
      base: "User",
      description: "",
      active: true,
      scope: { orgAdminScope: false, evzoneSupportScope: false, noSilentActions: true },
      perms: mergePerms(basePerms, {
        areas: { dashboard: true } as any,
        modules: { "Rides & Logistics": true, "E-Commerce": true } as any,
        marketplaces: { ServiceMart: true } as any,
      }),
      updatedAt: now,
    };
    setRoleDraft(draft);
    setRoleModalOpen(true);
  };

  const openEditRole = (r: RoleDef) => {
    setRoleDraft(deepClone(r));
    setRoleModalOpen(true);
  };

  const saveRoleDraft = () => {
    if (!roleDraft) return;
    const name = roleDraft.name.trim();
    if (!name) {
      toast({ title: "Missing name", message: "Role name is required.", kind: "warn" });
      return;
    }
    if (roleDraft.type === "Custom" && roleNames.some((n) => n.toLowerCase() === name.toLowerCase() && selectedRoleId !== roleDraft.id)) {
      toast({ title: "Name exists", message: "Choose a unique role name.", kind: "warn" });
      return;
    }

    openAudit({
      title: roleNames.includes(roleDraft.name) ? "Update role" : "Create role",
      action: () => {
        setRoles((prev) => {
          const exists = prev.some((r) => r.id === roleDraft.id);
          if (exists) {
            return prev.map((r) => (r.id === roleDraft.id ? { ...roleDraft, updatedAt: Date.now() } : r));
          }
          return [{ ...roleDraft, updatedAt: Date.now() }, ...prev];
        });
        setSelectedRoleId(roleDraft.id);
        toast({ title: "Saved", message: "Role saved.", kind: "success" });
      },
    });

    setRoleModalOpen(false);
  };

  const deleteCustomRole = (r: RoleDef) => {
    if (r.type !== "Custom") {
      toast({ title: "Blocked", message: "System roles cannot be deleted.", kind: "warn" });
      return;
    }

    openAudit({
      title: "Delete role",
      action: () => {
        setRoles((prev) => prev.filter((x) => x.id !== r.id));
        if (selectedRoleId === r.id) {
          setSelectedRoleId(roles.find((x) => x.type === "System")?.id || "");
        }
        toast({ title: "Deleted", message: "Role removed.", kind: "info" });
      },
    });
  };

  // Delegation
  const openDelegation = (d?: DelegationRule) => {
    if (d) setDelegationDraft(deepClone(d));
    else {
      setDelegationDraft({
        id: uid("DL"),
        enabled: true,
        fromRole: "Approver",
        delegateRole: "Manager",
        startDate: "2026-01-07",
        endDate: "2026-01-14",
        appliesTo: { approvals: true, rfqs: true, invoices: false },
        reason: "Coverage",
        createdAt: Date.now(),
      });
    }
    setDelegationModalOpen(true);
  };

  const saveDelegation = () => {
    if (!delegationDraft) return;
    if (!delegationDraft.reason.trim()) {
      toast({ title: "Reason required", message: "Add a reason for delegation.", kind: "warn" });
      return;
    }

    openAudit({
      title: "Save delegation",
      action: () => {
        setDelegations((prev) => {
          const exists = prev.some((d) => d.id === delegationDraft.id);
          if (exists) return prev.map((d) => (d.id === delegationDraft.id ? { ...delegationDraft } : d));
          return [{ ...delegationDraft }, ...prev];
        });
        toast({ title: "Saved", message: "Delegation saved.", kind: "success" });
      },
    });

    setDelegationModalOpen(false);
  };

  const deleteDelegation = (id: string) => {
    openAudit({
      title: "Delete delegation",
      action: () => {
        setDelegations((prev) => prev.filter((d) => d.id !== id));
        toast({ title: "Deleted", message: "Delegation removed.", kind: "info" });
      },
    });
  };

  // Support mode
  const requestSupportToggle = (mode: "enable" | "disable") => {
    setSupportToggleReason("");
    setSupportToggleOpen(mode);
  };

  const confirmSupportToggle = () => {
    if (supportToggleReason.trim().length < 8) {
      toast({ title: "Reason required", message: "Provide a clear reason for support mode change.", kind: "warn" });
      return;
    }

    openAudit({
      title: supportToggleOpen === "enable" ? "Enable support mode" : "Disable support mode",
      action: () => {
        setSupportModeEnabled(supportToggleOpen === "enable");
        toast({
          title: supportToggleOpen === "enable" ? "Support enabled" : "Support disabled",
          message: "Audit log updated.",
          kind: "success",
        });
      },
    });

    setSupportToggleOpen(null);
  };

  // Simulation
  const simPages = useMemo(() => {
    if (!simRole) return [] as Array<{ key: keyof PermissionAreas; label: string }>;
    return [
      { key: "dashboard", label: "Dashboard" },
      { key: "users", label: "Users" },
      { key: "groups", label: "Groups" },
      { key: "orgSetup", label: "Org setup" },
      { key: "policies", label: "Policy builder" },
      { key: "approvals", label: "Approvals" },
      { key: "billing", label: "Billing" },
      { key: "invoices", label: "Invoices" },
      { key: "integrations", label: "Integrations" },
      { key: "reports", label: "Reports" },
      { key: "security", label: "Security" },
    ] as Array<{ key: keyof PermissionAreas; label: string }>;
  }, [simRole]);

  const simActions = useMemo(() => {
    return [
      { key: "createRFQ" as const, label: "Create RFQ" },
      { key: "issueBudget" as const, label: "Issue budget" },
      { key: "approveSpend" as const, label: "Approve spend" },
      { key: "exportReports" as const, label: "Export reports" },
      { key: "adjustInvoice" as const, label: "Adjust invoice" },
      { key: "changeCreditLimit" as const, label: "Change credit limit" },
    ];
  }, []);

  const simulateAction = (key: keyof PermissionActions) => {
    if (!simRole) return;

    // support mode gating
    if (simRole.name === "EVzone Support" && !supportModeEnabled) {
      toast({ title: "Blocked", message: "Support mode is disabled for this organization.", kind: "warn" });
      return;
    }

    // module / marketplace context check
    if (key !== "exportReports" && key !== "toggleSupportMode") {
      if (!canModule(simRole, simModule)) {
        toast({ title: "Blocked", message: `Module disabled for role: ${simModule}`, kind: "warn" });
        return;
      }
      if (simModule === "E-Commerce" && !canMarketplace(simRole, simMarketplace)) {
        toast({ title: "Blocked", message: `Marketplace disabled for role: ${simMarketplace}`, kind: "warn" });
        return;
      }
    }

    // support no silent actions
    if (hasSupportWriteRestriction(simRole) && key !== "exportReports") {
      if (key === "adjustInvoice" || key === "changeCreditLimit") {
        if (simRole.perms.actions[key] === "none") {
          toast({ title: "Blocked", message: "Support cannot perform this action. Only request is allowed.", kind: "warn" });
          return;
        }
        openAudit({
          title: `Support request: ${key}`,
          secondRequired: false,
          action: () => {
            toast({ title: "Ticket created", message: "Support request logged and visible to org admins.", kind: "success" });
          },
        });
        return;
      }
      toast({ title: "Blocked", message: "Support cannot perform write actions. Create a ticket instead.", kind: "warn" });
      return;
    }

    // basic permission
    const has = canAction(simRole, key);
    if (!has) {
      toast({ title: "Denied", message: "Role lacks permission for this action.", kind: "warn" });
      return;
    }

    // dual-control for sensitive actions
    if ((key === "adjustInvoice" || key === "changeCreditLimit") && dual.enabled && dual.requireReason) {
      const cfg = key === "adjustInvoice" ? dual.invoiceAdjust : dual.creditChange;
      const level = simRole.perms.actions[key];
      const requiresSecond = cfg.enabled && cfg.requireTwoApprovers && level === "approve";

      const approverCandidates = roles
        .filter((r) => r.active)
        .filter((r) => r.perms.actions[key] === "approve")
        .map((r) => r.name)
        .filter((name) => name !== simRole.name);

      openAudit({
        title: `Confirm ${key}`,
        secondRequired: requiresSecond,
        defaultSecondRole: approverCandidates[0] || "",
        action: () => {
          toast({ title: "Submitted", message: requiresSecond ? "Dual-control: second approval required." : "Action submitted.", kind: "success" });
        },
      });
      return;
    }

    toast({ title: "Allowed", message: "Action allowed (demo).", kind: "success" });
  };

  // Role editor helpers
  const updateSelectedRole = (patch: Partial<RoleDef>) => {
    if (!selectedRole) return;
    setRoles((prev) => prev.map((r) => (r.id === selectedRole.id ? { ...r, ...patch, updatedAt: Date.now() } : r)));
  };

  const updatePerms = (patch: Partial<PermissionSet>) => {
    if (!selectedRole) return;
    updateSelectedRole({ perms: mergePerms(selectedRole.perms, patch) } as any);
  };

  const updateScope = (patch: Partial<RoleScope>) => {
    if (!selectedRole) return;
    updateSelectedRole({ scope: { ...selectedRole.scope, ...patch } });
  };

  const supportRolePresent = useMemo(() => roles.some((r) => r.name === "EVzone Support"), [roles]);

  const permissionSummary = useMemo(() => {
    if (!selectedRole) return null;
    const enabledModules = SERVICE_MODULES.filter((m) => selectedRole.perms.modules[m]).length;
    const enabledMk = MARKETPLACES.filter((m) => selectedRole.perms.marketplaces[m]).length;
    const enabledAreas = Object.values(selectedRole.perms.areas).filter(Boolean).length;
    const actions = Object.entries(selectedRole.perms.actions)
      .filter(([, v]) => (typeof v === "boolean" ? v : v !== "none"))
      .length;
    return { enabledModules, enabledMk, enabledAreas, actions };
  }, [selectedRole, SERVICE_MODULES, MARKETPLACES]);

  // Governance alert: approver inactive (demo)
  const inactiveApproverAlert = useMemo(() => {
    const approverRole = roles.find((r) => r.name === "Approver");
    if (!approverRole) return null;
    // Demo condition: show alert always
    return {
      title: "Approver inactivity detected",
      body: "An approver has been inactive. Consider enabling out-of-office delegation to avoid SLA breaches.",
    };
  }, [roles]);

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Roles, Permissions and Admin Governance</div>
                  <div className="mt-1 text-xs text-slate-500">System roles, custom roles, two-admin model, delegation, templates, simulations, and dual-control.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Roles: ${roles.length}`} tone="neutral" />
                    <Pill label={`Support mode: ${supportModeEnabled ? "Enabled" : "Disabled"}`} tone={supportModeEnabled ? "good" : "warn"} />
                    <Pill label={`Dual-control: ${dual.enabled ? "On" : "Off"}`} tone={dual.enabled ? "info" : "neutral"} />
                    <Pill label="No silent actions" tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setTab("Simulation")}>
                  <Eye className="h-4 w-4" /> View as role
                </Button>
                <Button variant="outline" onClick={openCreateRole}>
                  <Plus className="h-4 w-4" /> New custom role
                </Button>
                <Button
                  variant="primary"
                  onClick={() => toast({ title: "Saved", message: "Governance settings saved (demo).", kind: "success" })}
                >
                  <Save className="h-4 w-4" /> Save
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["Roles", "Delegation", "Dual-control", "Simulation"] as TabId[]).map((t) => (
                <button
                  key={t}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "Roles" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                {/* Left: role list */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Roles</div>
                        <div className="mt-1 text-xs text-slate-500">System and custom roles</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>

                    <div className="mt-3 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        value={roleQ}
                        onChange={(e) => setRoleQ(e.target.value)}
                        placeholder="Search roles"
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="mt-3 space-y-2">
                      {filteredRoles.map((r) => {
                        const active = r.id === selectedRoleId;
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => setSelectedRoleId(r.id)}
                            className={cn(
                              "w-full rounded-3xl border p-4 text-left transition",
                              active ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                            )}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                                  <Pill label={r.type} tone={r.type === "System" ? "neutral" : "info"} />
                                  {!r.active ? <Pill label="Disabled" tone="warn" /> : null}
                                  {r.scope.evzoneSupportScope ? <Pill label="Support" tone="info" /> : null}
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{r.base ? `Base: ${r.base}` : "Custom"} • Updated {timeAgo(r.updatedAt)}</div>
                              </div>
                              <ChevronRight className="mt-0.5 h-5 w-5 text-slate-400" />
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={openCreateRole}>
                        <Plus className="h-4 w-4" /> Create custom role
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          if (!selectedRole) return;
                          openEditRole(selectedRole);
                        }}
                        disabled={!selectedRole || selectedRole.type !== "Custom"}
                      >
                        <Save className="h-4 w-4" /> Edit selected role
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => selectedRole && deleteCustomRole(selectedRole)}
                        disabled={!selectedRole || selectedRole.type !== "Custom"}
                      >
                        <Trash2 className="h-4 w-4" /> Delete selected role
                      </Button>
                    </div>
                  </div>

                  {/* Two-admin model */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Two-admin model</div>
                        <div className="mt-1 text-xs text-slate-500">Org admins vs EVzone support scope</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Support mode must be enabled for EVzone support to sign in. Support is support-only and has no silent actions.
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      <Button
                        variant={supportModeEnabled ? "danger" : "primary"}
                        onClick={() => requestSupportToggle(supportModeEnabled ? "disable" : "enable")}
                      >
                        <Shield className="h-4 w-4" /> {supportModeEnabled ? "Disable support mode" : "Enable support mode"}
                      </Button>
                      {!supportRolePresent ? (
                        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          EVzone Support role is missing. Add it as a system role in production.
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Governance alert */}
                  {inactiveApproverAlert ? (
                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Governance alert</div>
                          <div className="mt-1 text-xs text-slate-700">{inactiveApproverAlert.title}</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>
                      <div className="mt-3 text-sm text-slate-700">{inactiveApproverAlert.body}</div>
                      <Button variant="outline" className="mt-3 w-full" onClick={() => setTab("Delegation")}>
                        <ChevronRight className="h-4 w-4" /> Open delegation
                      </Button>
                    </div>
                  ) : null}
                </div>

                {/* Right: role editor */}
                <div className="lg:col-span-8 space-y-4">
                  {selectedRole ? (
                    <>
                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-base font-semibold text-slate-900">{selectedRole.name}</div>
                              <Pill label={selectedRole.type} tone={selectedRole.type === "System" ? "neutral" : "info"} />
                              {selectedRole.scope.evzoneSupportScope ? <Pill label="EVzone Support scope" tone="info" /> : null}
                              {selectedRole.scope.orgAdminScope ? <Pill label="Org admin scope" tone="neutral" /> : null}
                              {selectedRole.scope.noSilentActions ? <Pill label="No silent actions" tone="neutral" /> : null}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Updated {formatDateTime(selectedRole.updatedAt)}</div>
                            <div className="mt-2 text-sm text-slate-700">{selectedRole.description || "-"}</div>

                            {permissionSummary ? (
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Pill label={`Modules: ${permissionSummary.enabledModules}`} tone="neutral" />
                                <Pill label={`Marketplaces: ${permissionSummary.enabledMk}`} tone="neutral" />
                                <Pill label={`Areas: ${permissionSummary.enabledAreas}`} tone="neutral" />
                                <Pill label={`Actions: ${permissionSummary.actions}`} tone="neutral" />
                              </div>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => updateSelectedRole({ active: !selectedRole.active })}
                            >
                              {selectedRole.active ? "Disable role" : "Enable role"}
                            </Button>
                            <Button variant="outline" onClick={previewTemplate}>
                              <Layers className="h-4 w-4" /> Apply template
                            </Button>
                            <Button variant="primary" onClick={() => toast({ title: "Saved", message: "Role permissions saved (demo).", kind: "success" })}>
                              <Save className="h-4 w-4" /> Save
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Scopes */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Scopes</div>
                              <div className="mt-1 text-xs text-slate-500">Two-admin model and safety</div>
                            </div>
                            <Pill label="Core" tone="neutral" />
                          </div>
                          <div className="mt-4 space-y-3">
                            <Toggle
                              enabled={selectedRole.scope.orgAdminScope}
                              onChange={(v) => updateScope({ orgAdminScope: v })}
                              label="Org admin scope"
                              description="Allows organization-wide configuration actions."
                              disabled={selectedRole.type === "System" && selectedRole.name === "EVzone Support"}
                            />
                            <Toggle
                              enabled={selectedRole.scope.evzoneSupportScope}
                              onChange={(v) => updateScope({ evzoneSupportScope: v })}
                              label="EVzone support scope"
                              description="Support-only access. Must not be used by regular org admins."
                              disabled={selectedRole.type === "System" && selectedRole.name !== "EVzone Support"}
                            />
                            <Toggle
                              enabled={selectedRole.scope.noSilentActions}
                              onChange={(v) => updateScope({ noSilentActions: v })}
                              label="No silent actions"
                              description="Write actions require visible confirmation and audit."
                            />

                            {hasSupportWriteRestriction(selectedRole) ? (
                              <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                Support scope with no silent actions: support can view and create requests, but cannot silently change billing.
                              </div>
                            ) : null}
                          </div>
                        </div>

                        {/* Templates */}
                        <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Policy-driven templates</div>
                              <div className="mt-1 text-xs text-slate-500">Premium: apply a permission preset</div>
                            </div>
                            <Pill label="Premium" tone="info" />
                          </div>
                          <div className="mt-4 grid grid-cols-1 gap-3">
                            <Select
                              label="Template"
                              value={applyTemplateId}
                              onChange={(v) => setApplyTemplateId(v as TemplateId)}
                              options={templates.map((t) => ({ value: t.id, label: t.name }))}
                              hint="Preview available"
                            />
                            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                              {templates.find((t) => t.id === applyTemplateId)?.description}
                            </div>
                            <Button variant="outline" onClick={previewTemplate}>
                              <Eye className="h-4 w-4" /> Preview and apply
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Permissions matrix */}
                      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Permissions</div>
                            <div className="mt-1 text-xs text-slate-500">Service Modules, Marketplaces, areas, and actions</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              onClick={() => {
                                const allOn: Record<ServiceModule, boolean> = {} as any;
                                SERVICE_MODULES.forEach((m) => (allOn[m] = true));
                                updatePerms({ modules: allOn });
                                toast({ title: "Updated", message: "All modules enabled (draft).", kind: "success" });
                              }}
                            >
                              <Plus className="h-4 w-4" /> Enable all modules
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const allOff: Record<ServiceModule, boolean> = {} as any;
                                SERVICE_MODULES.forEach((m) => (allOff[m] = false));
                                updatePerms({ modules: allOff });
                                toast({ title: "Updated", message: "All modules disabled (draft).", kind: "info" });
                              }}
                            >
                              <X className="h-4 w-4" /> Disable all modules
                            </Button>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Service Modules</div>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {SERVICE_MODULES.map((m) => (
                                <Toggle
                                  key={m}
                                  enabled={selectedRole.perms.modules[m]}
                                  onChange={(v) => updatePerms({ modules: { [m]: v } as any })}
                                  label={m}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between">
                              <div className="text-xs font-semibold text-slate-600">Marketplaces (E-Commerce)</div>
                              <Pill label={selectedRole.perms.modules["E-Commerce"] ? "E-Commerce enabled" : "E-Commerce off"} tone={selectedRole.perms.modules["E-Commerce"] ? "good" : "warn"} />
                            </div>
                            <div className={cn("mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2", !selectedRole.perms.modules["E-Commerce"] && "opacity-60")}>
                              {MARKETPLACES.map((m) => (
                                <Toggle
                                  key={m}
                                  enabled={selectedRole.perms.marketplaces[m]}
                                  onChange={(v) => updatePerms({ marketplaces: { [m]: v } as any })}
                                  label={m}
                                  disabled={!selectedRole.perms.modules["E-Commerce"]}
                                />
                              ))}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">Marketplace permissions apply only if E-Commerce module is enabled.</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                          <div>
                            <div className="text-xs font-semibold text-slate-600">Areas</div>
                            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                              {(Object.keys(selectedRole.perms.areas) as Array<keyof PermissionAreas>).map((k) => (
                                <Toggle
                                  key={k}
                                  enabled={selectedRole.perms.areas[k]}
                                  onChange={(v) => updatePerms({ areas: { [k]: v } as any })}
                                  label={k}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs font-semibold text-slate-600">Actions</div>
                            <div className="mt-2 space-y-2">
                              <Toggle
                                enabled={selectedRole.perms.actions.createRFQ}
                                onChange={(v) => updatePerms({ actions: { createRFQ: v } as any })}
                                label="Create RFQ"
                              />
                              <Toggle
                                enabled={selectedRole.perms.actions.issueBudget}
                                onChange={(v) => updatePerms({ actions: { issueBudget: v } as any })}
                                label="Issue budget"
                              />
                              <Toggle
                                enabled={selectedRole.perms.actions.approveSpend}
                                onChange={(v) => updatePerms({ actions: { approveSpend: v } as any })}
                                label="Approve spend"
                              />
                              <Toggle
                                enabled={selectedRole.perms.actions.exportReports}
                                onChange={(v) => updatePerms({ actions: { exportReports: v } as any })}
                                label="Export reports"
                              />

                              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="text-sm font-semibold text-slate-900">Sensitive actions</div>
                                <div className="mt-1 text-xs text-slate-600">Premium: dual-control (4-eyes) may apply.</div>

                                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                                  <Select
                                    label="Adjust invoice"
                                    value={selectedRole.perms.actions.adjustInvoice}
                                    onChange={(v) => updatePerms({ actions: { adjustInvoice: v as any } as any })}
                                    options={[
                                      { value: "none", label: "No access" },
                                      { value: "request", label: "Request" },
                                      { value: "approve", label: "Approve" },
                                    ]}
                                    hint="Dual-control"
                                  />
                                  <Select
                                    label="Change credit limit"
                                    value={selectedRole.perms.actions.changeCreditLimit}
                                    onChange={(v) => updatePerms({ actions: { changeCreditLimit: v as any } as any })}
                                    options={[
                                      { value: "none", label: "No access" },
                                      { value: "request", label: "Request" },
                                      { value: "approve", label: "Approve" },
                                    ]}
                                    hint="Dual-control"
                                  />
                                </div>
                                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                                  Best practice: set these to Request for most roles, and use dual-control to approve.
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-slate-500">Premium: use Simulation tab to see exactly what this role can access.</div>
                    </>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <Shield className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">No role selected</div>
                      <div className="mt-1 text-sm text-slate-600">Select a role from the left.</div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {tab === "Delegation" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Approval delegation and out-of-office</div>
                        <div className="mt-1 text-xs text-slate-500">Route approvals when approvers are unavailable.</div>
                      </div>
                      <Pill label="Core" tone="neutral" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Delegation can apply to approvals, RFQs, and invoice approvals.
                    </div>
                    <Button variant="primary" className="mt-3 w-full" onClick={() => openDelegation()}>
                      <Plus className="h-4 w-4" /> New delegation
                    </Button>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: show prompts when approver goes inactive, or when SLAs breach.
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Suggested policies</div>
                    <ul className="mt-3 space-y-2 text-sm text-slate-700">
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Require reason for every delegation.</li>
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} /> Avoid delegating to EVzone Support.</li>
                      <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Use end dates and review regularly.</li>
                    </ul>
                  </div>
                </div>

                <div className="lg:col-span-8">
                  <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Delegations</div>
                        <div className="mt-1 text-xs text-slate-500">Active and scheduled delegations</div>
                      </div>
                      <Button variant="outline" onClick={() => openDelegation()}>
                        <Plus className="h-4 w-4" /> Add
                      </Button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">From</th>
                            <th className="px-4 py-3 font-semibold">Delegate</th>
                            <th className="px-4 py-3 font-semibold">Dates</th>
                            <th className="px-4 py-3 font-semibold">Applies to</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {delegations.map((d) => (
                            <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{d.fromRole}</td>
                              <td className="px-4 py-3 text-slate-700">{d.delegateRole}</td>
                              <td className="px-4 py-3 text-slate-700">{d.startDate} to {d.endDate}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {d.appliesTo.approvals ? <Pill label="Approvals" tone="neutral" /> : null}
                                  {d.appliesTo.rfqs ? <Pill label="RFQs" tone="neutral" /> : null}
                                  {d.appliesTo.invoices ? <Pill label="Invoices" tone="neutral" /> : null}
                                </div>
                              </td>
                              <td className="px-4 py-3"><Pill label={d.enabled ? "Enabled" : "Off"} tone={d.enabled ? "good" : "neutral"} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openDelegation(d)}>
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setDelegations((prev) => prev.map((x) => x.id === d.id ? { ...x, enabled: !x.enabled } : x));
                                      toast({ title: "Updated", message: `Delegation ${d.enabled ? "disabled" : "enabled"}.`, kind: "success" });
                                    }}
                                  >
                                    {d.enabled ? "Disable" : "Enable"}
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteDelegation(d.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500">
                      Premium: delegations can be linked to Approval Workflow Builder SLAs.
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "Dual-control" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Dual-control (4-eyes)</div>
                        <div className="mt-1 text-xs text-slate-500">Premium: protect sensitive actions</div>
                      </div>
                      <Pill label="Premium" tone="info" />
                    </div>
                    <Toggle
                      enabled={dual.enabled}
                      onChange={(v) => setDual((p) => ({ ...p, enabled: v }))}
                      label="Enable dual-control"
                      description="Apply to invoice adjustments and credit limit changes."
                    />
                    <Toggle
                      enabled={dual.requireReason}
                      onChange={(v) => setDual((p) => ({ ...p, requireReason: v }))}
                      label="Require reason"
                      description="Always prompt for a reason in audit logs."
                      disabled={!dual.enabled}
                    />
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Best practice: enable dual-control for credit changes and invoice adjustments.
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Who can approve?</div>
                    <div className="mt-2 text-xs text-slate-600">Roles with Approve level for sensitive actions</div>
                    <div className="mt-3 space-y-2">
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-600">Credit limit approvers</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rolesWithAdjust(roles, "changeCreditLimit", "approve").map((r) => (
                            <Pill key={r.id} label={r.name} tone="neutral" />
                          ))}
                          {!rolesWithAdjust(roles, "changeCreditLimit", "approve").length ? <Pill label="None" tone="warn" /> : null}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-600">Invoice adjust approvers</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {rolesWithAdjust(roles, "adjustInvoice", "approve").map((r) => (
                            <Pill key={r.id} label={r.name} tone="neutral" />
                          ))}
                          {!rolesWithAdjust(roles, "adjustInvoice", "approve").length ? <Pill label="None" tone="warn" /> : null}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Tune these in Roles tab under Sensitive actions.</div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Credit limit changes</div>
                        <div className="mt-1 text-xs text-slate-500">Configure thresholds and who can request and approve.</div>
                      </div>
                      <Pill label={dual.creditChange.enabled ? "Enabled" : "Off"} tone={dual.creditChange.enabled ? "good" : "neutral"} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Toggle
                        enabled={dual.creditChange.enabled}
                        onChange={(v) => setDual((p) => ({ ...p, creditChange: { ...p.creditChange, enabled: v } }))}
                        label="Enable"
                        description="Enforce dual-control for credit changes"
                        disabled={!dual.enabled}
                      />
                      <Toggle
                        enabled={dual.creditChange.requireTwoApprovers}
                        onChange={(v) => setDual((p) => ({ ...p, creditChange: { ...p.creditChange, requireTwoApprovers: v } }))}
                        label="Require 2 approvers"
                        description="4-eyes for approve-level actions"
                        disabled={!dual.enabled || !dual.creditChange.enabled}
                      />
                      <Field
                        label="Threshold (UGX)"
                        value={String(dual.creditChange.thresholdUGX)}
                        onChange={(v) => setDual((p) => ({ ...p, creditChange: { ...p.creditChange, thresholdUGX: Number(v || 0) } }))}
                        type="number"
                        hint={`Example: ${formatUGX(dual.creditChange.thresholdUGX)}`}
                        disabled={!dual.enabled || !dual.creditChange.enabled}
                      />
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-600">Notes</div>
                        <div className="mt-1 text-xs text-slate-600">In production, requests above threshold require dual approval and are audit logged.</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Invoice adjustments</div>
                        <div className="mt-1 text-xs text-slate-500">Protect invoice edits, credits, and line item corrections.</div>
                      </div>
                      <Pill label={dual.invoiceAdjust.enabled ? "Enabled" : "Off"} tone={dual.invoiceAdjust.enabled ? "good" : "neutral"} />
                    </div>
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Toggle
                        enabled={dual.invoiceAdjust.enabled}
                        onChange={(v) => setDual((p) => ({ ...p, invoiceAdjust: { ...p.invoiceAdjust, enabled: v } }))}
                        label="Enable"
                        description="Enforce dual-control for invoice adjustments"
                        disabled={!dual.enabled}
                      />
                      <Toggle
                        enabled={dual.invoiceAdjust.requireTwoApprovers}
                        onChange={(v) => setDual((p) => ({ ...p, invoiceAdjust: { ...p.invoiceAdjust, requireTwoApprovers: v } }))}
                        label="Require 2 approvers"
                        description="4-eyes for approve-level actions"
                        disabled={!dual.enabled || !dual.invoiceAdjust.enabled}
                      />
                      <Field
                        label="Threshold (UGX)"
                        value={String(dual.invoiceAdjust.thresholdUGX)}
                        onChange={(v) => setDual((p) => ({ ...p, invoiceAdjust: { ...p.invoiceAdjust, thresholdUGX: Number(v || 0) } }))}
                        type="number"
                        hint={`Example: ${formatUGX(dual.invoiceAdjust.thresholdUGX)}`}
                        disabled={!dual.enabled || !dual.invoiceAdjust.enabled}
                      />
                      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="text-xs font-semibold text-slate-600">Notes</div>
                        <div className="mt-1 text-xs text-slate-600">Use invoice group policies to restrict who can request edits.</div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Dual-control guidance</div>
                        <div className="mt-1 text-sm text-slate-700">Grant Approve level only to a small set of roles. Most roles should Request only.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {tab === "Simulation" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">View as role</div>
                        <div className="mt-1 text-xs text-slate-500">Premium: permission simulation</div>
                      </div>
                      <Pill label="Premium" tone="info" />
                    </div>

                    <Select
                      label="Role"
                      value={simRoleId}
                      onChange={(v) => setSimRoleId(v)}
                      options={roles.map((r) => ({ value: r.id, label: `${r.name} (${r.type})` }))}
                    />

                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <Select
                        label="Module context"
                        value={simModule}
                        onChange={(v) => setSimModule(v as ServiceModule)}
                        options={SERVICE_MODULES.map((m) => ({ value: m, label: m }))}
                      />
                      <Select
                        label="Marketplace context"
                        value={simMarketplace}
                        onChange={(v) => setSimMarketplace(v as Marketplace)}
                        options={MARKETPLACES.map((m) => ({ value: m, label: m }))}
                        disabled={simModule !== "E-Commerce"}
                        hint={simModule !== "E-Commerce" ? "Applies to E-Commerce" : undefined}
                      />
                    </div>

                    {simRole?.name === "EVzone Support" ? (
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Support role is gated by Support mode. No silent actions. Sensitive actions are requests.
                      </div>
                    ) : null}

                    <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      Support mode: <span className="font-semibold text-slate-900">{supportModeEnabled ? "Enabled" : "Disabled"}</span>
                      <div className="mt-2">
                        <Button variant={supportModeEnabled ? "danger" : "primary"} className="w-full" onClick={() => requestSupportToggle(supportModeEnabled ? "disable" : "enable")}>
                          <Shield className="h-4 w-4" /> {supportModeEnabled ? "Disable support" : "Enable support"}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="text-sm font-semibold text-slate-900">Try actions</div>
                    <div className="mt-1 text-xs text-slate-500">Attempt actions under current role and context.</div>
                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {simActions.map((a) => (
                        <Button key={a.key} variant="outline" onClick={() => simulateAction(a.key)}>
                          <ChevronRight className="h-4 w-4" /> {a.label}
                        </Button>
                      ))}
                    </div>
                    <div className="mt-3 text-xs text-slate-500">Sensitive actions may require audit reason and a second approver.</div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Access preview</div>
                        <div className="mt-1 text-xs text-slate-500">Pages and modules visible to this role.</div>
                      </div>
                      <Pill label="Simulation" tone="info" />
                    </div>

                    {simRole ? (
                      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Pages</div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {simPages.map((p) => (
                              <div key={String(p.key)} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                <div className="text-sm font-semibold text-slate-800">{p.label}</div>
                                <Pill label={canArea(simRole, p.key) ? "Allowed" : "Hidden"} tone={canArea(simRole, p.key) ? "good" : "neutral"} />
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Modules</div>
                          <div className="mt-3 grid grid-cols-1 gap-2">
                            {SERVICE_MODULES.map((m) => (
                              <div key={m} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                <div className="text-sm font-semibold text-slate-800">{m}</div>
                                <Pill label={canModule(simRole, m) ? "On" : "Off"} tone={canModule(simRole, m) ? "good" : "neutral"} />
                              </div>
                            ))}
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                            For E-Commerce, marketplace toggles further restrict access.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 text-sm text-slate-600">Select a role.</div>
                    )}

                    {simRole && simModule === "E-Commerce" ? (
                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Marketplaces</div>
                            <div className="mt-1 text-xs text-slate-500">Marketplace access for this role</div>
                          </div>
                          <Pill label="E-Commerce" tone="neutral" />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {MARKETPLACES.map((m) => (
                            <div key={m} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2">
                              <div className="text-sm font-semibold text-slate-800">{m}</div>
                              <Pill label={canMarketplace(simRole, m) ? "On" : "Off"} tone={canMarketplace(simRole, m) ? "good" : "neutral"} />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {simRole && hasSupportWriteRestriction(simRole) ? (
                      <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 p-4">
                        <div className="flex items-start gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Support safety</div>
                            <div className="mt-1 text-sm text-slate-700">Support can never perform silent actions. All requests create visible tickets and audit logs.</div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            H Roles, Permissions & Admin Governance v2: system roles, custom roles, module and marketplace permissions, two-admin model, delegation, permission simulation, templates, and dual-control.
          </div>
        </div>
      </div>

      {/* Template preview modal */}
      <Modal
        open={templateModalOpen}
        title="Template preview"
        subtitle="See what changes before applying."
        onClose={() => setTemplateModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyTemplate}>
              <Layers className="h-4 w-4" /> Apply
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Template: <span className="font-semibold text-slate-900">{templates.find((t) => t.id === applyTemplateId)?.name}</span>
        </div>
        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Changes</div>
          <div className="mt-2 text-xs text-slate-500">Showing up to 60 items</div>
          <div className="mt-3 space-y-2">
            {templateDiff.slice(0, 60).map((d, idx) => (
              <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-700">
                {d}
              </div>
            ))}
            {!templateDiff.length ? (
              <div className="rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200">
                No changes detected.
              </div>
            ) : null}
          </div>
        </div>
      </Modal>

      {/* Role create/edit modal */}
      <Modal
        open={roleModalOpen}
        title={roleDraft?.type === "Custom" ? (roleNames.includes(roleDraft?.name || "") ? "Edit custom role" : "Create custom role") : "Role"}
        subtitle="Custom roles can be scoped by modules, marketplaces, areas, and actions."
        onClose={() => setRoleModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRoleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveRoleDraft}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
        maxW="980px"
      >
        {roleDraft ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Role name" required value={roleDraft.name} onChange={(v) => setRoleDraft((p) => (p ? { ...p, name: v } : p))} placeholder="Role name" />
              <Select
                label="Base"
                value={roleDraft.base || "User"}
                onChange={(v) => setRoleDraft((p) => (p ? { ...p, base: v as SystemRoleName } : p))}
                options={SYSTEM_ROLES.filter((x) => x !== "EVzone Support").map((x) => ({ value: x, label: x }))}
                hint="Starter"
              />
              <div className="md:col-span-2">
                <Field label="Description" value={roleDraft.description} onChange={(v) => setRoleDraft((p) => (p ? { ...p, description: v } : p))} placeholder="Description" />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Quick setup</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {([
                  "manager_ops",
                  "accountant_strict",
                  "approver_min",
                  "travel_coordinator",
                  "hospital_compliance",
                ] as TemplateId[]).map((id) => (
                  <Button
                    key={id}
                    variant="outline"
                    onClick={() => {
                      const tmpl = systemTemplate(id, SERVICE_MODULES, MARKETPLACES);
                      setRoleDraft((p) => (p ? { ...p, perms: mergePerms(p.perms, tmpl.permsPatch), scope: tmpl.scopePatch ? { ...p.scope, ...tmpl.scopePatch } : p.scope } : p));
                      toast({ title: "Template applied", message: tmpl.name, kind: "success" });
                    }}
                  >
                    <Sparkles className="h-4 w-4" /> {templates.find((t) => t.id === id)?.name || id}
                  </Button>
                ))}
              </div>
              <div className="mt-3 text-xs text-slate-600">You can adjust details after applying.</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Safety scope</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Toggle enabled={roleDraft.scope.orgAdminScope} onChange={(v) => setRoleDraft((p) => (p ? { ...p, scope: { ...p.scope, orgAdminScope: v } } : p))} label="Org admin scope" />
                <Toggle enabled={roleDraft.scope.noSilentActions} onChange={(v) => setRoleDraft((p) => (p ? { ...p, scope: { ...p.scope, noSilentActions: v } } : p))} label="No silent actions" />
                <Toggle enabled={roleDraft.scope.evzoneSupportScope} onChange={(v) => setRoleDraft((p) => (p ? { ...p, scope: { ...p.scope, evzoneSupportScope: v } } : p))} label="EVzone support scope" description="Use only for support accounts" />
              </div>
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                Avoid giving both Org admin scope and EVzone support scope to the same role.
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Delegation modal */}
      <Modal
        open={delegationModalOpen}
        title={delegationDraft?.id ? "Delegation" : "New delegation"}
        subtitle="Approval delegation and out-of-office coverage."
        onClose={() => setDelegationModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDelegationModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveDelegation}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
        maxW="980px"
      >
        {delegationDraft ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="From role"
                value={delegationDraft.fromRole}
                onChange={(v) => setDelegationDraft((p) => (p ? { ...p, fromRole: v } : p))}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
              />
              <Select
                label="Delegate role"
                value={delegationDraft.delegateRole}
                onChange={(v) => setDelegationDraft((p) => (p ? { ...p, delegateRole: v } : p))}
                options={roles.map((r) => ({ value: r.name, label: r.name }))}
              />
              <Field label="Start date" value={delegationDraft.startDate} onChange={(v) => setDelegationDraft((p) => (p ? { ...p, startDate: v } : p))} type="date" />
              <Field label="End date" value={delegationDraft.endDate} onChange={(v) => setDelegationDraft((p) => (p ? { ...p, endDate: v } : p))} type="date" />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Applies to</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                {([
                  { k: "approvals", label: "Approvals" },
                  { k: "rfqs", label: "RFQs" },
                  { k: "invoices", label: "Invoices" },
                ] as const).map((x) => (
                  <Toggle
                    key={x.k}
                    enabled={(delegationDraft.appliesTo as any)[x.k]}
                    onChange={(v) => setDelegationDraft((p) => (p ? { ...p, appliesTo: { ...p.appliesTo, [x.k]: v } } : p))}
                    label={x.label}
                  />
                ))}
              </div>
            </div>

            <Field
              label="Reason"
              value={delegationDraft.reason}
              onChange={(v) => setDelegationDraft((p) => (p ? { ...p, reason: v } : p))}
              placeholder="Reason"
              required
            />

            <Toggle
              enabled={delegationDraft.enabled}
              onChange={(v) => setDelegationDraft((p) => (p ? { ...p, enabled: v } : p))}
              label={delegationDraft.enabled ? "Enabled" : "Off"}
              description="Disable without deleting to preserve history"
            />

            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              Premium: this can be connected to out-of-office status in user profiles.
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Support toggle modal */}
      <Modal
        open={supportToggleOpen !== null}
        title={supportToggleOpen === "enable" ? "Enable support mode" : "Disable support mode"}
        subtitle="This change is audited and visible to org admins."
        onClose={() => setSupportToggleOpen(null)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSupportToggleOpen(null)}>Cancel</Button>
            <Button variant={supportToggleOpen === "enable" ? "primary" : "danger"} onClick={confirmSupportToggle}>
              <Shield className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
        maxW="860px"
      >
        <Field
          label="Reason"
          value={supportToggleReason}
          onChange={setSupportToggleReason}
          placeholder="Example: allow EVzone to troubleshoot invoice delivery"
          required
          hint="Minimum 8 characters"
        />
        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          Support sessions are always audited. No silent actions.
        </div>
      </Modal>

      {/* Audit confirmation modal */}
      <Modal
        open={auditOpen}
        title={auditTitle || "Confirm action"}
        subtitle="Audit-friendly confirmation and reason prompt."
        onClose={() => setAuditOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAuditOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={confirmAudit} disabled={auditReason.trim().length < 8 || !auditAck || (auditSecondRequired && !auditSecondRole)}>
              <BadgeCheck className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
        maxW="980px"
      >
        <div className="space-y-4">
          <Field
            label="Reason"
            value={auditReason}
            onChange={setAuditReason}
            placeholder="Explain why you are making this change"
            required
            hint="Minimum 8 characters"
          />

          {auditSecondRequired ? (
            <Select
              label="Second approver role"
              value={auditSecondRole}
              onChange={setAuditSecondRole}
              options={roles
                .filter((r) => r.active)
                .map((r) => ({ value: r.name, label: r.name }))}
              hint="Dual-control"
            />
          ) : null}

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <input
              type="checkbox"
              checked={auditAck}
              onChange={(e) => setAuditAck(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300"
            />
            <div className="text-sm font-semibold text-slate-800">I confirm this action is authorized and will be audit logged.</div>
          </label>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
            Premium: audit log includes policy versions, role, IP, device, and support watermark.
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          H Roles, Permissions & Admin Governance v2: roles, permissions, templates, simulations, delegation, two-admin model, and dual-control.
        </div>
      </footer>
    </div>
  );
}
