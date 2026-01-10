import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  Bell,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  CreditCard,
  Download,
  FileText,
  Filter,
  Gauge,
  Lock,
  Plus,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  ShieldAlert,
  Sparkles,
  Timer,
  Unlock,
  Users,
  Wallet,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type PaymentModel = "Wallet" | "Credit" | "Prepaid";

type FundingMethod = "Bank transfer" | "Mobile money" | "Card" | "Internal transfer";

type WalletType = "Org" | "Group" | "Cost center";

type WalletStatus = "Active" | "Frozen";

type GroupName = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type CostCenter = "OPS-001" | "SALES-TRAVEL" | "FIN-OPS" | "ADMIN-CORE" | "PROC-001";

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

type Risk = "Low" | "Medium" | "High";

type LedgerType =
  | "Wallet funding"
  | "Wallet transfer"
  | "Spend"
  | "Credit draw"
  | "Credit repayment"
  | "Prepaid deposit"
  | "Prepaid spend"
  | "Hold placed"
  | "Hold released"
  | "Freeze"
  | "Unfreeze";

type WalletRow = {
  id: string;
  name: string;
  type: WalletType;
  group?: GroupName;
  costCenter?: CostCenter;
  currency: "UGX";
  balanceUGX: number;
  heldUGX: number;
  status: WalletStatus;
  updatedAt: number;
};

type CreditLine = {
  enabled: boolean;
  limitUGX: number;
  usedUGX: number;
  repaymentTerms: {
    cycle: "Weekly" | "Monthly";
    graceDays: number;
    metadata: string;
  };
  delinquent: boolean;
};

type PrepaidAccount = {
  enabled: boolean;
  balanceUGX: number;
  reservedUGX: number;
  stopWhenDepleted: boolean;
};

type FundingRequestStatus = "Pending" | "Approved" | "Rejected";

type FundingRequest = {
  id: string;
  createdAt: number;
  createdBy: string;
  kind: "Add funds" | "Prepaid deposit" | "Repay credit" | "Limit increase";
  method: FundingMethod;
  walletId?: string;
  amountUGX: number;
  risk: Risk;
  reason: string;
  status: FundingRequestStatus;
  approvedBy?: string;
  decisionNote?: string;
};

type AutoTopUpRule = {
  id: string;
  enabled: boolean;
  walletId: string;
  thresholdUGX: number;
  topUpAmountUGX: number;
  maxPerDayUGX: number;
  requireApprovalOverUGX: number;
  method: FundingMethod;
  notes: string;
};

type RiskEvent = {
  id: string;
  createdAt: number;
  severity: "Info" | "Warning" | "Critical";
  title: string;
  details: string;
  walletId?: string;
  status: "Open" | "Resolved";
};

