import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  FileText,
  Filter,
  Globe,
  HelpCircle,
  Layers,
  Link2,
  MessageCircle,
  Plus,
  RefreshCcw,
  Search,
  Shield,
  Sparkles,
  Store,
  Tag,
  Ticket,
  Timer,
  Trash2,
  Users,
  X,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
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
            className="fixed inset-0 z-50 m-auto flex w-[min(980px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW, maxHeight: "90vh" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex flex-none items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
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
            <div className="flex-1 overflow-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="flex-none border-t border-slate-200 px-5 py-4">{footer}</div>
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
  toasts: Array<{ id: string; title: string; message?: string; kind: string }>;
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

// Taxonomy

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

type Severity = "Info" | "Warning" | "Critical";

type EventKind =
  | "Approval"
  | "Payment"
  | "Reminder"
  | "Budget"
  | "Policy"
  | "Vendor"
  | "Quote";

type Channel = "Email" | "WhatsApp" | "WeChat" | "SMS";

type DeliveryStatus = "Sent" | "Delivered" | "Failed" | "Queued";

type EventRow = {
  id: string;
  ts: number;
  severity: Severity;
  kind: EventKind;
  module: ServiceModule;
  marketplace?: Marketplace | "-";
  title: string;
  body: string;
  // for actions
  assignedTo?: string | null;
  status: "Open" | "Snoozed" | "Resolved";
  snoozeUntil?: number | null;
  rootCauseKey: string;
  // delivery
  deliveries: Array<{ channel: Channel; status: DeliveryStatus; detail: string }>;
  // audit
  why: {
    rule: string;
    triggeredBy: string;
    audience: string;
    auditId: string;
  };
};

type DigestRule = {
  id: string;
  enabled: boolean;
  frequency: "Daily" | "Weekly";
  role: "All" | "Org Admin" | "Accountant" | "Approver" | "Manager";
  includeSev: Severity[];
  includeKinds: EventKind[];
  channels: Channel[];
  timeOfDay: string; // HH:MM
};

type RoutingRule = {
  id: string;
  enabled: boolean;
  name: string;
  match: {
    kinds: EventKind[];
    severities: Severity[];
    modules: ServiceModule[];
    marketplaces: Array<Marketplace | "-">;
  };
  routeToRole: "Accountant" | "Approver" | "Org Admin" | "Manager";
};

function sevTone(sev: Severity) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}

function kindIcon(kind: EventKind) {
  switch (kind) {
    case "Approval":
      return <BadgeCheck className="h-4 w-4" />;
    case "Payment":
      return <Shield className="h-4 w-4" />;
    case "Reminder":
      return <Timer className="h-4 w-4" />;
    case "Budget":
      return <Tag className="h-4 w-4" />;
    case "Policy":
      return <FileText className="h-4 w-4" />;
    case "Vendor":
      return <Store className="h-4 w-4" />;
    case "Quote":
      return <Ticket className="h-4 w-4" />;
    default:
      return <Bell className="h-4 w-4" />;
  }
}

function clusterLabel(key: string) {
  // friendly labels for clustering keys
  const map: Record<string, string> = {
    "pay_fail_gateway": "Payment gateway failures",
    "policy_breach_hours": "Outside working hours policy breaches",
    "vendor_anomaly_shenzhen": "Shenzhen Store anomaly cluster",
    "rfq_sla_breach": "RFQ SLA breaches",
    "budget_near_cap_sales": "Sales nearing budget cap",
    "invoice_overdue": "Overdue invoices",
  };
  return map[key] || key;
}

function groupBy<T>(arr: T[], keyFn: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const it of arr) {
    const k = keyFn(it);
    out[k] = out[k] || [];
    out[k].push(it);
  }
  return out;
}

