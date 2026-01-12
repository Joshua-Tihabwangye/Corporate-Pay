import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  Copy,
  FileText,
  Filter,
  Flame,
  Group,
  Info,
  ListChecks,
  Paperclip,
  Search,
  Shield,
  Sparkles,
  Timer,
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

type GroupName = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type TxType = "Ride" | "Purchase" | "Service" | "RFQ" | "Exception";

type Risk = "Low" | "Medium" | "High";

type Status =
  | "Pending"
  | "Escalated"
  | "Breached"
  | "Needs info"
  | "Approved"
  | "Rejected"
  | "Changes requested";

type AuditEntry = {
  id: string;
  at: number;
  by: string;
  action: "Approve" | "Reject" | "Request changes" | "Delegate" | "Attachment added" | "Comment added";
  itemId: string;
  why: string;
};

type HistoryEntry = {
  at: number;
  by: string;
  action: string;
  why?: string;
};

type ApprovalItem = {
  id: string;
  tx: TxType;
  module: ServiceModule;
  marketplace: Marketplace | "-";
  group: GroupName;
  requester: string;
  vendor: string;
  amountUGX: number;
  createdAt: number;
  slaDueAt: number;
  status: Status;
  risk: Risk;
  assignedTo: string;
  patternKey: string;
  requiresAttachment: boolean;
  hasAttachment: boolean;
  requiresComment: boolean;
  hasComment: boolean;
  history: HistoryEntry[];
};

type Approver = {
  id: string;
  name: string;
  role: "Approver Desk" | "Finance Desk" | "Procurement Desk" | "CFO" | "Org Admin";
  load: number;
  ooo: boolean;
};

type SortKey = "sla" | "amount" | "group" | "module" | "marketplace";

type GroupMode = "None" | "Requester" | "Vendor" | "Pattern";

type ActionKind = "Approve" | "Reject" | "Request changes";

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

function dueLabel(dueAt: number) {
  const mins = Math.round((dueAt - Date.now()) / 60000);
  const abs = Math.abs(mins);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const body = h ? `${h}h ${m}m` : `${m}m`;
  if (mins >= 0) return `Due in ${body}`;
  return `Overdue by ${body}`;
}

function isBreached(dueAt: number) {
  return Date.now() > dueAt;
}

function isDueSoon(dueAt: number, mins = 120) {
  const d = dueAt - Date.now();
  return d > 0 && d <= mins * 60 * 1000;
}

function riskTone(r: Risk) {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
}

function statusTone(s: Status) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  if (s === "Breached" || s === "Escalated") return "bad" as const;
  if (s === "Changes requested" || s === "Needs info") return "warn" as const;
  return "warn" as const;
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>
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
      className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}
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
}: {
  enabled: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn(
          "relative h-7 w-12 rounded-full border transition",
          enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
        )}
        onClick={() => onChange(!enabled)}
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
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
  options: string[];
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-500"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 shadow-sm outline-none focus:ring-4 focus:ring-emerald-100"
      />
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
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
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
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
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
                {t.message ? <div className="mt-0.5 text-sm text-slate-600">{t.message}</div> : null}
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

function groupBy<T>(arr: T[], keyFn: (t: T) => string) {
  const out: Record<string, T[]> = {};
  for (const it of arr) {
    const k = keyFn(it);
    out[k] = out[k] || [];
    out[k].push(it);
  }
  return out;
}

function bulkSafeguards(items: ApprovalItem[]) {
  const reasons: string[] = [];
  if (!items.length) return { ok: false, reasons: ["Select at least one item"] };

  const open = items.filter((i) => i.status === "Pending" || i.status === "Breached" || i.status === "Escalated" || i.status === "Needs info");
  if (open.length !== items.length) reasons.push("Only open items can be bulk approved");

  const vendors = Array.from(new Set(items.map((i) => i.vendor)));
  if (vendors.length !== 1) reasons.push("Bulk approve requires the same vendor");

  const allLow = items.every((i) => i.risk === "Low");
  if (!allLow) reasons.push("Bulk approve requires low risk items");

  const anyMissingAttachment = items.some((i) => i.requiresAttachment && !i.hasAttachment);
  if (anyMissingAttachment) reasons.push("All items must have required attachments");

  const total = items.reduce((a, b) => a + b.amountUGX, 0);
  if (total > 3000000) reasons.push("Bulk approve total is above safeguard cap (UGX 3,000,000)");

  const ok = reasons.length === 0;
  return { ok, reasons };
}

