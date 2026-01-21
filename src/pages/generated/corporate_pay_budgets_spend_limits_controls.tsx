import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Flame,
  Info,
  LineChart,
  PiggyBank,
  Plus,
  Search,
  Shield,
  Sparkles,
  Timer,
  User,
  Users,
  Wallet,
  X,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type BudgetPeriod = "Weekly" | "Monthly" | "Quarterly";

type CapType = "Hard" | "Soft";

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

type Risk = "Low" | "Medium" | "High";

type BudgetScope = "Org" | "Group" | "Module" | "Marketplace";

type Budget = {
  id: string;
  scope: BudgetScope;
  period: BudgetPeriod;
  capType: CapType;
  amountUGX: number;
  usedUGX: number;
  group?: GroupName;
  module?: ServiceModule;
  marketplace?: Marketplace;
  updatedAt: number;
  updatedBy: string;
  notes?: string;
};

type UserRow = {
  id: string;
  name: string;
  group: GroupName;
  role: string;
  autoApprovalEligible: boolean;
};

type UserCap = {
  id: string;
  userId: string;
  period: BudgetPeriod;
  capType: CapType;
  amountUGX: number;
  usedUGX: number;
  updatedAt: number;
  updatedBy: string;
};

type AlertItem = {
  id: string;
  ts: number;
  severity: "Info" | "Warning" | "Critical";
  title: string;
  message: string;
  relatedIds: string[];
};

type HistoryItem = {
  id: string;
  ts: number;
  actor: string;
  type:
  | "Budget created"
  | "Budget updated"
  | "User cap updated"
  | "Spend attempted"
  | "Spend applied"
  | "Hard cap blocked"
  | "Exception requested"
  | "Exception approved"
  | "Exception rejected";
  details: string;
};

type ExceptionStatus = "Pending" | "Approved" | "Rejected";

type ExceptionTarget = "Org" | "Group" | "User" | "Module" | "Marketplace";

type EmergencyException = {
  id: string;
  createdAt: number;
  createdBy: string;
  status: ExceptionStatus;
  targetType: ExceptionTarget;
  targetId: string; // budget id or user id
  extraAmountUGX: number;
  reason: string;
  attachmentsProvided: boolean;
  approver: string;
  decisionNote?: string;
};