export default function CorporatePayNotificationsCenterV2() {
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message?: string; kind: string }>
  >([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

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

  const [orgName] = useState("Acme Group Ltd");

  const [q, setQ] = useState("");
  const [sev, setSev] = useState<"All" | Severity>("All");
  const [kind, setKind] = useState<"All" | EventKind>("All");
  const [module, setModule] = useState<"All" | ServiceModule>("All");
  const [marketplace, setMarketplace] = useState<"All" | Marketplace | "-">("All");
  const [includeQuotes, setIncludeQuotes] = useState(true);

  const marketplaceEnabled = useMemo(() => module === "All" || module === "E-Commerce", [module]);

  const [assignee, setAssignee] = useState("You");
  const [showMineOnly, setShowMineOnly] = useState(false);

  const [clusterMode, setClusterMode] = useState(true);

  const [events, setEvents] = useState<EventRow[]>(() => {
    const now = Date.now();
    return [
      {
        id: "EVT-1001",
        ts: now - 12 * 60 * 1000,
        severity: "Critical",
        kind: "Payment",
        module: "Finance & Payments",
        marketplace: "-",
        title: "Failed payment attempts",
        body: "2 wallet top-ups failed due to gateway error. Risk of hold if unpaid invoices persist.",
        assignedTo: null,
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "pay_fail_gateway",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered to finance@acme.com" },
          { channel: "WhatsApp", status: "Failed", detail: "User not opted-in" },
          { channel: "SMS", status: "Sent", detail: "Sent to +256700..." },
          { channel: "WeChat", status: "Queued", detail: "Awaiting channel token" },
        ],
        why: {
          rule: "Collections: payment failure alert",
          triggeredBy: "Payment gateway returned error code 502",
          audience: "Org Admin + Accountant",
          auditId: "AUD-90021",
        },
      },
      {
        id: "EVT-1002",
        ts: now - 2 * 60 * 60 * 1000,
        severity: "Warning",
        kind: "Policy",
        module: "Rides & Logistics",
        marketplace: "-",
        title: "Policy breach: outside working hours",
        body: "4 rides requested outside allowed time window. Consider tightening policy or enabling approvals.",
        assignedTo: "You",
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "policy_breach_hours",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered to admin@acme.com" },
          { channel: "WhatsApp", status: "Delivered", detail: "Delivered to WhatsApp group" },
          { channel: "SMS", status: "Delivered", detail: "Delivered" },
          { channel: "WeChat", status: "Sent", detail: "Sent" },
        ],
        why: {
          rule: "Policy engine: breach alert",
          triggeredBy: "Requests created outside Mon-Fri 06:00-22:00",
          audience: "Org Admin + Approver",
          auditId: "AUD-90042",
        },
      },
      {
        id: "EVT-1003",
        ts: now - 4 * 60 * 60 * 1000,
        severity: "Warning",
        kind: "Vendor",
        module: "E-Commerce",
        marketplace: "MyLiveDealz",
        title: "Anomaly: Shenzhen Store spend",
        body: "Vendor spend is 3.1× typical in the last 24h. Review vendor rule or require approvals.",
        assignedTo: null,
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "vendor_anomaly_shenzhen",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered" },
          { channel: "WhatsApp", status: "Delivered", detail: "Delivered" },
          { channel: "WeChat", status: "Delivered", detail: "Delivered" },
          { channel: "SMS", status: "Delivered", detail: "Delivered" },
        ],
        why: {
          rule: "Anomaly detection: vendor spike",
          triggeredBy: "Spend spike in MyLiveDealz orders",
          audience: "Org Admin + Accountant",
          auditId: "AUD-90110",
        },
      },
      {
        id: "EVT-1004",
        ts: now - 26 * 60 * 60 * 1000,
        severity: "Critical",
        kind: "Quote",
        module: "Rides & Logistics",
        marketplace: "-",
        title: "RFQ escalation: past SLA",
        body: "RFQ-390 is escalated and past SLA. High-value asset requires action.",
        assignedTo: "Approver Desk",
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "rfq_sla_breach",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered" },
          { channel: "WhatsApp", status: "Delivered", detail: "Delivered" },
          { channel: "SMS", status: "Delivered", detail: "Delivered" },
          { channel: "WeChat", status: "Delivered", detail: "Delivered" },
        ],
        why: {
          rule: "Approvals: SLA breach escalation",
          triggeredBy: "SLA timer reached 0",
          audience: "Approver + Org Admin",
          auditId: "AUD-90200",
        },
      },
      {
        id: "EVT-1005",
        ts: now - 3 * 24 * 60 * 60 * 1000,
        severity: "Info",
        kind: "Budget",
        module: "Rides & Logistics",
        marketplace: "-",
        title: "Budget alert: Sales at 82%",
        body: "Sales group has reached 82% of monthly cap. Consider adjust or enforce.",
        assignedTo: "Finance Desk",
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "budget_near_cap_sales",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered" },
          { channel: "WhatsApp", status: "Sent", detail: "Sent" },
          { channel: "SMS", status: "Delivered", detail: "Delivered" },
          { channel: "WeChat", status: "Queued", detail: "Queued" },
        ],
        why: {
          rule: "Budget monitor: threshold 80%",
          triggeredBy: "Spend ratio crossed 80%",
          audience: "Accountant + Manager",
          auditId: "AUD-90300",
        },
      },
      {
        id: "EVT-1006",
        ts: now - 6 * 24 * 60 * 60 * 1000,
        severity: "Warning",
        kind: "Reminder",
        module: "Finance & Payments",
        marketplace: "-",
        title: "Invoice overdue reminder",
        body: "1 invoice overdue. Dunning schedule will escalate if unpaid.",
        assignedTo: null,
        status: "Open",
        snoozeUntil: null,
        rootCauseKey: "invoice_overdue",
        deliveries: [
          { channel: "Email", status: "Delivered", detail: "Delivered" },
          { channel: "WhatsApp", status: "Failed", detail: "Opt-out" },
          { channel: "SMS", status: "Delivered", detail: "Delivered" },
          { channel: "WeChat", status: "Sent", detail: "Sent" },
        ],
        why: {
          rule: "Collections: overdue reminder",
          triggeredBy: "Invoice unpaid after due date",
          audience: "Accountant + Org Admin",
          auditId: "AUD-90410",
        },
      },
    ];
  });

  // Premium: smart digests
  const [digestRules, setDigestRules] = useState<DigestRule[]>(() => [
    {
      id: "DG-01",
      enabled: true,
      frequency: "Daily",
      role: "Accountant",
      includeSev: ["Warning", "Critical"],
      includeKinds: ["Payment", "Reminder", "Budget"],
      channels: ["Email", "WhatsApp"],
      timeOfDay: "08:30",
    },
    {
      id: "DG-02",
      enabled: true,
      frequency: "Daily",
      role: "Approver",
      includeSev: ["Warning", "Critical"],
      includeKinds: ["Approval", "Quote"],
      channels: ["Email", "SMS"],
      timeOfDay: "09:00",
    },
    {
      id: "DG-03",
      enabled: true,
      frequency: "Weekly",
      role: "Org Admin",
      includeSev: ["Info", "Warning", "Critical"],
      includeKinds: ["Payment", "Budget", "Policy", "Vendor", "Quote"],
      channels: ["Email"],
      timeOfDay: "08:00",
    },
  ]);

  // Premium: routing rules
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(() => [
    {
      id: "RR-01",
      enabled: true,
      name: "Finance alerts to Accountants",
      match: {
        kinds: ["Payment", "Reminder", "Budget"],
        severities: ["Warning", "Critical", "Info"],
        modules: ["Finance & Payments"],
        marketplaces: ["-"],
      },
      routeToRole: "Accountant",
    },
    {
      id: "RR-02",
      enabled: true,
      name: "Approval reminders to Approvers",
      match: {
        kinds: ["Approval", "Quote"],
        severities: ["Warning", "Critical"],
        modules: ["Rides & Logistics", "E-Commerce"],
        marketplaces: ["-", "MyLiveDealz"],
      },
      routeToRole: "Approver",
    },
  ]);

  // Event actions
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<EventRow | null>(null);
  const [assignTo, setAssignTo] = useState("You");

  const [whyOpen, setWhyOpen] = useState(false);
  const [whyTarget, setWhyTarget] = useState<EventRow | null>(null);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleTarget, setRuleTarget] = useState<EventRow | null>(null);

  const [digestOpen, setDigestOpen] = useState(false);
  const [routingOpen, setRoutingOpen] = useState(false);

  // Derived filtering
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return events.filter((e) => {
      if (!includeQuotes && e.kind === "Quote") return false;
      if (sev !== "All" && e.severity !== sev) return false;
      if (kind !== "All" && e.kind !== kind) return false;
      if (module !== "All" && e.module !== module) return false;
      if (marketplace !== "All") {
        if (marketplaceEnabled) {
          if ((e.marketplace || "-") !== marketplace) return false;
        } else {
          // marketplace filter only meaningful for e-commerce
          if (marketplace !== "-") return false;
        }
      }
      if (showMineOnly) {
        if ((e.assignedTo || "") !== assignee) return false;
      }
      if (query) {
        const blob = `${e.id} ${e.title} ${e.body} ${e.kind} ${e.severity} ${e.module} ${e.marketplace || "-"}`.toLowerCase();
        if (!blob.includes(query)) return false;
      }
      
      // Hide snoozed items if snooze time is in future
      if (e.status === "Snoozed" && e.snoozeUntil && e.snoozeUntil > Date.now()) {
        return false;
      }

      return true;
    });
  }, [events, q, sev, kind, module, marketplace, includeQuotes, showMineOnly, assignee, marketplaceEnabled]);

  const openCount = useMemo(() => filtered.filter((e) => e.status === "Open").length, [filtered]);
  const criticalCount = useMemo(() => filtered.filter((e) => e.status === "Open" && e.severity === "Critical").length, [filtered]);

  const clusters = useMemo(() => {
    const groups = groupBy(filtered, (e) => e.rootCauseKey);
    const keys = Object.keys(groups);
    // Sort clusters by highest severity and recency
    const rank = (arr: EventRow[]) => {
      const sevScore = (s: Severity) => (s === "Critical" ? 3 : s === "Warning" ? 2 : 1);
      const maxSev = Math.max(...arr.map((x) => sevScore(x.severity)));
      const latest = Math.max(...arr.map((x) => x.ts));
      return { maxSev, latest };
    };
    keys.sort((a, b) => {
      const ra = rank(groups[a]);
      const rb = rank(groups[b]);
      if (rb.maxSev !== ra.maxSev) return rb.maxSev - ra.maxSev;
      return rb.latest - ra.latest;
    });
    return keys.map((k) => ({ key: k, label: clusterLabel(k), items: groups[k] }));
  }, [filtered]);

  const canShowMarketplace = useMemo(() => module === "All" || module === "E-Commerce", [module]);

  const snooze = (e: EventRow, minutes: number) => {
    const until = Date.now() + minutes * 60 * 1000;
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: "Snoozed", snoozeUntil: until } : x)));
    toast({ title: "Snoozed", message: `${e.id} snoozed for ${minutes} minutes.`, kind: "info" });
  };

  const resolve = (e: EventRow) => {
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, status: "Resolved", snoozeUntil: null } : x)));
    toast({ title: "Resolved", message: `${e.id} resolved.`, kind: "success" });
  };

  const assign = (e: EventRow, who: string) => {
    setEvents((prev) => prev.map((x) => (x.id === e.id ? { ...x, assignedTo: who } : x)));
    toast({ title: "Assigned", message: `${e.id} assigned to ${who}.`, kind: "success" });
  };

  const createRuleFrom = (e: EventRow) => {
    setRuleTarget(e);
    setRuleOpen(true);
  };

  const createDigestPreview = () => {
    toast({ title: "Digest preview", message: "Generating digest preview (demo).", kind: "info" });
  };

  const triggerSendDigest = () => {
    toast({ title: "Digest sent", message: "Digest sent to configured channels (demo).", kind: "success" });
    setDigestOpen(false);
  };

  const toggleDigestEnabled = (id: string) => {
    setDigestRules((prev) => prev.map((d) => (d.id === id ? { ...d, enabled: !d.enabled } : d)));
  };

  const toggleRoutingEnabled = (id: string) => {
    setRoutingRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const addRoutingRuleFromTemplate = () => {
    const r: RoutingRule = {
      id: uid("RR"),
      enabled: true,
      name: "Policy breaches to Approvers",
      match: {
        kinds: ["Policy"],
        severities: ["Warning", "Critical"],
        modules: ["Rides & Logistics"],
        marketplaces: ["-"],
      },
      routeToRole: "Approver",
    };
    setRoutingRules((p) => [r, ...p]);
    toast({ title: "Rule added", message: "Routing rule added from template.", kind: "success" });
  };

  const handleExport = () => {
    const headers = ["ID", "Timestamp", "Severity", "Kind", "Module", "Marketplace", "Title", "Body", "AssignedTo", "Status"];
    const rows = filtered.map(e => [
      e.id,
      new Date(e.ts).toISOString(),
      e.severity,
      e.kind,
      e.module,
      e.marketplace || "-",
      `"${e.title.replace(/"/g, '""')}"`,
      `"${e.body.replace(/"/g, '""')}"`,
      e.assignedTo || "",
      e.status
    ]);
    
    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `notifications_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export ready", message: "Download started.", kind: "success" });
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))",
      }}
    >
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Notifications and Activity Center</div>
                  <div className="mt-1 text-xs text-slate-500">Organization: {orgName} • Unified feed across approvals, billing, policies, budgets, vendors, and quotes.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`${openCount} open`} tone={openCount ? "warn" : "good"} />
                    {criticalCount ? <Pill label={`${criticalCount} critical`} tone="bad" /> : null}
                    <Pill label={clusterMode ? `Clusters: ${clusters.length}` : `Events: ${filtered.length}`} tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setDigestOpen(true)}>
                  <CalendarClock className="h-4 w-4" /> Digests
                </Button>
                <Button variant="outline" onClick={() => setRoutingOpen(true)}>
                  <ShuffleIcon /> Routing rules
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <FileText className="h-4 w-4" /> Export
                </Button>
                <Button variant="primary" onClick={() => toast({ title: "Refresh", message: "Feed refreshed (demo).", kind: "success" })}>
                  <RefreshCcw className="h-4 w-4" /> Refresh
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Approvals, payments, policies..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-600">Severity</div>
                <select
                  value={sev}
                  onChange={(e) => setSev(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="All">All</option>
                  <option value="Info">Info</option>
                  <option value="Warning">Warning</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-600">Module</div>
                <select
                  value={module}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setModule(v);
                    if (v !== "All" && v !== "E-Commerce") setMarketplace("All");
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900 outline-none"
                >
                  <option value="All">All</option>
                  {SERVICE_MODULES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className={cn("rounded-2xl border px-3 py-2", canShowMarketplace ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70")}>
                <div className="text-xs font-semibold text-slate-600">Marketplace / Quotes</div>
                <div className="mt-1 grid grid-cols-2 gap-2">
                  <select
                    value={marketplace}
                    disabled={!canShowMarketplace}
                    onChange={(e) => setMarketplace(e.target.value as any)}
                    className={cn(
                      "w-full rounded-xl border px-2 py-2 text-sm font-semibold outline-none",
                      canShowMarketplace ? "border-slate-200 bg-white text-slate-900" : "border-slate-200 bg-slate-50 text-slate-500"
                    )}
                  >
                    <option value="All">All</option>
                    <option value="-">(No marketplace)</option>
                    {MARKETPLACES.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <label className={cn("flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold", !includeQuotes && "opacity-80")}>
                    <span className="text-slate-700">Quotes</span>
                    <input
                      type="checkbox"
                      checked={includeQuotes}
                      onChange={(e) => setIncludeQuotes(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </label>
                </div>
                {!canShowMarketplace ? <div className="mt-1 text-xs text-slate-500">Marketplace applies to E-Commerce only.</div> : null}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={clusterMode}
                    onChange={(e) => setClusterMode(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Cluster mode
                  <Pill label="Premium" tone="info" />
                </label>

                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={showMineOnly}
                    onChange={(e) => setShowMineOnly(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  Assigned to me
                </label>

                <div className={cn("rounded-2xl border border-slate-200 bg-white px-3 py-2", !showMineOnly && "opacity-70")}>
                  <div className="text-xs font-semibold text-slate-600">Assignee</div>
                  <select
                    value={assignee}
                    disabled={!showMineOnly}
                    onChange={(e) => setAssignee(e.target.value)}
                    className={cn(
                      "mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 outline-none",
                      !showMineOnly && "bg-slate-50 text-slate-500"
                    )}
                  >
                    <option>You</option>
                    <option>Finance Desk</option>
                    <option>Approver Desk</option>
                    <option>Org Admin</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => {
                  setQ(""); setSev("All"); setKind("All"); setModule("All"); setMarketplace("All"); setIncludeQuotes(true);
                  toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                }}>
                  <Filter className="h-4 w-4" /> Reset
                </Button>
                <Button variant="outline" onClick={() => toast({ title: "Bulk", message: "Bulk actions (demo).", kind: "info" })}>
                  <Sparkles className="h-4 w-4" /> Bulk actions
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {clusterMode ? (
              <div className="space-y-4">
                {clusters.map((c) => (
                  <ClusterCard
                    key={c.key}
                    clusterKey={c.key}
                    label={c.label}
                    items={c.items}
                    onOpen={(e) => {
                      setWhyTarget(e);
                      setWhyOpen(true);
                    }}
                    onAssign={(e) => {
                      setAssignTarget(e);
                      setAssignTo(e.assignedTo || "You");
                      setAssignOpen(true);
                    }}
                    onResolve={(e) => resolve(e)}
                    onSnooze={(e, min) => snooze(e, min)}
                    onRule={(e) => createRuleFrom(e)}
                  />
                ))}
                {!clusters.length ? (
                  <Empty title="No events" subtitle="No notifications match your filters." />
                ) : null}
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((e) => (
                  <EventCard
                    key={e.id}
                    e={e}
                    onWhy={() => { setWhyTarget(e); setWhyOpen(true); }}
                    onAssign={() => { setAssignTarget(e); setAssignTo(e.assignedTo || "You"); setAssignOpen(true); }}
                    onResolve={() => resolve(e)}
                    onSnooze={(min) => snooze(e, min)}
                    onRule={() => createRuleFrom(e)}
                  />
                ))}
                {!filtered.length ? (
                  <Empty title="No events" subtitle="No notifications match your filters." />
                ) : null}
              </div>
            )}

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Premium controls</div>
                  <div className="mt-1 text-xs text-slate-500">Digests and routing rules improve signal-to-noise.</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" onClick={() => setDigestOpen(true)}>
                    <CalendarClock className="h-4 w-4" /> Configure digests
                  </Button>
                  <Button variant="outline" onClick={() => setRoutingOpen(true)}>
                    <ShuffleIcon /> Configure routing
                  </Button>
                  <Button variant="primary" onClick={() => toast({ title: "Done", message: "Premium controls saved (demo).", kind: "success" })}>
                    <Check className="h-4 w-4" /> Save
                  </Button>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold">Digests</div>
                  <div className="mt-1 text-slate-600">Daily/weekly summaries by role. Reduce notification fatigue.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold">Routing rules</div>
                  <div className="mt-1 text-slate-600">Send finance alerts to Accountants, approval reminders to Approvers.</div>
                </div>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              B Notifications v2: unified feed with filters, actions, delivery logs, audit-linked explanations, smart digests, routing rules, and logic-based clustering.
            </div>
          </div>
        </div>
      </div>

      {/* Assign modal */}
      <Modal
        open={assignOpen}
        title="Assign event"
        subtitle="Assign an event to a person or desk (audit logged in production)."
        onClose={() => setAssignOpen(false)}
        actions={[{ label: "Assign", onClick: () => {
          if (!assignTarget) return;
          assign(assignTarget, assignTo);
          setAssignOpen(false);
        } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAssignOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!assignTarget) return;
                assign(assignTarget, assignTo);
                setAssignOpen(false);
              }}
            >
              <Users className="h-4 w-4" /> Assign
            </Button>
          </div>
        }
      >
        {assignTarget ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="font-semibold">Event</div>
              <div className="mt-1 text-slate-600">{assignTarget.id} • {assignTarget.title}</div>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Assign to</div>
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                <option>You</option>
                <option>Finance Desk</option>
                <option>Approver Desk</option>
                <option>Org Admin</option>
                <option>Support Desk</option>
              </select>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Why modal */}
      <Modal
        open={whyOpen}
        title="Why did I get this?"
        subtitle="Audit-linked explanation of rules and triggers."
        onClose={() => setWhyOpen(false)}
        actions={[{ label: "Close", onClick: () => setWhyOpen(false) }]}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setWhyOpen(false)}>Close</Button>
          </div>
        }
      >
        {whyTarget ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Event</div>
                  <div className="mt-1 text-xs text-slate-500">{whyTarget.id} • {whyTarget.kind} • {whyTarget.severity}</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{whyTarget.title}</div>
                  <div className="mt-1 text-sm text-slate-700">{whyTarget.body}</div>
                </div>
                <Pill label={whyTarget.status} tone={whyTarget.status === "Resolved" ? "good" : whyTarget.status === "Snoozed" ? "warn" : "info"} />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="text-sm font-semibold text-slate-900">Explanation</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <ExplainRow label="Rule" value={whyTarget.why.rule} />
                <ExplainRow label="Triggered by" value={whyTarget.why.triggeredBy} />
                <ExplainRow label="Audience" value={whyTarget.why.audience} />
                <ExplainRow label="Audit ID" value={whyTarget.why.auditId} />
              </div>
              <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600">
                Premium: This links to the immutable audit log record and policy version.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Delivery logs</div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {whyTarget.deliveries.map((d) => (
                  <div key={d.channel} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold text-slate-600">{d.channel}</div>
                      <Pill label={d.status} tone={d.status === "Failed" ? "bad" : d.status === "Queued" ? "warn" : "good"} />
                    </div>
                    <div className="mt-2 text-xs text-slate-600">{d.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Create rule modal */}
      <Modal
        open={ruleOpen}
        title="Create rule from this event"
        subtitle="Generate a policy/routing rule draft based on the event."
        onClose={() => setRuleOpen(false)}
        actions={[{ label: "Create", onClick: () => {
          setRuleOpen(false);
          toast({ title: "Rule created", message: "Rule draft created (demo).", kind: "success" });
        } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setRuleOpen(false);
                toast({ title: "Rule created", message: "Rule draft created (demo).", kind: "success" });
              }}
            >
              <Plus className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        {ruleTarget ? (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <div className="font-semibold">Event</div>
              <div className="mt-1 text-slate-600">{ruleTarget.id} • {ruleTarget.title}</div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Suggested rule</div>
              <div className="mt-2 text-xs text-slate-600">This is a safe draft. Review before saving.</div>
              <pre className="mt-3 overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(
                  {
                    if: {
                      kind: ruleTarget.kind,
                      severity: ruleTarget.severity,
                      module: ruleTarget.module,
                      marketplace: ruleTarget.marketplace || "-",
                      rootCause: ruleTarget.rootCauseKey,
                    },
                    then: {
                      action: ruleTarget.kind === "Vendor" ? "Require approvals for vendor" : "Route to role",
                      routeTo: ruleTarget.kind === "Payment" ? "Accountant" : "Approver",
                      notify: ["Email", "WhatsApp"],
                    },
                    notes: "Generated from event. Audit logged.",
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Digests modal */}
      <Modal
        open={digestOpen}
        title="Smart digests"
        subtitle="Daily/weekly summaries by role and channel."
        onClose={() => setDigestOpen(false)}
        actions={[{ label: "Send now", onClick: triggerSendDigest }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDigestOpen(false)}>Close</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={createDigestPreview}>
                <FileText className="h-4 w-4" /> Preview
              </Button>
              <Button variant="primary" onClick={triggerSendDigest}>
                <CalendarClock className="h-4 w-4" /> Send now
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {digestRules.map((d) => (
            <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{d.frequency} digest</div>
                    <Pill label={`Role: ${d.role}`} tone="info" />
                    <Pill label={`Time: ${d.timeOfDay}`} tone="neutral" />
                    <Pill label={d.enabled ? "Enabled" : "Off"} tone={d.enabled ? "good" : "neutral"} />
                  </div>
                  <div className="mt-2 text-xs text-slate-600">
                    Include: {d.includeSev.join(", ")} • {d.includeKinds.join(", ")}
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Channels: {d.channels.join(", ")}
                  </div>
                </div>
                <button
                  type="button"
                  className={cn(
                    "relative h-7 w-12 rounded-full transition",
                    d.enabled ? "border-emerald-300 bg-emerald-200" : "border-amber-300 bg-white"
                  )}
                  onClick={() => toggleDigestEnabled(d.id)}
                  aria-label="Toggle digest"
                  style={{ border: d.enabled ? "none" : "2px solid #F77F00" }} // Orange ring when off
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                      d.enabled ? "left-[22px]" : "left-1 ring-1 ring-slate-200"
                    )}
                  />
                </button>
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Premium: digests are generated from clustering and routing rules to reduce noise.
              </div>
            </div>
          ))}
        </div>
      </Modal>


      {/* Routing rules modal */}
      <Modal
        open={routingOpen}
        title="Routing rules"
        subtitle="Send finance alerts to Accountants, approvals to Approvers, etc."
        onClose={() => setRoutingOpen(false)}
        actions={[{ label: "Save", onClick: () => {
          toast({ title: "Saved", message: "Routing rules saved (demo).", kind: "success" });
          setRoutingOpen(false);
        } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRoutingOpen(false)}>Close</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={addRoutingRuleFromTemplate}>
                <Plus className="h-4 w-4" /> Add template
              </Button>
              <Button variant="primary" onClick={() => {
                toast({ title: "Saved", message: "Routing rules saved (demo).", kind: "success" });
                setRoutingOpen(false);
              }}>
                <Check className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          {routingRules.map((r) => (
            <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                    <Pill label={`Route to ${r.routeToRole}`} tone="info" />
                    <Pill label={r.enabled ? "Enabled" : "Off"} tone={r.enabled ? "good" : "neutral"} />
                  </div>
                  <div className="mt-2 text-xs text-slate-600">Kinds: {r.match.kinds.join(", ")}</div>
                  <div className="mt-1 text-xs text-slate-600">Severities: {r.match.severities.join(", ")}</div>
                  <div className="mt-1 text-xs text-slate-600">Modules: {r.match.modules.join(", ")}</div>
                  <div className="mt-1 text-xs text-slate-600">Marketplaces: {r.match.marketplaces.join(", ")}</div>
                </div>
                <button
                  type="button"
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition",
                    r.enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                  )}
                  onClick={() => toggleRoutingEnabled(r.id)}
                  aria-label="Toggle routing rule"
                  style={!r.enabled ? { border: "2px solid #F77F00" } : undefined}
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                      r.enabled ? "left-[22px]" : "left-1 ring-1 ring-slate-200"
                    )}
                  />
                </button>
              </div>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Premium: routing decisions are logged and visible in "Why did I get this?".
              </div>
            </div>
          ))}
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
          B Notifications & Activity Center v2: unified feed, severity/module/marketplace filters, actions (snooze/assign/resolve/create rule), channel delivery logs, audit explanations, smart digests, routing rules, and clustering.
        </div>
      </footer>
    </div>
  );


}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <Bell className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function EventCard({
  e,
  onWhy,
  onAssign,
  onResolve,
  onSnooze,
  onRule,
}: {
  e: EventRow;
  onWhy: () => void;
  onAssign: () => void;
  onResolve: () => void;
  onSnooze: (min: number) => void;
  onRule: () => void;
}) {
  const tone = sevTone(e.severity);
  const isSnoozed = e.status === "Snoozed";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={e.severity} tone={tone} />
            <Pill label={e.kind} tone="neutral" />
            <Pill label={e.module} tone="neutral" />
            {e.marketplace && e.marketplace !== "-" ? <Pill label={String(e.marketplace)} tone="info" /> : <Pill label="No marketplace" tone="neutral" />}
            <Pill label={e.status} tone={e.status === "Resolved" ? "good" : e.status === "Snoozed" ? "warn" : "info"} />
            {e.assignedTo ? <Pill label={`Assigned: ${e.assignedTo}`} tone="info" /> : <Pill label="Unassigned" tone="warn" />}
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900 truncate">{e.title}</div>
          <div className="mt-1 text-sm text-slate-700">{e.body}</div>
          <div className="mt-2 text-xs text-slate-500">
            {timeAgo(e.ts)} • {formatDateTime(e.ts)} • {e.id}
            {isSnoozed && e.snoozeUntil ? <span className="ml-2">• Snoozed until {formatDateTime(e.snoozeUntil)}</span> : null}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" className="text-xs" onClick={onWhy}>
            <Link2 className="h-4 w-4" /> Why?
          </Button>
          <Button variant="outline" className="text-xs" onClick={onAssign}>
            <Users className="h-4 w-4" /> Assign
          </Button>
          <div className="relative">
            <SnoozeMenu onSnooze={onSnooze} />
          </div>
          <Button variant="outline" className="text-xs" onClick={onRule}>
            <Sparkles className="h-4 w-4" /> Create rule
          </Button>
          <Button variant="primary" className="text-xs" onClick={onResolve}>
            <Check className="h-4 w-4" /> Resolve
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <DeliveryMini deliveries={e.deliveries} />
        <WhyMini why={e.why} />
      </div>
    </div>
  );
}

function ClusterCard({
  clusterKey,
  label,
  items,
  onOpen,
  onAssign,
  onResolve,
  onSnooze,
  onRule,
}: {
  clusterKey: string;
  label: string;
  items: EventRow[];
  onOpen: (e: EventRow) => void;
  onAssign: (e: EventRow) => void;
  onResolve: (e: EventRow) => void;
  onSnooze: (e: EventRow, min: number) => void;
  onRule: (e: EventRow) => void;
}) {
  const maxSev = items.reduce<Severity>((acc, e) => {
    const score = (s: Severity) => (s === "Critical" ? 3 : s === "Warning" ? 2 : 1);
    return score(e.severity) > score(acc) ? e.severity : acc;
  }, "Info");
  const tone = sevTone(maxSev);

  const [open, setOpen] = useState(true);

  const openItems = items.filter((i) => i.status !== "Resolved");

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill label={label} tone={tone} />
            <Pill label={`${items.length} events`} tone="neutral" />
            <Pill label={`${openItems.length} open`} tone={openItems.length ? "warn" : "good"} />
          </div>
          <div className="mt-2 text-sm font-semibold text-slate-900">Root cause: {clusterKey}</div>
          <div className="mt-1 text-xs text-slate-500">Logic-based clustering groups similar alerts into one stack.</div>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-slate-500 transition", open ? "rotate-180" : "rotate-0")} />
      </button>

      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="border-t border-slate-200">
            <div className="space-y-3 p-4">
              {items.map((e) => (
                <EventCard
                  key={e.id}
                  e={e}
                  onWhy={() => onOpen(e)}
                  onAssign={() => onAssign(e)}
                  onResolve={() => onResolve(e)}
                  onSnooze={(min) => onSnooze(e, min)}
                  onRule={() => onRule(e)}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function DeliveryMini({ deliveries }: { deliveries: EventRow["deliveries"] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">Delivery status</div>
        <Pill label={`${deliveries.length} channels`} tone="neutral" />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {deliveries.map((d) => (
          <div key={d.channel} className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-600">{d.channel}</div>
              <Pill label={d.status} tone={d.status === "Failed" ? "bad" : d.status === "Queued" ? "warn" : "good"} />
            </div>
            <div className="mt-2 text-xs text-slate-600">{d.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WhyMini({ why }: { why: EventRow["why"] }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">Why did I get this?</div>
        <Pill label={why.auditId} tone="info" />
      </div>
      <div className="mt-3 space-y-2">
        <MiniRow label="Rule" value={why.rule} />
        <MiniRow label="Triggered by" value={why.triggeredBy} />
        <MiniRow label="Audience" value={why.audience} />
      </div>
      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
        Premium: audit ID links to immutable audit log.
      </div>
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="text-xs font-semibold text-slate-900 text-right">{value}</div>
    </div>
  );
}

function ExplainRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <div className="mt-1 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function SnoozeMenu({ onSnooze }: { onSnooze: (min: number) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        onClick={() => setOpen((v) => !v)}
      >
        <Clock className="h-4 w-4" /> Snooze
        <ChevronDown className={cn("h-4 w-4 transition", open ? "rotate-180" : "rotate-0")} />
      </button>
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="absolute right-0 z-10 mt-2 w-48 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
          >
            {[30, 60, 240, 1440].map((m) => (
              <button
                key={m}
                type="button"
                className="flex w-full items-center justify-between px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
                onClick={() => {
                  onSnooze(m);
                  setOpen(false);
                }}
              >
                <span>{m === 1440 ? "1 day" : `${m} min`}</span>
                <Timer className="h-4 w-4 text-slate-500" />
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ShuffleIcon() {
  // simple inline icon (avoid extra dependency)
  return (
    <span className="grid h-4 w-4 place-items-center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 3h5v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 20l6.5-6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 10l7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 21h5v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4 4l6.5 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 14l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}
