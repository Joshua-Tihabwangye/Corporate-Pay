import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  GitBranch,
  Headphones,
  HelpCircle,
  Layers,
  Leaf,
  Lock,
  MessageSquare,
  Search,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  Wallet,
  Wrench,
  X,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type ActorRole = "Org Admin" | "Finance" | "Approver" | "Employee" | "EVzone Support";
type Tier = "Core" | "Premium" | "Phase 2";

type Category =
  | "All"
  | "Organization"
  | "Access"
  | "Controls"
  | "Finance"
  | "Integrations"
  | "Security"
  | "Support"
  | "Reporting";

type Health = "Healthy" | "Needs attention" | "At risk";

type Toast = {
  id: string;
  title: string;
  message?: string;
  kind: "success" | "warn" | "error" | "info";
};

type SettingsItem = {
  id: string;
  title: string;
  description: string;
  category: Exclude<Category, "All">;
  path: string;
  tier: Tier;
  roles: ActorRole[];
  tags: string[];
  icon: React.ComponentType<{ className?: string }>;
  lastUpdatedAt: number;
  health: Health;
  quickActions: Array<{
    id: string;
    label: string;
    kind: "open" | "copy" | "action";
    hint?: string;
  }>;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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

function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
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

function toneForTier(t: Tier) {
  if (t === "Premium") return "info" as const;
  if (t === "Phase 2") return "neutral" as const;
  return "neutral" as const;
}

function toneForHealth(h: Health) {
  if (h === "At risk") return "bad" as const;
  if (h === "Needs attention") return "warn" as const;
  return "good" as const;
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
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
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
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
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

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(value, 0, 100);
  const size = 78;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;
  return (
    <div className="relative grid place-items-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="#E2E8F0"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={EVZ.green}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute text-sm font-semibold text-slate-900">
        {Math.round(pct)}%
      </div>
    </div>


  );
}

function ActionMenu({
  actions,
}: {
  actions: Array<{
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!actions.length) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                action.onClick();
                setIsOpen(false);
              }}
              disabled={action.disabled}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50",
                action.variant === "danger"
                  ? "text-rose-600 hover:bg-rose-50"
                  : "text-slate-700 hover:bg-slate-50"
              )}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      )}
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
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
    disabled?: boolean;
  }>;
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
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button
                  className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
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
                {t.kind === "error" || t.kind === "warn" ? (
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

function Section({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          {subtitle ? (
            <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
          ) : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <Settings2 className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

export default function CorporatePayAdminSettingsHubV2() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(
      () => setToasts((p) => p.filter((x) => x.id !== id)),
      3200
    );
  };

  const now = Date.now();

  const items = useMemo<SettingsItem[]>(() => {
    const mk = (
      partial: Omit<SettingsItem, "lastUpdatedAt"> & { lastUpdatedDaysAgo: number }
    ): SettingsItem => ({
      ...partial,
      lastUpdatedAt: now - partial.lastUpdatedDaysAgo * 24 * 60 * 60 * 1000,
    });

    return [
      mk({
        id: "org_setup",
        title: "Organization Profile and Program Setup",
        description:
          "Company profile, entities, billing contacts, branding, invoice groups, and support toggle.",
        category: "Organization",
        path: "/settings/org/setup",
        tier: "Core",
        roles: ["Org Admin"],
        tags: ["profile", "entities", "billing", "invoice groups", "support"],
        icon: Building2,
        lastUpdatedDaysAgo: 2,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open wizard", kind: "open" },
          { id: "copy", label: "Copy link", kind: "copy" },
        ],
      }),
      mk({
        id: "modules_marketplaces",
        title: "Modules and Marketplaces Enablement",
        description:
          "Enable service modules and marketplaces including MyLiveDealz. Includes Other slots for expansion.",
        category: "Organization",
        path: "/settings/modules",
        tier: "Core",
        roles: ["Org Admin"],
        tags: ["service modules", "marketplaces", "rollout"],
        icon: Layers,
        lastUpdatedDaysAgo: 3,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Manage enablement", kind: "open" },
          { id: "copy", label: "Copy link", kind: "copy" },
        ],
      }),
      mk({
        id: "users_invites",
        title: "Users and Invitations",
        description:
          "Invite employees, set group and cost center defaults, bulk import, and offboarding.",
        category: "Access",
        path: "/settings/users",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["users", "invites", "CSV import", "offboarding"],
        icon: Users,
        lastUpdatedDaysAgo: 6,
        health: "Needs attention",
        quickActions: [
          { id: "open", label: "Open users", kind: "open" },
          { id: "action", label: "Invite user", kind: "action", hint: "Quick create" },
        ],
      }),
      mk({
        id: "groups_cost_centers",
        title: "Groups and Cost Centers",
        description:
          "Create Groups, cost centers, project tags, and chargeback rules.",
        category: "Access",
        path: "/settings/groups",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["groups", "cost centers", "project codes"],
        icon: SlidersHorizontal,
        lastUpdatedDaysAgo: 9,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open groups", kind: "open" },
          { id: "copy", label: "Copy link", kind: "copy" },
        ],
      }),
      mk({
        id: "roles_permissions",
        title: "Roles, Permissions and Governance",
        description:
          "Custom roles, module permissions, two-admin model controls, delegation, and simulation.",
        category: "Access",
        path: "/settings/roles",
        tier: "Core",
        roles: ["Org Admin"],
        tags: ["RBAC", "governance", "delegation"],
        icon: ShieldCheck,
        lastUpdatedDaysAgo: 12,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open roles", kind: "open" },
          { id: "copy", label: "Copy link", kind: "copy" },
        ],
      }),
      mk({
        id: "policy_builder",
        title: "Policies",
        description:
          "Policy builder for rides, services, purchases and marketplace restrictions with inheritance.",
        category: "Controls",
        path: "/settings/policies",
        tier: "Core",
        roles: ["Org Admin", "Approver"],
        tags: ["policy", "inheritance", "simulator"],
        icon: Wrench,
        lastUpdatedDaysAgo: 4,
        health: "Needs attention",
        quickActions: [
          { id: "open", label: "Open policies", kind: "open" },
          { id: "action", label: "Simulate scenario", kind: "action" },
        ],
      }),
      mk({
        id: "approval_workflows",
        title: "Approval Workflow Builder",
        description:
          "Create approval flows per module and marketplace including RFQs and high value assets.",
        category: "Controls",
        path: "/settings/approvals/workflows",
        tier: "Core",
        roles: ["Org Admin", "Approver", "Finance"],
        tags: ["approvals", "rules", "SLA"],
        icon: BadgeCheck,
        lastUpdatedDaysAgo: 7,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open builder", kind: "open" },
          { id: "action", label: "Create template", kind: "action" },
        ],
      }),
      mk({
        id: "budgets",
        title: "Budgets, Spend Limits and Controls",
        description:
          "Org, group, user, module, and marketplace budgets with forecasting and exceptions.",
        category: "Finance",
        path: "/settings/budgets",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["budgets", "caps", "exceptions"],
        icon: Wallet,
        lastUpdatedDaysAgo: 1,
        health: "At risk",
        quickActions: [
          { id: "open", label: "Open budgets", kind: "open" },
          { id: "action", label: "Request exception", kind: "action" },
        ],
      }),
      mk({
        id: "billing_invoice_groups",
        title: "Billing Setup and Invoice Groups",
        description:
          "Invoice frequency, invoice groups, tax, templates, and billing simulations.",
        category: "Finance",
        path: "/settings/billing",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["billing", "invoice groups", "tax"],
        icon: FileText,
        lastUpdatedDaysAgo: 5,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open billing", kind: "open" },
          { id: "copy", label: "Copy link", kind: "copy" },
        ],
      }),
      mk({
        id: "reporting",
        title: "Reporting and Analytics",
        description:
          "Spend reports, approval performance, exports, custom report builder, and schedules.",
        category: "Reporting",
        path: "/reports",
        tier: "Core",
        roles: ["Org Admin", "Finance", "Approver"],
        tags: ["reports", "exports", "schedules"],
        icon: BarChart3,
        lastUpdatedDaysAgo: 2,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open reports", kind: "open" },
          { id: "action", label: "Schedule report", kind: "action" },
        ],
      }),
      mk({
        id: "esg",
        title: "Sustainability and ESG Reporting",
        description:
          "EV usage metrics, charging utilization, emissions estimates, and ESG template exports.",
        category: "Reporting",
        path: "/reports/esg",
        tier: "Premium",
        roles: ["Org Admin", "Finance"],
        tags: ["ESG", "emissions", "templates"],
        icon: Leaf,
        lastUpdatedDaysAgo: 2,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open ESG", kind: "open" },
          { id: "action", label: "Update factors", kind: "action" },
        ],
      }),
      mk({
        id: "integrations",
        title: "Integrations and Developer Center",
        description:
          "ERP exports, secure API keys, scopes, webhooks, sandbox mode, and inspector.",
        category: "Integrations",
        path: "/settings/integrations",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["exports", "API keys", "webhooks"],
        icon: GitBranch,
        lastUpdatedDaysAgo: 1,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open integrations", kind: "open" },
          { id: "action", label: "Create webhook", kind: "action" },
        ],
      }),
      mk({
        id: "security",
        title: "Security, Audit and Compliance",
        description:
          "Audit logs, MFA policies, retention, support mode gating, dual control, forensic exports.",
        category: "Security",
        path: "/settings/security",
        tier: "Core",
        roles: ["Org Admin", "Finance"],
        tags: ["audit", "MFA", "retention", "dual control"],
        icon: Lock,
        lastUpdatedDaysAgo: 1,
        health: "Needs attention",
        quickActions: [
          { id: "open", label: "Open security", kind: "open" },
          { id: "action", label: "Run posture check", kind: "action" },
        ],
      }),
      mk({
        id: "support_tools",
        title: "Support and EVzone Admin Tools",
        description:
          "Embedded support role, auditable sessions, scoped tools, recording policy, and status messages.",
        category: "Support",
        path: "/settings/support-tools",
        tier: "Premium",
        roles: ["Org Admin", "EVzone Support", "Finance"],
        tags: ["support", "cases", "sessions", "incidents"],
        icon: Headphones,
        lastUpdatedDaysAgo: 0,
        health: "Healthy",
        quickActions: [
          { id: "open", label: "Open support tools", kind: "open" },
          { id: "action", label: "Request support", kind: "action" },
        ],
      }),
    ];
  }, [now]);

  const categories: Category[] = [
    "All",
    "Organization",
    "Access",
    "Controls",
    "Finance",
    "Integrations",
    "Security",
    "Support",
    "Reporting",
  ];
  const [category, setCategory] = useState<Category>("All");
  const [query, setQuery] = useState("");
  const [viewAs, setViewAs] = useState<ActorRole>("Org Admin");
  const [pinned, setPinned] = useState<string[]>(() => [
    "org_setup",
    "security",
    "integrations",
  ]);
  const [selectedId, setSelectedId] = useState<string>("org_setup");

  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [accessItemId, setAccessItemId] = useState<string | null>(null);
  const [accessReason, setAccessReason] = useState("");

  const selected = useMemo(
    () => items.find((i) => i.id === selectedId) || items[0],
    [items, selectedId]
  );

  const canAccessSelected = useMemo(
    () => selected.roles.includes(viewAs),
    [selected.roles, viewAs]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((i) => (category === "All" ? true : i.category === category))
      .filter((i) => {
        if (!q) return true;
        const blob = `${i.title} ${i.description} ${i.category} ${i.tags.join(
          " "
        )} ${i.path} ${i.tier}`.toLowerCase();
        return blob.includes(q);
      })
      .slice()
      .sort((a, b) => {
        const ap = pinned.includes(a.id) ? 1 : 0;
        const bp = pinned.includes(b.id) ? 1 : 0;
        if (ap !== bp) return bp - ap;

        const rank = (h: Health) => (h === "At risk" ? 3 : h === "Needs attention" ? 2 : 1);
        const ar = rank(a.health);
        const br = rank(b.health);
        if (ar !== br) return br - ar;

        return b.lastUpdatedAt - a.lastUpdatedAt;
      });
  }, [items, category, query, pinned]);

  const goLiveReadiness = useMemo(() => {
    const keyIds = [
      "org_setup",
      "modules_marketplaces",
      "billing_invoice_groups",
      "security",
      "integrations",
    ];
    const ok = keyIds.filter((id) => {
      const it = items.find((x) => x.id === id);
      return it ? it.health === "Healthy" : false;
    }).length;
    return Math.round((ok / keyIds.length) * 100);
  }, [items]);

  const counters = useMemo(() => {
    const total = items.length;
    const risk = items.filter((i) => i.health === "At risk").length;
    const attention = items.filter((i) => i.health === "Needs attention").length;
    const premium = items.filter((i) => i.tier === "Premium").length;
    const phase2 = items.filter((i) => i.tier === "Phase 2").length;
    return { total, risk, attention, premium, phase2 };
  }, [items]);

  const exportManifest = () => {
    const payload = {
      generatedAt: new Date().toISOString(),
      viewAs,
      category,
      query: query || undefined,
      pinned,
      items: items.map((i) => ({
        id: i.id,
        title: i.title,
        category: i.category,
        path: i.path,
        tier: i.tier,
        roles: i.roles,
        tags: i.tags,
        health: i.health,
        lastUpdatedAt: i.lastUpdatedAt,
      })),
    };
    downloadText("admin-settings-hub.json", JSON.stringify(payload, null, 2), "application/json");
    toast({ title: "Exported", message: "Settings manifest downloaded.", kind: "success" });
  };

  const copyLink = async (path: string) => {
    try {
      await navigator.clipboard.writeText(path);
      toast({ title: "Copied", message: "Link copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const openItem = (it: SettingsItem) => {
    if (!it.roles.includes(viewAs)) {
      setAccessItemId(it.id);
      setAccessReason("");
      setAccessModalOpen(true);
      return;
    }
    setSelectedId(it.id);
    toast({ title: "Navigate", message: `Open ${it.path}`, kind: "info" });
  };

  const togglePin = (id: string) => {
    setPinned((p) => (p.includes(id) ? p.filter((x) => x !== id) : [id, ...p].slice(0, 8)));
  };

  const requestAccess = () => {
    if (!accessItemId) return;
    if (accessReason.trim().length < 8) {
      toast({ title: "Reason required", message: "Explain why you need access.", kind: "warn" });
      return;
    }
    toast({ title: "Requested", message: `Access request created for ${accessItemId}.`, kind: "success" });
    setAccessModalOpen(false);
  };

  const recentChanges = useMemo(() => {
    return items
      .slice()
      .sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
      .slice(0, 6)
      .map((i) => ({
        id: uid("chg"),
        at: i.lastUpdatedAt,
        title: i.title,
        note:
          i.health === "Healthy"
            ? "Updated configuration"
            : i.health === "Needs attention"
            ? "Requires review"
            : "At risk limit",
        path: i.path,
        health: i.health,
      }));
  }, [items]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))",
      }}
    >
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                  style={{ background: EVZ.green }}
                >
                  <Settings2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Admin Settings Hub</div>
                  <div className="mt-1 text-xs text-slate-500">
                    One place to manage every CorporatePay setting. Use search, filters, and role-based access.
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Total ${counters.total}`} tone="neutral" />
                    <Pill label={`At risk ${counters.risk}`} tone={counters.risk ? "warn" : "good"} />
                    <Pill label={`Needs attention ${counters.attention}`} tone={counters.attention ? "warn" : "good"} />
                    <Pill label={`Premium ${counters.premium}`} tone={counters.premium ? "info" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[220px]">
                  <Select
                    label="View as"
                    value={viewAs}
                    onChange={(v) => setViewAs(v as ActorRole)}
                    options={[
                      { value: "Org Admin", label: "Org Admin" },
                      { value: "Finance", label: "Finance" },
                      { value: "Approver", label: "Approver" },
                      { value: "Employee", label: "Employee" },
                      { value: "EVzone Support", label: "EVzone Support" },
                    ]}
                    hint="Role gating"
                  />
                </div>

                <Button variant="outline" onClick={exportManifest}>
                  <Download className="h-4 w-4" /> Export manifest
                </Button>

                <Button
                  variant="primary"
                  onClick={() => {
                    setSelectedId("support_tools");
                    toast({ title: "Support", message: "Open support tools", kind: "info" });
                  }}
                >
                  <Headphones className="h-4 w-4" /> Support tools
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-7">
                <div className="text-xs font-semibold text-slate-600">Search settings</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="policy, budgets, invoice groups, API keys..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {query ? (
                    <button
                      className="rounded-xl p-1 text-slate-500 hover:bg-slate-100"
                      onClick={() => setQuery("")}
                      aria-label="Clear"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-5">
                <div className="text-xs font-semibold text-slate-600">Category</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {categories.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={cn(
                        "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                        category === c
                          ? "text-white ring-emerald-600"
                          : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                      )}
                      style={category === c ? { background: EVZ.green } : undefined}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left: cards */}
              <div className="lg:col-span-8 space-y-4">
                <Section
                  title="Settings"
                  subtitle="Click a card to view details and actions. Locked items can request access."
                  right={<Pill label={`${filtered.length} shown`} tone="neutral" />}
                >
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {filtered.map((it) => {
                      const Icon = it.icon;
                      const locked = !it.roles.includes(viewAs);
                      const pinnedOn = pinned.includes(it.id);

                      return (
                        <button
                          key={it.id}
                          type="button"
                          className={cn(
                            "relative rounded-3xl border bg-white p-4 text-left shadow-sm transition hover:bg-slate-50",
                            selectedId === it.id
                              ? "border-emerald-300 ring-4 ring-emerald-100"
                              : "border-slate-200"
                          )}
                          onClick={() => {
                            setSelectedId(it.id);
                            if (locked) toast({ title: "Locked", message: "Request access to open.", kind: "warn" });
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex min-w-0 items-start gap-3">
                              <div
                                className={cn(
                                  "grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-white",
                                  locked ? "bg-slate-400" : ""
                                )}
                                style={locked ? undefined : { background: EVZ.green }}
                              >
                                <Icon className="h-5 w-5" />
                              </div>

                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-slate-900">{it.title}</div>
                                  <Pill label={it.tier} tone={toneForTier(it.tier)} />
                                  <Pill label={it.health} tone={toneForHealth(it.health)} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">
                                  {it.category} • Updated {timeAgo(it.lastUpdatedAt)}
                                </div>
                                <div className="mt-2 line-clamp-2 text-sm text-slate-700">{it.description}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {it.tags.slice(0, 4).map((t) => (
                                    <Pill key={`${it.id}-${t}`} label={t} tone="neutral" />
                                  ))}
                                  {it.tags.length > 4 ? <Pill label="+more" tone="neutral" /> : null}
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-2">
                              <button
                                type="button"
                                className={cn(
                                  "rounded-2xl p-2",
                                  pinnedOn
                                    ? "bg-amber-50 text-amber-900 ring-1 ring-amber-200"
                                    : "text-slate-500 hover:bg-slate-100"
                                )}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  togglePin(it.id);
                                  toast({ title: pinnedOn ? "Unpinned" : "Pinned", message: it.title, kind: "info" });
                                }}
                                aria-label={pinnedOn ? "Unpin" : "Pin"}
                              >
                                <Star className={cn("h-4 w-4", pinnedOn && "fill-current")} />
                              </button>

                              <Button
                                variant={locked ? "outline" : "primary"}
                                className="px-3 py-2 text-xs"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openItem(it);
                                }}
                              >
                                {locked ? <Lock className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                                {locked ? "Request" : "Open"}
                              </Button>
                            </div>
                          </div>

                          {locked ? (
                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              Locked for role: <span className="font-semibold">{viewAs}</span>. Request access to proceed.
                            </div>
                          ) : null}
                        </button>
                      );
                    })}

                    {!filtered.length ? <Empty title="No matches" subtitle="Try a different search or category." /> : null}
                  </div>
                </Section>
              </div>

              {/* Right rail */}
              <div className="lg:col-span-4 space-y-4">
                <Section
                  title="Selected"
                  subtitle="Details and quick actions"
                  right={
                    <Pill
                      label={canAccessSelected ? "Accessible" : "Locked"}
                      tone={canAccessSelected ? "good" : "warn"}
                    />
                  }
                >
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{selected.title}</div>
                          <Pill label={selected.tier} tone={toneForTier(selected.tier)} />
                          <Pill label={selected.health} tone={toneForHealth(selected.health)} />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {selected.category} • Updated {timeAgo(selected.lastUpdatedAt)}
                        </div>
                        <div className="mt-3 text-sm text-slate-700">{selected.description}</div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                          Path: <span className="font-mono">{selected.path}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Pill label={`Allowed roles: ${selected.roles.join(", ")}`} tone="neutral" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant={canAccessSelected ? "primary" : "outline"} onClick={() => openItem(selected)}>
                        <ChevronRight className="h-4 w-4" />
                        {canAccessSelected ? "Open" : "Request access"}
                      </Button>

                      <Button variant="outline" onClick={() => void copyLink(selected.path)}>
                        <Copy className="h-4 w-4" /> Copy link
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => {
                          togglePin(selected.id);
                          toast({
                            title: pinned.includes(selected.id) ? "Unpinned" : "Pinned",
                            message: selected.title,
                            kind: "info",
                          });
                        }}
                      >
                        <Star className={cn("h-4 w-4", pinned.includes(selected.id) && "fill-current")} />
                        {pinned.includes(selected.id) ? "Unpin" : "Pin"}
                      </Button>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2">
                      {selected.quickActions.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-3 text-left hover:bg-slate-50"
                          onClick={() => {
                            if (a.kind === "copy") {
                              void copyLink(selected.path);
                              return;
                            }
                            if (a.kind === "open") {
                              openItem(selected);
                              return;
                            }
                            toast({ title: "Action", message: a.hint || a.label, kind: "info" });
                          }}
                        >
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{a.label}</div>
                            {a.hint ? <div className="mt-1 text-xs text-slate-500">{a.hint}</div> : null}
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </button>
                      ))}
                    </div>
                  </div>
                </Section>

                <Section
                  title="Go-live readiness"
                  subtitle="Quick snapshot of key configuration."
                  right={
                    <Pill
                      label={goLiveReadiness >= 80 ? "On track" : "Needs work"}
                      tone={goLiveReadiness >= 80 ? "good" : "warn"}
                    />
                  }
                >
                  <div className="flex items-center justify-between gap-3 rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-center gap-3">
                      <ProgressRing value={goLiveReadiness} />
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{goLiveReadiness}%</div>
                        <div className="mt-1 text-xs text-slate-500">
                          Org setup, modules, billing, security, integrations
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      className="px-3 py-2 text-xs"
                      onClick={() => {
                        setSelectedId("org_setup");
                        toast({ title: "Tip", message: "Start with Organization Setup wizard.", kind: "info" });
                      }}
                    >
                      <ChevronRight className="h-4 w-4" /> Wizard
                    </Button>
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    This is a demo readiness score for the settings hub.
                  </div>
                </Section>

                <Section title="Pinned" subtitle="Your top shortcuts" right={<Pill label={`${pinned.length}`} tone="neutral" />}>
                  <div className="space-y-2">
                    {pinned
                      .map((id) => items.find((i) => i.id === id))
                      .filter(Boolean)
                      .map((it) => {
                        const item = it as SettingsItem;
                        const Icon = item.icon;
                        const locked = !item.roles.includes(viewAs);
                        return (
                          <button
                            key={item.id}
                            type="button"
                            className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                            onClick={() => setSelectedId(item.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <div
                                  className={cn(
                                    "grid h-10 w-10 place-items-center rounded-2xl text-white",
                                    locked ? "bg-slate-400" : ""
                                  )}
                                  style={locked ? undefined : { background: EVZ.green }}
                                >
                                  <Icon className="h-5 w-5" />
                                </div>
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{item.title}</div>
                                  <div className="mt-1 text-xs text-slate-500">{item.path}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {locked ? (
                                  <Lock className="h-4 w-4 text-slate-400" />
                                ) : (
                                  <ChevronRight className="h-5 w-5 text-slate-400" />
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    {!pinned.length ? <Empty title="No pinned items" subtitle="Pin settings you use most." /> : null}
                  </div>
                </Section>

                <Section title="Recent changes" subtitle="Last updates" right={<Pill label="Live" tone="info" />}>
                  <div className="space-y-2">
                    {recentChanges.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50"
                        onClick={() => {
                          const it = items.find((i) => i.path === c.path);
                          if (it) setSelectedId(it.id);
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={c.health} tone={toneForHealth(c.health)} />
                              <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {timeAgo(c.at)} • {c.note}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </div>
                      </button>
                    ))}
                  </div>
                </Section>

                <Section title="Help" subtitle="Guidance and support" right={<Pill label="Core" tone="neutral" />}>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      onClick={() => toast({ title: "Help Center", message: "Opening help center (demo).", kind: "info" })}
                    >
                      <HelpCircle className="h-4 w-4" /> Help Center
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedId("support_tools");
                        toast({ title: "Request support", message: "Create a support case from Support Tools.", kind: "info" });
                      }}
                    >
                      <MessageSquare className="h-4 w-4" /> Request support
                    </Button>
                  </div>
                </Section>
              </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              Admin Settings Hub v2: single umbrella page linking to all CorporatePay settings. Includes search, category
              filters, pinned shortcuts, role-gated access requests, and a readiness snapshot.
            </div>
          </footer>
        </div>
      </div>

      {/* Access request modal */}
      <Modal
        open={accessModalOpen}
        title="Request access"
        subtitle="This creates a request for Org Admin to grant permissions."
        onClose={() => setAccessModalOpen(false)}
        actions={[{ label: "Submit", onClick: requestAccess }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAccessModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={requestAccess}>
              <BadgeCheck className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Role</div>
          <div className="mt-1 text-sm text-slate-700">{viewAs}</div>
          <div className="mt-3 text-sm font-semibold text-slate-900">Setting</div>
          <div className="mt-1 text-sm text-slate-700">{accessItemId}</div>
        </div>

        <div className="mt-3">
          <textarea
            value={accessReason}
            onChange={(e) => setAccessReason(e.target.value)}
            placeholder="Explain why you need access and for how long"
            rows={4}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
          />
          <div className="mt-2 text-xs text-slate-600">Requests should be auditable and time-bounded in production.</div>
        </div>
      </Modal>
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
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
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