type SpendEvent = {
  userId: string;
  module: ServiceModule;
  marketplace: Marketplace | "-";
  amountUGX: number;
  vendor: string;
  risk: Risk;
  note: string;
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

function pct(n: number, d: number) {
  if (d <= 0) return 0;
  return Math.round((n / d) * 100);
}

function pillToneForSeverity(sev: AlertItem["severity"]) {
  if (sev === "Critical") return "bad" as const;
  if (sev === "Warning") return "warn" as const;
  return "info" as const;
}

function toneForCapType(cap: CapType) {
  return cap === "Hard" ? ("warn" as const) : ("neutral" as const);
}

function toneForRisk(r: Risk) {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
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
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
      />
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  hint,
  disabled,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
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
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
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

function ActionMenu({ actions }: { actions: Array<{ label: string; onClick: () => void; variant?: "default" | "danger" }> }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-40 mt-1 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200">
            {actions.map((a, i) => (
              <button
                key={i}
                onClick={() => {
                  a.onClick();
                  setOpen(false);
                }}
                className={cn(
                  "block w-full px-4 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50",
                  a.variant === "danger" ? "text-rose-700 hover:bg-rose-50" : "text-slate-700"
                )}
              >
                {a.label}
              </button>
            ))}
          </div>
        </>
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
  actions?: Array<{ label: string; onClick: () => void; variant?: "default" | "danger" }>;
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
              <div className="flex items-center gap-1">
                {actions ? <ActionMenu actions={actions} /> : null}
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

function StatCard({
  title,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
}) {
  const bg =
    tone === "good"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "warn"
        ? "bg-amber-50 text-amber-800"
        : tone === "bad"
          ? "bg-rose-50 text-rose-700"
          : tone === "info"
            ? "bg-blue-50 text-blue-700"
            : "bg-slate-50 text-slate-700";

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          <div className="mt-1 text-xs text-slate-600">{sub}</div>
        </div>
        <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
      </div>
    </div>
  );
}

function ProgressBar({ valuePct, labelLeft, labelRight }: { valuePct: number; labelLeft: string; labelRight: string }) {
  const pctv = clamp(valuePct, 0, 140);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold">{labelLeft}</span>
        <span className="font-semibold">{labelRight}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pctv)}%`, background: EVZ.green }} />
      </div>
      {pctv > 100 ? (
        <div className="mt-2 text-xs font-semibold text-rose-700">Over by {Math.round((pctv - 100) * 10) / 10}%</div>
      ) : null}
    </div>
  );
}

function daysRunway(remaining: number, burnPerDay: number) {
  if (burnPerDay <= 0) return Infinity;
  return remaining / burnPerDay;
}

export default function CorporatePayBudgetsSpendControlsV2() {
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

  const USERS: UserRow[] = [
    { id: "U-1001", name: "Mary N.", group: "Operations", role: "Manager", autoApprovalEligible: true },
    { id: "U-1002", name: "John S.", group: "Sales", role: "Employee", autoApprovalEligible: false },
    { id: "U-1003", name: "Irene K.", group: "Operations", role: "Travel Coordinator", autoApprovalEligible: true },
    { id: "U-1004", name: "Daisy O.", group: "Finance", role: "Accountant", autoApprovalEligible: true },
    { id: "U-1005", name: "Procurement Desk", group: "Procurement", role: "Approver", autoApprovalEligible: true },
  ];

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Assume month context (demo)
  const dayOfPeriod = 8;
  const periodDays = 30;

  // Budgets
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const now = Date.now();
    return [
      {
        id: "B-ORG",
        scope: "Org",
        period: "Monthly",
        capType: "Hard",
        amountUGX: 40000000,
        usedUGX: 32500000,
        updatedAt: now - 2 * 24 * 60 * 60 * 1000,
        updatedBy: "Org Admin",
        notes: "Primary monthly budget",
      },
      {
        id: "B-G-OPS",
        scope: "Group",
        period: "Monthly",
        capType: "Soft",
        amountUGX: 15000000,
        usedUGX: 12000000,
        group: "Operations",
        updatedAt: now - 24 * 60 * 60 * 1000,
        updatedBy: "Org Admin",
        notes: "Operations monthly allocation",
      },
      {
        id: "B-G-SALES",
        scope: "Group",
        period: "Monthly",
        capType: "Soft",
        amountUGX: 12000000,
        usedUGX: 9800000,
        group: "Sales",
        updatedAt: now - 24 * 60 * 60 * 1000,
        updatedBy: "Org Admin",
      },
      {
        id: "B-G-FIN",
        scope: "Group",
        period: "Monthly",
        capType: "Hard",
        amountUGX: 6000000,
        usedUGX: 5200000,
        group: "Finance",
        updatedAt: now - 48 * 60 * 60 * 1000,
        updatedBy: "Org Admin",
      },
      {
        id: "B-MOD-RIDES",
        scope: "Module",
        period: "Monthly",
        capType: "Soft",
        amountUGX: 16000000,
        usedUGX: 14200000,
        module: "Rides & Logistics",
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedBy: "Finance Desk",
        notes: "Soft cap, above routes to approvals",
      },
      {
        id: "B-MKT-MYLIVE",
        scope: "Marketplace",
        period: "Monthly",
        capType: "Hard",
        amountUGX: 6000000,
        usedUGX: 5200000,
        module: "E-Commerce",
        marketplace: "MyLiveDealz",
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
        updatedBy: "Procurement Desk",
        notes: "High risk marketplace hard cap",
      },
    ];
  });

  // User caps
  const [userCaps, setUserCaps] = useState<UserCap[]>(() => {
    const now = Date.now();
    return [
      { id: "UC-1001", userId: "U-1001", period: "Monthly", capType: "Soft", amountUGX: 3000000, usedUGX: 2100000, updatedAt: now - 3 * 24 * 60 * 60 * 1000, updatedBy: "Org Admin" },
      { id: "UC-1002", userId: "U-1002", period: "Monthly", capType: "Hard", amountUGX: 1200000, usedUGX: 900000, updatedAt: now - 3 * 24 * 60 * 60 * 1000, updatedBy: "Org Admin" },
      { id: "UC-1003", userId: "U-1003", period: "Monthly", capType: "Soft", amountUGX: 2000000, usedUGX: 1400000, updatedAt: now - 3 * 24 * 60 * 60 * 1000, updatedBy: "Org Admin" },
    ];
  });

  // Alerts and history
  const [alerts, setAlerts] = useState<AlertItem[]>(() => {
    const now = Date.now();
    return [
      {
        id: "AL-01",
        ts: now - 50 * 60 * 1000,
        severity: "Warning",
        title: "Sales group at 82%",
        message: "Sales group is above 80% of monthly cap. Consider enforce or adjust.",
        relatedIds: ["B-G-SALES"],
      },
      {
        id: "AL-02",
        ts: now - 20 * 60 * 1000,
        severity: "Critical",
        title: "Finance group nearing hard cap",
        message: "Finance group hard cap is close. Remaining is under UGX 1,000,000.",
        relatedIds: ["B-G-FIN"],
      },
    ];
  });

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const now = Date.now();
    return [
      { id: "H-01", ts: now - 3 * 24 * 60 * 60 * 1000, actor: "Org Admin", type: "Budget updated", details: "Updated org monthly budget to UGX 40,000,000" },
      { id: "H-02", ts: now - 2 * 24 * 60 * 60 * 1000, actor: "Org Admin", type: "Budget updated", details: "Updated Operations budget to UGX 15,000,000" },
      { id: "H-03", ts: now - 9 * 60 * 60 * 1000, actor: "System", type: "Spend applied", details: "Applied spend UGX 82,000 to Rides & Logistics for John S." },
    ];
  });

  // Emergency exceptions
  const [exceptions, setExceptions] = useState<EmergencyException[]>(() => {
    const now = Date.now();
    return [
      {
        id: "EXC-01",
        createdAt: now - 18 * 60 * 60 * 1000,
        createdBy: "Finance Desk",
        status: "Pending",
        targetType: "Group",
        targetId: "B-G-FIN",
        extraAmountUGX: 1500000,
        reason: "Urgent month-end reconciliations and payouts",
        attachmentsProvided: true,
        approver: "Org Admin",
      },
    ];
  });

  // Tabs
  const [tab, setTab] = useState<"budgets" | "caps" | "history" | "forecast" | "exceptions">("budgets");

  // Modals
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<Budget>(() => {
    const now = Date.now();
    return {
      id: "",
      scope: "Group",
      period: "Monthly",
      capType: "Soft",
      amountUGX: 1000000,
      usedUGX: 0,
      group: "Operations",
      updatedAt: now,
      updatedBy: "You",
      notes: "",
    };
  });

  const [capModalOpen, setCapModalOpen] = useState(false);
  const [capDraft, setCapDraft] = useState<UserCap>(() => {
    const now = Date.now();
    return { id: "", userId: USERS[0].id, period: "Monthly", capType: "Soft", amountUGX: 500000, usedUGX: 0, updatedAt: now, updatedBy: "You" };
  });

  const [spendModalOpen, setSpendModalOpen] = useState(false);
  const [spendDraft, setSpendDraft] = useState<SpendEvent>(() => ({
    userId: USERS[1].id,
    module: "Rides & Logistics",
    marketplace: "-",
    amountUGX: 85000,
    vendor: "EVzone Rides",
    risk: "Low",
    note: "Client meeting ride",
  }));

  const [exceptionModalOpen, setExceptionModalOpen] = useState(false);
  const [exceptionDraft, setExceptionDraft] = useState<EmergencyException>(() => ({
    id: "",
    createdAt: Date.now(),
    createdBy: "You",
    status: "Pending",
    targetType: "Group",
    targetId: "B-G-FIN",
    extraAmountUGX: 1000000,
    reason: "",
    attachmentsProvided: true,
    approver: "Org Admin",
  }));

  // Derived
  const orgBudget = useMemo(() => budgets.find((b) => b.scope === "Org") || null, [budgets]);
  const totalUsed = orgBudget?.usedUGX || budgets.filter((b) => b.scope === "Org").reduce((a, b) => a + b.usedUGX, 0);
  const totalAmount = orgBudget?.amountUGX || budgets.filter((b) => b.scope === "Org").reduce((a, b) => a + b.amountUGX, 0);
  const remaining = Math.max(0, totalAmount - totalUsed);

  const orgBurnPerDay = useMemo(() => {
    // simple burn rate estimate from MTD usage
    return dayOfPeriod > 0 ? totalUsed / dayOfPeriod : 0;
  }, [totalUsed]);

  const runwayDays = useMemo(() => daysRunway(remaining, orgBurnPerDay), [remaining, orgBurnPerDay]);

  const orgForecast = useMemo(() => {
    if (dayOfPeriod <= 0) return totalUsed;
    return Math.round((totalUsed / dayOfPeriod) * periodDays);
  }, [totalUsed]);

  const openAlerts = useMemo(() => alerts.slice().sort((a, b) => b.ts - a.ts), [alerts]);

  // Suggested caps (premium) based on mock historical
  const historical = useMemo(() => {
    // last 3 periods usage per group (UGX)
    return {
      Operations: [11800000, 12400000, 13100000],
      Sales: [8200000, 9100000, 9900000],
      Finance: [4300000, 5100000, 5600000],
      Admin: [3100000, 3700000, 3900000],
      Procurement: [2400000, 2900000, 3200000],
    } as Record<GroupName, number[]>;
  }, []);

  const suggestedGroupCaps = useMemo(() => {
    const factor = 1.15; // +15%
    return GROUPS.map((g) => {
      const arr = historical[g];
      const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
      const p90 = Math.max(...arr);
      const suggested = Math.round(Math.max(avg, p90) * factor);
      return { group: g, avg: Math.round(avg), p90, suggested };
    });
  }, [GROUPS, historical]);

  // Forecasting by group/module/marketplace
  const groupForecast = useMemo(() => {
    const groupBudgets = budgets.filter((b) => b.scope === "Group" && b.period === "Monthly");
    return groupBudgets.map((b) => {
      const burn = dayOfPeriod > 0 ? b.usedUGX / dayOfPeriod : 0;
      const forecast = Math.round(burn * periodDays);
      const rem = Math.max(0, b.amountUGX - b.usedUGX);
      const runway = daysRunway(rem, burn);
      return { ...b, forecast, burnPerDay: burn, runway };
    });
  }, [budgets]);

  const moduleForecast = useMemo(() => {
    const moduleBudgets = budgets.filter((b) => b.scope === "Module" && b.period === "Monthly");
    return moduleBudgets.map((b) => {
      const burn = dayOfPeriod > 0 ? b.usedUGX / dayOfPeriod : 0;
      const forecast = Math.round(burn * periodDays);
      return { ...b, forecast, burnPerDay: burn };
    });
  }, [budgets]);

  const marketplaceForecast = useMemo(() => {
    const mktBudgets = budgets.filter((b) => b.scope === "Marketplace" && b.period === "Monthly");
    return mktBudgets.map((b) => {
      const burn = dayOfPeriod > 0 ? b.usedUGX / dayOfPeriod : 0;
      const forecast = Math.round(burn * periodDays);
      return { ...b, forecast, burnPerDay: burn };
    });
  }, [budgets]);

  // Helpers
  const addHistory = (h: Omit<HistoryItem, "id">) => {
    setHistory((prev) => [{ id: uid("H"), ...h }, ...prev]);
  };

  const addAlert = (a: Omit<AlertItem, "id">) => {
    setAlerts((prev) => [{ id: uid("AL"), ...a }, ...prev].slice(0, 40));
  };

  const exportJSON = () => {
    const payload = {
      budgets,
      userCaps,
      alerts,
      history,
      exceptions,
      exportedAt: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-budgets-controls.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Downloaded JSON config.", kind: "success" });
  };

  const copyJSON = async () => {
    const payload = { budgets, userCaps, alerts, history, exceptions };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", message: "Copied JSON to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  // Budget editor
  const openNewBudget = () => {
    const now = Date.now();
    setBudgetDraft({
      id: "",
      scope: "Group",
      period: "Monthly",
      capType: "Soft",
      amountUGX: 1000000,
      usedUGX: 0,
      group: "Operations",
      updatedAt: now,
      updatedBy: "You",
      notes: "",
    });
    setBudgetModalOpen(true);
  };

  const openEditBudget = (b: Budget) => {
    setBudgetDraft(JSON.parse(JSON.stringify(b)));
    setBudgetModalOpen(true);
  };

  const saveBudget = () => {
    // basic validation
    if (budgetDraft.amountUGX <= 0) {
      toast({ title: "Invalid amount", message: "Budget amount must be greater than zero.", kind: "warn" });
      return;
    }

    // marketplace scope requires module E-Commerce
    if (budgetDraft.scope === "Marketplace" && budgetDraft.module !== "E-Commerce") {
      toast({ title: "Invalid scope", message: "Marketplace budgets must be under E-Commerce.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const isNew = !budgetDraft.id;
    const id = isNew ? uid("B") : budgetDraft.id;

    setBudgets((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((x) => x.id === id);
      const row = { ...budgetDraft, id, updatedAt: now, updatedBy: "You" };
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });

    addHistory({ ts: now, actor: "You", type: isNew ? "Budget created" : "Budget updated", details: `${isNew ? "Created" : "Updated"} ${budgetDraft.scope} budget (${id}) to ${formatUGX(budgetDraft.amountUGX)} (${budgetDraft.capType})` });

    toast({ title: "Saved", message: "Budget saved.", kind: "success" });
    setBudgetModalOpen(false);
  };

  const deleteBudget = (id: string) => {
    setBudgets((p) => p.filter((b) => b.id !== id));
    addHistory({ ts: Date.now(), actor: "You", type: "Budget updated", details: `Deleted budget ${id}` });
    toast({ title: "Deleted", message: `Budget ${id} removed.",`, kind: "info" });
  };

  // User caps editor
  const openNewCap = () => {
    const now = Date.now();
    setCapDraft({ id: "", userId: USERS[0].id, period: "Monthly", capType: "Soft", amountUGX: 500000, usedUGX: 0, updatedAt: now, updatedBy: "You" });
    setCapModalOpen(true);
  };

  const openEditCap = (c: UserCap) => {
    setCapDraft(JSON.parse(JSON.stringify(c)));
    setCapModalOpen(true);
  };

  const saveCap = () => {
    if (capDraft.amountUGX <= 0) {
      toast({ title: "Invalid amount", message: "Cap amount must be greater than zero.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const isNew = !capDraft.id;
    const id = isNew ? uid("UC") : capDraft.id;

    setUserCaps((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((x) => x.id === id);
      const row = { ...capDraft, id, updatedAt: now, updatedBy: "You" };
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });

    addHistory({ ts: now, actor: "You", type: "User cap updated", details: `${isNew ? "Created" : "Updated"} user cap (${id}) to ${formatUGX(capDraft.amountUGX)} (${capDraft.capType})` });

    toast({ title: "Saved", message: "User cap saved.", kind: "success" });
    setCapModalOpen(false);
  };

  // Emergency exceptions
  const openNewException = (targetType?: ExceptionTarget, targetId?: string) => {
    setExceptionDraft({
      id: "",
      createdAt: Date.now(),
      createdBy: "You",
      status: "Pending",
      targetType: targetType || "Group",
      targetId: targetId || "B-G-FIN",
      extraAmountUGX: 1000000,
      reason: "",
      attachmentsProvided: true,
      approver: "Org Admin",
    });
    setExceptionModalOpen(true);
  };

  const submitException = () => {
    if (exceptionDraft.reason.trim().length < 10) {
      toast({ title: "Reason required", message: "Provide a clear reason (min 10 chars).", kind: "warn" });
      return;
    }
    const now = Date.now();
    const exc: EmergencyException = { ...exceptionDraft, id: uid("EXC"), createdAt: now, createdBy: "You", status: "Pending" };
    setExceptions((p) => [exc, ...p]);
    addHistory({ ts: now, actor: "You", type: "Exception requested", details: `Requested emergency exception ${exc.id} (+${formatUGX(exc.extraAmountUGX)}) for ${exc.targetType} ${exc.targetId}` });
    addAlert({ ts: now, severity: "Warning", title: "Emergency exception requested", message: `${exc.id} pending approval.`, relatedIds: [exc.targetId] });
    toast({ title: "Requested", message: "Emergency exception submitted.", kind: "success" });
    setExceptionModalOpen(false);
  };

  const decideException = (id: string, decision: "Approved" | "Rejected") => {
    const now = Date.now();
    setExceptions((prev) =>
      prev.map((e) => (e.id === id ? { ...e, status: decision, decisionNote: decision === "Approved" ? "Approved" : "Rejected", approver: "Org Admin" } : e))
    );
    addHistory({ ts: now, actor: "Org Admin", type: decision === "Approved" ? "Exception approved" : "Exception rejected", details: `${decision} emergency exception ${id}` });

    if (decision === "Approved") {
      // apply to budget or cap by increasing amount
      const ex = exceptions.find((x) => x.id === id);
      if (ex) {
        if (ex.targetType === "User") {
          // bump user cap if exists
          setUserCaps((prev) =>
            prev.map((c) => (c.userId === ex.targetId ? { ...c, amountUGX: c.amountUGX + ex.extraAmountUGX, updatedAt: now, updatedBy: "Org Admin" } : c))
          );
        } else {
          setBudgets((prev) =>
            prev.map((b) => (b.id === ex.targetId ? { ...b, amountUGX: b.amountUGX + ex.extraAmountUGX, updatedAt: now, updatedBy: "Org Admin", notes: `${b.notes || ""} (Exception ${id})` } : b))
          );
        }
      }
      addAlert({ ts: now, severity: "Info", title: "Emergency exception approved", message: `${id} approved and applied to limits.",`, relatedIds: [id] });
      toast({ title: "Approved", message: "Exception applied to limits.", kind: "success" });
    } else {
      addAlert({ ts: now, severity: "Info", title: "Emergency exception rejected", message: `${id} rejected.",`, relatedIds: [id] });
      toast({ title: "Rejected", message: "Exception rejected.", kind: "info" });
    }
  };

  // Spend simulation
  const openSpendSim = () => {
    setSpendDraft({
      userId: USERS[1].id,
      module: "Rides & Logistics",
      marketplace: "-",
      amountUGX: 85000,
      vendor: "EVzone Rides",
      risk: "Low",
      note: "Client meeting ride",
    });
    setSpendModalOpen(true);
  };

  const findUser = (id: string) => USERS.find((u) => u.id === id) || USERS[0];

  const applySpend = () => {
    const now = Date.now();
    const u = findUser(spendDraft.userId);

    addHistory({ ts: now, actor: "System", type: "Spend attempted", details: `Spend attempt ${formatUGX(spendDraft.amountUGX)} by ${u.name} in ${spendDraft.module}${spendDraft.module === "E-Commerce" ? ` (${spendDraft.marketplace})` : ""}` });

    // Determine applicable budgets
    const applicable: Budget[] = [];
    const org = budgets.find((b) => b.scope === "Org" && b.period === "Monthly");
    if (org) applicable.push(org);

    const gBudget = budgets.find((b) => b.scope === "Group" && b.group === u.group && b.period === "Monthly");
    if (gBudget) applicable.push(gBudget);

    const mBudget = budgets.find((b) => b.scope === "Module" && b.module === spendDraft.module && b.period === "Monthly");
    if (mBudget) applicable.push(mBudget);

    if (spendDraft.module === "E-Commerce" && spendDraft.marketplace !== "-") {
      const mkBudget = budgets.find((b) => b.scope === "Marketplace" && b.marketplace === spendDraft.marketplace && b.period === "Monthly");
      if (mkBudget) applicable.push(mkBudget);
    }

    const cap = userCaps.find((c) => c.userId === u.id && c.period === "Monthly") || null;

    // Check hard caps first (any hard cap blocks)
    const blockers: Array<{ label: string; id: string }> = [];

    for (const b of applicable) {
      if (b.capType === "Hard" && b.usedUGX + spendDraft.amountUGX > b.amountUGX) {
        blockers.push({ label: `${b.scope} budget ${b.id}`, id: b.id });
      }
    }
    if (cap && cap.capType === "Hard" && cap.usedUGX + spendDraft.amountUGX > cap.amountUGX) {
      blockers.push({ label: `User cap ${cap.id}`, id: cap.id });
    }

    if (blockers.length) {
      addHistory({ ts: now, actor: "System", type: "Hard cap blocked", details: `Blocked by: ${blockers.map((b) => b.label).join(", ")}` });
      addAlert({ ts: now, severity: "Critical", title: "Hard cap blocked", message: `Spend blocked by hard cap. Consider emergency exception if urgent.",`, relatedIds: blockers.map((x) => x.id) });
      toast({ title: "Blocked", message: "Hard cap blocked this spend.", kind: "warn" });
      setSpendModalOpen(false);
      return;
    }

    // Apply spend
    setBudgets((prev) =>
      prev.map((b) => {
        const hit = applicable.find((x) => x.id === b.id);
        if (!hit) return b;
        const nextUsed = b.usedUGX + spendDraft.amountUGX;
        return { ...b, usedUGX: nextUsed };
      })
    );

    if (cap) {
      setUserCaps((prev) => prev.map((c) => (c.id === cap.id ? { ...c, usedUGX: c.usedUGX + spendDraft.amountUGX } : c)));
    }

    // Alerts: 80% and 100%
    const checkThreshold = (label: string, id: string, used: number, amount: number, capType: CapType) => {
      const beforePct = pct(used - spendDraft.amountUGX, amount);
      const afterPct = pct(used, amount);
      if (afterPct >= 100 && beforePct < 100) {
        addAlert({ ts: now, severity: capType === "Hard" ? "Critical" : "Warning", title: `${label} reached 100%`, message: `${id} reached its limit.",`, relatedIds: [id] });
      } else if (afterPct >= 80 && beforePct < 80) {
        addAlert({ ts: now, severity: "Warning", title: `${label} at 80%`, message: `${id} is above 80% of its cap.",`, relatedIds: [id] });
      }
    };

    for (const b of applicable) {
      const updated = budgets.find((x) => x.id === b.id);
      const used = (updated?.usedUGX || b.usedUGX) + spendDraft.amountUGX;
      checkThreshold(`${b.scope}`, b.id, used, b.amountUGX, b.capType);

      // Soft cap behavior: allow but alert if exceeded
      if (b.capType === "Soft" && used > b.amountUGX) {
        addAlert({ ts: now, severity: "Warning", title: "Soft cap exceeded", message: `${b.id} exceeded soft cap. Routed to approvals in production.",`, relatedIds: [b.id] });
      }
    }

    if (cap) {
      const nextUsed = cap.usedUGX + spendDraft.amountUGX;
      checkThreshold("User cap", cap.id, nextUsed, cap.amountUGX, cap.capType);
      if (cap.capType === "Soft" && nextUsed > cap.amountUGX) {
        addAlert({ ts: now, severity: "Warning", title: "User soft cap exceeded", message: `${u.name} exceeded their soft cap. Consider adjust or enforce.",`, relatedIds: [cap.id] });
      }
    }

    addHistory({ ts: now, actor: "System", type: "Spend applied", details: `Applied spend ${formatUGX(spendDraft.amountUGX)} by ${u.name}.` });
    toast({ title: "Applied", message: "Spend applied and budgets updated.", kind: "success" });
    setSpendModalOpen(false);
  };

  // Render
  const orgPct = totalAmount > 0 ? (totalUsed / totalAmount) * 100 : 0;

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
                  <PiggyBank className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Budgets, Spend Limits and Controls</div>
                  <div className="mt-1 text-xs text-slate-500">Org budgets, group budgets, user caps, alerts, forecasting, and emergency exceptions.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Period: Monthly (Day ${dayOfPeriod}/${periodDays})`} tone="neutral" />
                    <Pill label={`Org used: ${Math.round(orgPct)}%`} tone={orgPct >= 90 ? "warn" : "good"} />
                    <Pill label={`Alerts: ${alerts.length}`} tone={alerts.some((a) => a.severity === "Critical") ? "bad" : "info"} />
                    <Pill label="Premium forecasting" tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={copyJSON}>
                  <Copy className="h-4 w-4" /> Copy JSON
                </Button>
                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="outline" onClick={openSpendSim}>
                  <Wallet className="h-4 w-4" /> Simulate spend
                </Button>
                <Button variant="primary" onClick={openNewBudget}>
                  <Plus className="h-4 w-4" /> New budget
                </Button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                title="Org budget"
                value={formatUGX(totalAmount)}
                sub="Monthly"
                icon={<PiggyBank className="h-5 w-5" />}
                tone="neutral"
              />
              <StatCard
                title="Spent"
                value={formatUGX(totalUsed)}
                sub={`MTD (Day ${dayOfPeriod})`}
                icon={<BarChart3 className="h-5 w-5" />}
                tone={orgPct >= 90 ? "warn" : "good"}
              />
              <StatCard
                title="Remaining"
                value={formatUGX(remaining)}
                sub="Available this period"
                icon={<Wallet className="h-5 w-5" />}
                tone={remaining <= 2000000 ? "warn" : "neutral"}
              />
              <StatCard
                title="Runway"
                value={runwayDays === Infinity ? "∞" : `${Math.max(0, Math.round(runwayDays))} days`}
                sub="At current burn"
                icon={<Timer className="h-5 w-5" />}
                tone={runwayDays !== Infinity && runwayDays <= 5 ? "warn" : "neutral"}
              />
              <StatCard
                title="Forecast"
                value={formatUGX(orgForecast)}
                sub={orgForecast > totalAmount ? "Over budget risk" : "Within budget"}
                icon={<LineChart className="h-5 w-5" />}
                tone={orgForecast > totalAmount ? "warn" : "good"}
              />
              <StatCard
                title="Exceptions"
                value={`${exceptions.filter((e) => e.status === "Pending").length} pending`}
                sub="Emergency workflow"
                icon={<Shield className="h-5 w-5" />}
                tone={exceptions.some((e) => e.status === "Pending") ? "info" : "neutral"}
              />
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
              <ProgressBar valuePct={orgPct} labelLeft="Org usage" labelRight={`${Math.round(orgPct)}%`} />
              <div className="mt-2 text-xs text-slate-600">
                Hard cap blocks spend. Soft cap allows spend but triggers alerts and routes to approvals in production.
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "budgets", label: "Budgets" },
                { id: "caps", label: "User caps" },
                { id: "history", label: "Allocation history" },
                { id: "forecast", label: "Forecasting" },
                { id: "exceptions", label: "Emergency exceptions" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === (t.id as any) ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === (t.id as any) ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t.id as any)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="flex flex-col gap-4">
              {/* Alerts */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Alerts</div>
                      <div className="mt-1 text-xs text-slate-500">Real-time cap breach alerts and policy reminders.</div>
                    </div>
                    <Pill label="Live" tone="info" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {openAlerts.slice(0, 6).map((a) => (
                      <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Pill label={a.severity} tone={pillToneForSeverity(a.severity)} />
                              <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{a.message}</div>
                            <div className="mt-2 text-xs text-slate-500">{timeAgo(a.ts)} • {formatDateTime(a.ts)}</div>
                          </div>
                          <AlertTriangle className={cn("h-5 w-5", a.severity === "Critical" ? "text-rose-700" : a.severity === "Warning" ? "text-amber-700" : "text-blue-700")} />
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: "Rule", message: "Create rule from this alert (see J).", kind: "info" })}>
                            <Sparkles className="h-4 w-4" /> Create rule
                          </Button>
                          <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openNewException("Org", "B-ORG")}>
                            <Shield className="h-4 w-4" /> Exception
                          </Button>
                        </div>
                      </div>
                    ))}
                    {!openAlerts.length ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        No alerts.
                      </div>
                    ) : null}
                  </div>
                </div>

              {/* Main */}
              <div className="space-y-4">
                {tab === "budgets" ? (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Budgets</div>
                          <div className="mt-1 text-xs text-slate-500">Org, group, module, and marketplace budgets.</div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={openNewBudget}>
                            <Plus className="h-4 w-4" /> Add budget
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Scope</th>
                              <th className="px-4 py-3 font-semibold">Target</th>
                              <th className="px-4 py-3 font-semibold">Period</th>
                              <th className="px-4 py-3 font-semibold">Cap type</th>
                              <th className="px-4 py-3 font-semibold">Used</th>
                              <th className="px-4 py-3 font-semibold">Limit</th>
                              <th className="px-4 py-3 font-semibold">Usage</th>
                              <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {budgets
                              .slice()
                              .sort((a, b) => (a.scope === "Org" ? -1 : b.scope === "Org" ? 1 : a.scope.localeCompare(b.scope)))
                              .map((b) => {
                                const usage = pct(b.usedUGX, b.amountUGX);
                                const over = b.usedUGX > b.amountUGX;
                                const warn = usage >= 80;
                                const target =
                                  b.scope === "Org"
                                    ? "Organization"
                                    : b.scope === "Group"
                                      ? b.group
                                      : b.scope === "Module"
                                        ? b.module
                                        : `${b.marketplace}`;
                                return (
                                  <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-4 py-3"><Pill label={b.scope} tone="neutral" /></td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">{target || "-"}</td>
                                    <td className="px-4 py-3 text-slate-700">{b.period}</td>
                                    <td className="px-4 py-3"><Pill label={b.capType} tone={toneForCapType(b.capType)} /></td>
                                    <td className="px-4 py-3 text-slate-700">{formatUGX(b.usedUGX)}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(b.amountUGX)}</td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-col gap-1">
                                        <Pill label={`${usage}%`} tone={over ? "bad" : warn ? "warn" : "good"} />
                                        <div className="text-xs text-slate-500">Updated {timeAgo(b.updatedAt)}</div>
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditBudget(b)}>
                                          Edit
                                        </Button>
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openNewException(b.scope === "Org" ? "Org" : b.scope === "Group" ? "Group" : b.scope === "Module" ? "Module" : "Marketplace", b.id)}>
                                          <Shield className="h-4 w-4" /> Exception
                                        </Button>
                                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteBudget(b.id)}>
                                          <X className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            {!budgets.length ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-600">
                                  No budgets configured.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Core: hard cap vs soft cap, budget periods, allocation history, real-time alerts. Premium: forecasting and suggested caps.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Premium: suggested caps</div>
                          <div className="mt-1 text-xs text-slate-500">Based on historical spend. Apply to group budgets.</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Group</th>
                              <th className="px-4 py-3 font-semibold">Avg</th>
                              <th className="px-4 py-3 font-semibold">Max</th>
                              <th className="px-4 py-3 font-semibold">Suggested</th>
                              <th className="px-4 py-3 font-semibold">Apply</th>
                            </tr>
                          </thead>
                          <tbody>
                            {suggestedGroupCaps.map((s) => (
                              <tr key={s.group} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{s.group}</td>
                                <td className="px-4 py-3 text-slate-700">{formatUGX(s.avg)}</td>
                                <td className="px-4 py-3 text-slate-700">{formatUGX(s.p90)}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(s.suggested)}</td>
                                <td className="px-4 py-3">
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      const now = Date.now();
                                      setBudgets((prev) =>
                                        prev.map((b) =>
                                          b.scope === "Group" && b.group === s.group
                                            ? { ...b, amountUGX: s.suggested, updatedAt: now, updatedBy: "You", notes: `${b.notes || ""} (Suggested caps applied)` }
                                            : b
                                        )
                                      );
                                      addHistory({ ts: now, actor: "You", type: "Budget updated", details: `Applied suggested cap for ${s.group} to ${formatUGX(s.suggested)}` });
                                      toast({ title: "Applied", message: `Updated ${s.group} budget.",`, kind: "success" });
                                    }}
                                  >
                                    Apply
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Suggested caps are guidance. Keep stricter controls for high-risk modules and marketplaces.
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "caps" ? (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">User caps</div>
                          <div className="mt-1 text-xs text-slate-500">User spend caps by period. Hard cap blocks, soft cap warns.</div>
                        </div>
                        <Button variant="primary" onClick={openNewCap}>
                          <Plus className="h-4 w-4" /> Add cap
                        </Button>
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">User</th>
                              <th className="px-4 py-3 font-semibold">Group</th>
                              <th className="px-4 py-3 font-semibold">Eligible</th>
                              <th className="px-4 py-3 font-semibold">Cap type</th>
                              <th className="px-4 py-3 font-semibold">Used</th>
                              <th className="px-4 py-3 font-semibold">Limit</th>
                              <th className="px-4 py-3 font-semibold">Usage</th>
                              <th className="px-4 py-3 font-semibold">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {userCaps.map((c) => {
                              const u = USERS.find((x) => x.id === c.userId);
                              const usage = pct(c.usedUGX, c.amountUGX);
                              const warn = usage >= 80;
                              const over = c.usedUGX > c.amountUGX;
                              return (
                                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{u?.name || c.userId}</td>
                                  <td className="px-4 py-3 text-slate-700">{u?.group || "-"}</td>
                                  <td className="px-4 py-3"><Pill label={u?.autoApprovalEligible ? "Yes" : "No"} tone={u?.autoApprovalEligible ? "good" : "neutral"} /></td>
                                  <td className="px-4 py-3"><Pill label={c.capType} tone={toneForCapType(c.capType)} /></td>
                                  <td className="px-4 py-3 text-slate-700">{formatUGX(c.usedUGX)}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(c.amountUGX)}</td>
                                  <td className="px-4 py-3">
                                    <Pill label={`${usage}%`} tone={over ? "bad" : warn ? "warn" : "good"} />
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditCap(c)}>
                                        Edit
                                      </Button>
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openNewException("User", c.userId)}>
                                        <Shield className="h-4 w-4" /> Exception
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                            {!userCaps.length ? (
                              <tr>
                                <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-600">
                                  No user caps configured.
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Premium: suggested caps can be computed per user based on their historical spend.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Real-time alerts</div>
                          <div className="mt-1 text-xs text-slate-500">Alerts are generated when crossing 80% or 100% thresholds, and on hard cap blocks.</div>
                        </div>
                        <Button variant="outline" onClick={openSpendSim}>
                          <Wallet className="h-4 w-4" /> Simulate spend
                        </Button>
                      </div>

                      <div className="mt-4 space-y-2">
                        {openAlerts.slice(0, 8).map((a) => (
                          <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={a.severity} tone={pillToneForSeverity(a.severity)} />
                                  <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                                </div>
                                <div className="mt-1 text-sm text-slate-700">{a.message}</div>
                                <div className="mt-2 text-xs text-slate-500">{formatDateTime(a.ts)} ({timeAgo(a.ts)})</div>
                                {a.relatedIds.length ? (
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {a.relatedIds.slice(0, 4).map((id) => (
                                      <Pill key={id} label={id} tone="neutral" />
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              <AlertTriangle className={cn("h-5 w-5", a.severity === "Critical" ? "text-rose-700" : a.severity === "Warning" ? "text-amber-700" : "text-blue-700")} />
                            </div>
                          </div>
                        ))}
                        {!openAlerts.length ? (
                          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                              <BellIcon />
                            </div>
                            <div className="mt-3 text-sm font-semibold text-slate-900">No alerts</div>
                            <div className="mt-1 text-sm text-slate-600">Alerts will appear here.</div>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "history" ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Budget allocation history</div>
                        <div className="mt-1 text-xs text-slate-500">Changes are logged with who, when, and what happened.</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={copyJSON}>
                          <Copy className="h-4 w-4" /> Copy JSON
                        </Button>
                        <Button variant="outline" onClick={exportJSON}>
                          <Download className="h-4 w-4" /> Export
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      {history.slice(0, 30).map((h) => (
                        <div key={h.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={h.type} tone={h.type.includes("Hard cap") ? "bad" : h.type.includes("Exception") ? "info" : "neutral"} />
                                <div className="text-sm font-semibold text-slate-900">{h.actor}</div>
                              </div>
                              <div className="mt-1 text-sm text-slate-700">{h.details}</div>
                              <div className="mt-2 text-xs text-slate-500">{formatDateTime(h.ts)} ({timeAgo(h.ts)}) • {h.id}</div>
                            </div>
                            <FileText className="h-5 w-5 text-slate-600" />
                          </div>
                        </div>
                      ))}
                      {!history.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <FileText className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No history</div>
                          <div className="mt-1 text-sm text-slate-600">Changes will be recorded here.</div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {tab === "forecast" ? (
                  <>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Forecasting and runway</div>
                          <div className="mt-1 text-xs text-slate-500">Premium: forecast to month-end by group, module, and marketplace.</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Org forecast</div>
                          <div className="mt-1 text-xs text-slate-500">Simple burn-rate projection.</div>
                          <div className="mt-3">
                            <ProgressBar
                              valuePct={pct(orgForecast, totalAmount)}
                              labelLeft={`Forecast ${formatUGX(orgForecast)}`}
                              labelRight={`Budget ${formatUGX(totalAmount)}`}
                            />
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Burn per day: {formatUGX(Math.round(orgBurnPerDay))}</div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="text-sm font-semibold text-slate-900">Runway by group</div>
                          <div className="mt-1 text-xs text-slate-500">How long until budgets run out.</div>
                          <div className="mt-3 space-y-2">
                            {groupForecast.map((g) => {
                              const rem = Math.max(0, g.amountUGX - g.usedUGX);
                              const days = g.runway === Infinity ? Infinity : Math.max(0, Math.round(g.runway));
                              return (
                                <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <div className="text-sm font-semibold text-slate-900">{g.group}</div>
                                      <div className="mt-1 text-xs text-slate-500">Remaining: {formatUGX(rem)} • Burn/day: {formatUGX(Math.round(g.burnPerDay))}</div>
                                    </div>
                                    <Pill label={days === Infinity ? "∞" : `${days}d`} tone={days !== Infinity && days <= 5 ? "warn" : "neutral"} />
                                  </div>
                                  <div className="mt-2">
                                    <ProgressBar valuePct={pct(g.usedUGX, g.amountUGX)} labelLeft="Used" labelRight={`${pct(g.usedUGX, g.amountUGX)}%`} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Forecast by module</div>
                            <div className="mt-1 text-xs text-slate-500">Module budgets and projected spend.</div>
                          </div>
                          <Pill label="Premium" tone="info" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {moduleForecast.length ? (
                            moduleForecast.map((m) => (
                              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{m.module}</div>
                                    <div className="mt-1 text-xs text-slate-500">Forecast: {formatUGX(m.forecast)} • Budget: {formatUGX(m.amountUGX)}</div>
                                  </div>
                                  <Pill label={m.forecast > m.amountUGX ? "Risk" : "OK"} tone={m.forecast > m.amountUGX ? "warn" : "good"} />
                                </div>
                                <div className="mt-2">
                                  <ProgressBar valuePct={pct(m.forecast, m.amountUGX)} labelLeft="Forecast" labelRight={`${pct(m.forecast, m.amountUGX)}%`} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                              No module budgets configured.
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Forecast by marketplace</div>
                            <div className="mt-1 text-xs text-slate-500">E-Commerce marketplace budgets and projected spend.</div>
                          </div>
                          <Pill label="Premium" tone="info" />
                        </div>
                        <div className="mt-3 space-y-2">
                          {marketplaceForecast.length ? (
                            marketplaceForecast.map((m) => (
                              <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{m.marketplace}</div>
                                    <div className="mt-1 text-xs text-slate-500">Forecast: {formatUGX(m.forecast)} • Budget: {formatUGX(m.amountUGX)}</div>
                                  </div>
                                  <Pill label={m.forecast > m.amountUGX ? "Risk" : "OK"} tone={m.forecast > m.amountUGX ? "warn" : "good"} />
                                </div>
                                <div className="mt-2">
                                  <ProgressBar valuePct={pct(m.forecast, m.amountUGX)} labelLeft="Forecast" labelRight={`${pct(m.forecast, m.amountUGX)}%`} />
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                              No marketplace budgets configured.
                            </div>
                          )}
                        </div>
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Tip: keep MyLiveDealz stricter due to high-value deals.
                        </div>
                      </div>
                    </div>
                  </>
                ) : null}

                {tab === "exceptions" ? (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Emergency exception workflow</div>
                        <div className="mt-1 text-xs text-slate-500">Premium: allow temporary limit increases with approvals.</div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => openNewException()}>
                          <Plus className="h-4 w-4" /> New exception
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Target</th>
                            <th className="px-4 py-3 font-semibold">Extra</th>
                            <th className="px-4 py-3 font-semibold">Reason</th>
                            <th className="px-4 py-3 font-semibold">Attachments</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {exceptions.map((e) => (
                            <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{e.id}</td>
                              <td className="px-4 py-3">
                                <Pill label={e.status} tone={e.status === "Approved" ? "good" : e.status === "Rejected" ? "bad" : "warn"} />
                              </td>
                              <td className="px-4 py-3 text-slate-700">{e.targetType} • {e.targetId}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(e.extraAmountUGX)}</td>
                              <td className="px-4 py-3 text-slate-700">{e.reason}</td>
                              <td className="px-4 py-3"><Pill label={e.attachmentsProvided ? "Yes" : "No"} tone={e.attachmentsProvided ? "good" : "warn"} /></td>
                              <td className="px-4 py-3">
                                {e.status === "Pending" ? (
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => decideException(e.id, "Approved")}>
                                      <Check className="h-4 w-4" /> Approve
                                    </Button>
                                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => decideException(e.id, "Rejected")}>
                                      <X className="h-4 w-4" /> Reject
                                    </Button>
                                  </div>
                                ) : (
                                  <Pill label={`By ${e.approver}`} tone="neutral" />
                                )}
                              </td>
                            </tr>
                          ))}
                          {!exceptions.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">
                                No exceptions.
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Emergency exceptions should be rare and always audit logged.
                    </div>
                  </div>

                ) : null}
              </div>



              {/* Quick Actions */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Quick actions</div>
                      <div className="mt-1 text-xs text-slate-500">Budget and control tools.</div>
                    </div>
                    <Pill label="Admin" tone="neutral" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
                    <Button variant="outline" onClick={openNewBudget}>
                      <Plus className="h-4 w-4" /> Create budget
                    </Button>
                    <Button variant="outline" onClick={openNewCap}>
                      <User className="h-4 w-4" /> Set user cap
                    </Button>
                    <Button variant="outline" onClick={openSpendSim}>
                      <Wallet className="h-4 w-4" /> Simulate spend
                    </Button>
                    <Button variant="outline" onClick={() => openNewException()}>
                      <Shield className="h-4 w-4" /> Emergency exception
                    </Button>
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Premium: emergency exceptions require approvals and are audit logged.
                  </div>
                </div>
            </div>
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              L Budgets, Spend Limits and Controls v2. Core: org budget, group budgets, user caps, hard vs soft caps, budget periods, real-time alerts, and allocation history. Premium: forecasting and runway, suggested caps, and emergency exceptions with approvals.
            </div>
          </footer>
        </div>
      </div>

      {/* Budget modal */}
      <Modal
        open={budgetModalOpen}
        title={budgetDraft.id ? "Edit budget" : "New budget"}
        subtitle="Org, group, module, or marketplace budgets."
        onClose={() => setBudgetModalOpen(false)}
        actions={[
          ...(budgetDraft.id ? [{ label: "Delete", onClick: () => { deleteBudget(budgetDraft.id); setBudgetModalOpen(false); }, variant: "danger" as const }] : []),
          { label: "Save", onClick: saveBudget }
        ]}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setBudgetModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveBudget}>
              {budgetDraft.id ? "Save budget" : "Add budget"}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Scope"
            value={budgetDraft.scope}
            onChange={(v) => {
              const scope = v as BudgetScope;
              setBudgetDraft((p) => {
                const next: Budget = { ...p, scope };
                if (scope === "Org") {
                  delete next.group;
                  delete next.module;
                  delete next.marketplace;
                }
                if (scope === "Group") {
                  next.group = next.group || "Operations";
                  delete next.module;
                  delete next.marketplace;
                }
                if (scope === "Module") {
                  next.module = next.module || "Rides & Logistics";
                  delete next.group;
                  delete next.marketplace;
                }
                if (scope === "Marketplace") {
                  next.module = "E-Commerce";
                  next.marketplace = next.marketplace || "MyLiveDealz";
                  delete next.group;
                }
                return next;
              });
            }}
            options={["Org", "Group", "Module", "Marketplace"]}
          />

          <Select
            label="Period"
            value={budgetDraft.period}
            onChange={(v) => setBudgetDraft((p) => ({ ...p, period: v as BudgetPeriod }))}
            options={["Weekly", "Monthly", "Quarterly"]}
          />

          <Select
            label="Cap type"
            value={budgetDraft.capType}
            onChange={(v) => setBudgetDraft((p) => ({ ...p, capType: v as CapType }))}
            options={["Hard", "Soft"]}
            hint="Hard blocks spend"
          />

          <NumberField
            label="Amount (UGX)"
            value={budgetDraft.amountUGX}
            onChange={(v) => setBudgetDraft((p) => ({ ...p, amountUGX: Math.max(0, v) }))}
            hint={formatUGX(budgetDraft.amountUGX)}
          />

          <div className={cn("", budgetDraft.scope === "Group" ? "" : "opacity-70")}>
            <Select
              label="Group"
              value={budgetDraft.group || "Operations"}
              onChange={(v) => setBudgetDraft((p) => ({ ...p, group: v as GroupName }))}
              options={["Operations", "Sales", "Finance", "Admin", "Procurement"]}
              disabled={budgetDraft.scope !== "Group"}
            />
          </div>

          <div className={cn("", budgetDraft.scope === "Module" ? "" : "opacity-70")}>
            <Select
              label="Module"
              value={budgetDraft.module || "Rides & Logistics"}
              onChange={(v) => setBudgetDraft((p) => ({ ...p, module: v as ServiceModule }))}
              options={SERVICE_MODULES}
              disabled={budgetDraft.scope !== "Module" && budgetDraft.scope !== "Marketplace"}
              hint={budgetDraft.scope === "Marketplace" ? "Fixed to E-Commerce" : undefined}
            />
          </div>

          <div className={cn("md:col-span-2", budgetDraft.scope === "Marketplace" ? "" : "opacity-70")}>
            <Select
              label="Marketplace"
              value={budgetDraft.marketplace || "MyLiveDealz"}
              onChange={(v) => setBudgetDraft((p) => ({ ...p, marketplace: v as Marketplace }))}
              options={MARKETPLACES}
              disabled={budgetDraft.scope !== "Marketplace"}
              hint="E-Commerce only"
            />
          </div>

          <div className="md:col-span-2">
            <TextArea
              label="Notes"
              value={budgetDraft.notes || ""}
              onChange={(v) => setBudgetDraft((p) => ({ ...p, notes: v }))}
              placeholder="Explain why this budget exists"
              rows={3}
            />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Best practice: keep high-risk marketplaces on hard cap or require approvals above soft cap.
          </div>
        </div>
      </Modal>

      {/* User cap modal */}
      <Modal
        open={capModalOpen}
        title={capDraft.id ? "Edit user cap" : "New user cap"}
        subtitle="User caps are enforced alongside budgets."
        onClose={() => setCapModalOpen(false)}
        actions={[
          { label: "Save", onClick: saveCap }
        ]}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCapModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={saveCap}>
              Save cap
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="User"
            value={capDraft.userId}
            onChange={(v) => setCapDraft((p) => ({ ...p, userId: v }))}
            options={USERS.map((u) => u.id)}
            hint="Select user ID"
          />
          <Select
            label="Period"
            value={capDraft.period}
            onChange={(v) => setCapDraft((p) => ({ ...p, period: v as BudgetPeriod }))}
            options={["Weekly", "Monthly", "Quarterly"]}
          />
          <Select
            label="Cap type"
            value={capDraft.capType}
            onChange={(v) => setCapDraft((p) => ({ ...p, capType: v as CapType }))}
            options={["Hard", "Soft"]}
            hint="Hard blocks spend"
          />
          <NumberField
            label="Cap amount (UGX)"
            value={capDraft.amountUGX}
            onChange={(v) => setCapDraft((p) => ({ ...p, amountUGX: Math.max(0, v) }))}
            hint={formatUGX(capDraft.amountUGX)}
          />

          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Premium: use suggested caps from historical spend for consistent enforcement.
          </div>
        </div>
      </Modal>

      {/* Spend simulation modal */}
      <Modal
        open={spendModalOpen}
        title="Simulate spend"
        subtitle="Creates alerts on breach and updates used amounts. Hard caps block."
        onClose={() => setSpendModalOpen(false)}
        actions={[
          { label: "Emergency exception", onClick: () => openNewException("Org", "B-ORG") },
          { label: "Apply", onClick: applySpend }
        ]}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSpendModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={applySpend}>
              Apply
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="User"
            value={spendDraft.userId}
            onChange={(v) => {
              const u = USERS.find((x) => x.id === v) || USERS[0];
              setSpendDraft((p) => ({ ...p, userId: v, module: p.module, marketplace: p.module === "E-Commerce" ? (p.marketplace === "-" ? "MyLiveDealz" : p.marketplace) : "-" }));
              toast({ title: "User", message: `${u.name} selected.",`, kind: "info" });
            }}
            options={USERS.map((u) => u.id)}
            hint="User ID"
          />

          <NumberField
            label="Amount (UGX)"
            value={spendDraft.amountUGX}
            onChange={(v) => setSpendDraft((p) => ({ ...p, amountUGX: Math.max(0, v) }))}
            hint={formatUGX(spendDraft.amountUGX)}
          />

          <Select
            label="Service Module"
            value={spendDraft.module}
            onChange={(v) => {
              const m = v as ServiceModule;
              setSpendDraft((p) => ({ ...p, module: m, marketplace: m === "E-Commerce" ? (p.marketplace === "-" ? "MyLiveDealz" : p.marketplace) : "-" }));
            }}
            options={SERVICE_MODULES}
          />

          <Select
            label="Marketplace"
            value={String(spendDraft.marketplace === "-" ? "MyLiveDealz" : spendDraft.marketplace)}
            onChange={(v) => setSpendDraft((p) => ({ ...p, marketplace: v as Marketplace }))}
            options={MARKETPLACES}
            disabled={spendDraft.module !== "E-Commerce"}
            hint={spendDraft.module !== "E-Commerce" ? "E-Commerce only" : undefined}
          />

          <Select
            label="Risk"
            value={spendDraft.risk}
            onChange={(v) => setSpendDraft((p) => ({ ...p, risk: v as Risk }))}
            options={["Low", "Medium", "High"]}
            hint="Premium safeguards"
          />

          <Field
            label="Vendor"
            value={spendDraft.vendor}
            onChange={(v) => setSpendDraft((p) => ({ ...p, vendor: v }))}
            placeholder="Vendor name"
          />

          <div className="md:col-span-2">
            <TextArea label="Note" value={spendDraft.note} onChange={(v) => setSpendDraft((p) => ({ ...p, note: v }))} placeholder="Reason for spend" rows={3} />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Spend hits org budget, group budget, optional module and marketplace budgets, plus the user cap.
          </div>
        </div>
      </Modal>

      {/* Emergency exception modal */}
      <Modal
        open={exceptionModalOpen}
        title="Emergency exception request"
        subtitle="Premium: temporary limit increase requires approval."
        onClose={() => setExceptionModalOpen(false)}
        actions={[
          { label: "Submit", onClick: submitException }
        ]}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setExceptionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={submitException}>
              Submit
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Target type"
            value={exceptionDraft.targetType}
            onChange={(v) => setExceptionDraft((p) => ({ ...p, targetType: v as ExceptionTarget }))}
            options={["Org", "Group", "User", "Module", "Marketplace"]}
          />

          <Field
            label="Target ID"
            value={exceptionDraft.targetId}
            onChange={(v) => setExceptionDraft((p) => ({ ...p, targetId: v }))}
            placeholder="Budget ID or User ID"
            hint="Example: B-ORG or B-G-FIN or U-1002"
          />

          <NumberField
            label="Extra amount (UGX)"
            value={exceptionDraft.extraAmountUGX}
            onChange={(v) => setExceptionDraft((p) => ({ ...p, extraAmountUGX: Math.max(0, v) }))}
            hint={formatUGX(exceptionDraft.extraAmountUGX)}
          />

          <Select
            label="Approver"
            value={exceptionDraft.approver}
            onChange={(v) => setExceptionDraft((p) => ({ ...p, approver: v }))}
            options={["Org Admin", "Finance Desk", "CFO"]}
          />

          <div className="md:col-span-2">
            <TextArea
              label="Reason"
              value={exceptionDraft.reason}
              onChange={(v) => setExceptionDraft((p) => ({ ...p, reason: v }))}
              placeholder="Example: urgent purchase required for operations, request approval to exceed cap"
              hint="Minimum 10 characters"
              rows={4}
            />
          </div>

          <Toggle
            enabled={exceptionDraft.attachmentsProvided}
            onChange={(v) => setExceptionDraft((p) => ({ ...p, attachmentsProvided: v }))}
            label="Attachments provided"
            description="Required for high value exceptions"
          />

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            In production, this request routes to Approval Workflow Builder (J) and appears in Approvals Inbox (K).
          </div>
        </div>
      </Modal>
    </div>
  );

  function BellIcon() {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-slate-700">
        <path d="M15 17H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M18 8a6 6 0 10-12 0c0 7-3 7-3 7h18s-3 0-3-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
}