type Enforcement = {
  enabled: boolean;
  invoiceOverdueDays: number;
  invoiceGraceDays: number;
  agreementCompliant: boolean;
  status: "Active" | "Soft stop" | "Hard stop";
  reasons: string[];
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
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
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
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
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
          disabled
            ? "border-slate-200 bg-slate-50 text-slate-500"
            : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
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
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
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
              <button className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
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
          {subtitle ? <div className="mt-1 text-xs text-slate-500">{subtitle}</div> : null}
        </div>
        {right}
      </div>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function ProgressBar({ pct, labelLeft, labelRight }: { pct: number; labelLeft: string; labelRight: string }) {
  const v = clamp(pct, 0, 150);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold">{labelLeft}</span>
        <span className="font-semibold">{labelRight}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, v)}%`, background: EVZ.green }} />
      </div>
      {v > 100 ? <div className="mt-2 text-xs font-semibold text-rose-700">Over by {Math.round((v - 100) * 10) / 10}%</div> : null}
    </div>
  );
}

function toneForRisk(r: Risk) {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
}

function toneForEnforcement(s: Enforcement["status"]) {
  if (s === "Hard stop") return "bad" as const;
  if (s === "Soft stop") return "warn" as const;
  return "good" as const;
}

function toneForFRStatus(s: FundingRequestStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  return "warn" as const;
}

function availableWalletBalance(w: WalletRow) {
  return Math.max(0, w.balanceUGX - w.heldUGX);
}

export default function CorporatePayWalletCreditPrepaidV2() {
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
  const COST_CENTERS: CostCenter[] = ["OPS-001", "SALES-TRAVEL", "FIN-OPS", "ADMIN-CORE", "PROC-001"];

  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<
    "overview" | "wallets" | "credit" | "prepaid" | "funding" | "autotopup" | "risk" | "ledger"
  >("overview");

  // Payment models
  const [defaultPayment, setDefaultPayment] = useState<PaymentModel>("Wallet");
  const [allowedPayments, setAllowedPayments] = useState<Record<PaymentModel, boolean>>({
    Wallet: true,
    Credit: true,
    Prepaid: true,
  });

  // Wallets
  const [wallets, setWallets] = useState<WalletRow[]>(() => {
    const now = Date.now();
    return [
      { id: "W-ORG", name: "Main Corporate Wallet", type: "Org", currency: "UGX", balanceUGX: 9200000, heldUGX: 700000, status: "Active", updatedAt: now - 2 * 60 * 60 * 1000 },
      { id: "W-OPS", name: "Operations Wallet", type: "Group", group: "Operations", currency: "UGX", balanceUGX: 3200000, heldUGX: 0, status: "Active", updatedAt: now - 5 * 60 * 60 * 1000 },
      { id: "W-SALES", name: "Sales Wallet", type: "Group", group: "Sales", currency: "UGX", balanceUGX: 1800000, heldUGX: 120000, status: "Active", updatedAt: now - 8 * 60 * 60 * 1000 },
      { id: "W-CC-TRAVEL", name: "Sales Travel Cost Center", type: "Cost center", costCenter: "SALES-TRAVEL", currency: "UGX", balanceUGX: 600000, heldUGX: 0, status: "Active", updatedAt: now - 1 * 24 * 60 * 60 * 1000 },
    ];
  });

  const [primaryWalletId, setPrimaryWalletId] = useState("W-ORG");

  // Credit line
  const [credit, setCredit] = useState<CreditLine>(() => ({
    enabled: true,
    limitUGX: 15000000,
    usedUGX: 4200000,
    repaymentTerms: {
      cycle: "Monthly",
      graceDays: 7,
      metadata: "Interest: 0% promo, late fee: per agreement",
    },
    delinquent: false,
  }));

  // Prepaid
  const [prepaid, setPrepaid] = useState<PrepaidAccount>(() => ({
    enabled: true,
    balanceUGX: 5400000,
    reservedUGX: 350000,
    stopWhenDepleted: true,
  }));

  // Controls
  const [largeFundingThresholdUGX, setLargeFundingThresholdUGX] = useState(5000000);
  const [riskFreezeCorporatePay, setRiskFreezeCorporatePay] = useState(false);

  // Enforcement
  const [enforcementCfg, setEnforcementCfg] = useState<{ enabled: boolean; invoiceGraceDays: number; invoiceOverdueDays: number }>(() => ({
    enabled: true,
    invoiceGraceDays: 7,
    invoiceOverdueDays: 0,
  }));

  // Funding approvals
  const [requests, setRequests] = useState<FundingRequest[]>(() => {
    const now = Date.now();
    return [
      {
        id: "FR-1001",
        createdAt: now - 6 * 60 * 60 * 1000,
        createdBy: "Finance Desk",
        kind: "Add funds",
        method: "Bank transfer",
        walletId: "W-ORG",
        amountUGX: 8500000,
        risk: "Medium",
        reason: "Top up for month start operations",
        status: "Pending",
      },
      {
        id: "FR-1002",
        createdAt: now - 30 * 60 * 60 * 1000,
        createdBy: "Procurement Desk",
        kind: "Prepaid deposit",
        method: "Bank transfer",
        amountUGX: 5000000,
        risk: "Low",
        reason: "Prepaid deposit for Q1",
        status: "Approved",
        approvedBy: "Org Admin",
        decisionNote: "Approved",
      },
    ];
  });

  // Auto top-up rules
  const [autoTopUps, setAutoTopUps] = useState<AutoTopUpRule[]>(() => [
    {
      id: "ATU-01",
      enabled: true,
      walletId: "W-ORG",
      thresholdUGX: 1500000,
      topUpAmountUGX: 2000000,
      maxPerDayUGX: 4000000,
      requireApprovalOverUGX: 5000000,
      method: "Bank transfer",
      notes: "Protect availability for core services.",
    },
  ]);

  // Ledger
  const [ledger, setLedger] = useState<
    Array<{ id: string; at: number; type: LedgerType; walletId?: string; amountUGX: number; note: string }>
  >(() => {
    const now = Date.now();
    return [
      { id: "LG-001", at: now - 2 * 60 * 60 * 1000, type: "Hold placed", walletId: "W-ORG", amountUGX: 700000, note: "Hold for pending RFQ milestone" },
      { id: "LG-002", at: now - 5 * 60 * 60 * 1000, type: "Spend", walletId: "W-SALES", amountUGX: 82000, note: "Ride to client meeting" },
      { id: "LG-003", at: now - 10 * 60 * 60 * 1000, type: "Credit draw", amountUGX: 1200000, note: "Marketplace purchase covered by credit" },
      { id: "LG-004", at: now - 2 * 24 * 60 * 60 * 1000, type: "Prepaid deposit", amountUGX: 5000000, note: "Deposit funded" },
    ];
  });

  // Risk events
  const [riskEvents, setRiskEvents] = useState<RiskEvent[]>(() => {
    const now = Date.now();
    return [
      {
        id: "RE-01",
        createdAt: now - 70 * 60 * 1000,
        severity: "Warning",
        title: "Unusual funding frequency",
        details: "3 funding attempts within 30 minutes. Review source accounts.",
        walletId: "W-ORG",
        status: "Open",
      },
      {
        id: "RE-02",
        createdAt: now - 14 * 60 * 60 * 1000,
        severity: "Critical",
        title: "Potential fraud trigger",
        details: "Large funding request above threshold requires approval.",
        walletId: "W-ORG",
        status: "Open",
      },
    ];
  });

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [walletDraft, setWalletDraft] = useState<WalletRow>(() => ({
    id: "",
    name: "",
    type: "Group",
    group: "Operations",
    costCenter: "OPS-001",
    currency: "UGX",
    balanceUGX: 0,
    heldUGX: 0,
    status: "Active",
    updatedAt: Date.now(),
  }));

  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [fundDraft, setFundDraft] = useState<{
    kind: "Add funds" | "Transfer" | "Repay credit" | "Prepaid deposit";
    fromWalletId: string;
    toWalletId: string;
    amountUGX: number;
    method: FundingMethod;
    reason: string;
    risk: Risk;
  }>(() => ({
    kind: "Add funds",
    fromWalletId: "W-ORG",
    toWalletId: "W-ORG",
    amountUGX: 500000,
    method: "Bank transfer",
    reason: "",
    risk: "Low",
  }));

  const [autoTopUpOpen, setAutoTopUpOpen] = useState(false);
  const [autoTopUpDraft, setAutoTopUpDraft] = useState<AutoTopUpRule>(() => ({
    id: "",
    enabled: true,
    walletId: "W-ORG",
    thresholdUGX: 1500000,
    topUpAmountUGX: 2000000,
    maxPerDayUGX: 4000000,
    requireApprovalOverUGX: 5000000,
    method: "Bank transfer",
    notes: "",
  }));

  // Filters
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerType, setLedgerType] = useState<"All" | LedgerType>("All");
  const [ledgerWallet, setLedgerWallet] = useState<"All" | string>("All");

  const [reqQ, setReqQ] = useState("");
  const [reqStatus, setReqStatus] = useState<"All" | FundingRequestStatus>("All");

  // Derived balances
  const primaryWallet = useMemo(() => wallets.find((w) => w.id === primaryWalletId) || wallets[0], [wallets, primaryWalletId]);
  const totalWalletBalance = useMemo(() => wallets.reduce((a, b) => a + b.balanceUGX, 0), [wallets]);
  const totalWalletAvailable = useMemo(() => wallets.reduce((a, b) => a + availableWalletBalance(b), 0), [wallets]);

  const creditAvailable = Math.max(0, credit.limitUGX - credit.usedUGX);
  const prepaidAvailable = Math.max(0, prepaid.balanceUGX - prepaid.reservedUGX);

  const enforcement: Enforcement = useMemo(() => {
    const reasons: string[] = [];

    if (!enforcementCfg.enabled) {
      return { enabled: false, invoiceOverdueDays: enforcementCfg.invoiceOverdueDays, invoiceGraceDays: enforcementCfg.invoiceGraceDays, agreementCompliant: true, status: "Active", reasons: [] };
    }

    if (riskFreezeCorporatePay) {
      reasons.push("CorporatePay is frozen by admin risk control");
    }

    if (enforcementCfg.invoiceOverdueDays > enforcementCfg.invoiceGraceDays) {
      reasons.push(`Invoice overdue beyond grace (${enforcementCfg.invoiceOverdueDays}d > ${enforcementCfg.invoiceGraceDays}d)`);
    }

    // Payment model constraints
    const walletOk = allowedPayments.Wallet && primaryWallet && primaryWallet.status === "Active" && availableWalletBalance(primaryWallet) > 0;
    const creditOk = allowedPayments.Credit && credit.enabled && !credit.delinquent && creditAvailable > 0;
    const prepaidOk = allowedPayments.Prepaid && prepaid.enabled && prepaidAvailable > 0;

    // For default payment selection, enforce depletion
    if (defaultPayment === "Wallet" && (!primaryWallet || primaryWallet.status !== "Active")) {
      reasons.push("Primary wallet is not active");
    }
    if (defaultPayment === "Wallet" && primaryWallet && availableWalletBalance(primaryWallet) <= 0) {
      reasons.push("Primary wallet is depleted");
    }
    if (defaultPayment === "Credit" && credit.enabled && (credit.delinquent || creditAvailable <= 0)) {
      reasons.push(credit.delinquent ? "Credit line is delinquent" : "Credit limit reached");
    }
    if (defaultPayment === "Prepaid" && prepaid.enabled && prepaidAvailable <= 0 && prepaid.stopWhenDepleted) {
      reasons.push("Prepaid deposit depleted" );
    }

    const agreementCompliant = reasons.length === 0;

    // Hard stop conditions
    const hardStop =
      riskFreezeCorporatePay ||
      enforcementCfg.invoiceOverdueDays > enforcementCfg.invoiceGraceDays ||
      (defaultPayment === "Prepaid" && prepaid.stopWhenDepleted && !prepaidOk) ||
      (defaultPayment === "Wallet" && !walletOk) ||
      (defaultPayment === "Credit" && !creditOk);

    // Soft stop: if default method blocked but another allowed method is available
    const anyAvailable = walletOk || creditOk || prepaidOk;
    const defaultAvailable =
      defaultPayment === "Wallet" ? walletOk : defaultPayment === "Credit" ? creditOk : prepaidOk;

    if (hardStop && !anyAvailable) {
      return { enabled: true, invoiceOverdueDays: enforcementCfg.invoiceOverdueDays, invoiceGraceDays: enforcementCfg.invoiceGraceDays, agreementCompliant: false, status: "Hard stop", reasons };
    }

    if (!defaultAvailable && anyAvailable) {
      reasons.push("Default payment method unavailable, fallback available" );
      return { enabled: true, invoiceOverdueDays: enforcementCfg.invoiceOverdueDays, invoiceGraceDays: enforcementCfg.invoiceGraceDays, agreementCompliant: false, status: "Soft stop", reasons };
    }

    if (hardStop) {
      return { enabled: true, invoiceOverdueDays: enforcementCfg.invoiceOverdueDays, invoiceGraceDays: enforcementCfg.invoiceGraceDays, agreementCompliant: false, status: "Hard stop", reasons };
    }

    return { enabled: true, invoiceOverdueDays: enforcementCfg.invoiceOverdueDays, invoiceGraceDays: enforcementCfg.invoiceGraceDays, agreementCompliant, status: "Active", reasons };
  }, [enforcementCfg, riskFreezeCorporatePay, allowedPayments, defaultPayment, primaryWallet, credit, creditAvailable, prepaid, prepaidAvailable]);

  const serviceMatrix = useMemo(() => {
    const base = SERVICE_MODULES.map((m) => ({ module: m, enabled: true, reason: "" }));
    if (!enforcement.enabled) return base;

    if (enforcement.status === "Hard stop") {
      return base.map((x) => ({ ...x, enabled: false, reason: enforcement.reasons[0] || "Hard stop" }));
    }

    if (enforcement.status === "Soft stop") {
      // Soft stop does not disable modules, but flags that fallback payment will be used.
      return base.map((x) => ({ ...x, enabled: true, reason: "Fallback payment may apply" }));
    }

    return base;
  }, [SERVICE_MODULES, enforcement]);

  const pendingRequests = useMemo(() => requests.filter((r) => r.status === "Pending").length, [requests]);

  // Filtered funding requests
  const filteredRequests = useMemo(() => {
    const q = reqQ.trim().toLowerCase();
    return requests
      .filter((r) => (reqStatus === "All" ? true : r.status === reqStatus))
      .filter((r) => {
        if (!q) return true;
        const blob = `${r.id} ${r.kind} ${r.method} ${r.createdBy} ${r.reason} ${r.status} ${r.walletId || ""}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [requests, reqQ, reqStatus]);

  // Filtered ledger
  const filteredLedger = useMemo(() => {
    const q = ledgerQ.trim().toLowerCase();
    return ledger
      .filter((l) => (ledgerType === "All" ? true : l.type === ledgerType))
      .filter((l) => (ledgerWallet === "All" ? true : (l.walletId || "") === ledgerWallet))
      .filter((l) => {
        if (!q) return true;
        const blob = `${l.id} ${l.type} ${l.note} ${l.walletId || ""}`.toLowerCase();
        return blob.includes(q);
      })
      .sort((a, b) => b.at - a.at);
  }, [ledger, ledgerQ, ledgerType, ledgerWallet]);

  // Actions
  const openCreateWallet = () => {
    setWalletDraft({
      id: "",
      name: "",
      type: "Group",
      group: "Operations",
      costCenter: "OPS-001",
      currency: "UGX",
      balanceUGX: 0,
      heldUGX: 0,
      status: "Active",
      updatedAt: Date.now(),
    });
    setWalletModalOpen(true);
  };

  const saveWallet = () => {
    if (!walletDraft.name.trim()) {
      toast({ title: "Missing name", message: "Wallet name is required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    const id = walletDraft.id || uid("W");
    const row: WalletRow = { ...walletDraft, id, updatedAt: now };

    setWallets((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...prev];
    });

    toast({ title: "Saved", message: "Wallet saved.", kind: "success" });
    setWalletModalOpen(false);

    if (!primaryWalletId) setPrimaryWalletId(id);
  };

  const deleteWallet = (id: string) => {
    if (id === "W-ORG") {
      toast({ title: "Blocked", message: "You cannot delete the main org wallet in this demo.", kind: "warn" });
      return;
    }
    setWallets((p) => p.filter((w) => w.id !== id));
    if (primaryWalletId === id) setPrimaryWalletId("W-ORG");
    toast({ title: "Deleted", message: "Wallet removed.", kind: "info" });
  };

  const openFunding = (kind: (typeof fundDraft)["kind"]) => {
    const w0 = primaryWalletId || wallets[0]?.id || "W-ORG";
    setFundDraft((p) => ({
      ...p,
      kind,
      fromWalletId: w0,
      toWalletId: w0,
      amountUGX: kind === "Repay credit" ? 500000 : kind === "Prepaid deposit" ? 2000000 : 500000,
      method: kind === "Transfer" ? "Internal transfer" : "Bank transfer",
      reason: "",
      risk: "Low",
    }));
    setFundModalOpen(true);
  };

  const createRequest = (r: Omit<FundingRequest, "id" | "createdAt" | "status"> & { status?: FundingRequestStatus }) => {
    const row: FundingRequest = {
      id: uid("FR"),
      createdAt: Date.now(),
      status: r.status || "Pending",
      ...r,
    };
    setRequests((p) => [row, ...p]);
    return row;
  };

  const addLedger = (entry: Omit<(typeof ledger)[number], "id" | "at">) => {
    setLedger((p) => [{ id: uid("LG"), at: Date.now(), ...entry }, ...p]);
  };

  const applyFunding = () => {
    const reason = fundDraft.reason.trim();
    if (reason.length < 8) {
      toast({ title: "Reason required", message: "Add a clear reason (min 8 chars).", kind: "warn" });
      return;
    }
    if (fundDraft.amountUGX <= 0) {
      toast({ title: "Invalid amount", message: "Amount must be greater than zero.", kind: "warn" });
      return;
    }

    const amount = fundDraft.amountUGX;
    const now = Date.now();

    // Large funding approvals
    const requiresApproval = amount >= largeFundingThresholdUGX && (fundDraft.kind === "Add funds" || fundDraft.kind === "Prepaid deposit");

    if (fundDraft.kind === "Add funds") {
      const req = createRequest({
        createdBy: "You",
        kind: "Add funds",
        method: fundDraft.method,
        walletId: fundDraft.toWalletId,
        amountUGX: amount,
        risk: fundDraft.risk,
        reason,
        status: requiresApproval ? "Pending" : "Approved",
        approvedBy: requiresApproval ? undefined : "Auto",
        decisionNote: requiresApproval ? undefined : "Auto-approved under threshold",
      });

      if (!requiresApproval) {
        setWallets((prev) => prev.map((w) => (w.id === fundDraft.toWalletId ? { ...w, balanceUGX: w.balanceUGX + amount, updatedAt: now } : w)));
        addLedger({ type: "Wallet funding", walletId: fundDraft.toWalletId, amountUGX: amount, note: `Funding (${fundDraft.method}): ${reason}` });
        toast({ title: "Funded", message: `Added ${formatUGX(amount)} to wallet.",`, kind: "success" });
      } else {
        addLedger({ type: "Wallet funding", walletId: fundDraft.toWalletId, amountUGX: 0, note: `Funding request ${req.id} pending approval` });
        toast({ title: "Request created", message: `${req.id} pending approval.",`, kind: "info" });
      }

      setFundModalOpen(false);
      return;
    }

    if (fundDraft.kind === "Transfer") {
      if (fundDraft.fromWalletId === fundDraft.toWalletId) {
        toast({ title: "Invalid transfer", message: "Choose different wallets.", kind: "warn" });
        return;
      }
      const from = wallets.find((w) => w.id === fundDraft.fromWalletId);
      const to = wallets.find((w) => w.id === fundDraft.toWalletId);
      if (!from || !to) {
        toast({ title: "Wallet not found", message: "Select valid wallets.", kind: "warn" });
        return;
      }
      if (from.status !== "Active") {
        toast({ title: "Blocked", message: "Source wallet is frozen.", kind: "warn" });
        return;
      }
      if (availableWalletBalance(from) < amount) {
        toast({ title: "Insufficient", message: "Not enough available balance in source wallet.", kind: "warn" });
        return;
      }

      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === from.id) return { ...w, balanceUGX: w.balanceUGX - amount, updatedAt: now };
          if (w.id === to.id) return { ...w, balanceUGX: w.balanceUGX + amount, updatedAt: now };
          return w;
        })
      );
      addLedger({ type: "Wallet transfer", walletId: from.id, amountUGX: -amount, note: `Transfer to ${to.name}: ${reason}` });
      addLedger({ type: "Wallet transfer", walletId: to.id, amountUGX: amount, note: `Transfer from ${from.name}: ${reason}` });
      toast({ title: "Transferred", message: `Moved ${formatUGX(amount)}.",`, kind: "success" });
      setFundModalOpen(false);
      return;
    }

    if (fundDraft.kind === "Repay credit") {
      const req = createRequest({
        createdBy: "You",
        kind: "Repay credit",
        method: fundDraft.method,
        amountUGX: amount,
        risk: fundDraft.risk,
        reason,
        status: amount >= largeFundingThresholdUGX ? "Pending" : "Approved",
        approvedBy: amount >= largeFundingThresholdUGX ? undefined : "Auto",
        decisionNote: amount >= largeFundingThresholdUGX ? undefined : "Auto-approved under threshold",
      });

      if (req.status === "Approved") {
        setCredit((p) => ({ ...p, usedUGX: Math.max(0, p.usedUGX - amount), delinquent: false }));
        addLedger({ type: "Credit repayment", amountUGX: amount, note: `Credit repayment (${fundDraft.method}): ${reason}` });
        toast({ title: "Repaid", message: `Repaid ${formatUGX(amount)}.",`, kind: "success" });
      } else {
        toast({ title: "Request created", message: `${req.id} pending approval.",`, kind: "info" });
      }
      setFundModalOpen(false);
      return;
    }

    if (fundDraft.kind === "Prepaid deposit") {
      const req = createRequest({
        createdBy: "You",
        kind: "Prepaid deposit",
        method: fundDraft.method,
        amountUGX: amount,
        risk: fundDraft.risk,
        reason,
        status: requiresApproval ? "Pending" : "Approved",
        approvedBy: requiresApproval ? undefined : "Auto",
        decisionNote: requiresApproval ? undefined : "Auto-approved under threshold",
      });

      if (!requiresApproval) {
        setPrepaid((p) => ({ ...p, balanceUGX: p.balanceUGX + amount }));
        addLedger({ type: "Prepaid deposit", amountUGX: amount, note: `Prepaid deposit (${fundDraft.method}): ${reason}` });
        toast({ title: "Deposited", message: `Added ${formatUGX(amount)} to prepaid.",`, kind: "success" });
      } else {
        toast({ title: "Request created", message: `${req.id} pending approval.",`, kind: "info" });
      }

      setFundModalOpen(false);
      return;
    }
  };

  const approveRequest = (id: string) => {
    const now = Date.now();
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;

    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Approved", approvedBy: "You", decisionNote: "Approved", } : r)));

    if (req.kind === "Add funds" && req.walletId) {
      setWallets((prev) => prev.map((w) => (w.id === req.walletId ? { ...w, balanceUGX: w.balanceUGX + req.amountUGX, updatedAt: now } : w)));
      addLedger({ type: "Wallet funding", walletId: req.walletId, amountUGX: req.amountUGX, note: `Approved funding ${id}` });
    }

    if (req.kind === "Prepaid deposit") {
      setPrepaid((p) => ({ ...p, balanceUGX: p.balanceUGX + req.amountUGX }));
      addLedger({ type: "Prepaid deposit", amountUGX: req.amountUGX, note: `Approved prepaid deposit ${id}` });
    }

    if (req.kind === "Repay credit") {
      setCredit((p) => ({ ...p, usedUGX: Math.max(0, p.usedUGX - req.amountUGX), delinquent: false }));
      addLedger({ type: "Credit repayment", amountUGX: req.amountUGX, note: `Approved credit repayment ${id}` });
    }

    toast({ title: "Approved", message: `${id} approved.",`, kind: "success" });
  };

  const rejectRequest = (id: string) => {
    const req = requests.find((r) => r.id === id);
    if (!req || req.status !== "Pending") return;
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Rejected", approvedBy: "You", decisionNote: "Rejected" } : r)));
    toast({ title: "Rejected", message: `${id} rejected.",`, kind: "info" });
  };

  const toggleWalletFreeze = (id: string) => {
    const now = Date.now();
    setWallets((prev) =>
      prev.map((w) => {
        if (w.id !== id) return w;
        const nextStatus: WalletStatus = w.status === "Active" ? "Frozen" : "Active";
        addLedger({ type: nextStatus === "Frozen" ? "Freeze" : "Unfreeze", walletId: id, amountUGX: 0, note: `${nextStatus} by admin` });
        return { ...w, status: nextStatus, updatedAt: now };
      })
    );
    toast({ title: "Updated", message: "Wallet status updated.", kind: "info" });
  };

  const runAutoTopUpSimulation = () => {
    const now = Date.now();
    const hits: string[] = [];

    autoTopUps.forEach((r) => {
      if (!r.enabled) return;
      const w = wallets.find((x) => x.id === r.walletId);
      if (!w) return;
      const avail = availableWalletBalance(w);
      if (avail >= r.thresholdUGX) return;

      const needsApproval = r.topUpAmountUGX >= r.requireApprovalOverUGX;
      const req = createRequest({
        createdBy: "System",
        kind: "Add funds",
        method: r.method,
        walletId: r.walletId,
        amountUGX: r.topUpAmountUGX,
        risk: "Low",
        reason: `Auto top-up rule ${r.id} triggered (avail ${formatUGX(avail)} < ${formatUGX(r.thresholdUGX)})`,
        status: needsApproval ? "Pending" : "Approved",
        approvedBy: needsApproval ? undefined : "Auto",
        decisionNote: needsApproval ? undefined : "Auto-approved by rule",
      });

      if (!needsApproval) {
        setWallets((prev) => prev.map((x) => (x.id === r.walletId ? { ...x, balanceUGX: x.balanceUGX + r.topUpAmountUGX, updatedAt: now } : x)));
        addLedger({ type: "Wallet funding", walletId: r.walletId, amountUGX: r.topUpAmountUGX, note: `Auto top-up applied (${r.id})` });
      } else {
        addLedger({ type: "Wallet funding", walletId: r.walletId, amountUGX: 0, note: `Auto top-up request ${req.id} pending approval` });
      }
      hits.push(r.id);
    });

    if (!hits.length) {
      toast({ title: "No triggers", message: "No auto top-up rules triggered.", kind: "info" });
    } else {
      toast({ title: "Auto top-up", message: `Triggered ${hits.length} rule(s).\`,`, kind: "success" });
    }
  };

  const saveAutoTopUp = () => {
    if (!autoTopUpDraft.walletId) {
      toast({ title: "Missing wallet", message: "Select a wallet.", kind: "warn" });
      return;
    }
    if (autoTopUpDraft.thresholdUGX <= 0 || autoTopUpDraft.topUpAmountUGX <= 0) {
      toast({ title: "Invalid values", message: "Threshold and top-up amount must be greater than zero.", kind: "warn" });
      return;
    }

    const id = autoTopUpDraft.id || uid("ATU");
    const row: AutoTopUpRule = { ...autoTopUpDraft, id };
    setAutoTopUps((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...prev];
    });

    toast({ title: "Saved", message: "Auto top-up rule saved.", kind: "success" });
    setAutoTopUpOpen(false);
  };

  const resolveRiskEvent = (id: string) => {
    setRiskEvents((prev) => prev.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e)));
    toast({ title: "Resolved", message: "Risk event resolved.", kind: "success" });
  };

  const exportJSON = () => {
    const payload = {
      allowedPayments,
      defaultPayment,
      primaryWalletId,
      wallets,
      credit,
      prepaid,
      enforcementCfg,
      riskFreezeCorporatePay,
      largeFundingThresholdUGX,
      requests,
      autoTopUps,
      riskEvents,
      ledger,
      exportedAt: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-wallet-credit-prepaid.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Downloaded JSON config.", kind: "success" });
  };

  const copyJSON = async () => {
    const payload = { wallets, credit, prepaid, requests, autoTopUps, enforcementCfg, riskEvents, ledger };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", message: "Copied JSON to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const openEditWallet = (w: WalletRow) => {
    setWalletDraft(JSON.parse(JSON.stringify(w)));
    setWalletModalOpen(true);
  };

  const filteredWallets = useMemo(() => {
    return wallets.slice().sort((a, b) => {
      if (a.id === primaryWalletId) return -1;
      if (b.id === primaryWalletId) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [wallets, primaryWalletId]);

  const walletOptions = useMemo(() => wallets.map((w) => w.id), [wallets]);

  const compliancePanelTone = toneForEnforcement(enforcement.status);

  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}
    >
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Wallet className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Corporate Wallet, Credit Line and Prepaid Funding</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Three payment models, multi-wallets, funding approvals, auto top-up rules, and enforcement.
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Default: ${defaultPayment}`} tone="info" />
                    <Pill label={`Pending requests: ${pendingRequests}`} tone={pendingRequests ? "warn" : "good"} />
                    <Pill label={`Enforcement: ${enforcement.status}`} tone={compliancePanelTone} />
                    {riskFreezeCorporatePay ? <Pill label="Frozen" tone="bad" /> : <Pill label="Not frozen" tone="good" />}
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
                <Button variant="outline" onClick={() => openFunding("Add funds")}> 
                  <Plus className="h-4 w-4" /> Add funds
                </Button>
                <Button variant="primary" onClick={openCreateWallet}>
                  <Plus className="h-4 w-4" /> New wallet
                </Button>
              </div>
            </div>

            {/* KPI cards */}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
              <Kpi title="Wallet total" value={formatUGX(totalWalletBalance)} sub={`${formatUGX(totalWalletAvailable)} available`} icon={<Wallet className="h-5 w-5" />} tone="neutral" />
              <Kpi title="Credit utilization" value={`${Math.round((credit.usedUGX / Math.max(1, credit.limitUGX)) * 100)}%`} sub={`${formatUGX(creditAvailable)} available`} icon={<CreditCard className="h-5 w-5" />} tone={credit.delinquent ? "bad" : "neutral"} />
              <Kpi title="Prepaid" value={formatUGX(prepaid.balanceUGX)} sub={`${formatUGX(prepaidAvailable)} available`} icon={<Banknote className="h-5 w-5" />} tone={prepaidAvailable <= 0 ? "warn" : "neutral"} />
              <Kpi title="Large funding threshold" value={formatUGX(largeFundingThresholdUGX)} sub="Requires approval" icon={<Shield className="h-5 w-5" />} tone="info" />
              <Kpi title="Open risk events" value={`${riskEvents.filter((r) => r.status === "Open").length}`} sub="Fraud triggers and reviews" icon={<ShieldAlert className="h-5 w-5" />} tone={riskEvents.some((r) => r.status === "Open" && r.severity === "Critical") ? "bad" : "warn"} />
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "wallets", label: "Wallets" },
                { id: "credit", label: "Credit line" },
                { id: "prepaid", label: "Prepaid" },
                { id: "funding", label: "Funding and approvals" },
                { id: "autotopup", label: "Auto top-up" },
                { id: "risk", label: "Risk and enforcement" },
                { id: "ledger", label: "Ledger" },
              ].map((t) => (
                <button
                  key={t.id}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === (t.id as any)
                      ? "text-white ring-emerald-600"
                      : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
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
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <Section
                    title="Payment models"
                    subtitle="Employees use normal EVzone apps. CorporatePay appears at checkout based on these settings."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <ModelCard
                        icon={<Wallet className="h-5 w-5" />}
                        title="Pay as you go"
                        subtitle="Corporate Wallet"
                        on={allowedPayments.Wallet}
                        onToggle={() => setAllowedPayments((p) => ({ ...p, Wallet: !p.Wallet }))}
                        selected={defaultPayment === "Wallet"}
                        onSelect={() => setDefaultPayment("Wallet")}
                        bullets={["Uses wallet balance", "Supports sub-wallets", "Stops when depleted (if no fallback)"]}
                      />
                      <ModelCard
                        icon={<CreditCard className="h-5 w-5" />}
                        title="Credit line"
                        subtitle="Limit-based spend"
                        on={allowedPayments.Credit}
                        onToggle={() => setAllowedPayments((p) => ({ ...p, Credit: !p.Credit }))}
                        selected={defaultPayment === "Credit"}
                        onSelect={() => setDefaultPayment("Credit")}
                        bullets={["Limit and utilization", "Repayment terms metadata", "Stops if delinquent or limit reached"]}
                      />
                      <ModelCard
                        icon={<Banknote className="h-5 w-5" />}
                        title="Prepaid deposit"
                        subtitle="Spend down"
                        on={allowedPayments.Prepaid}
                        onToggle={() => setAllowedPayments((p) => ({ ...p, Prepaid: !p.Prepaid }))}
                        selected={defaultPayment === "Prepaid"}
                        onSelect={() => setDefaultPayment("Prepaid")}
                        bullets={["Spend down balance", "Stops when depleted", "Good for strict cost control"]}
                      />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                      Best practice: keep more than one model enabled so CorporatePay can fall back when a balance is low.
                    </div>
                  </Section>

                  <Section
                    title="Account health"
                    subtitle="Balances, availability, and service stop enforcement."
                    right={<Pill label={enforcement.status} tone={toneForEnforcement(enforcement.status)} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Primary wallet</div>
                            <div className="mt-1 text-xs text-slate-500">Used by default for pay-as-you-go.</div>
                          </div>
                          <Pill label={primaryWallet?.status || "-"} tone={primaryWallet?.status === "Frozen" ? "bad" : "good"} />
                        </div>
                        <div className="mt-3 grid grid-cols-1 gap-2">
                          <Select
                            label="Primary wallet"
                            value={primaryWalletId}
                            onChange={setPrimaryWalletId}
                            options={walletOptions}
                            hint="Org Admin"
                          />
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                            Balance: <span className="font-semibold text-slate-900">{formatUGX(primaryWallet?.balanceUGX || 0)}</span>
                            <br />
                            Held: <span className="font-semibold text-slate-900">{formatUGX(primaryWallet?.heldUGX || 0)}</span>
                            <br />
                            Available: <span className="font-semibold text-slate-900">{formatUGX(primaryWallet ? availableWalletBalance(primaryWallet) : 0)}</span>
                          </div>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2">
                          <Button variant="outline" onClick={() => openFunding("Transfer")}>
                            <ArrowUpRight className="h-4 w-4" /> Transfer
                          </Button>
                          <Button variant="outline" onClick={() => openFunding("Add funds")}>
                            <Plus className="h-4 w-4" /> Add funds
                          </Button>
                          <Button variant="outline" onClick={() => toggleWalletFreeze(primaryWalletId)}>
                            {primaryWallet?.status === "Frozen" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {primaryWallet?.status === "Frozen" ? "Unfreeze" : "Freeze"}
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Enforcement</div>
                            <div className="mt-1 text-xs text-slate-500">Policy-backed auto stop when agreements are not complied with.</div>
                          </div>
                          <Pill label={enforcement.enabled ? "Enabled" : "Off"} tone={enforcement.enabled ? "info" : "neutral"} />
                        </div>

                        <div className="mt-3 space-y-3">
                          <Toggle
                            enabled={enforcementCfg.enabled}
                            onChange={(v) => setEnforcementCfg((p) => ({ ...p, enabled: v }))}
                            label="Enable enforcement"
                            description="When on, the system can stop services based on compliance."
                          />
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <NumberField
                              label="Invoice overdue days"
                              value={enforcementCfg.invoiceOverdueDays}
                              onChange={(v) => setEnforcementCfg((p) => ({ ...p, invoiceOverdueDays: Math.max(0, v) }))}
                              hint="Simulated"
                              disabled={!enforcementCfg.enabled}
                            />
                            <NumberField
                              label="Grace days"
                              value={enforcementCfg.invoiceGraceDays}
                              onChange={(v) => setEnforcementCfg((p) => ({ ...p, invoiceGraceDays: Math.max(0, v) }))}
                              hint="Policy"
                              disabled={!enforcementCfg.enabled}
                            />
                          </div>

                          <div className={cn("rounded-2xl p-3 text-xs ring-1", enforcement.status === "Hard stop" ? "bg-rose-50 text-rose-800 ring-rose-200" : enforcement.status === "Soft stop" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-emerald-50 text-emerald-900 ring-emerald-200")}>
                            <div className="font-semibold">Status: {enforcement.status}</div>
                            {enforcement.reasons.length ? (
                              <ul className="mt-2 space-y-1">
                                {enforcement.reasons.slice(0, 5).map((r, i) => (
                                  <li key={i}>• {r}</li>
                                ))}
                              </ul>
                            ) : (
                              <div className="mt-2">No issues detected.</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Service availability</div>
                          <div className="mt-1 text-xs text-slate-500">When hard stopped, CorporatePay disappears at checkout and services stop.</div>
                        </div>
                        <Pill label={enforcement.status} tone={toneForEnforcement(enforcement.status)} />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                        {serviceMatrix.slice(0, 8).map((s) => (
                          <div key={s.module} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-slate-900">{s.module}</div>
                              <div className="mt-0.5 text-xs text-slate-500">{s.enabled ? "Enabled" : "Disabled"}{s.reason ? ` • ${s.reason}` : ""}</div>
                            </div>
                            <Pill label={s.enabled ? "On" : "Off"} tone={s.enabled ? "good" : "bad"} />
                          </div>
                        ))}
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section
                    title="Funding actions"
                    subtitle="Add funds, deposit prepaid, repay credit, or transfer between sub-wallets."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <ActionTile
                        icon={<Plus className="h-5 w-5" />}
                        title="Add funds"
                        subtitle="Top up wallet"
                        onClick={() => openFunding("Add funds")}
                      />
                      <ActionTile
                        icon={<ArrowUpRight className="h-5 w-5" />}
                        title="Transfer"
                        subtitle="Org to group or cost center"
                        onClick={() => openFunding("Transfer")}
                      />
                      <ActionTile
                        icon={<Banknote className="h-5 w-5" />}
                        title="Prepaid deposit"
                        subtitle="Spend down account"
                        onClick={() => openFunding("Prepaid deposit")}
                      />
                      <ActionTile
                        icon={<CreditCard className="h-5 w-5" />}
                        title="Repay credit"
                        subtitle="Reduce utilization"
                        onClick={() => openFunding("Repay credit")}
                      />
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: large funding events can require approvals. Threshold: {formatUGX(largeFundingThresholdUGX)}.
                    </div>
                  </Section>

                  <Section
                    title="Pending approvals"
                    subtitle="Funding requests and limit changes that require review."
                    right={<Pill label={`${pendingRequests} pending`} tone={pendingRequests ? "warn" : "good"} />}
                  >
                    <div className="space-y-2">
                      {filteredRequests.filter((r) => r.status === "Pending").slice(0, 6).map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.id}</div>
                                <Pill label={r.kind} tone="neutral" />
                                <Pill label={r.risk} tone={toneForRisk(r.risk)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{formatDateTime(r.createdAt)} • By {r.createdBy}</div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{formatUGX(r.amountUGX)}</div>
                              <div className="mt-1 text-xs text-slate-600">Method: {r.method}{r.walletId ? ` • Wallet: ${r.walletId}` : ""}</div>
                              <div className="mt-2 text-xs text-slate-600">Reason: {r.reason}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveRequest(r.id)}>
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectRequest(r.id)}>
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!pendingRequests ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <BadgeCheck className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No pending requests</div>
                          <div className="mt-1 text-sm text-slate-600">All funding requests have been processed.</div>
                        </div>
                      ) : null}
                    </div>
                  </Section>

                  <Section
                    title="Premium: auto top-up"
                    subtitle="Threshold-based funding rules to keep services available."
                    right={<Pill label={`${autoTopUps.filter((r) => r.enabled).length} enabled`} tone="info" />}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => { setAutoTopUpDraft({ id: "", enabled: true, walletId: primaryWalletId, thresholdUGX: 1500000, topUpAmountUGX: 2000000, maxPerDayUGX: 4000000, requireApprovalOverUGX: 5000000, method: "Bank transfer", notes: "" }); setAutoTopUpOpen(true); }}>
                        <Plus className="h-4 w-4" /> New rule
                      </Button>
                      <Button variant="primary" onClick={runAutoTopUpSimulation}>
                        <RefreshCcw className="h-4 w-4" /> Run simulation
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {autoTopUps.slice(0, 3).map((r) => {
                        const w = wallets.find((x) => x.id === r.walletId);
                        const avail = w ? availableWalletBalance(w) : 0;
                        const willTrigger = avail < r.thresholdUGX;
                        return (
                          <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{r.id}</div>
                                  <Pill label={r.enabled ? "On" : "Off"} tone={r.enabled ? "good" : "neutral"} />
                                  <Pill label={willTrigger ? "Would trigger" : "OK"} tone={willTrigger ? "warn" : "good"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Wallet: {w?.name || r.walletId}</div>
                                <div className="mt-2 text-xs text-slate-600">Threshold: {formatUGX(r.thresholdUGX)} • Top-up: {formatUGX(r.topUpAmountUGX)} • Max/day: {formatUGX(r.maxPerDayUGX)}</div>
                                <div className="mt-1 text-xs text-slate-600">Approval required over: {formatUGX(r.requireApprovalOverUGX)} • Method: {r.method}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setAutoTopUpDraft(r); setAutoTopUpOpen(true); }}>
                                  Edit
                                </Button>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setAutoTopUps((p) => p.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}>
                                  {r.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} {r.enabled ? "Disable" : "Enable"}
                                </Button>
                              </div>
                            </div>
                            {r.notes ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{r.notes}</div> : null}
                          </div>
                        );
                      })}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "wallets" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Multi-wallets"
                    subtitle="Premium: wallets per group and cost center. Allocate funds and enforce spend boundaries."
                    right={<Pill label={`${wallets.length} wallets`} tone="info" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Primary</th>
                            <th className="px-4 py-3 font-semibold">Wallet</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Target</th>
                            <th className="px-4 py-3 font-semibold">Balance</th>
                            <th className="px-4 py-3 font-semibold">Held</th>
                            <th className="px-4 py-3 font-semibold">Available</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredWallets.map((w) => (
                            <tr key={w.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <input
                                  type="radio"
                                  name="primaryWallet"
                                  checked={primaryWalletId === w.id}
                                  onChange={() => setPrimaryWalletId(w.id)}
                                  className="h-4 w-4"
                                />
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{w.name}</td>
                              <td className="px-4 py-3 text-slate-700">{w.type}</td>
                              <td className="px-4 py-3 text-slate-700">{w.type === "Group" ? w.group : w.type === "Cost center" ? w.costCenter : "Organization"}</td>
                              <td className="px-4 py-3 text-slate-700">{formatUGX(w.balanceUGX)}</td>
                              <td className="px-4 py-3 text-slate-700">{formatUGX(w.heldUGX)}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(availableWalletBalance(w))}</td>
                              <td className="px-4 py-3">
                                <Pill label={w.status} tone={w.status === "Frozen" ? "bad" : "good"} />
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditWallet(w)}>
                                    Edit
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleWalletFreeze(w.id)}>
                                    {w.status === "Frozen" ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />} {w.status === "Frozen" ? "Unfreeze" : "Freeze"}
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setFundDraft((p) => ({ ...p, kind: "Transfer", fromWalletId: primaryWalletId, toWalletId: w.id })); setFundModalOpen(true); }}>
                                    <ArrowUpRight className="h-4 w-4" /> Allocate
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteWallet(w.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">Updated {timeAgo(w.updatedAt)}</div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: cost center wallets help chargeback and improve reporting.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section
                    title="Wallet settings"
                    subtitle="Funding thresholds and risk controls."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    <NumberField
                      label="Large funding threshold (UGX)"
                      value={largeFundingThresholdUGX}
                      onChange={(v) => setLargeFundingThresholdUGX(Math.max(0, v))}
                      hint="Above this requires approval"
                    />
                    <div className="mt-3">
                      <Toggle
                        enabled={riskFreezeCorporatePay}
                        onChange={setRiskFreezeCorporatePay}
                        label="Freeze CorporatePay"
                        description="Risk control that blocks CorporatePay at checkout."
                      />
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: fraud triggers can automatically freeze wallets and require step-up approval.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "credit" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Credit line"
                    subtitle="Limit-based spend with repayment terms metadata."
                    right={<Pill label={credit.enabled ? "Enabled" : "Off"} tone={credit.enabled ? "good" : "neutral"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Toggle
                        enabled={credit.enabled}
                        onChange={(v) => setCredit((p) => ({ ...p, enabled: v }))}
                        label="Enable credit"
                        description="When enabled, credit can be used when allowed by policy."
                      />
                      <Toggle
                        enabled={credit.delinquent}
                        onChange={(v) => setCredit((p) => ({ ...p, delinquent: v }))}
                        label="Delinquent"
                        description="Simulate repayment delinquency (stops credit)."
                      />
                      <NumberField
                        label="Credit limit (UGX)"
                        value={credit.limitUGX}
                        onChange={(v) => setCredit((p) => ({ ...p, limitUGX: Math.max(0, v) }))}
                        hint={formatUGX(credit.limitUGX)}
                      />
                      <NumberField
                        label="Used (UGX)"
                        value={credit.usedUGX}
                        onChange={(v) => setCredit((p) => ({ ...p, usedUGX: clamp(v, 0, p.limitUGX) }))}
                        hint={formatUGX(credit.usedUGX)}
                      />
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <ProgressBar
                        pct={(credit.usedUGX / Math.max(1, credit.limitUGX)) * 100}
                        labelLeft={`Used ${formatUGX(credit.usedUGX)}`}
                        labelRight={`Limit ${formatUGX(credit.limitUGX)}`}
                      />
                      <div className="mt-2 text-xs text-slate-600">Available: {formatUGX(creditAvailable)}</div>
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Repayment terms</div>
                          <div className="mt-1 text-xs text-slate-500">Metadata for enterprise agreements.</div>
                        </div>
                        <Pill label={credit.repaymentTerms.cycle} tone="neutral" />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Select
                          label="Cycle"
                          value={credit.repaymentTerms.cycle}
                          onChange={(v) => setCredit((p) => ({ ...p, repaymentTerms: { ...p.repaymentTerms, cycle: v as any } }))}
                          options={["Weekly", "Monthly"]}
                        />
                        <NumberField
                          label="Grace days"
                          value={credit.repaymentTerms.graceDays}
                          onChange={(v) => setCredit((p) => ({ ...p, repaymentTerms: { ...p.repaymentTerms, graceDays: Math.max(0, v) } }))}
                        />
                        <Field
                          label="Terms metadata"
                          value={credit.repaymentTerms.metadata}
                          onChange={(v) => setCredit((p) => ({ ...p, repaymentTerms: { ...p.repaymentTerms, metadata: v } }))}
                          placeholder="Interest, fees, notes"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => openFunding("Repay credit")}>
                          <ArrowDownLeft className="h-4 w-4" /> Repay
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            const req = createRequest({
                              createdBy: "You",
                              kind: "Limit increase",
                              method: "Bank transfer",
                              amountUGX: 0,
                              risk: "Medium",
                              reason: "Request limit increase review",
                              status: "Pending",
                            });
                            toast({ title: "Requested", message: `${req.id} limit review pending.",`, kind: "info" });
                          }}
                        >
                          <Plus className="h-4 w-4" /> Request limit review
                        </Button>
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Credit controls" subtitle="Premium: risk controls and approval for large draws." right={<Pill label="Premium" tone="info" />}>
                    <NumberField
                      label="Large funding threshold"
                      value={largeFundingThresholdUGX}
                      onChange={(v) => setLargeFundingThresholdUGX(Math.max(0, v))}
                      hint="Shared setting"
                    />
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Large repayment events can require approvals. Delinquency triggers auto stop.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "prepaid" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Prepaid deposit"
                    subtitle="Spend down account. When depleted, services can stop automatically."
                    right={<Pill label={prepaid.enabled ? "Enabled" : "Off"} tone={prepaid.enabled ? "good" : "neutral"} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Toggle
                        enabled={prepaid.enabled}
                        onChange={(v) => setPrepaid((p) => ({ ...p, enabled: v }))}
                        label="Enable prepaid"
                        description="Allow prepaid to be used as CorporatePay method."
                      />
                      <Toggle
                        enabled={prepaid.stopWhenDepleted}
                        onChange={(v) => setPrepaid((p) => ({ ...p, stopWhenDepleted: v }))}
                        label="Stop when depleted"
                        description="If on, prepaid depletion triggers a stop for prepaid payment model."
                      />
                      <NumberField
                        label="Balance (UGX)"
                        value={prepaid.balanceUGX}
                        onChange={(v) => setPrepaid((p) => ({ ...p, balanceUGX: Math.max(0, v) }))}
                        hint={formatUGX(prepaid.balanceUGX)}
                      />
                      <NumberField
                        label="Reserved (UGX)"
                        value={prepaid.reservedUGX}
                        onChange={(v) => setPrepaid((p) => ({ ...p, reservedUGX: clamp(v, 0, p.balanceUGX) }))}
                        hint="Pending commitments"
                      />
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <ProgressBar
                        pct={(prepaidAvailable / Math.max(1, prepaid.balanceUGX)) * 100}
                        labelLeft={`Available ${formatUGX(prepaidAvailable)}`}
                        labelRight={`Total ${formatUGX(prepaid.balanceUGX)}`}
                      />
                      <div className="mt-2 text-xs text-slate-600">Reserved: {formatUGX(prepaid.reservedUGX)}</div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => openFunding("Prepaid deposit")}>
                        <Plus className="h-4 w-4" /> Add deposit
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // simulate prepaid spend
                          const spend = Math.min(prepaidAvailable, 150000);
                          setPrepaid((p) => ({ ...p, balanceUGX: Math.max(0, p.balanceUGX - spend) }));
                          addLedger({ type: "Prepaid spend", amountUGX: -spend, note: "Prepaid spend simulation" });
                          toast({ title: "Spent", message: `Prepaid spend ${formatUGX(spend)}.",`, kind: "success" });
                        }}
                      >
                        <ArrowDownLeft className="h-4 w-4" /> Simulate spend
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      When prepaid is the default payment model, depletion can stop services immediately (if enabled).
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Prepaid controls" subtitle="Premium: approvals for large deposits and risk holds." right={<Pill label="Premium" tone="info" />}>
                    <NumberField
                      label="Large deposit threshold"
                      value={largeFundingThresholdUGX}
                      onChange={(v) => setLargeFundingThresholdUGX(Math.max(0, v))}
                      hint="Shared setting"
                    />
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Large deposits route to approvals. Risk holds can be placed at wallet level.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "funding" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Funding requests"
                    subtitle="Approvals for large events and sensitive operations."
                    right={<Pill label={`${pendingRequests} pending`} tone={pendingRequests ? "warn" : "good"} />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label="Search" value={reqQ} onChange={setReqQ} placeholder="FR-1001, add funds..." />
                      <Select label="Status" value={reqStatus} onChange={(v) => setReqStatus(v as any)} options={["All", "Pending", "Approved", "Rejected"]} />
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Kind</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Method</th>
                            <th className="px-4 py-3 font-semibold">Wallet</th>
                            <th className="px-4 py-3 font-semibold">Risk</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRequests.map((r) => (
                            <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{r.id}</td>
                              <td className="px-4 py-3 text-slate-700">{r.kind}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(r.amountUGX)}</td>
                              <td className="px-4 py-3 text-slate-700">{r.method}</td>
                              <td className="px-4 py-3 text-slate-700">{r.walletId || "-"}</td>
                              <td className="px-4 py-3"><Pill label={r.risk} tone={toneForRisk(r.risk)} /></td>
                              <td className="px-4 py-3"><Pill label={r.status} tone={toneForFRStatus(r.status)} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {r.status === "Pending" ? (
                                    <>
                                      <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveRequest(r.id)}>
                                        <Check className="h-4 w-4" /> Approve
                                      </Button>
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectRequest(r.id)}>
                                        <X className="h-4 w-4" /> Reject
                                      </Button>
                                    </>
                                  ) : (
                                    <Pill label={r.approvedBy ? `By ${r.approvedBy}` : "Done"} tone="neutral" />
                                  )}
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => toast({ title: "Details", message: `Reason: ${r.reason}`, kind: "info" })}
                                  >
                                    <FileText className="h-4 w-4" /> Details
                                  </Button>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">{formatDateTime(r.createdAt)} • {r.createdBy}</div>
                              </td>
                            </tr>
                          ))}
                          {!filteredRequests.length ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-600">No requests found.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: large funding events require approvals and show in Approvals Inbox (K).
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Funding actions" subtitle="Create requests or apply immediately under threshold.">
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={() => openFunding("Add funds")}>
                        <Plus className="h-4 w-4" /> Add funds
                      </Button>
                      <Button variant="outline" onClick={() => openFunding("Prepaid deposit")}>
                        <Banknote className="h-4 w-4" /> Prepaid deposit
                      </Button>
                      <Button variant="outline" onClick={() => openFunding("Repay credit")}>
                        <CreditCard className="h-4 w-4" /> Repay credit
                      </Button>
                      <Button variant="outline" onClick={() => openFunding("Transfer")}>
                        <ArrowUpRight className="h-4 w-4" /> Transfer
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Funding rules: approvals are triggered by threshold and risk settings.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "autotopup" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Auto top-up rules"
                    subtitle="Premium: threshold-based top ups with max per day safeguards."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setAutoTopUpDraft({
                            id: "",
                            enabled: true,
                            walletId: primaryWalletId,
                            thresholdUGX: 1500000,
                            topUpAmountUGX: 2000000,
                            maxPerDayUGX: 4000000,
                            requireApprovalOverUGX: 5000000,
                            method: "Bank transfer",
                            notes: "",
                          });
                          setAutoTopUpOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4" /> New rule
                      </Button>
                      <Button variant="outline" onClick={runAutoTopUpSimulation}>
                        <RefreshCcw className="h-4 w-4" /> Run simulation
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {autoTopUps.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.id}</div>
                                <Pill label={r.enabled ? "On" : "Off"} tone={r.enabled ? "good" : "neutral"} />
                                <Pill label={r.method} tone="neutral" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Wallet: {wallets.find((w) => w.id === r.walletId)?.name || r.walletId}</div>
                              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="text-xs font-semibold text-slate-600">Trigger</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">Below {formatUGX(r.thresholdUGX)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="text-xs font-semibold text-slate-600">Top-up</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(r.topUpAmountUGX)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="text-xs font-semibold text-slate-600">Max per day</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(r.maxPerDayUGX)}</div>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                                  <div className="text-xs font-semibold text-slate-600">Approval over</div>
                                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(r.requireApprovalOverUGX)}</div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setAutoTopUpDraft(r); setAutoTopUpOpen(true); }}>
                                Edit
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setAutoTopUps((p) => p.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled } : x))}>
                                {r.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} {r.enabled ? "Disable" : "Enable"}
                              </Button>
                            </div>
                          </div>
                          {r.notes ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{r.notes}</div> : null}
                        </div>
                      ))}
                      {!autoTopUps.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No rules configured.</div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Notes" subtitle="How auto top-up behaves.">
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) If wallet available balance drops below threshold, a top-up is created</li>
                        <li>2) If top-up amount is above approval threshold, request goes to approvals</li>
                        <li>3) Max per day is a safeguard, enforced by policy in production</li>
                      </ul>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "risk" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <Section
                    title="Risk controls"
                    subtitle="Premium: freeze, holds, fraud triggers, and approvals for large events."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    <Toggle
                      enabled={riskFreezeCorporatePay}
                      onChange={setRiskFreezeCorporatePay}
                      label="Freeze CorporatePay"
                      description="Stops CorporatePay at checkout. No silent actions and always audited."
                    />

                    <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <NumberField
                        label="Large funding approval threshold"
                        value={largeFundingThresholdUGX}
                        onChange={(v) => setLargeFundingThresholdUGX(Math.max(0, v))}
                        hint="Shared across funding"
                      />
                      <NumberField
                        label="Invoice overdue days (simulate)"
                        value={enforcementCfg.invoiceOverdueDays}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, invoiceOverdueDays: Math.max(0, v) }))}
                        hint="Impacts enforcement"
                        disabled={!enforcementCfg.enabled}
                      />
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Fraud triggers examples: unusual funding frequency, repeated failed repayments, high value RFQ holds.
                    </div>
                  </Section>

                  <Section title="Risk events" subtitle="Investigate and resolve." right={<Pill label={`${riskEvents.filter((r) => r.status === "Open").length} open`} tone="warn" />}>
                    <div className="space-y-2">
                      {riskEvents
                        .slice()
                        .sort((a, b) => (a.status === b.status ? b.createdAt - a.createdAt : a.status === "Open" ? -1 : 1))
                        .map((e) => (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={e.severity} tone={e.severity === "Critical" ? "bad" : e.severity === "Warning" ? "warn" : "info"} />
                                  <div className="text-sm font-semibold text-slate-900">{e.title}</div>
                                  <Pill label={e.status} tone={e.status === "Open" ? "warn" : "good"} />
                                </div>
                                <div className="mt-2 text-sm text-slate-700">{e.details}</div>
                                <div className="mt-2 text-xs text-slate-500">{formatDateTime(e.createdAt)} • {timeAgo(e.createdAt)}{e.walletId ? ` • Wallet ${e.walletId}` : ""}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                {e.status === "Open" ? (
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => resolveRiskEvent(e.id)}>
                                    <Check className="h-4 w-4" /> Resolve
                                  </Button>
                                ) : (
                                  <Pill label="Resolved" tone="good" />
                                )}
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => toast({ title: "Audit", message: "In production, this opens a full audit view.", kind: "info" })}
                                >
                                  <FileText className="h-4 w-4" /> Audit
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {!riskEvents.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No risk events.</div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section title="Enforcement summary" subtitle="Auto stop when agreements are not complied with.">
                    <div className={cn("rounded-3xl border p-4", enforcement.status === "Hard stop" ? "border-rose-200 bg-rose-50" : enforcement.status === "Soft stop" ? "border-amber-200 bg-amber-50" : "border-emerald-200 bg-emerald-50")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Status: {enforcement.status}</div>
                          <div className="mt-1 text-xs text-slate-700">Enforcement {enforcement.enabled ? "enabled" : "disabled"} • Invoice grace {enforcementCfg.invoiceGraceDays} day(s)</div>
                        </div>
                        <Pill label={enforcement.enabled ? "On" : "Off"} tone={enforcement.enabled ? "info" : "neutral"} />
                      </div>
                      {enforcement.reasons.length ? (
                        <div className="mt-3 rounded-2xl bg-white/60 p-3 text-xs text-slate-700">
                          <div className="font-semibold">Reasons</div>
                          <ul className="mt-2 space-y-1">
                            {enforcement.reasons.slice(0, 8).map((r, i) => (
                              <li key={i}>• {r}</li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <div className="mt-3 text-xs text-slate-700">No enforcement issues detected.</div>
                      )}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Policy-backed enforcement is recommended for corporate compliance and predictable spend.
                    </div>
                  </Section>

                  <Section title="Quick tests" subtitle="Simulate agreement issues and observe enforcement changes.">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnforcementCfg((p) => ({ ...p, invoiceOverdueDays: p.invoiceGraceDays + 3 }));
                          toast({ title: "Simulated", message: "Invoice overdue beyond grace.", kind: "warn" });
                        }}
                      >
                        <CalendarClock className="h-4 w-4" /> Simulate overdue
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setEnforcementCfg((p) => ({ ...p, invoiceOverdueDays: 0 }));
                          toast({ title: "Reset", message: "Invoice overdue cleared.", kind: "info" });
                        }}
                      >
                        <RefreshCcw className="h-4 w-4" /> Clear overdue
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setWallets((p) => p.map((w) => (w.id === primaryWalletId ? { ...w, balanceUGX: 0, heldUGX: 0 } : w)));
                          toast({ title: "Simulated", message: "Primary wallet depleted.", kind: "warn" });
                        }}
                      >
                        <Wallet className="h-4 w-4" /> Deplete wallet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCredit((p) => ({ ...p, delinquent: true }));
                          toast({ title: "Simulated", message: "Credit marked delinquent.", kind: "warn" });
                        }}
                      >
                        <CreditCard className="h-4 w-4" /> Delinquent credit
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "ledger" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Ledger"
                    subtitle="All wallet, credit and prepaid movements."
                    right={<Pill label={`${ledger.length} entries`} tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Field label="Search" value={ledgerQ} onChange={setLedgerQ} placeholder="LG-001, hold, funding..." />
                      <Select label="Type" value={ledgerType} onChange={(v) => setLedgerType(v as any)} options={["All", ...Array.from(new Set(ledger.map((l) => l.type)))]} />
                      <Select label="Wallet" value={ledgerWallet} onChange={setLedgerWallet} options={["All", ...walletOptions]} hint="Optional" />
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Wallet</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Note</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLedger.map((l) => (
                            <tr key={l.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{l.id}</td>
                              <td className="px-4 py-3 text-slate-700">{formatDateTime(l.at)}</td>
                              <td className="px-4 py-3"><Pill label={l.type} tone="neutral" /></td>
                              <td className="px-4 py-3 text-slate-700">{l.walletId || "-"}</td>
                              <td className={cn("px-4 py-3 font-semibold", l.amountUGX < 0 ? "text-rose-700" : "text-slate-900")}>
                                {l.amountUGX < 0 ? `-${formatUGX(Math.abs(l.amountUGX))}` : formatUGX(l.amountUGX)}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{l.note}</td>
                            </tr>
                          ))}
                          {!filteredLedger.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No ledger entries.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: ledger exports can be pushed to ERP via secure API.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Export" subtitle="Export transactions for accounting."
                    right={<Pill label="ERP-ready" tone="info" />}
                  >
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={exportJSON}>
                        <Download className="h-4 w-4" /> Export JSON
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({ title: "Export", message: "CSV/PDF export would be generated in production.", kind: "info" });
                        }}
                      >
                        <FileText className="h-4 w-4" /> Export CSV/PDF
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Best practice: use invoice group AP codes for ERP mapping.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {/* Light placeholders for tabs that are already covered in overview */}
            {tab === "autotopup" || tab === "overview" || tab === "wallets" || tab === "credit" || tab === "prepaid" || tab === "funding" || tab === "risk" || tab === "ledger" ? null : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              M Corporate Wallet, Credit Line and Prepaid Funding v2: three payment models, funding actions, credit metadata, prepaid stop, approvals, auto top-up, multi-wallets, risk controls, and enforcement.
            </div>
          </footer>
        </div>
      </div>

      {/* Wallet modal */}
      <Modal
        open={walletModalOpen}
        title={walletDraft.id ? "Edit wallet" : "Create wallet"}
        subtitle="Premium: multi-wallets per group and cost center."
        onClose={() => setWalletModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setWalletModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {walletDraft.id ? (
                <Button variant="danger" onClick={() => { deleteWallet(walletDraft.id); setWalletModalOpen(false); }}>
                  <X className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveWallet}>
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" value={walletDraft.name} onChange={(v) => setWalletDraft((p) => ({ ...p, name: v }))} placeholder="Wallet name" />
          <Select
            label="Type"
            value={walletDraft.type}
            onChange={(v) => {
              const type = v as WalletType;
              setWalletDraft((p) => ({ ...p, type, group: type === "Group" ? (p.group || "Operations") : undefined, costCenter: type === "Cost center" ? (p.costCenter || "OPS-001") : undefined }));
            }}
            options={["Org", "Group", "Cost center"]}
          />
          <Select
            label="Group"
            value={walletDraft.group || "Operations"}
            onChange={(v) => setWalletDraft((p) => ({ ...p, group: v as GroupName }))}
            options={GROUPS}
            disabled={walletDraft.type !== "Group"}
          />
          <Select
            label="Cost center"
            value={walletDraft.costCenter || "OPS-001"}
            onChange={(v) => setWalletDraft((p) => ({ ...p, costCenter: v as CostCenter }))}
            options={COST_CENTERS}
            disabled={walletDraft.type !== "Cost center"}
          />
          <NumberField
            label="Balance (UGX)"
            value={walletDraft.balanceUGX}
            onChange={(v) => setWalletDraft((p) => ({ ...p, balanceUGX: Math.max(0, v) }))}
            hint={formatUGX(walletDraft.balanceUGX)}
          />
          <NumberField
            label="Held (UGX)"
            value={walletDraft.heldUGX}
            onChange={(v) => setWalletDraft((p) => ({ ...p, heldUGX: Math.max(0, v) }))}
            hint="Holds reserve funds"
          />
          <Select
            label="Status"
            value={walletDraft.status}
            onChange={(v) => setWalletDraft((p) => ({ ...p, status: v as WalletStatus }))}
            options={["Active", "Frozen"]}
          />
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            In production, cost center wallets map to chargeback and ERP exports.
          </div>
        </div>
      </Modal>

      {/* Funding modal */}
      <Modal
        open={fundModalOpen}
        title={fundDraft.kind}
        subtitle="Funding actions with approvals for large events."
        onClose={() => setFundModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setFundModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyFunding}>
              <Check className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Action"
            value={fundDraft.kind}
            onChange={(v) => setFundDraft((p) => ({ ...p, kind: v as any }))}
            options={["Add funds", "Transfer", "Repay credit", "Prepaid deposit"]}
          />
          <Select
            label="Method"
            value={fundDraft.method}
            onChange={(v) => setFundDraft((p) => ({ ...p, method: v as FundingMethod }))}
            options={["Bank transfer", "Mobile money", "Card", "Internal transfer"]}
            hint={fundDraft.kind === "Transfer" ? "Internal transfer" : "Funding method"}
            disabled={fundDraft.kind === "Transfer"}
          />

          {fundDraft.kind === "Transfer" ? (
            <>
              <Select
                label="From wallet"
                value={fundDraft.fromWalletId}
                onChange={(v) => setFundDraft((p) => ({ ...p, fromWalletId: v }))}
                options={walletOptions}
              />
              <Select
                label="To wallet"
                value={fundDraft.toWalletId}
                onChange={(v) => setFundDraft((p) => ({ ...p, toWalletId: v }))}
                options={walletOptions}
              />
            </>
          ) : fundDraft.kind === "Add funds" ? (
            <Select
              label="Wallet"
              value={fundDraft.toWalletId}
              onChange={(v) => setFundDraft((p) => ({ ...p, toWalletId: v }))}
              options={walletOptions}
            />
          ) : null}

          <NumberField
            label="Amount (UGX)"
            value={fundDraft.amountUGX}
            onChange={(v) => setFundDraft((p) => ({ ...p, amountUGX: Math.max(0, v) }))}
            hint={formatUGX(fundDraft.amountUGX)}
          />

          <Select
            label="Risk"
            value={fundDraft.risk}
            onChange={(v) => setFundDraft((p) => ({ ...p, risk: v as Risk }))}
            options={["Low", "Medium", "High"]}
            hint="Premium safeguards"
          />

          <div className="md:col-span-2">
            <TextArea
              label="Reason"
              value={fundDraft.reason}
              onChange={(v) => setFundDraft((p) => ({ ...p, reason: v }))}
              placeholder="Example: month-start top up for operations"
              hint="Minimum 8 characters"
              rows={4}
            />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Approval required if amount is above {formatUGX(largeFundingThresholdUGX)} or if risk controls demand it.
          </div>
        </div>
      </Modal>

      {/* Auto top-up modal */}
      <Modal
        open={autoTopUpOpen}
        title={autoTopUpDraft.id ? "Edit auto top-up" : "New auto top-up"}
        subtitle="Premium: threshold-based top up rule with max per day."
        onClose={() => setAutoTopUpOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setAutoTopUpOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveAutoTopUp}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Toggle
            enabled={autoTopUpDraft.enabled}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, enabled: v }))}
            label="Enabled"
            description="If off, rule will not trigger."
          />
          <Select
            label="Wallet"
            value={autoTopUpDraft.walletId}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, walletId: v }))}
            options={walletOptions}
          />
          <NumberField
            label="Trigger threshold (UGX)"
            value={autoTopUpDraft.thresholdUGX}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, thresholdUGX: Math.max(0, v) }))}
            hint={formatUGX(autoTopUpDraft.thresholdUGX)}
          />
          <NumberField
            label="Top-up amount (UGX)"
            value={autoTopUpDraft.topUpAmountUGX}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, topUpAmountUGX: Math.max(0, v) }))}
            hint={formatUGX(autoTopUpDraft.topUpAmountUGX)}
          />
          <NumberField
            label="Max per day (UGX)"
            value={autoTopUpDraft.maxPerDayUGX}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, maxPerDayUGX: Math.max(0, v) }))}
            hint={formatUGX(autoTopUpDraft.maxPerDayUGX)}
          />
          <NumberField
            label="Approval required over (UGX)"
            value={autoTopUpDraft.requireApprovalOverUGX}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, requireApprovalOverUGX: Math.max(0, v) }))}
            hint="Creates funding request"
          />
          <Select
            label="Method"
            value={autoTopUpDraft.method}
            onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, method: v as FundingMethod }))}
            options={["Bank transfer", "Mobile money", "Card"]}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Notes"
              value={autoTopUpDraft.notes}
              onChange={(v) => setAutoTopUpDraft((p) => ({ ...p, notes: v }))}
              placeholder="Explain rule intent"
              rows={3}
            />
          </div>
        </div>
      </Modal>
    </div>
  );

  function Kpi({ title, value, sub, icon, tone }: { title: string; value: string; sub: string; icon: React.ReactNode; tone: "neutral" | "good" | "warn" | "bad" | "info" }) {
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

  function ModelCard({
    icon,
    title,
    subtitle,
    on,
    onToggle,
    selected,
    onSelect,
    bullets,
  }: {
    icon: React.ReactNode;
    title: string;
    subtitle: string;
    on: boolean;
    onToggle: () => void;
    selected: boolean;
    onSelect: () => void;
    bullets: string[];
  }) {
    return (
      <div className={cn("rounded-3xl border bg-white p-4", selected ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200")}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">{icon}</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Pill label={on ? "Enabled" : "Off"} tone={on ? "good" : "neutral"} />
            <button
              type="button"
              className={cn(
                "relative h-7 w-12 rounded-full border transition",
                on ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
              )}
              onClick={onToggle}
              aria-label="Toggle"
            >
              <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", on ? "left-[22px]" : "left-1")} />
            </button>
          </div>
        </div>

        <ul className="mt-3 space-y-1 text-xs text-slate-600">
          {bullets.map((b) => (
            <li key={b}>• {b}</li>
          ))}
        </ul>

        <div className="mt-4">
          <Button variant={selected ? "primary" : "outline"} className="w-full" onClick={onSelect} disabled={!on} title={!on ? "Enable this model first" : ""}>
            <BadgeCheck className="h-4 w-4" /> Set as default
          </Button>
        </div>
      </div>
    );
  }

  function ActionTile({ icon, title, subtitle, onClick }: { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void }) {
    return (
      <button type="button" onClick={onClick} className="rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">{icon}</div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{title}</div>
              <div className="mt-1 text-xs text-slate-500">{subtitle}</div>
            </div>
          </div>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </div>
      </button>
    );
  }
}