export default function CorporatePayApprovalsInboxV2() {
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

  const GROUPS: GroupName[] = ["Operations", "Sales", "Finance", "Admin", "Procurement"];

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const now = Date.now();
  const [items, setItems] = useState<ApprovalItem[]>(() => [
    {
      id: "AP-1821",
      tx: "Purchase",
      module: "E-Commerce",
      marketplace: "MyLiveDealz",
      group: "Operations",
      requester: "Mary N.",
      vendor: "Shenzhen Store",
      amountUGX: 654000,
      createdAt: now - 2 * 60 * 60 * 1000,
      slaDueAt: now + 2 * 60 * 60 * 1000,
      status: "Pending",
      risk: "High",
      assignedTo: "Procurement Desk",
      patternKey: "vendor_anomaly_shenzhen",
      requiresAttachment: true,
      hasAttachment: true,
      requiresComment: true,
      hasComment: true,
      history: [{ at: now - 2 * 60 * 60 * 1000, by: "System", action: "Created" }],
    },
    {
      id: "RFQ-390",
      tx: "RFQ",
      module: "Rides & Logistics",
      marketplace: "-",
      group: "Admin",
      requester: "Ronald I.",
      vendor: "Vehicle Supplier",
      amountUGX: 285000000,
      createdAt: now - 26 * 60 * 60 * 1000,
      slaDueAt: now - 2 * 60 * 60 * 1000,
      status: "Escalated",
      risk: "High",
      assignedTo: "CFO",
      patternKey: "rfq_high_value",
      requiresAttachment: true,
      hasAttachment: true,
      requiresComment: true,
      hasComment: true,
      history: [
        { at: now - 26 * 60 * 60 * 1000, by: "System", action: "Created" },
        { at: now - 18 * 60 * 60 * 1000, by: "Manager", action: "Approved", why: "Needed" },
        { at: now - 9 * 60 * 60 * 1000, by: "Finance Desk", action: "Approved", why: "Budget check" },
      ],
    },
    {
      id: "RD-0442",
      tx: "Ride",
      module: "Rides & Logistics",
      marketplace: "-",
      group: "Sales",
      requester: "John S.",
      vendor: "EVzone Rides",
      amountUGX: 41500,
      createdAt: now - 35 * 60 * 1000,
      slaDueAt: now + 3 * 60 * 60 * 1000,
      status: "Pending",
      risk: "Low",
      assignedTo: "Approver Desk",
      patternKey: "commute_repeat",
      requiresAttachment: false,
      hasAttachment: false,
      requiresComment: false,
      hasComment: false,
      history: [{ at: now - 35 * 60 * 1000, by: "System", action: "Created" }],
    },
    {
      id: "SV-2201",
      tx: "Service",
      module: "EVs & Charging",
      marketplace: "-",
      group: "Finance",
      requester: "Finance Desk",
      vendor: "EVzone Charging",
      amountUGX: 1800000,
      createdAt: now - 4 * 60 * 60 * 1000,
      slaDueAt: now + 1 * 60 * 60 * 1000,
      status: "Pending",
      risk: "Medium",
      assignedTo: "Finance Desk",
      patternKey: "charging_credits",
      requiresAttachment: true,
      hasAttachment: false,
      requiresComment: true,
      hasComment: true,
      history: [{ at: now - 4 * 60 * 60 * 1000, by: "System", action: "Created" }],
    },
    {
      id: "PO-9002",
      tx: "Purchase",
      module: "E-Commerce",
      marketplace: "EVmart",
      group: "Operations",
      requester: "Irene K.",
      vendor: "Kampala Office Mart",
      amountUGX: 120000,
      createdAt: now - 90 * 60 * 1000,
      slaDueAt: now + 4 * 60 * 60 * 1000,
      status: "Pending",
      risk: "Low",
      assignedTo: "Procurement Desk",
      patternKey: "low_risk_vendor",
      requiresAttachment: false,
      hasAttachment: false,
      requiresComment: false,
      hasComment: false,
      history: [{ at: now - 90 * 60 * 1000, by: "System", action: "Created" }],
    },
    {
      id: "PO-9003",
      tx: "Purchase",
      module: "E-Commerce",
      marketplace: "EVmart",
      group: "Operations",
      requester: "Irene K.",
      vendor: "Kampala Office Mart",
      amountUGX: 98000,
      createdAt: now - 120 * 60 * 1000,
      slaDueAt: now + 4 * 60 * 60 * 1000,
      status: "Pending",
      risk: "Low",
      assignedTo: "Procurement Desk",
      patternKey: "low_risk_vendor",
      requiresAttachment: false,
      hasAttachment: false,
      requiresComment: false,
      hasComment: false,
      history: [{ at: now - 120 * 60 * 1000, by: "System", action: "Created" }],
    },
    {
      id: "EX-0011",
      tx: "Exception",
      module: "Finance & Payments",
      marketplace: "-",
      group: "Finance",
      requester: "Daisy O.",
      vendor: "CorporatePay",
      amountUGX: 0,
      createdAt: now - 7 * 60 * 60 * 1000,
      slaDueAt: now - 20 * 60 * 1000,
      status: "Breached",
      risk: "High",
      assignedTo: "Org Admin",
      patternKey: "policy_exception",
      requiresAttachment: true,
      hasAttachment: true,
      requiresComment: true,
      hasComment: true,
      history: [{ at: now - 7 * 60 * 60 * 1000, by: "System", action: "Created" }],
    },
  ]);

  const [audit, setAudit] = useState<AuditEntry[]>(() => [
    {
      id: "AUD-001",
      at: now - 9 * 60 * 60 * 1000,
      by: "Finance Desk",
      action: "Approve",
      itemId: "RFQ-390",
      why: "Budget confirmed",
    },
  ]);

  const [approvers] = useState<Approver[]>(() => [
    { id: "APR-01", name: "Approver Desk", role: "Approver Desk", load: 4, ooo: false },
    { id: "APR-02", name: "Procurement Desk", role: "Procurement Desk", load: 6, ooo: false },
    { id: "APR-03", name: "Finance Desk", role: "Finance Desk", load: 7, ooo: false },
    { id: "APR-04", name: "CFO", role: "CFO", load: 1, ooo: false },
    { id: "APR-05", name: "Org Admin", role: "Org Admin", load: 2, ooo: false },
  ]);

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | Status>("All");
  const [risk, setRisk] = useState<"All" | Risk>("All");
  const [group, setGroup] = useState<"All" | GroupName>("All");
  const [module, setModule] = useState<"All" | ServiceModule>("All");
  const [marketplace, setMarketplace] = useState<"All" | Marketplace | "-">("All");
  const [groupMode, setGroupMode] = useState<GroupMode>("None");

  // Sorting
  const [sortKey, setSortKey] = useState<SortKey>("sla");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Premium: bulk safeguards
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkWhy, setBulkWhy] = useState("");
  const [bulkAck, setBulkAck] = useState(false);

  // Action modal
  const [actionOpen, setActionOpen] = useState(false);
  const [actionKind, setActionKind] = useState<ActionKind>("Approve");
  const [actionItemIds, setActionItemIds] = useState<string[]>([]);
  const [actionWhy, setActionWhy] = useState("");

  // Attachment modal
  const [attachOpen, setAttachOpen] = useState(false);
  const [attachItemId, setAttachItemId] = useState<string | null>(null);
  const [attachNote, setAttachNote] = useState("Supporting document added");

  // Delegate modal
  const [delegateOpen, setDelegateOpen] = useState(false);
  const [delegateItemId, setDelegateItemId] = useState<string | null>(null);
  const [delegateTo, setDelegateTo] = useState<string>(approvers[0]?.name || "Approver Desk");
  const [delegateWhy, setDelegateWhy] = useState("Reassign to avoid SLA breach");

  // Audit view modal
  const [auditOpen, setAuditOpen] = useState(false);
  const [auditItemId, setAuditItemId] = useState<string | null>(null);

  const marketplaceEnabled = useMemo(() => module === "All" || module === "E-Commerce", [module]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((i) => {
        if (status !== "All" && i.status !== status) return false;
        if (risk !== "All" && i.risk !== risk) return false;
        if (group !== "All" && i.group !== group) return false;
        if (module !== "All" && i.module !== module) return false;
        if (marketplace !== "All") {
          if (!marketplaceEnabled) {
            // marketplace filter only applies for E-Commerce
            if (marketplace !== "-") return false;
          } else {
            if (String(i.marketplace) !== String(marketplace)) return false;
          }
        }
        if (query) {
          const blob = `${i.id} ${i.tx} ${i.module} ${i.marketplace} ${i.group} ${i.requester} ${i.vendor} ${i.status} ${i.risk}`.toLowerCase();
          if (!blob.includes(query)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const dir = sortDir === "asc" ? 1 : -1;
        if (sortKey === "sla") return dir * (a.slaDueAt - b.slaDueAt);
        if (sortKey === "amount") return dir * (a.amountUGX - b.amountUGX);
        if (sortKey === "group") return dir * a.group.localeCompare(b.group);
        if (sortKey === "module") return dir * a.module.localeCompare(b.module);
        if (sortKey === "marketplace") return dir * String(a.marketplace).localeCompare(String(b.marketplace));
        return 0;
      });
  }, [items, q, status, risk, group, module, marketplace, sortKey, sortDir, marketplaceEnabled]);

  const grouped = useMemo(() => {
    if (groupMode === "None") return null;
    const keyFn = (i: ApprovalItem) => {
      if (groupMode === "Vendor") return i.vendor;
      if (groupMode === "Requester") return i.requester;
      return i.patternKey;
    };
    const groups = groupBy(filtered, keyFn);
    const keys = Object.keys(groups);
    keys.sort((a, b) => groups[b].length - groups[a].length);
    return keys.map((k) => ({ key: k, items: groups[k] }));
  }, [filtered, groupMode]);

  const openCount = useMemo(() => filtered.filter((i) => ["Pending", "Escalated", "Breached", "Needs info"].includes(i.status)).length, [filtered]);
  const escalatedCount = useMemo(() => filtered.filter((i) => i.status === "Escalated").length, [filtered]);
  const breachedCount = useMemo(() => filtered.filter((i) => i.status === "Breached" || isBreached(i.slaDueAt)).length, [filtered]);

  const dueSoonCount = useMemo(() => filtered.filter((i) => isDueSoon(i.slaDueAt) && !isBreached(i.slaDueAt)).length, [filtered]);

  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
  const bulkCheck = useMemo(() => bulkSafeguards(selectedItems), [selectedItems]);

  const clearSelection = () => setSelected(new Set());

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((i) => next.add(i.id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      filtered.forEach((i) => next.delete(i.id));
      return next;
    });
  };

  const openAction = (kind: ActionKind, ids: string[]) => {
    setActionKind(kind);
    setActionItemIds(ids);
    setActionWhy("");
    setActionOpen(true);
  };

  const performAction = () => {
    const why = actionWhy.trim();
    if (why.length < 8) {
      toast({ title: "Reason required", message: "Add a clear comment or reason (min 8 chars).", kind: "warn" });
      return;
    }

    const targetIds = actionItemIds;
    const nowTs = Date.now();

    setItems((prev) =>
      prev.map((it) => {
        if (!targetIds.includes(it.id)) return it;

        // Attachment enforcement for approve
        if (actionKind === "Approve" && it.requiresAttachment && !it.hasAttachment) {
          return it;
        }

        const nextStatus: Status =
          actionKind === "Approve"
            ? "Approved"
            : actionKind === "Reject"
              ? "Rejected"
              : "Changes requested";

        return {
          ...it,
          status: nextStatus,
          hasComment: it.hasComment || !!why,
          history: [...it.history, { at: nowTs, by: "You", action: nextStatus, why }],
        };
      })
    );

    // add audit entries
    setAudit((prev) => [
      ...targetIds.map((id) => ({ id: uid("AUD"), at: nowTs, by: "You", action: actionKind, itemId: id, why })),
      ...prev,
    ]);

    // warn if some approvals were blocked due to attachments
    const blocked = items.filter((it) => targetIds.includes(it.id) && actionKind === "Approve" && it.requiresAttachment && !it.hasAttachment);
    if (blocked.length) {
      toast({
        title: "Some items blocked",
        message: `Attachment required for ${blocked.length} item(s). Add attachment and try again.`,
        kind: "warn",
      });
    } else {
      toast({ title: "Done", message: `${actionKind} completed for ${targetIds.length} item(s).`, kind: actionKind === "Approve" ? "success" : "info" });
    }

    setActionOpen(false);
    setActionItemIds([]);
    setActionWhy("");
    clearSelection();
  };

  const addAttachment = () => {
    if (!attachItemId) return;
    const nowTs = Date.now();
    setItems((prev) =>
      prev.map((it) =>
        it.id === attachItemId
          ? {
            ...it,
            hasAttachment: true,
            history: [...it.history, { at: nowTs, by: "You", action: "Attachment added", why: attachNote }],
          }
          : it
      )
    );
    setAudit((prev) => [{ id: uid("AUD"), at: nowTs, by: "You", action: "Attachment added", itemId: attachItemId, why: attachNote }, ...prev]);
    toast({ title: "Attachment added", message: `${attachItemId} updated.",`, kind: "success" });
    setAttachOpen(false);
    setAttachItemId(null);
  };

  const openDelegate = (id: string) => {
    setDelegateItemId(id);
    setDelegateTo(approvers[0]?.name || "Approver Desk");
    setDelegateWhy("Reassign to avoid SLA breach");
    setDelegateOpen(true);
  };

  const delegateNow = () => {
    if (!delegateItemId) return;
    const why = delegateWhy.trim();
    if (why.length < 8) {
      toast({ title: "Reason required", message: "Add a clear reason (min 8 chars).", kind: "warn" });
      return;
    }
    const nowTs = Date.now();
    setItems((prev) =>
      prev.map((it) =>
        it.id === delegateItemId
          ? {
            ...it,
            assignedTo: delegateTo,
            status: it.status === "Breached" ? "Escalated" : it.status,
            history: [...it.history, { at: nowTs, by: "You", action: `Delegated to ${delegateTo}`, why }],
          }
          : it
      )
    );
    setAudit((prev) => [{ id: uid("AUD"), at: nowTs, by: "You", action: "Delegate", itemId: delegateItemId, why }, ...prev]);
    toast({ title: "Delegated", message: `${delegateItemId} delegated to ${delegateTo}.`, kind: "success" });
    setDelegateOpen(false);
    setDelegateItemId(null);
  };

  // Premium smart grouping suggestions
  const suggestions = useMemo(() => {
    const open = items.filter((i) => ["Pending", "Needs info"].includes(i.status));
    const byVendor = groupBy(open, (i) => `${i.vendor}||${i.risk}`);
    const groups = Object.keys(byVendor)
      .map((k) => {
        const arr = byVendor[k];
        const [vendor, risk] = k.split("||");
        const sum = arr.reduce((a, b) => a + b.amountUGX, 0);
        return {
          vendor,
          risk: risk as Risk,
          count: arr.length,
          total: sum,
          ids: arr.map((x) => x.id),
        };
      })
      .filter((g) => g.count >= 2)
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return groups;
  }, [items]);

  const escalationPanel = useMemo(() => {
    const hot = items
      .filter((i) => i.status === "Escalated" || i.status === "Breached" || isBreached(i.slaDueAt))
      .sort((a, b) => a.slaDueAt - b.slaDueAt)
      .slice(0, 6);
    return hot;
  }, [items]);

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
                  <ClipboardCheck className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Approvals Inbox</div>
                  <div className="mt-1 text-xs text-slate-500">Unified approvals for rides, services, purchases, RFQs, quotes and exceptions.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Open: ${openCount}`} tone={openCount ? "warn" : "good"} />
                    {dueSoonCount ? <Pill label={`Due soon: ${dueSoonCount}`} tone="warn" /> : <Pill label="No due soon" tone="good" />}
                    {escalatedCount ? <Pill label={`Escalated: ${escalatedCount}`} tone="bad" /> : <Pill label="No escalations" tone="good" />}
                    {breachedCount ? <Pill label={`Breached: ${breachedCount}`} tone="bad" /> : <Pill label="No breaches" tone="good" />}
                    {selected.size ? <Pill label={`Selected: ${selected.size}`} tone="info" /> : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({ title: "Audit", message: "Open an item audit from the table.", kind: "info" });
                  }}
                >
                  <FileText className="h-4 w-4" /> Audit
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({ title: "Refresh", message: "Inbox refreshed (demo).", kind: "success" });
                  }}
                >
                  <Timer className="h-4 w-4" /> Refresh
                </Button>
                <Button
                  variant="primary"
                  disabled={!selected.size}
                  onClick={() => {
                    setBulkWhy("");
                    setBulkAck(false);
                    setBulkOpen(true);
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Bulk actions
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-6">
              <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="ID, requester, vendor, module..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Select label="Status" value={status} onChange={(v) => setStatus(v as any)} options={["All", "Pending", "Needs info", "Escalated", "Breached", "Approved", "Rejected", "Changes requested"]} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Select label="Risk" value={risk} onChange={(v) => setRisk(v as any)} options={["All", "Low", "Medium", "High"]} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Select label="Group" value={group} onChange={(v) => setGroup(v as any)} options={["All", ...GROUPS]} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                <Select
                  label="Service Module"
                  value={module}
                  onChange={(v) => {
                    setModule(v as any);
                    if (v !== "All" && v !== "E-Commerce") setMarketplace("All");
                  }}
                  options={["All", ...SERVICE_MODULES]}
                />
              </div>

              <div className={cn("rounded-2xl border px-3 py-2", marketplaceEnabled ? "border-slate-200 bg-white" : "border-slate-200 bg-slate-50 opacity-70")}>
                <Select
                  label="Marketplace"
                  value={String(marketplace)}
                  onChange={(v) => setMarketplace(v as any)}
                  options={["All", "-", ...MARKETPLACES]}
                  hint={!marketplaceEnabled ? "E-Commerce only" : undefined}
                  disabled={!marketplaceEnabled}
                />
              </div>

              <div className="md:col-span-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <Select
                      label="Sort"
                      value={`${sortKey}:${sortDir}`}
                      onChange={(v) => {
                        const [k, d] = v.split(":");
                        setSortKey(k as SortKey);
                        setSortDir(d as any);
                      }}
                      options={[
                        "sla:asc",
                        "sla:desc",
                        "amount:asc",
                        "amount:desc",
                        "group:asc",
                        "group:desc",
                        "module:asc",
                        "module:desc",
                        "marketplace:asc",
                        "marketplace:desc",
                      ]}
                      hint="SLA, amount, group"
                    />
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                    <Select
                      label="Grouping"
                      value={groupMode}
                      onChange={(v) => setGroupMode(v as GroupMode)}
                      options={["None", "Vendor", "Requester", "Pattern"]}
                      hint="Premium"
                    />
                  </div>

                  <Button
                    variant="outline"
                    onClick={() => {
                      setQ("");
                      setStatus("All");
                      setRisk("All");
                      setGroup("All");
                      setModule("All");
                      setMarketplace("All");
                      setGroupMode("None");
                      setSortKey("sla");
                      setSortDir("asc");
                      toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                    }}
                  >
                    <Filter className="h-4 w-4" /> Reset
                  </Button>

                  <Button variant="outline" onClick={selected.size ? deselectAllFiltered : selectAllFiltered}>
                    <Users className="h-4 w-4" /> {selected.size ? "Deselect visible" : "Select visible"}
                  </Button>

                  {selected.size ? (
                    <Button variant="outline" onClick={clearSelection}>
                      <X className="h-4 w-4" /> Clear selection
                    </Button>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Pill label="Core" tone="neutral" />
                  <Pill label="Premium grouping" tone="info" />
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {/* Premium: suggestions */}
            {suggestions.length ? (
              <div className="mb-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Smart grouping suggestions</div>
                    <div className="mt-1 text-xs text-slate-500">Same vendor and repeated patterns. Use bulk approve with safeguards.</div>
                  </div>
                  <Pill label="Premium" tone="info" />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                  {suggestions.map((s) => (
                    <div key={`${s.vendor}-${s.risk}`} className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{s.vendor}</div>
                          <div className="mt-1 text-xs text-slate-500">{s.count} item(s) • Total {formatUGX(s.total)}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Pill label={`Risk: ${s.risk}`} tone={riskTone(s.risk)} />
                            <Pill label="Same vendor" tone="neutral" />
                          </div>
                        </div>
                        <Sparkles className="h-5 w-5 text-emerald-700" />
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSelected((prev) => {
                              const next = new Set(prev);
                              s.ids.forEach((id) => next.add(id));
                              return next;
                            });
                            toast({ title: "Selected", message: `Selected ${s.count} item(s) from ${s.vendor}.`, kind: "success" });
                          }}
                        >
                          <Group className="h-4 w-4" /> Select group
                        </Button>
                        <Button
                          variant="primary"
                          disabled={s.risk !== "Low"}
                          title={s.risk !== "Low" ? "Bulk approve is restricted to low risk" : ""}
                          onClick={() => {
                            setSelected(new Set(s.ids));
                            setBulkWhy("");
                            setBulkAck(false);
                            setBulkOpen(true);
                          }}
                        >
                          <Sparkles className="h-4 w-4" /> Bulk approve
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Main list */}
              <div className="lg:col-span-9">
                {groupMode === "None" ? (
                  <InboxTable
                    items={filtered}
                    selected={selected}
                    onToggle={toggleSelect}
                    onOpenAudit={(id) => {
                      setAuditItemId(id);
                      setAuditOpen(true);
                    }}
                    onAddAttachment={(id) => {
                      setAttachItemId(id);
                      setAttachNote("Supporting document added");
                      setAttachOpen(true);
                    }}
                    onDelegate={openDelegate}
                    onAction={(kind, id) => openAction(kind, [id])}
                  />
                ) : (
                  <GroupedView
                    groups={grouped || []}
                    selected={selected}
                    onToggle={toggleSelect}
                    onOpenAudit={(id) => {
                      setAuditItemId(id);
                      setAuditOpen(true);
                    }}
                    onAddAttachment={(id) => {
                      setAttachItemId(id);
                      setAttachNote("Supporting document added");
                      setAttachOpen(true);
                    }}
                    onDelegate={openDelegate}
                    onAction={(kind, id) => openAction(kind, [id])}
                  />
                )}
              </div>

              {/* Escalation panel */}
              <div className="lg:col-span-3">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Escalation panel</div>
                      <div className="mt-1 text-xs text-slate-500">Breached or escalated items. Delegate now to avoid further breaches.</div>
                    </div>
                    <Pill label="Premium" tone="info" />
                  </div>

                  <div className="mt-3 space-y-2">
                    {escalationPanel.length ? (
                      escalationPanel.map((i) => (
                        <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{i.id}</div>
                                <Pill label={i.status} tone={statusTone(i.status)} />
                                <Pill label={i.risk} tone={riskTone(i.risk)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{i.module}{i.module === "E-Commerce" ? ` • ${i.marketplace}` : ""}</div>
                              <div className="mt-1 text-xs text-slate-500">{i.requester} • {i.vendor}</div>
                              <div className="mt-2 text-xs font-semibold text-slate-700">{dueLabel(i.slaDueAt)}</div>
                            </div>
                            <AlertTriangle className="h-5 w-5 text-rose-700" />
                          </div>
                          <div className="mt-3 flex flex-col gap-2">
                            <Button variant="outline" onClick={() => { setAuditItemId(i.id); setAuditOpen(true); }}>
                              <FileText className="h-4 w-4" /> View audit
                            </Button>
                            <Button variant="primary" onClick={() => openDelegate(i.id)}>
                              <Users className="h-4 w-4" /> Delegate now
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Shield className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No escalations</div>
                        <div className="mt-1 text-sm text-slate-600">You are on track.</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Tip: tighten SLAs and enable load balancing in Approval Workflow Builder (J).
                  </div>
                </div>
              </div>
            </div>

            {selected.size ? (
              <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Selection actions</div>
                    <div className="mt-1 text-xs text-slate-500">You selected {selected.size} item(s). Bulk approve is restricted by safeguards.</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => openAction("Request changes", selectedItems.map((x) => x.id))}>
                      <Info className="h-4 w-4" /> Request changes
                    </Button>
                    <Button variant="outline" onClick={() => openAction("Reject", selectedItems.map((x) => x.id))}>
                      <X className="h-4 w-4" /> Reject
                    </Button>
                    <Button variant="primary" disabled={!bulkCheck.ok} onClick={() => { setBulkWhy(""); setBulkAck(false); setBulkOpen(true); }}>
                      <Sparkles className="h-4 w-4" /> Bulk approve
                    </Button>
                  </div>
                </div>
                {!bulkCheck.ok ? (
                  <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    <div className="font-semibold">Bulk approve safeguards</div>
                    <ul className="mt-2 space-y-1">
                      {bulkCheck.reasons.map((r) => (
                        <li key={r}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                    Eligible for bulk approve: same vendor, low risk, required attachments present, and total under cap.
                  </div>
                )}
              </div>
            ) : null}

            <div className="mt-4 text-xs text-slate-500">
              K Approvals Inbox v2: unified queue, sorting, actions with comments, attachment enforcement, audit trail, premium bulk approve safeguards, smart grouping, and escalation delegation.
            </div>
          </div>
        </div>
      </div>

      {/* Action modal */}
      <Modal
        open={actionOpen}
        title={`${actionKind}`}
        subtitle={`Applies to ${actionItemIds.length} item(s). Comment is required.`}
        onClose={() => setActionOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={actionKind === "Approve" ? "primary" : actionKind === "Reject" ? "danger" : "outline"}
                onClick={performAction}
              >
                <Check className="h-4 w-4" /> Confirm
              </Button>
            </div>
          </div>
        }
      >
        <TextArea
          label="Comment and reason"
          value={actionWhy}
          onChange={setActionWhy}
          placeholder="Example: approvals aligned with policy and budget. Proceed."
          hint="Minimum 8 characters"
          rows={4}
        />

        <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Attachment enforcement: Approve is blocked if required attachment is missing.
        </div>

        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">Vendor</th>
                <th className="px-4 py-3 font-semibold">Risk</th>
                <th className="px-4 py-3 font-semibold">Attachment</th>
              </tr>
            </thead>
            <tbody>
              {items
                .filter((i) => actionItemIds.includes(i.id))
                .map((i) => (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">{i.id}</td>
                    <td className="px-4 py-3 text-slate-700">{formatUGX(i.amountUGX)}</td>
                    <td className="px-4 py-3 text-slate-700">{i.vendor}</td>
                    <td className="px-4 py-3"><Pill label={i.risk} tone={riskTone(i.risk)} /></td>
                    <td className="px-4 py-3">
                      {i.requiresAttachment ? (
                        <Pill label={i.hasAttachment ? "Present" : "Missing"} tone={i.hasAttachment ? "good" : "bad"} />
                      ) : (
                        <Pill label="Not required" tone="neutral" />
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Modal>

      {/* Bulk approve modal */}
      <Modal
        open={bulkOpen}
        title="Bulk approve"
        subtitle="Premium safeguards apply. Same vendor and low risk only."
        onClose={() => setBulkOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!bulkCheck.ok || !bulkAck || bulkWhy.trim().length < 8}
              onClick={() => {
                openAction("Approve", selectedItems.map((x) => x.id));
                setBulkOpen(false);
                setActionWhy(bulkWhy);
              }}
            >
              <Sparkles className="h-4 w-4" /> Confirm bulk approve
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          Selected: {selectedItems.length} item(s) • Total: {formatUGX(selectedItems.reduce((a, b) => a + b.amountUGX, 0))}
        </div>

        {!bulkCheck.ok ? (
          <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <div className="font-semibold">Safeguards not satisfied</div>
            <ul className="mt-2 space-y-1">
              {bulkCheck.reasons.map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
            Safeguards satisfied. Bulk approve is allowed.
          </div>
        )}

        <div className="mt-4">
          <TextArea
            label="Reason"
            value={bulkWhy}
            onChange={setBulkWhy}
            placeholder="Example: low-risk recurring purchases from same vendor."
            hint="Minimum 8 characters"
            rows={3}
          />
          <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
            <input type="checkbox" checked={bulkAck} onChange={(e) => setBulkAck(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
            <div className="text-sm font-semibold text-slate-800">I confirm these approvals are authorized and will be audit logged.</div>
          </label>
        </div>
      </Modal>

      {/* Attachment modal */}
      <Modal
        open={attachOpen}
        title="Add attachment"
        subtitle="Required attachment enforcement blocks approval without this."
        onClose={() => setAttachOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAttachOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addAttachment}>
              <Paperclip className="h-4 w-4" /> Mark attached
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Item: <span className="font-semibold text-slate-900">{attachItemId}</span>
        </div>
        <TextArea
          label="Attachment note"
          value={attachNote}
          onChange={setAttachNote}
          placeholder="Example: invoice PDF uploaded"
          rows={3}
        />
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
          Demo: this marks the item as having required attachment. In production, files are uploaded and scanned.
        </div>
      </Modal>

      {/* Delegate modal */}
      <Modal
        open={delegateOpen}
        title="Delegate now"
        subtitle="Premium: reassign escalated items to prevent SLA breaches."
        onClose={() => setDelegateOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDelegateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={delegateNow}>
              <Users className="h-4 w-4" /> Delegate
            </Button>
          </div>
        }
      >
        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
          Item: <span className="font-semibold text-slate-900">{delegateItemId}</span>
        </div>
        <Select
          label="Delegate to"
          value={delegateTo}
          onChange={setDelegateTo}
          options={approvers.map((a) => `${a.name}`)}
          hint="Pick an approver desk"
        />
        <div className="mt-3 grid grid-cols-1 gap-2">
          {approvers.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">{a.name}</div>
                <div className="mt-0.5 text-xs text-slate-500">Role: {a.role} • Load: {a.load}{a.ooo ? " • OOO" : ""}</div>
              </div>
              <Pill label={a.load >= 6 ? "Busy" : "OK"} tone={a.load >= 6 ? "warn" : "good"} />
            </div>
          ))}
        </div>
        <div className="mt-3">
          <TextArea
            label="Reason"
            value={delegateWhy}
            onChange={setDelegateWhy}
            placeholder="Example: CFO out of office, delegate to Org Admin"
            hint="Minimum 8 characters"
            rows={3}
          />
        </div>
      </Modal>

      {/* Audit modal */}
      <Modal
        open={auditOpen}
        title="Audit trail"
        subtitle="Who, when, and why."
        onClose={() => setAuditOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setAuditOpen(false)}>Close</Button>
          </div>
        }
      >
        {(() => {
          const id = auditItemId;
          const item = items.find((x) => x.id === id);
          if (!id || !item) {
            return <div className="text-sm text-slate-600">Select an item to view audit.</div>;
          }
          const entries = audit.filter((a) => a.itemId === id);
          return (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.id}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.tx} • {item.module}{item.module === "E-Commerce" ? ` • ${item.marketplace}` : ""}</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill label={item.status} tone={statusTone(item.status)} />
                      <Pill label={`Risk: ${item.risk}`} tone={riskTone(item.risk)} />
                      <Pill label={`Assigned: ${item.assignedTo}`} tone="info" />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Created</div>
                    <div className="text-sm font-semibold text-slate-900">{formatDateTime(item.createdAt)}</div>
                    <div className="mt-1 text-xs text-slate-500">{dueLabel(item.slaDueAt)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Item history</div>
                <div className="mt-3 space-y-2">
                  {item.history
                    .slice()
                    .sort((a, b) => b.at - a.at)
                    .map((h, idx) => (
                      <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{h.action}</div>
                            <div className="mt-1 text-xs text-slate-500">By {h.by} • {formatDateTime(h.at)} ({timeAgo(h.at)})</div>
                            {h.why ? <div className="mt-2 text-xs text-slate-600">Why: {h.why}</div> : null}
                          </div>
                          <Pill label="History" tone="neutral" />
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Audit entries</div>
                <div className="mt-3 space-y-2">
                  {entries.length ? (
                    entries
                      .slice()
                      .sort((a, b) => b.at - a.at)
                      .map((a) => (
                        <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                                <Pill label={a.by} tone="info" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.at)} • {a.id}</div>
                              <div className="mt-2 text-xs text-slate-600">Why: {a.why}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => navigator.clipboard.writeText(a.id)}>
                              <Copy className="h-4 w-4" /> Copy ID
                            </Button>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                        <FileText className="h-6 w-6" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-slate-900">No audit entries</div>
                      <div className="mt-1 text-sm text-slate-600">Actions create audit entries.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          K Approvals Inbox v2. Core: unified queue, sorting, actions with comments, attachment enforcement, and audit trail. Premium: bulk approve safeguards, smart grouping, and escalation delegation.
        </div>
      </footer>
    </div>
  );
}

function InboxTable({
  items,
  selected,
  onToggle,
  onOpenAudit,
  onAddAttachment,
  onDelegate,
  onAction,
}: {
  items: ApprovalItem[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpenAudit: (id: string) => void;
  onAddAttachment: (id: string) => void;
  onDelegate: (id: string) => void;
  onAction: (kind: ActionKind, id: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <div className="text-sm font-semibold text-slate-900">Queue</div>
        <div className="mt-1 text-xs text-slate-500">Approve, reject, request changes, attach docs, and view audit.</div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-600">
            <tr>
              <th className="px-4 py-3 font-semibold">Select</th>
              <th className="px-4 py-3 font-semibold">ID</th>
              <th className="px-4 py-3 font-semibold">Type</th>
              <th className="px-4 py-3 font-semibold">Module</th>
              <th className="px-4 py-3 font-semibold">Marketplace</th>
              <th className="px-4 py-3 font-semibold">Group</th>
              <th className="px-4 py-3 font-semibold">Requester</th>
              <th className="px-4 py-3 font-semibold">Vendor</th>
              <th className="px-4 py-3 font-semibold">Amount</th>
              <th className="px-4 py-3 font-semibold">SLA</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => {
              const due = isBreached(i.slaDueAt);
              const soon = isDueSoon(i.slaDueAt);
              const approveBlocked = i.requiresAttachment && !i.hasAttachment;
              return (
                <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(i.id)}
                      onChange={() => onToggle(i.id)}
                      className="h-4 w-4 rounded border-slate-300"
                    />
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{i.id}</td>
                  <td className="px-4 py-3 text-slate-700">{i.tx}</td>
                  <td className="px-4 py-3 text-slate-700">{i.module}</td>
                  <td className="px-4 py-3 text-slate-700">{i.marketplace}</td>
                  <td className="px-4 py-3 text-slate-700">{i.group}</td>
                  <td className="px-4 py-3 text-slate-700">{i.requester}</td>
                  <td className="px-4 py-3 text-slate-700">{i.vendor}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(i.amountUGX)}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <Pill label={dueLabel(i.slaDueAt)} tone={due ? "bad" : soon ? "warn" : "info"} />
                      <div className="text-xs text-slate-500">{formatDateTime(i.slaDueAt)}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      <Pill label={i.status} tone={statusTone(i.status)} />
                      <Pill label={`Risk: ${i.risk}`} tone={riskTone(i.risk)} />
                      {approveBlocked ? <Pill label="Attachment missing" tone="bad" /> : i.requiresAttachment ? <Pill label="Attachment OK" tone="good" /> : <Pill label="No attachment" tone="neutral" />}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onOpenAudit(i.id)}>
                        <FileText className="h-4 w-4" /> Audit
                      </Button>
                      {approveBlocked ? (
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onAddAttachment(i.id)}>
                          <Paperclip className="h-4 w-4" /> Add attachment
                        </Button>
                      ) : null}
                      {(i.status === "Escalated" || i.status === "Breached" || isBreached(i.slaDueAt)) ? (
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onDelegate(i.id)}>
                          <Users className="h-4 w-4" /> Delegate
                        </Button>
                      ) : null}
                      <Button variant="primary" className="px-3 py-2 text-xs" disabled={approveBlocked} title={approveBlocked ? "Attachment required" : ""} onClick={() => onAction("Approve", i.id)}>
                        <Check className="h-4 w-4" /> Approve
                      </Button>
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onAction("Request changes", i.id)}>
                        <Info className="h-4 w-4" /> Changes
                      </Button>
                      <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onAction("Reject", i.id)}>
                        <X className="h-4 w-4" /> Reject
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {!items.length ? (
              <tr>
                <td colSpan={12} className="px-4 py-10">
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                    <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                      <ListChecks className="h-6 w-6" />
                    </div>
                    <div className="mt-3 text-sm font-semibold text-slate-900">No items</div>
                    <div className="mt-1 text-sm text-slate-600">Nothing matches your filters.</div>
                  </div>
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden">
        <div className="space-y-3 p-4">
          {items.map((i) => {
            const due = isBreached(i.slaDueAt);
            const soon = isDueSoon(i.slaDueAt);
            const approveBlocked = i.requiresAttachment && !i.hasAttachment;
            return (
              <div key={i.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">{i.id}</div>
                      <Pill label={i.status} tone={statusTone(i.status)} />
                      <Pill label={i.risk} tone={riskTone(i.risk)} />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{i.tx} • {i.module}{i.module === "E-Commerce" ? ` • ${i.marketplace}` : ""}</div>
                    <div className="mt-1 text-xs text-slate-500">{i.group} • {i.requester}</div>
                    <div className="mt-1 text-xs text-slate-500">Vendor: {i.vendor}</div>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{formatUGX(i.amountUGX)}</div>
                    <div className="mt-2">
                      <Pill label={dueLabel(i.slaDueAt)} tone={due ? "bad" : soon ? "warn" : "info"} />
                    </div>
                    {approveBlocked ? <div className="mt-2"><Pill label="Attachment missing" tone="bad" /></div> : null}
                  </div>
                  <input type="checkbox" checked={selected.has(i.id)} onChange={() => onToggle(i.id)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onOpenAudit(i.id)}>
                    <FileText className="h-4 w-4" /> Audit
                  </Button>
                  {approveBlocked ? (
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onAddAttachment(i.id)}>
                      <Paperclip className="h-4 w-4" /> Attach
                    </Button>
                  ) : null}
                  {(i.status === "Escalated" || i.status === "Breached" || isBreached(i.slaDueAt)) ? (
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onDelegate(i.id)}>
                      <Users className="h-4 w-4" /> Delegate
                    </Button>
                  ) : null}
                  <Button variant="primary" className="px-3 py-2 text-xs" disabled={approveBlocked} onClick={() => onAction("Approve", i.id)}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => onAction("Request changes", i.id)}>
                    <Info className="h-4 w-4" /> Changes
                  </Button>
                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => onAction("Reject", i.id)}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </div>
              </div>
            );
          })}

          {!items.length ? (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
              <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                <ListChecks className="h-6 w-6" />
              </div>
              <div className="mt-3 text-sm font-semibold text-slate-900">No items</div>
              <div className="mt-1 text-sm text-slate-600">Nothing matches your filters.</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GroupedView({
  groups,
  selected,
  onToggle,
  onOpenAudit,
  onAddAttachment,
  onDelegate,
  onAction,
}: {
  groups: Array<{ key: string; items: ApprovalItem[] }>;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onOpenAudit: (id: string) => void;
  onAddAttachment: (id: string) => void;
  onDelegate: (id: string) => void;
  onAction: (kind: ActionKind, id: string) => void;
}) {
  return (
    <div className="space-y-3">
      {groups.map((g) => (
        <GroupAccordion
          key={g.key}
          title={g.key}
          count={g.items.length}
          total={g.items.reduce((a, b) => a + b.amountUGX, 0)}
        >
          <InboxTable
            items={g.items}
            selected={selected}
            onToggle={onToggle}
            onOpenAudit={onOpenAudit}
            onAddAttachment={onAddAttachment}
            onDelegate={onDelegate}
            onAction={onAction}
          />
        </GroupAccordion>
      ))}

      {!groups.length ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
            <Group className="h-6 w-6" />
          </div>
          <div className="mt-3 text-sm font-semibold text-slate-900">No groups</div>
          <div className="mt-1 text-sm text-slate-600">Nothing matches your filters.</div>
        </div>
      ) : null}
    </div>
  );
}

function GroupAccordion({
  title,
  count,
  total,
  children,
}: {
  title: string;
  count: number;
  total: number;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <Pill label={`${count} item(s)`} tone="neutral" />
            <Pill label={`Total ${formatUGX(total)}`} tone="info" />
          </div>
          <div className="mt-1 text-xs text-slate-500">Smart grouping stack</div>
        </div>
        <ChevronDown className={cn("h-5 w-5 text-slate-500 transition", open ? "rotate-180" : "rotate-0")} />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.18 }}
            className="border-t border-slate-200"
          >
            <div className="p-4">{children}</div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
