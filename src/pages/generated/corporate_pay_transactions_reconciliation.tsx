import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Link2,
  ListChecks,
  RefreshCcw,
  Search,
  Settings2,
  Shield,
  Sparkles,
  Split,
  X,
  Plus,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type Currency = "UGX" | "USD" | "EUR" | "CNY";

type TxType =
  | "Wallet debit"
  | "Wallet credit"
  | "Credit draw"
  | "Credit repayment"
  | "Prepaid deposit"
  | "Prepaid spend"
  | "Refund"
  | "Reversal";

type TxStatus = "Posted" | "Pending" | "Failed";

type Severity = "Info" | "Warning" | "Critical";

type ExceptionKind = "Failed charge" | "Partial payment" | "Duplicate" | "Unmatched" | "Refund pending";

type ExceptionStatus = "Open" | "Investigating" | "Resolved";

type MatchMethod = "Manual" | "Auto";

type PivotRowDim =
  | "Vendor"
  | "Service module"
  | "Marketplace"
  | "Group"
  | "Cost center"
  | "Tax code"
  | "Transaction type"
  | "Transaction status";

type PivotMetric = "Amount" | "Count";

type Transaction = {
  id: string;
  type: TxType;
  status: TxStatus;
  currency: Currency;
  amount: number; // positive numbers, direction comes from type
  vendor: string;
  serviceModule: string;
  marketplace: string;
  group: string;
  costCenter: string;
  taxCode: string;
  occurredAt: number;
  reference: string;
  note: string;
};

type InvoiceLine = {
  id: string;
  invoiceNo: string;
  invoiceId: string;
  entityId: string;
  currency: Currency;
  serviceDate: number;
  description: string;
  vendor: string;
  serviceModule: string;
  marketplace: string;
  group: string;
  costCenter: string;
  projectTag: string;
  taxCode: string;
  amount: number;
};

type Match = {
  id: string;
  lineId: string;
  txId: string;
  amount: number;
  method: MatchMethod;
  confidence: number; // 0..1
  ruleId?: string;
  createdAt: number;
  createdBy: string;
  note: string;
};

type ExceptionItem = {
  id: string;
  kind: ExceptionKind;
  severity: Severity;
  status: ExceptionStatus;
  createdAt: number;
  invoiceNo?: string;
  lineId?: string;
  txId?: string;
  message: string;
  suggestedNext: string;
};

type ErpMappingScope = "Default" | "Module" | "Marketplace" | "Vendor";

type ErpMapping = {
  id: string;
  scope: ErpMappingScope;
  key: string; // module or marketplace or vendor; or "*" for default
  glCode: string;
  costCenter: string;
  taxCode: string;
  memo: string;
  enabled: boolean;
};

type AutoMatchRule = {
  id: string;
  name: string;
  enabled: boolean;
  requireSameVendor: boolean;
  requireSameModule: boolean;
  requireSameMarketplace: boolean;
  dateWindowDays: number;
  amountTolerancePct: number;
  minConfidence: number;
  allowPartialMatch: boolean;
};

type AuditEvent = {
  id: string;
  at: number;
  actor: string;
  action:
  | "MATCH_CREATED"
  | "MATCH_REMOVED"
  | "AUTO_MATCH_RUN"
  | "EXCEPTION_CREATED"
  | "EXCEPTION_UPDATED"
  | "ERP_MAPPING_UPDATED"
  | "RULE_UPDATED"
  | "EXPORT"
  | "TX_STATUS_UPDATED";
  entityRef: string;
  details: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number, currency: Currency) {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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

function daysBetween(a: number, b: number) {
  const DAY = 24 * 60 * 60 * 1000;
  return Math.floor(Math.abs(a - b) / DAY);
}

function Pill({ label, tone = "neutral" }: { label: string; tone?: "good" | "warn" | "bad" | "info" | "neutral" }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    warn: "bg-amber-50 text-amber-800 ring-amber-200",
    bad: "bg-rose-50 text-rose-700 ring-rose-200",
    info: "bg-blue-50 text-blue-700 ring-blue-200",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200",
  };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", map[tone])}>{label}</span>;
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
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  title?: string;
}) {
  const base = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-4";
  const variants: Record<string, string> = {
    primary: "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent: "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline: "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger: "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
  };
  const style = variant === "primary" ? { background: EVZ.green } : variant === "accent" ? { background: EVZ.orange } : undefined;
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
        min={0}
        onKeyDown={(e) => (e.key === "-" || e.key === "e") && e.preventDefault()}
        value={value}
        onChange={(e) => {
          const v = Number(e.target.value || 0);
          if (v >= 0) onChange(v);
        }}
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
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
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

function TextArea({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 4,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={cn(
          "mt-2 w-full rounded-2xl border p-3 text-sm font-semibold shadow-sm outline-none focus:ring-4",
          disabled ? "border-slate-200 bg-slate-50 text-slate-500" : "border-slate-200 bg-white text-slate-900 focus:ring-emerald-100"
        )}
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
  maxW = "980px",
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
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-4 top-4 z-50 mx-auto flex w-[min(1020px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW, maxHeight: "92vh" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header - rigid */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

            {/* Footer - rigid */}
            {footer ? <div className="shrink-0 border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 w-[min(480px,calc(100vw-2rem))] space-y-2">
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
                {t.kind === "error" || t.kind === "warn" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
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

function downloadJSON(filename: string, payload: any) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCSV(rows: Array<Record<string, any>>, columns: Array<{ key: string; label: string }>) {
  const esc = (v: any) => {
    const s = String(v ?? "");
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const head = columns.map((c) => esc(c.label)).join(",");
  const body = rows.map((r) => columns.map((c) => esc(r[c.key])).join(",")).join("\n");
  return `${head}\n${body}`;
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

function pivotValueKey(dim: PivotRowDim, r: { [k: string]: any }) {
  if (dim === "Vendor") return r.vendor || "-";
  if (dim === "Service module") return r.serviceModule || "-";
  if (dim === "Marketplace") return r.marketplace || "-";
  if (dim === "Group") return r.group || "-";
  if (dim === "Cost center") return r.costCenter || "-";
  if (dim === "Tax code") return r.taxCode || "-";
  if (dim === "Transaction type") return r.type || "-";
  if (dim === "Transaction status") return r.status || "-";
  return "-";
}

function buildPivot<T extends { [k: string]: any }>(rows: T[], rowDim: PivotRowDim, metric: PivotMetric, amountKey: string) {
  const groups: Record<string, { key: string; value: number }> = {};
  for (const r of rows) {
    const k = pivotValueKey(rowDim, r);
    const v = metric === "Count" ? 1 : Number(r[amountKey] || 0);
    groups[k] = groups[k] || { key: k, value: 0 };
    groups[k].value += v;
  }
  return Object.values(groups).sort((a, b) => b.value - a.value);
}

function scoreCandidate(line: InvoiceLine, tx: Transaction, rule: AutoMatchRule) {
  let score = 1;
  if (rule.requireSameVendor && line.vendor !== tx.vendor) return 0;
  if (rule.requireSameModule && line.serviceModule !== tx.serviceModule) score *= 0.65;
  if (rule.requireSameMarketplace) {
    const lm = (line.marketplace || "-").trim();
    const tm = (tx.marketplace || "-").trim();
    if (lm !== tm) score *= 0.55;
  }

  const dd = daysBetween(line.serviceDate, tx.occurredAt);
  const dateOk = dd <= Math.max(0, rule.dateWindowDays);
  score *= dateOk ? 1 : Math.max(0, 1 - (dd - rule.dateWindowDays) * 0.12);

  const tol = Math.max(0.001, rule.amountTolerancePct / 100);
  const diffPct = Math.abs(line.amount - tx.amount) / Math.max(1, line.amount);
  const amtOk = diffPct <= tol;
  score *= amtOk ? 1 : Math.max(0, 1 - (diffPct - tol) * 2.2);

  // slight bias toward posted
  score *= tx.status === "Posted" ? 1 : tx.status === "Pending" ? 0.7 : 0;

  // currency mismatch is a hard stop in this demo
  if (line.currency !== tx.currency) return 0;

  return clamp(score, 0, 1);
}

export default function CorporatePayTransactionsReconciliationV2() {
  const DAY = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"ledger" | "recon" | "exceptions" | "erp" | "rules" | "reports">("recon");

  const [transactions, setTransactions] = useState<Transaction[]>(() => [
    {
      id: "TX-9001",
      type: "Wallet debit",
      status: "Posted",
      currency: "UGX",
      amount: 165000,
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Operations",
      costCenter: "OPS-001",
      taxCode: "VAT18",
      occurredAt: now - 4 * DAY,
      reference: "TRP-84001",
      note: "Airport pickup",
    },
    {
      id: "TX-9002",
      type: "Wallet debit",
      status: "Posted",
      currency: "UGX",
      amount: 98000,
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Operations",
      costCenter: "OPS-001",
      taxCode: "VAT18",
      occurredAt: now - 4 * DAY,
      reference: "TRP-84002",
      note: "City commute",
    },
    {
      id: "TX-9010",
      type: "Wallet debit",
      status: "Failed",
      currency: "UGX",
      amount: 120000,
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Sales",
      costCenter: "SALES-TRAVEL",
      taxCode: "VAT18",
      occurredAt: now - 2 * DAY,
      reference: "TRP-99001",
      note: "Client site",
    },
    {
      id: "TX-9020",
      type: "Credit draw",
      status: "Posted",
      currency: "UGX",
      amount: 900000,
      vendor: "Shenzhen Store",
      serviceModule: "E-Commerce",
      marketplace: "MyLiveDealz",
      group: "Procurement",
      costCenter: "PROC-001",
      taxCode: "VAT0",
      occurredAt: now - 8 * DAY,
      reference: "ORD-MLD-4401",
      note: "Deal order",
    },
    {
      id: "TX-9021",
      type: "Credit draw",
      status: "Posted",
      currency: "UGX",
      amount: 1100000,
      vendor: "Shenzhen Store",
      serviceModule: "E-Commerce",
      marketplace: "MyLiveDealz",
      group: "Procurement",
      costCenter: "PROC-001",
      taxCode: "VAT0",
      occurredAt: now - 8 * DAY,
      reference: "ORD-MLD-4402",
      note: "Deal order",
    },
    {
      id: "TX-9030",
      type: "Prepaid spend",
      status: "Posted",
      currency: "UGX",
      amount: 2400000,
      vendor: "Kampala Office Mart",
      serviceModule: "E-Commerce",
      marketplace: "EVmart",
      group: "Procurement",
      costCenter: "PROC-001",
      taxCode: "VAT18",
      occurredAt: now - 9 * DAY,
      reference: "ORD-EVM-2001",
      note: "Office supplies",
    },
    {
      id: "TX-9040",
      type: "Refund",
      status: "Pending",
      currency: "UGX",
      amount: 200000,
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Finance",
      costCenter: "FIN-OPS",
      taxCode: "VAT18",
      occurredAt: now - 1 * DAY,
      reference: "RFND-1001",
      note: "Refund pending",
    },
    {
      id: "TX-9050",
      type: "Reversal",
      status: "Posted",
      currency: "UGX",
      amount: 150000,
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Finance",
      costCenter: "FIN-OPS",
      taxCode: "VAT18",
      occurredAt: now - 12 * DAY,
      reference: "REV-2001",
      note: "Duplicate correction",
    },
  ]);

  const [invoiceLines, setInvoiceLines] = useState<InvoiceLine[]>(() => [
    {
      id: "IL-1001",
      invoiceNo: "ACME-202601-1042",
      invoiceId: "INV-0001",
      entityId: "ENT-UG",
      currency: "UGX",
      serviceDate: now - 4 * DAY,
      description: "Airport pickup TRP-84001",
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Operations",
      costCenter: "OPS-001",
      projectTag: "Office commute",
      taxCode: "VAT18",
      amount: 165000,
    },
    {
      id: "IL-1002",
      invoiceNo: "ACME-202601-1042",
      invoiceId: "INV-0001",
      entityId: "ENT-UG",
      currency: "UGX",
      serviceDate: now - 4 * DAY,
      description: "City commute TRP-84002",
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Operations",
      costCenter: "OPS-001",
      projectTag: "Office commute",
      taxCode: "VAT18",
      amount: 98000,
    },
    {
      id: "IL-1101",
      invoiceNo: "ACME-202601-1042",
      invoiceId: "INV-0001",
      entityId: "ENT-UG",
      currency: "UGX",
      serviceDate: now - 8 * DAY,
      description: "MyLiveDealz orders",
      vendor: "Shenzhen Store",
      serviceModule: "E-Commerce",
      marketplace: "MyLiveDealz",
      group: "Procurement",
      costCenter: "PROC-001",
      projectTag: "High value",
      taxCode: "VAT0",
      amount: 2000000,
    },
    {
      id: "IL-1201",
      invoiceNo: "ACME-202601-1042",
      invoiceId: "INV-0001",
      entityId: "ENT-UG",
      currency: "UGX",
      serviceDate: now - 9 * DAY,
      description: "EVmart supplies",
      vendor: "Kampala Office Mart",
      serviceModule: "E-Commerce",
      marketplace: "EVmart",
      group: "Procurement",
      costCenter: "PROC-001",
      projectTag: "Office supplies",
      taxCode: "VAT18",
      amount: 2400000,
    },
    {
      id: "IL-2001",
      invoiceNo: "ACME-SALES-202512-0088",
      invoiceId: "INV-0002",
      entityId: "ENT-UG",
      currency: "UGX",
      serviceDate: now - 2 * DAY,
      description: "Sales travel ride TRP-99001",
      vendor: "EVzone Rides",
      serviceModule: "Rides & Logistics",
      marketplace: "-",
      group: "Sales",
      costCenter: "SALES-TRAVEL",
      projectTag: "Client meetings",
      taxCode: "VAT18",
      amount: 120000,
    },
  ]);

  const [rules, setRules] = useState<AutoMatchRule[]>(() => [
    {
      id: "R-01",
      name: "Strict: same vendor, amount, and date",
      enabled: true,
      requireSameVendor: true,
      requireSameModule: false,
      requireSameMarketplace: false,
      dateWindowDays: 1,
      amountTolerancePct: 0,
      minConfidence: 0.92,
      allowPartialMatch: false,
    },
    {
      id: "R-02",
      name: "Standard: vendor + amount tolerance",
      enabled: true,
      requireSameVendor: true,
      requireSameModule: true,
      requireSameMarketplace: false,
      dateWindowDays: 7,
      amountTolerancePct: 5,
      minConfidence: 0.85,
      allowPartialMatch: true,
    },
    {
      id: "R-03",
      name: "Marketplace: vendor + marketplace",
      enabled: true,
      requireSameVendor: true,
      requireSameModule: true,
      requireSameMarketplace: true,
      dateWindowDays: 14,
      amountTolerancePct: 10,
      minConfidence: 0.8,
      allowPartialMatch: true,
    },
  ]);

  const [erpMappings, setErpMappings] = useState<ErpMapping[]>(() => [
    { id: "MAP-DEF", scope: "Default", key: "*", glCode: "4000", costCenter: "ORG", taxCode: "VAT18", memo: "Default mapping", enabled: true },
    { id: "MAP-MOD-RIDES", scope: "Module", key: "Rides & Logistics", glCode: "4100", costCenter: "OPS-001", taxCode: "VAT18", memo: "Ride revenue", enabled: true },
    { id: "MAP-MOD-CHG", scope: "Module", key: "EVs & Charging", glCode: "4200", costCenter: "OPS-001", taxCode: "VAT18", memo: "Charging", enabled: true },
    { id: "MAP-MKT-MYLIVE", scope: "Marketplace", key: "MyLiveDealz", glCode: "4305", costCenter: "PROC-001", taxCode: "VAT0", memo: "Deals marketplace", enabled: true },
    { id: "MAP-VND-SHEN", scope: "Vendor", key: "Shenzhen Store", glCode: "5001", costCenter: "PROC-001", taxCode: "VAT0", memo: "Imports vendor", enabled: true },
  ]);

  const [matches, setMatches] = useState<Match[]>(() => [
    {
      id: "MT-01",
      lineId: "IL-1001",
      txId: "TX-9001",
      amount: 165000,
      method: "Auto",
      confidence: 0.98,
      ruleId: "R-01",
      createdAt: now - 2 * 60 * 60 * 1000,
      createdBy: "System",
      note: "Auto-match",
    },
    {
      id: "MT-02",
      lineId: "IL-1002",
      txId: "TX-9002",
      amount: 98000,
      method: "Auto",
      confidence: 0.98,
      ruleId: "R-01",
      createdAt: now - 2 * 60 * 60 * 1000,
      createdBy: "System",
      note: "Auto-match",
    },
  ]);

  const [exceptions, setExceptions] = useState<ExceptionItem[]>(() => [
    {
      id: "EX-100",
      kind: "Failed charge",
      severity: "Critical",
      status: "Open",
      createdAt: now - 2 * DAY,
      txId: "TX-9010",
      invoiceNo: "ACME-SALES-202512-0088",
      message: "Transaction failed for Sales travel ride. No posted payment exists.",
      suggestedNext: "Retry charge or route to exceptions approval",
    },
    {
      id: "EX-101",
      kind: "Refund pending",
      severity: "Warning",
      status: "Investigating",
      createdAt: now - 1 * DAY,
      txId: "TX-9040",
      invoiceNo: "ACME-202601-1042",
      message: "Refund is pending and may need approval to post.",
      suggestedNext: "Approve refund or schedule follow-up",
    },
  ]);

  const [audit, setAudit] = useState<AuditEvent[]>(() => [
    { id: "AU-001", at: now - 2 * 60 * 60 * 1000, actor: "System", action: "AUTO_MATCH_RUN", entityRef: "Batch", details: "Auto-matched 2 lines" },
  ]);

  // Filters
  const [ledgerQ, setLedgerQ] = useState("");
  const [ledgerType, setLedgerType] = useState<"All" | TxType>("All");
  const [ledgerStatus, setLedgerStatus] = useState<"All" | TxStatus>("All");

  const [lineQ, setLineQ] = useState("");
  const [lineScope, setLineScope] = useState<"Unmatched" | "All" | "Partially matched">("Unmatched");

  const [excQ, setExcQ] = useState("");
  const [excStatus, setExcStatus] = useState<"All" | ExceptionStatus>("All");

  // Selection
  const [activeLineId, setActiveLineId] = useState<string | null>(null);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);

  // Modals
  const [matchModalOpen, setMatchModalOpen] = useState(false);
  const [matchDraft, setMatchDraft] = useState<{ amount: number; note: string }>({ amount: 0, note: "" });

  const [ruleModalOpen, setRuleModalOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<AutoMatchRule | null>(null);

  const [mappingModalOpen, setMappingModalOpen] = useState(false);
  const [mappingDraft, setMappingDraft] = useState<ErpMapping | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);

  // Derived helpers
  const txMatchedMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const mt of matches) m[mt.txId] = (m[mt.txId] || 0) + mt.amount;
    return m;
  }, [matches]);

  const lineMatchedMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const mt of matches) m[mt.lineId] = (m[mt.lineId] || 0) + mt.amount;
    return m;
  }, [matches]);

  const txRemaining = (txId: string) => {
    const tx = transactions.find((t) => t.id === txId);
    if (!tx) return 0;
    const used = txMatchedMap[txId] || 0;
    return Math.max(0, tx.amount - used);
  };

  const lineRemaining = (lineId: string) => {
    const line = invoiceLines.find((l) => l.id === lineId);
    if (!line) return 0;
    const used = lineMatchedMap[lineId] || 0;
    return Math.max(0, line.amount - used);
  };

  const lineIsMatched = (lineId: string) => lineRemaining(lineId) <= 0.0001;
  const lineIsPartiallyMatched = (lineId: string) => (lineMatchedMap[lineId] || 0) > 0 && lineRemaining(lineId) > 0.0001;

  const activeLine = useMemo(() => (activeLineId ? invoiceLines.find((l) => l.id === activeLineId) || null : null), [activeLineId, invoiceLines]);
  const activeTx = useMemo(() => (activeTxId ? transactions.find((t) => t.id === activeTxId) || null : null), [activeTxId, transactions]);

  const activeLineMatches = useMemo(() => (activeLine ? matches.filter((m) => m.lineId === activeLine.id) : []), [activeLine, matches]);
  const activeTxMatches = useMemo(() => (activeTx ? matches.filter((m) => m.txId === activeTx.id) : []), [activeTx, matches]);

  const filteredLedger = useMemo(() => {
    const q = ledgerQ.trim().toLowerCase();
    return transactions
      .filter((t) => (ledgerType === "All" ? true : t.type === ledgerType))
      .filter((t) => (ledgerStatus === "All" ? true : t.status === ledgerStatus))
      .filter((t) => {
        if (!q) return true;
        const blob = `${t.id} ${t.reference} ${t.vendor} ${t.serviceModule} ${t.marketplace} ${t.group} ${t.costCenter} ${t.note}`.toLowerCase();
        return blob.includes(q);
      })
      .slice()
      .sort((a, b) => b.occurredAt - a.occurredAt);
  }, [transactions, ledgerQ, ledgerType, ledgerStatus]);

  const filteredLines = useMemo(() => {
    const q = lineQ.trim().toLowerCase();
    return invoiceLines
      .filter((l) => {
        if (lineScope === "Unmatched") return !lineIsMatched(l.id);
        if (lineScope === "Partially matched") return lineIsPartiallyMatched(l.id);
        return true;
      })
      .filter((l) => {
        if (!q) return true;
        const blob = `${l.invoiceNo} ${l.description} ${l.vendor} ${l.serviceModule} ${l.marketplace} ${l.group} ${l.costCenter} ${l.projectTag} ${l.taxCode}`.toLowerCase();
        return blob.includes(q);
      })
      .slice()
      .sort((a, b) => b.serviceDate - a.serviceDate);
  }, [invoiceLines, lineQ, lineScope, lineMatchedMap, matches]);

  const filteredExceptions = useMemo(() => {
    const q = excQ.trim().toLowerCase();
    return exceptions
      .filter((e) => (excStatus === "All" ? true : e.status === excStatus))
      .filter((e) => {
        if (!q) return true;
        const blob = `${e.id} ${e.kind} ${e.severity} ${e.status} ${e.message} ${e.suggestedNext} ${e.invoiceNo || ""} ${e.txId || ""}`.toLowerCase();
        return blob.includes(q);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [exceptions, excQ, excStatus]);

  // Candidate transactions for a line
  const candidateTxs = useMemo(() => {
    if (!activeLine) return [] as Array<{ tx: Transaction; score: number; bestRule?: AutoMatchRule }>;

    const candidates = transactions
      .filter((t) => t.currency === activeLine.currency)
      .filter((t) => t.status !== "Failed")
      .filter((t) => txRemaining(t.id) > 0)
      .filter((t) => daysBetween(t.occurredAt, activeLine.serviceDate) <= 30);

    const enabledRules = rules.filter((r) => r.enabled);

    const scored = candidates
      .map((tx) => {
        let best = 0;
        let bestRule: AutoMatchRule | undefined;
        for (const r of enabledRules) {
          const s = scoreCandidate(activeLine, tx, r);
          if (s > best) {
            best = s;
            bestRule = r;
          }
        }
        return { tx, score: best, bestRule };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored;
  }, [activeLine, transactions, txMatchedMap, rules]);

  const kpis = useMemo(() => {
    const unmatched = invoiceLines.filter((l) => !lineIsMatched(l.id)).length;
    const partial = invoiceLines.filter((l) => lineIsPartiallyMatched(l.id)).length;
    const openExc = exceptions.filter((e) => e.status !== "Resolved").length;
    const failedTx = transactions.filter((t) => t.status === "Failed").length;
    const pendingTx = transactions.filter((t) => t.status === "Pending").length;
    const postedTx = transactions.filter((t) => t.status === "Posted").length;
    const unmatchedTx = transactions.filter((t) => txRemaining(t.id) > 0 && t.status === "Posted").length;
    return { unmatched, partial, openExc, failedTx, pendingTx, postedTx, unmatchedTx };
  }, [invoiceLines, matches, exceptions, transactions, txMatchedMap]);

  const addAudit = (e: Omit<AuditEvent, "id">) => setAudit((p) => [{ id: uid("AU"), ...e }, ...p]);

  const createException = (e: Omit<ExceptionItem, "id" | "createdAt" | "status"> & { status?: ExceptionStatus }) => {
    const row: ExceptionItem = { id: uid("EX"), createdAt: Date.now(), status: e.status || "Open", ...e };
    setExceptions((p) => [row, ...p]);
    addAudit({ at: row.createdAt, actor: "System", action: "EXCEPTION_CREATED", entityRef: row.id, details: `${row.kind} (${row.severity})` });
  };

  const openMatchModal = (txId?: string) => {
    if (!activeLine) {
      toast({ title: "Select a line", message: "Choose an invoice line to reconcile.", kind: "warn" });
      return;
    }
    if (txId) setActiveTxId(txId);
    const tx = txId ? transactions.find((t) => t.id === txId) : activeTx;
    const suggested = tx ? Math.min(lineRemaining(activeLine.id), txRemaining(tx.id)) : lineRemaining(activeLine.id);
    setMatchDraft({ amount: suggested > 0 ? suggested : 0, note: "" });
    setMatchModalOpen(true);
  };

  const createMatch = (method: MatchMethod, confidence: number, ruleId?: string) => {
    if (!activeLine || !activeTx) return;
    const amount = Math.max(0, Math.round(matchDraft.amount));
    if (amount <= 0) {
      toast({ title: "Invalid amount", message: "Match amount must be greater than zero.", kind: "warn" });
      return;
    }

    const lr = lineRemaining(activeLine.id);
    const tr = txRemaining(activeTx.id);
    if (amount > lr) {
      toast({ title: "Too much", message: "Amount exceeds remaining line balance.", kind: "warn" });
      return;
    }
    if (amount > tr) {
      toast({ title: "Too much", message: "Amount exceeds remaining transaction balance.", kind: "warn" });
      return;
    }

    const row: Match = {
      id: uid("MT"),
      lineId: activeLine.id,
      txId: activeTx.id,
      amount,
      method,
      confidence,
      ruleId,
      createdAt: Date.now(),
      createdBy: method === "Auto" ? "System" : "You",
      note: matchDraft.note.trim() || (method === "Auto" ? "Auto-match" : "Manual match"),
    };

    setMatches((p) => [row, ...p]);
    addAudit({ at: row.createdAt, actor: row.createdBy, action: "MATCH_CREATED", entityRef: row.id, details: `${row.lineId} <- ${row.txId} (${row.amount})` });

    toast({ title: "Matched", message: `${activeLine.invoiceNo} line matched to ${activeTx.id}.`, kind: "success" });

    // Create exceptions for partial payments
    const nextLineRemaining = lr - amount;
    if (nextLineRemaining > 0 && nextLineRemaining > Math.max(1000, activeLine.amount * 0.02)) {
      createException({
        kind: "Partial payment",
        severity: "Warning",
        invoiceNo: activeLine.invoiceNo,
        lineId: activeLine.id,
        txId: activeTx.id,
        message: "Line partially matched. Remaining amount still due.",
        suggestedNext: "Find another transaction or raise an adjustment",
        status: "Open",
      });
    }

    setMatchModalOpen(false);
  };

  const removeMatch = (matchId: string) => {
    const mt = matches.find((m) => m.id === matchId);
    if (!mt) return;
    setMatches((p) => p.filter((x) => x.id !== matchId));
    addAudit({ at: Date.now(), actor: "You", action: "MATCH_REMOVED", entityRef: matchId, details: `${mt.lineId} x ${mt.txId} (${mt.amount})` });
    toast({ title: "Unmatched", message: "Match removed.", kind: "info" });
  };

  const runAutoMatch = () => {
    const enabled = rules.filter((r) => r.enabled);
    if (!enabled.length) {
      toast({ title: "No rules", message: "Enable at least one auto-match rule.", kind: "warn" });
      return;
    }

    const start = Date.now();
    let matchedCount = 0;
    let skipped = 0;

    // Work on a snapshot so remaining computations are stable
    const txIndex: Record<string, Transaction> = Object.fromEntries(transactions.map((t) => [t.id, t]));

    // Helper: current remaining based on staged matches
    const stagedMatches = [...matches];
    const stagedTxUsed: Record<string, number> = {};
    const stagedLineUsed: Record<string, number> = {};
    for (const mt of stagedMatches) {
      stagedTxUsed[mt.txId] = (stagedTxUsed[mt.txId] || 0) + mt.amount;
      stagedLineUsed[mt.lineId] = (stagedLineUsed[mt.lineId] || 0) + mt.amount;
    }

    const txRem = (txId: string) => {
      const tx = txIndex[txId];
      if (!tx) return 0;
      return Math.max(0, tx.amount - (stagedTxUsed[txId] || 0));
    };

    const lineRem = (lineId: string) => {
      const line = invoiceLines.find((l) => l.id === lineId);
      if (!line) return 0;
      return Math.max(0, line.amount - (stagedLineUsed[lineId] || 0));
    };

    const newMatches: Match[] = [];

    const candidatesTx = transactions.filter((t) => t.status !== "Failed");

    for (const line of invoiceLines) {
      if (lineRem(line.id) <= 0.0001) continue;

      const txs = candidatesTx
        .filter((t) => t.currency === line.currency)
        .filter((t) => txRem(t.id) > 0)
        .filter((t) => daysBetween(t.occurredAt, line.serviceDate) <= 30);

      let best: { tx: Transaction; score: number; rule?: AutoMatchRule } | null = null;

      for (const tx of txs) {
        for (const rule of enabled) {
          const sc = scoreCandidate(line, tx, rule);
          if (sc <= 0) continue;
          if (sc < rule.minConfidence) continue;

          if (!best || sc > best.score) best = { tx, score: sc, rule };
        }
      }

      if (!best) {
        skipped += 1;
        continue;
      }

      const rule = best.rule!;
      const amount = Math.min(lineRem(line.id), txRem(best.tx.id));

      if (!rule.allowPartialMatch && amount !== lineRem(line.id)) {
        skipped += 1;
        continue;
      }

      if (amount <= 0) {
        skipped += 1;
        continue;
      }

      // Apply staged usage
      stagedTxUsed[best.tx.id] = (stagedTxUsed[best.tx.id] || 0) + amount;
      stagedLineUsed[line.id] = (stagedLineUsed[line.id] || 0) + amount;

      newMatches.push({
        id: uid("MT"),
        lineId: line.id,
        txId: best.tx.id,
        amount: Math.round(amount),
        method: "Auto",
        confidence: best.score,
        ruleId: rule.id,
        createdAt: Date.now(),
        createdBy: "System",
        note: `Auto-match by ${rule.name}`,
      });

      matchedCount += 1;
    }

    if (newMatches.length) {
      setMatches((p) => [...newMatches, ...p]);
      addAudit({ at: Date.now(), actor: "System", action: "AUTO_MATCH_RUN", entityRef: "Batch", details: `Auto-matched ${matchedCount} line(s), skipped ${skipped}.` });
      toast({ title: "Auto-match complete", message: `Matched ${matchedCount} line(s).`, kind: "success" });

      // Create an exception for any remaining unmatched lines
      const afterLineUsed: Record<string, number> = {};
      for (const mt of [...matches, ...newMatches]) afterLineUsed[mt.lineId] = (afterLineUsed[mt.lineId] || 0) + mt.amount;
      const stillUnmatched = invoiceLines.filter((l) => Math.max(0, l.amount - (afterLineUsed[l.id] || 0)) > 0.0001);
      if (stillUnmatched.length) {
        createException({
          kind: "Unmatched",
          severity: "Warning",
          message: `${stillUnmatched.length} invoice line(s) remain unmatched after auto-match.",`,
          suggestedNext: "Review candidate transactions or create adjustments",
          status: "Open",
        });
      }
    } else {
      toast({ title: "No matches", message: "No auto-matches met the confidence thresholds.", kind: "info" });
    }

    const tookMs = Date.now() - start;
    if (tookMs > 10) {
      // no-op, placeholder for perf metrics
    }
  };

  const resolveException = (id: string) => {
    setExceptions((p) => p.map((e) => (e.id === id ? { ...e, status: "Resolved" } : e)));
    addAudit({ at: Date.now(), actor: "You", action: "EXCEPTION_UPDATED", entityRef: id, details: "Marked resolved" });
    toast({ title: "Resolved", message: "Exception resolved.", kind: "success" });
  };

  const setExceptionStatus = (id: string, st: ExceptionStatus) => {
    setExceptions((p) => p.map((e) => (e.id === id ? { ...e, status: st } : e)));
    addAudit({ at: Date.now(), actor: "You", action: "EXCEPTION_UPDATED", entityRef: id, details: `Status -> ${st}` });
    toast({ title: "Updated", message: "Exception updated.", kind: "info" });
  };

  const retryFailedTx = (txId: string) => {
    setTransactions((p) => p.map((t) => (t.id === txId ? { ...t, status: "Pending", note: `${t.note} (retry queued)` } : t)));
    addAudit({ at: Date.now(), actor: "You", action: "TX_STATUS_UPDATED", entityRef: txId, details: "Retry queued" });
    toast({ title: "Retry queued", message: "Transaction moved to Pending.", kind: "success" });
  };

  const markTxPosted = (txId: string) => {
    setTransactions((p) => p.map((t) => (t.id === txId ? { ...t, status: "Posted" } : t)));
    addAudit({ at: Date.now(), actor: "You", action: "TX_STATUS_UPDATED", entityRef: txId, details: "Marked Posted" });
    toast({ title: "Updated", message: "Transaction marked Posted.", kind: "success" });
  };

  const openRuleEdit = (r?: AutoMatchRule) => {
    if (r) setRuleDraft(JSON.parse(JSON.stringify(r)));
    else
      setRuleDraft({
        id: "",
        name: "New rule",
        enabled: true,
        requireSameVendor: true,
        requireSameModule: true,
        requireSameMarketplace: false,
        dateWindowDays: 7,
        amountTolerancePct: 5,
        minConfidence: 0.85,
        allowPartialMatch: true,
      });
    setRuleModalOpen(true);
  };

  const saveRule = () => {
    if (!ruleDraft) return;
    if (!ruleDraft.name.trim()) {
      toast({ title: "Missing name", message: "Rule name is required.", kind: "warn" });
      return;
    }
    const isNew = !ruleDraft.id;
    const id = ruleDraft.id || uid("R");
    const row: AutoMatchRule = { ...ruleDraft, id };
    setRules((p) => {
      const idx = p.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = p.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...p];
    });
    addAudit({ at: Date.now(), actor: "You", action: "RULE_UPDATED", entityRef: id, details: `${isNew ? "Created" : "Updated"} rule` });
    toast({ title: "Saved", message: "Rule saved.", kind: "success" });
    setRuleModalOpen(false);
  };

  const deleteRule = (id: string) => {
    setRules((p) => p.filter((x) => x.id !== id));
    addAudit({ at: Date.now(), actor: "You", action: "RULE_UPDATED", entityRef: id, details: "Deleted rule" });
    toast({ title: "Deleted", message: "Rule deleted.", kind: "info" });
  };

  const openMappingEdit = (m?: ErpMapping) => {
    if (m) setMappingDraft(JSON.parse(JSON.stringify(m)));
    else setMappingDraft({ id: "", scope: "Module", key: "Rides & Logistics", glCode: "4000", costCenter: "ORG", taxCode: "VAT18", memo: "", enabled: true });
    setMappingModalOpen(true);
  };

  const saveMapping = () => {
    if (!mappingDraft) return;
    if (!mappingDraft.key.trim()) {
      toast({ title: "Missing key", message: "Key is required.", kind: "warn" });
      return;
    }
    const isNew = !mappingDraft.id;
    const id = mappingDraft.id || uid("MAP");
    const row: ErpMapping = { ...mappingDraft, id };
    setErpMappings((p) => {
      const idx = p.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = p.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...p];
    });
    addAudit({ at: Date.now(), actor: "You", action: "ERP_MAPPING_UPDATED", entityRef: id, details: `${isNew ? "Created" : "Updated"} mapping` });
    toast({ title: "Saved", message: "ERP mapping saved.", kind: "success" });
    setMappingModalOpen(false);
  };

  const deleteMapping = (id: string) => {
    setErpMappings((p) => p.filter((x) => x.id !== id));
    addAudit({ at: Date.now(), actor: "You", action: "ERP_MAPPING_UPDATED", entityRef: id, details: "Deleted mapping" });
    toast({ title: "Deleted", message: "Mapping removed.", kind: "info" });
  };

  const exportReconciliationReport = () => {
    const payload = buildReportPayload();
    downloadJSON("reconciliation-report.json", payload);
    addAudit({ at: Date.now(), actor: "You", action: "EXPORT", entityRef: "recon-report.json", details: "Exported reconciliation report JSON" });
    toast({ title: "Exported", message: "Reconciliation report JSON downloaded.", kind: "success" });
  };

  const exportLedgerCSV = () => {
    const rows = filteredLedger.map((t) => ({
      id: t.id,
      occurredAt: formatDateTime(t.occurredAt),
      type: t.type,
      status: t.status,
      currency: t.currency,
      amount: formatMoney(t.amount, t.currency),
      matched: formatMoney(txMatchedMap[t.id] || 0, t.currency),
      remaining: formatMoney(txRemaining(t.id), t.currency),
      vendor: t.vendor,
      module: t.serviceModule,
      marketplace: t.marketplace,
      group: t.group,
      costCenter: t.costCenter,
      taxCode: t.taxCode,
      reference: t.reference,
      note: t.note,
    }));

    const csv = toCSV(rows, [
      { key: "id", label: "ID" },
      { key: "occurredAt", label: "Time" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
      { key: "currency", label: "Currency" },
      { key: "amount", label: "Amount" },
      { key: "matched", label: "Matched" },
      { key: "remaining", label: "Remaining" },
      { key: "vendor", label: "Vendor" },
      { key: "module", label: "Module" },
      { key: "marketplace", label: "Marketplace" },
      { key: "group", label: "Group" },
      { key: "costCenter", label: "Cost center" },
      { key: "taxCode", label: "Tax code" },
      { key: "reference", label: "Reference" },
      { key: "note", label: "Note" },
    ]);

    downloadText("transaction-ledger.csv", csv, "text/csv");
    addAudit({ at: Date.now(), actor: "You", action: "EXPORT", entityRef: "transaction-ledger.csv", details: "Exported ledger CSV" });
    toast({ title: "Exported", message: "Ledger CSV downloaded.", kind: "success" });
  };

  const buildReportPayload = () => {
    const unmatchedLines = invoiceLines.filter((l) => lineRemaining(l.id) > 0.0001);
    const unmatchedTx = transactions.filter((t) => t.status === "Posted" && txRemaining(t.id) > 0.0001);

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        invoiceLines: invoiceLines.length,
        transactions: transactions.length,
        matches: matches.length,
        unmatchedLines: unmatchedLines.length,
        unmatchedPostedTransactions: unmatchedTx.length,
        openExceptions: exceptions.filter((e) => e.status !== "Resolved").length,
      },
      matches,
      unmatchedLines: unmatchedLines.map((l) => ({
        lineId: l.id,
        invoiceNo: l.invoiceNo,
        vendor: l.vendor,
        module: l.serviceModule,
        marketplace: l.marketplace,
        amount: l.amount,
        matched: lineMatchedMap[l.id] || 0,
        remaining: lineRemaining(l.id),
      })),
      unmatchedTransactions: unmatchedTx.map((t) => ({
        txId: t.id,
        type: t.type,
        vendor: t.vendor,
        module: t.serviceModule,
        marketplace: t.marketplace,
        amount: t.amount,
        matched: txMatchedMap[t.id] || 0,
        remaining: txRemaining(t.id),
      })),
      exceptions,
      erpMappings,
      rules,
      audit,
    };
  };

  const reportSummary = useMemo(() => buildReportPayload().summary, [invoiceLines, transactions, matches, exceptions, erpMappings, rules, audit, txMatchedMap, lineMatchedMap]);

  // Auto: generate exceptions for unmatched lines or posted tx (lightweight demo)
  useEffect(() => {
    const existingUnmatched = exceptions.some((e) => e.kind === "Unmatched");
    const stillUnmatched = invoiceLines.filter((l) => lineRemaining(l.id) > 0.0001);
    if (!existingUnmatched && stillUnmatched.length >= 2) {
      // do not spam, add once
      setExceptions((p) => [
        {
          id: uid("EX"),
          kind: "Unmatched",
          severity: "Warning",
          status: "Investigating",
          createdAt: Date.now(),
          message: "Some invoice lines are unmatched. Review reconciliation.",
          suggestedNext: "Run auto-match or match manually",
        },
        ...p,
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
                  <ListChecks className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Transactions and Reconciliation</div>
                  <div className="mt-1 text-xs text-slate-500">Ledger, matching tools, exceptions queue, ERP mappings, auto-match rules, and audit-ready reports.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Unmatched lines: ${kpis.unmatched}`} tone={kpis.unmatched ? "warn" : "good"} />
                    <Pill label={`Partial: ${kpis.partial}`} tone={kpis.partial ? "info" : "neutral"} />
                    <Pill label={`Open exceptions: ${kpis.openExc}`} tone={kpis.openExc ? "bad" : "good"} />
                    <Pill label={`Posted tx: ${kpis.postedTx}`} tone="neutral" />
                    <Pill label={`Unmatched tx: ${kpis.unmatchedTx}`} tone={kpis.unmatchedTx ? "warn" : "good"} />
                    <Pill label="Premium: auto-match + ERP" tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setTab("recon")}>
                  <Link2 className="h-4 w-4" /> Reconcile
                </Button>
                <Button variant="outline" onClick={runAutoMatch}>
                  <Sparkles className="h-4 w-4" /> Auto-match
                </Button>
                <Button variant="outline" onClick={exportLedgerCSV}>
                  <Download className="h-4 w-4" /> Ledger CSV
                </Button>
                <Button variant="primary" onClick={exportReconciliationReport}>
                  <FileText className="h-4 w-4" /> Export report
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "recon", label: "Reconciliation" },
                { id: "ledger", label: "Transaction ledger" },
                { id: "exceptions", label: "Exceptions queue" },
                { id: "erp", label: "ERP mappings" },
                { id: "rules", label: "Auto-match rules" },
                { id: "reports", label: "Reports" },
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
            {tab === "ledger" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Ledger filters" subtitle="Search by vendor, ref, module, cost center." right={<Pill label="Core" tone="neutral" />}>
                    <Field label="Search" value={ledgerQ} onChange={setLedgerQ} placeholder="TX-9001, vendor, ORD..." />
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select
                        label="Type"
                        value={ledgerType}
                        onChange={(v) => setLedgerType(v as any)}
                        options={[{ value: "All", label: "All" }, ...Array.from(new Set(transactions.map((t) => t.type))).map((x) => ({ value: x, label: x }))]}
                      />
                      <Select
                        label="Status"
                        value={ledgerStatus}
                        onChange={(v) => setLedgerStatus(v as any)}
                        options={[{ value: "All", label: "All" }, { value: "Posted", label: "Posted" }, { value: "Pending", label: "Pending" }, { value: "Failed", label: "Failed" }]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setLedgerQ("");
                          setLedgerType("All");
                          setLedgerStatus("All");
                          toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                      <Button variant="outline" onClick={exportLedgerCSV}>
                        <Download className="h-4 w-4" /> CSV
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Core: ledger shows wallet, credit, prepaid, refunds, and reversals.
                    </div>
                  </Section>

                  <Section title="Ledger insights" subtitle="Premium pivot summary." right={<Pill label="Premium" tone="info" />}>
                    <PivotSummary rows={filteredLedger} currency="UGX" />
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section
                    title="Transaction ledger"
                    subtitle="Click a transaction to reconcile against the selected invoice line."
                    right={<Pill label={`${filteredLedger.length} tx`} tone="neutral" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Tx</th>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Remaining</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredLedger.map((t) => {
                            const matched = txMatchedMap[t.id] || 0;
                            const rem = txRemaining(t.id);
                            const isActive = activeTxId === t.id;
                            return (
                              <tr key={t.id} className={cn("border-t border-slate-100 hover:bg-slate-50/60", isActive && "bg-emerald-50/40")}>
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{t.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">Ref: {t.reference}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{formatDateTime(t.occurredAt)}</td>
                                <td className="px-4 py-3 text-slate-700">{t.type}</td>
                                <td className="px-4 py-3"><Pill label={t.status} tone={t.status === "Posted" ? "good" : t.status === "Pending" ? "warn" : "bad"} /></td>
                                <td className="px-4 py-3 text-slate-700">{t.vendor}</td>
                                <td className="px-4 py-3 text-slate-700">{t.serviceModule}{t.marketplace !== "-" ? ` • ${t.marketplace}` : ""}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(t.amount, t.currency)}</td>
                                <td className="px-4 py-3">
                                  <div className="text-sm font-semibold text-slate-900">{formatMoney(rem, t.currency)}</div>
                                  <div className="mt-1 text-xs text-slate-500">Matched: {formatMoney(matched, t.currency)}</div>
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        setActiveTxId(t.id);
                                        toast({ title: "Selected", message: "Transaction selected.", kind: "info" });
                                      }}
                                    >
                                      <Link2 className="h-4 w-4" /> Select
                                    </Button>
                                    <Button
                                      variant="primary"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        setActiveTxId(t.id);
                                        openMatchModal(t.id);
                                      }}
                                      disabled={!activeLineId || rem <= 0 || t.status === "Failed"}
                                      title={!activeLineId ? "Select an invoice line first" : rem <= 0 ? "No remaining amount" : t.status === "Failed" ? "Failed transaction" : ""}
                                    >
                                      <Check className="h-4 w-4" /> Match
                                    </Button>
                                    {t.status === "Failed" ? (
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => retryFailedTx(t.id)}>
                                        <RefreshCcw className="h-4 w-4" /> Retry
                                      </Button>
                                    ) : t.status === "Pending" ? (
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => markTxPosted(t.id)}>
                                        <BadgeCheck className="h-4 w-4" /> Post
                                      </Button>
                                    ) : null}
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={async () => {
                                        try {
                                          await navigator.clipboard.writeText(t.id);
                                          toast({ title: "Copied", message: "Transaction ID copied.", kind: "success" });
                                        } catch {
                                          toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                        }
                                      }}
                                    >
                                      <Copy className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!filteredLedger.length ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-600">No transactions match filters.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: ERP export mappings (GL codes, cost centers, tax codes) are configured in the ERP tab.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "recon" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Invoice lines" subtitle="Select a line and match to transactions." right={<Pill label={lineScope} tone="neutral" />}>
                    <Field label="Search lines" value={lineQ} onChange={setLineQ} placeholder="Invoice, vendor, project tag..." />
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select
                        label="Scope"
                        value={lineScope}
                        onChange={(v) => setLineScope(v as any)}
                        options={[
                          { value: "Unmatched", label: "Unmatched" },
                          { value: "Partially matched", label: "Partially matched" },
                          { value: "All", label: "All" },
                        ]}
                        hint="Worklist"
                      />
                      <Button variant="outline" className="mt-[22px] w-full sm:mt-0" onClick={runAutoMatch}>
                        <Sparkles className="h-4 w-4" /> Auto-match
                      </Button>
                    </div>

                    <div className="mt-4 space-y-2">
                      {filteredLines.slice(0, 30).map((l) => {
                        const rem = lineRemaining(l.id);
                        const matched = lineMatchedMap[l.id] || 0;
                        const active = activeLineId === l.id;
                        return (
                          <button
                            key={l.id}
                            type="button"
                            className={cn(
                              "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                              active ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                            )}
                            onClick={() => {
                              setActiveLineId(l.id);
                              // keep tx selection but do not force
                            }}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="truncate text-sm font-semibold text-slate-900">{l.invoiceNo}</div>
                                  {rem <= 0.0001 ? <Pill label="Matched" tone="good" /> : matched > 0 ? <Pill label="Partial" tone="info" /> : <Pill label="Unmatched" tone="warn" />}
                                </div>
                                <div className="mt-1 truncate text-xs text-slate-500">{l.description}</div>
                                <div className="mt-1 text-xs text-slate-500">{l.vendor} • {l.serviceModule}{l.marketplace !== "-" ? ` • ${l.marketplace}` : ""}</div>
                                <div className="mt-1 text-xs text-slate-500">{l.group} • {l.costCenter} • {l.projectTag}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Amount</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(l.amount, l.currency)}</div>
                                <div className="mt-2 text-xs text-slate-500">Remaining</div>
                                <div className={cn("mt-1 text-sm font-semibold", rem > 0 ? "text-slate-900" : "text-emerald-700")}>{formatMoney(rem, l.currency)}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                      {!filteredLines.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                            <ListChecks className="h-6 w-6" />
                          </div>
                          <div className="mt-3 text-sm font-semibold text-slate-900">No lines</div>
                          <div className="mt-1 text-sm text-slate-600">Your current scope and filters show no lines.</div>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium assistant: auto-match uses enabled rules and confidence thresholds.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Reconciliation workspace"
                    subtitle="Match invoice lines to wallet, credit, prepaid, refunds, and reversals."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => setTab("ledger")}>
                          <ChevronRight className="h-4 w-4" /> Open ledger
                        </Button>
                        <Button variant="outline" onClick={() => setTab("exceptions")}>
                          <AlertTriangle className="h-4 w-4" /> Exceptions
                        </Button>
                      </div>
                    }
                  >
                    {!activeLine ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
                        <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <Link2 className="h-6 w-6" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">Select an invoice line</div>
                        <div className="mt-1 text-sm text-slate-600">Choose a line on the left to see candidate transactions.</div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                        <div className="lg:col-span-7 space-y-4">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{activeLine.invoiceNo}</div>
                                  <Pill label={activeLine.taxCode} tone="neutral" />
                                  <Pill label={activeLine.marketplace !== "-" ? activeLine.marketplace : activeLine.serviceModule} tone="info" />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{activeLine.description}</div>
                                <div className="mt-1 text-xs text-slate-500">{activeLine.vendor} • {formatDate(activeLine.serviceDate)}</div>
                                <div className="mt-1 text-xs text-slate-500">{activeLine.group} • {activeLine.costCenter} • {activeLine.projectTag}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-xs text-slate-500">Amount</div>
                                <div className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(activeLine.amount, activeLine.currency)}</div>
                                <div className="mt-1 text-xs text-slate-500">Remaining</div>
                                <div className={cn("mt-1 text-sm font-semibold", lineRemaining(activeLine.id) > 0 ? "text-slate-900" : "text-emerald-700")}>
                                  {formatMoney(lineRemaining(activeLine.id), activeLine.currency)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 flex flex-wrap items-center gap-2">
                              <Button
                                variant="primary"
                                onClick={() => {
                                  if (!activeTxId && candidateTxs[0]?.tx?.id) setActiveTxId(candidateTxs[0].tx.id);
                                  openMatchModal(activeTxId || candidateTxs[0]?.tx?.id);
                                }}
                                disabled={lineRemaining(activeLine.id) <= 0.0001}
                              >
                                <Check className="h-4 w-4" /> Match
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => {
                                  setActiveTxId(null);
                                  toast({ title: "Cleared", message: "Transaction selection cleared.", kind: "info" });
                                }}
                              >
                                <X className="h-4 w-4" /> Clear tx
                              </Button>
                              <Button variant="outline" onClick={runAutoMatch}>
                                <Sparkles className="h-4 w-4" /> Auto-match all
                              </Button>
                              <Button variant="outline" onClick={() => setReportModalOpen(true)}>
                                <FileText className="h-4 w-4" /> Report
                              </Button>
                            </div>

                            <div className="mt-4">
                              <div className="text-xs font-semibold text-slate-600">Existing matches</div>
                              <div className="mt-2 space-y-2">
                                {activeLineMatches.length ? (
                                  activeLineMatches.map((m) => {
                                    const tx = transactions.find((t) => t.id === m.txId);
                                    return (
                                      <div key={m.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                                        <div className="flex items-start justify-between gap-3">
                                          <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                              <div className="text-sm font-semibold text-slate-900">{m.txId}</div>
                                              <Pill label={m.method} tone={m.method === "Auto" ? "info" : "neutral"} />
                                              <Pill label={`${Math.round(m.confidence * 100)}%`} tone={m.confidence >= 0.9 ? "good" : m.confidence >= 0.8 ? "warn" : "neutral"} />
                                            </div>
                                            <div className="mt-1 text-xs text-slate-500">{tx?.vendor || "-"} • {tx?.type || "-"} • {tx ? formatDateTime(tx.occurredAt) : "-"}</div>
                                            <div className="mt-2 text-xs text-slate-600">Note: {m.note}</div>
                                          </div>
                                          <div className="text-right">
                                            <div className="text-xs text-slate-500">Amount</div>
                                            <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(m.amount, activeLine.currency)}</div>
                                            <div className="mt-2 flex justify-end">
                                              <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => removeMatch(m.id)}>
                                                <X className="h-4 w-4" /> Remove
                                              </Button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })
                                ) : (
                                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No matches yet for this line.</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="lg:col-span-5 space-y-4">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Candidate transactions</div>
                                <div className="mt-1 text-xs text-slate-500">Suggested by rules and scoring.</div>
                              </div>
                              <Pill label={`Top ${Math.min(8, candidateTxs.length)}`} tone="info" />
                            </div>

                            <div className="mt-3 space-y-2">
                              {candidateTxs.slice(0, 8).map((c) => {
                                const tx = c.tx;
                                const rem = txRemaining(tx.id);
                                const active = activeTxId === tx.id;
                                const score = Math.round(c.score * 100);
                                const ruleName = c.bestRule?.name || "-";
                                return (
                                  <button
                                    key={tx.id}
                                    type="button"
                                    className={cn(
                                      "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                                      active ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                                    )}
                                    onClick={() => setActiveTxId(tx.id)}
                                  >
                                    <div className="flex items-start justify-between gap-3">
                                      <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                          <div className="text-sm font-semibold text-slate-900">{tx.id}</div>
                                          <Pill label={tx.status} tone={tx.status === "Posted" ? "good" : "warn"} />
                                          <Pill label={`${score}%`} tone={score >= 90 ? "good" : score >= 80 ? "warn" : "neutral"} />
                                        </div>
                                        <div className="mt-1 text-xs text-slate-500">{tx.vendor} • {tx.type}</div>
                                        <div className="mt-1 text-xs text-slate-500">{tx.serviceModule}{tx.marketplace !== "-" ? ` • ${tx.marketplace}` : ""}</div>
                                        <div className="mt-1 text-xs text-slate-500">Rule: {ruleName}</div>
                                      </div>
                                      <div className="text-right">
                                        <div className="text-xs text-slate-500">Available</div>
                                        <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(rem, tx.currency)}</div>
                                        <div className="mt-2">
                                          <Button
                                            variant="primary"
                                            className="px-3 py-2 text-xs"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setActiveTxId(tx.id);
                                              openMatchModal(tx.id);
                                            }}
                                            disabled={lineRemaining(activeLine.id) <= 0.0001 || rem <= 0.0001}
                                          >
                                            <Check className="h-4 w-4" /> Match
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                );
                              })}
                              {!candidateTxs.length ? (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                                  No candidates found. Try opening the ledger and selecting a transaction.
                                </div>
                              ) : null}
                            </div>

                            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                              Premium assistant: auto-match rules can be tuned in the Rules tab.
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">Selected transaction</div>
                                <div className="mt-1 text-xs text-slate-500">For manual reconciliation.</div>
                              </div>
                              <Pill label={activeTx ? activeTx.status : "None"} tone={activeTx ? (activeTx.status === "Posted" ? "good" : activeTx.status === "Pending" ? "warn" : "bad") : "neutral"} />
                            </div>

                            {activeTx ? (
                              <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{activeTx.id}</div>
                                    <div className="mt-1 text-xs text-slate-500">{activeTx.vendor} • {activeTx.type}</div>
                                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(activeTx.occurredAt)} • Ref {activeTx.reference}</div>
                                    <div className="mt-2 text-xs text-slate-600">Note: {activeTx.note}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-slate-500">Remaining</div>
                                    <div className="mt-1 text-sm font-semibold text-slate-900">{formatMoney(txRemaining(activeTx.id), activeTx.currency)}</div>
                                  </div>
                                </div>

                                {activeTxMatches.length ? (
                                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                                    <div className="font-semibold text-slate-900">Matches</div>
                                    <ul className="mt-2 space-y-1">
                                      {activeTxMatches.slice(0, 6).map((m) => (
                                        <li key={m.id}>• {m.lineId} ({formatMoney(m.amount, activeTx.currency)})</li>
                                      ))}
                                    </ul>
                                  </div>
                                ) : (
                                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No matches for this transaction.</div>
                                )}

                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                  {activeTx.status === "Failed" ? (
                                    <Button variant="outline" onClick={() => retryFailedTx(activeTx.id)}>
                                      <RefreshCcw className="h-4 w-4" /> Retry
                                    </Button>
                                  ) : activeTx.status === "Pending" ? (
                                    <Button variant="outline" onClick={() => markTxPosted(activeTx.id)}>
                                      <BadgeCheck className="h-4 w-4" /> Mark Posted
                                    </Button>
                                  ) : null}
                                  <Button
                                    variant="outline"
                                    onClick={async () => {
                                      try {
                                        await navigator.clipboard.writeText(activeTx.id);
                                        toast({ title: "Copied", message: "Transaction ID copied.", kind: "success" });
                                      } catch {
                                        toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                      }
                                    }}
                                  >
                                    <Copy className="h-4 w-4" /> Copy ID
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                                Select a candidate or choose a transaction from the Ledger.
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "exceptions" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Exceptions filters" subtitle="Search and manage exceptions." right={<Pill label="Core" tone="neutral" />}>
                    <Field label="Search" value={excQ} onChange={setExcQ} placeholder="TX, invoice, message..." />
                    <Select
                      label="Status"
                      value={excStatus}
                      onChange={(v) => setExcStatus(v as any)}
                      options={[{ value: "All", label: "All" }, { value: "Open", label: "Open" }, { value: "Investigating", label: "Investigating" }, { value: "Resolved", label: "Resolved" }]}
                    />
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setExcQ("");
                          setExcStatus("All");
                          toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          createException({ kind: "Unmatched", severity: "Warning", message: "Manual exception created.", suggestedNext: "Review reconciliation" });
                          toast({ title: "Created", message: "Exception created.", kind: "success" });
                        }}
                      >
                        <Plus className="h-4 w-4" /> New exception
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Core: exceptions queue covers failed charges and partial payments.
                    </div>
                  </Section>

                  <Section title="Premium" subtitle="Audit-ready reconciliation reports." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Exceptions are linked to transactions and invoices</li>
                        <li>2) Actions are audit logged</li>
                        <li>3) Reports export to JSON for ERP ingestion</li>
                      </ul>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setTab("reports")}>
                        <ChevronRight className="h-4 w-4" /> Open reports
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Exceptions queue" subtitle="Failed charges, partial payments, and reconciliation gaps." right={<Pill label={`${filteredExceptions.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {filteredExceptions.map((e) => {
                        const tone = e.severity === "Critical" ? "bad" : e.severity === "Warning" ? "warn" : "info";
                        return (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{e.id}</div>
                                  <Pill label={e.kind} tone="neutral" />
                                  <Pill label={e.severity} tone={tone} />
                                  <Pill label={e.status} tone={e.status === "Resolved" ? "good" : e.status === "Investigating" ? "info" : "warn"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Created {timeAgo(e.createdAt)} • {formatDateTime(e.createdAt)}</div>
                                {e.invoiceNo ? <div className="mt-1 text-xs text-slate-500">Invoice: {e.invoiceNo}</div> : null}
                                {e.txId ? <div className="mt-1 text-xs text-slate-500">Transaction: {e.txId}</div> : null}
                                <div className="mt-2 text-sm text-slate-700">{e.message}</div>
                                <div className="mt-2 text-xs text-slate-600">Next: {e.suggestedNext}</div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {e.txId ? (
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setActiveTxId(e.txId || null);
                                      setTab("ledger");
                                      toast({ title: "Opened", message: "Transaction selected in ledger.", kind: "info" });
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4" /> Open tx
                                  </Button>
                                ) : null}
                                {e.status !== "Resolved" ? (
                                  <>
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setExceptionStatus(e.id, "Investigating")}>
                                      <Settings2 className="h-4 w-4" /> Investigate
                                    </Button>
                                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => resolveException(e.id)}>
                                      <Check className="h-4 w-4" /> Resolve
                                    </Button>
                                  </>
                                ) : (
                                  <Pill label="Done" tone="good" />
                                )}
                                {e.kind === "Failed charge" && e.txId ? (
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => retryFailedTx(e.txId!)}>
                                    <RefreshCcw className="h-4 w-4" /> Retry
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!filteredExceptions.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No exceptions.</div>
                      ) : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "erp" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="ERP export mappings" subtitle="GL codes, cost centers, tax codes." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Mapping resolution: Vendor, then Marketplace, then Module, then Default</li>
                        <li>2) Used by reconciliation exports and ERP posts</li>
                        <li>3) Keep tax codes consistent with entity VAT settings</li>
                      </ul>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => openMappingEdit()}>
                        <Plus className="h-4 w-4" /> New mapping
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          downloadJSON("erp-mappings.json", erpMappings);
                          addAudit({ at: Date.now(), actor: "You", action: "EXPORT", entityRef: "erp-mappings.json", details: "Exported ERP mappings" });
                          toast({ title: "Exported", message: "ERP mappings JSON downloaded.", kind: "success" });
                        }}
                      >
                        <Download className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </Section>

                  <Section title="ERP mapping preview" subtitle="Check how a transaction maps." right={<Pill label="Premium" tone="info" />}>
                    <MappingPreview
                      tx={activeTx}
                      mappings={erpMappings}
                      onPickTx={() => {
                        setTab("ledger");
                        toast({ title: "Pick tx", message: "Select a transaction in the ledger.", kind: "info" });
                      }}
                    />
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Mappings" subtitle="Define GL, cost center, and tax codes for exports." right={<Pill label={`${erpMappings.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Scope</th>
                            <th className="px-4 py-3 font-semibold">Key</th>
                            <th className="px-4 py-3 font-semibold">GL</th>
                            <th className="px-4 py-3 font-semibold">Cost center</th>
                            <th className="px-4 py-3 font-semibold">Tax</th>
                            <th className="px-4 py-3 font-semibold">Enabled</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {erpMappings.map((m) => (
                            <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3"><Pill label={m.scope} tone={m.scope === "Default" ? "neutral" : "info"} /></td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{m.key}</td>
                              <td className="px-4 py-3 text-slate-700">{m.glCode}</td>
                              <td className="px-4 py-3 text-slate-700">{m.costCenter}</td>
                              <td className="px-4 py-3 text-slate-700">{m.taxCode}</td>
                              <td className="px-4 py-3"><Pill label={m.enabled ? "On" : "Off"} tone={m.enabled ? "good" : "neutral"} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openMappingEdit(m)}>
                                    <Settings2 className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setErpMappings((p) => p.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)))}>
                                    {m.enabled ? "Disable" : "Enable"}
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteMapping(m.id)}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                {m.memo ? <div className="mt-2 text-xs text-slate-500">{m.memo}</div> : null}
                              </td>
                            </tr>
                          ))}
                          {!erpMappings.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-600">No mappings.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: exports can map invoice lines to GL codes, cost centers, and tax codes.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "rules" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Auto-match rules" subtitle="Premium: reconciliation assistant rules." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Same vendor and currency is recommended</li>
                        <li>2) Date window controls how far back to match</li>
                        <li>3) Amount tolerance handles small differences</li>
                        <li>4) Confidence threshold prevents risky matches</li>
                      </ul>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => openRuleEdit()}>
                        <Plus className="h-4 w-4" /> New rule
                      </Button>
                      <Button variant="outline" onClick={runAutoMatch}>
                        <Sparkles className="h-4 w-4" /> Run auto-match
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          downloadJSON("auto-match-rules.json", rules);
                          addAudit({ at: Date.now(), actor: "You", action: "EXPORT", entityRef: "auto-match-rules.json", details: "Exported rules" });
                          toast({ title: "Exported", message: "Rules JSON downloaded.", kind: "success" });
                        }}
                      >
                        <Download className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </Section>

                  <Section title="Rule test" subtitle="Select a line and see top candidates." right={<Pill label="Premium" tone="info" />}>
                    {activeLine ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">{activeLine.invoiceNo}</div>
                        <div className="mt-1 text-xs text-slate-500">{activeLine.description}</div>
                        <div className="mt-2 text-xs text-slate-600">Top candidates:</div>
                        <div className="mt-2 space-y-2">
                          {candidateTxs.slice(0, 3).map((c) => (
                            <div key={c.tx.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{c.tx.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">{c.tx.vendor} • {c.tx.type}</div>
                                </div>
                                <Pill label={`${Math.round(c.score * 100)}%`} tone={c.score >= 0.9 ? "good" : c.score >= 0.8 ? "warn" : "neutral"} />
                              </div>
                            </div>
                          ))}
                          {!candidateTxs.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No candidates found.</div> : null}
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        Select an invoice line in Reconciliation.
                      </div>
                    )}
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Rules" subtitle="Tune behavior and thresholds." right={<Pill label={`${rules.filter((r) => r.enabled).length} enabled`} tone="neutral" />}>
                    <div className="space-y-2">
                      {rules.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                                <Pill label={r.enabled ? "On" : "Off"} tone={r.enabled ? "good" : "neutral"} />
                                <Pill label={`Min ${Math.round(r.minConfidence * 100)}%`} tone="info" />
                                <Pill label={`Window ${r.dateWindowDays}d`} tone="neutral" />
                                <Pill label={`Tol ${r.amountTolerancePct}%`} tone="neutral" />
                                <Pill label={r.allowPartialMatch ? "Partial OK" : "Full only"} tone={r.allowPartialMatch ? "info" : "neutral"} />
                              </div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill label={r.requireSameVendor ? "Same vendor" : "Vendor optional"} tone={r.requireSameVendor ? "good" : "neutral"} />
                                <Pill label={r.requireSameModule ? "Same module" : "Module optional"} tone={r.requireSameModule ? "good" : "neutral"} />
                                <Pill label={r.requireSameMarketplace ? "Same marketplace" : "Marketplace optional"} tone={r.requireSameMarketplace ? "good" : "neutral"} />
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openRuleEdit(r)}>
                                <Settings2 className="h-4 w-4" /> Edit
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setRules((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)))}>
                                {r.enabled ? "Disable" : "Enable"}
                              </Button>
                              <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteRule(r.id)}>
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!rules.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No rules.</div>
                      ) : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: you can create strict rules for sensitive vendors and looser rules for low risk recurring vendors.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "reports" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Audit-ready reports" subtitle="Premium reconciliation reports." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Matches</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-900">{reportSummary.matches}</div>
                          <div className="mt-1 text-xs text-slate-600">Total match records</div>
                        </div>
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                          <BadgeCheck className="h-5 w-5" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      <KpiMini label="Unmatched lines" value={`${reportSummary.unmatchedLines}`} tone={reportSummary.unmatchedLines ? "warn" : "good"} icon={<AlertTriangle className="h-4 w-4" />} />
                      <KpiMini label="Unmatched posted tx" value={`${reportSummary.unmatchedPostedTransactions}`} tone={reportSummary.unmatchedPostedTransactions ? "warn" : "good"} icon={<Banknote className="h-4 w-4" />} />
                      <KpiMini label="Open exceptions" value={`${reportSummary.openExceptions}`} tone={reportSummary.openExceptions ? "bad" : "good"} icon={<Shield className="h-4 w-4" />} />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={exportReconciliationReport}>
                        <Download className="h-4 w-4" /> Export JSON
                      </Button>
                      <Button variant="outline" onClick={() => setReportModalOpen(true)}>
                        <FileText className="h-4 w-4" /> Preview
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Reports include: matches, unmatched items, exceptions, rules, ERP mappings, and audit log.
                    </div>
                  </Section>

                  <Section title="Audit log" subtitle="Who changed what and when." right={<Pill label={`${audit.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {audit.slice(0, 10).map((a) => (
                        <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={a.action} tone="neutral" />
                                <Pill label={a.actor} tone="info" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{formatDateTime(a.at)} • {timeAgo(a.at)} • {a.entityRef}</div>
                              <div className="mt-2 text-xs text-slate-700">{a.details}</div>
                            </div>
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(a.id);
                                  toast({ title: "Copied", message: "Audit ID copied.", kind: "success" });
                                } catch {
                                  toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
                                }
                              }}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!audit.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No audit events.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Reconciliation overview" subtitle="Pivot summary over transactions." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <PivotTable rows={transactions} title="By vendor" dim="Vendor" />
                      <PivotTable rows={transactions} title="By module" dim="Service module" />
                      <PivotTable rows={transactions} title="By transaction type" dim="Transaction type" />
                      <PivotTable rows={transactions} title="By status" dim="Transaction status" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: pivot summaries support quicker reconciliation reviews and ERP mapping validation.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              Q Transactions and Reconciliation v2. Core: ledger, manual matching, reconciliation to invoice lines, exceptions queue. Premium: ERP mappings, auto-match rules, and audit-ready exports.
            </div>
          </footer>
        </div>
      </div>

      {/* Match modal */}
      <Modal
        open={matchModalOpen}
        title="Create match"
        subtitle="Match selected invoice line to selected transaction."
        onClose={() => setMatchModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setMatchModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  // split suggestion: match remaining transaction portion
                  if (!activeLine || !activeTx) return;
                  const suggested = Math.min(lineRemaining(activeLine.id), txRemaining(activeTx.id));
                  setMatchDraft((p) => ({ ...p, amount: Math.max(0, Math.round(suggested)) }));
                  toast({ title: "Suggested", message: "Suggested a safe match amount.", kind: "info" });
                }}
              >
                <Split className="h-4 w-4" /> Suggest
              </Button>
              <Button variant="primary" onClick={() => createMatch("Manual", 0.88)} disabled={!activeLine || !activeTx}>
                <Check className="h-4 w-4" /> Match
              </Button>
            </div>
          </div>
        }
      >
        {!activeLine || !activeTx ? (
          <div className="text-sm text-slate-600">Select a line and transaction first.</div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              <div><span className="font-semibold">Line</span>: {activeLine.invoiceNo} • {activeLine.id}</div>
              <div className="mt-1"><span className="font-semibold">Tx</span>: {activeTx.id} • {activeTx.type} • {activeTx.status}</div>
              <div className="mt-1"><span className="font-semibold">Line remaining</span>: {formatMoney(lineRemaining(activeLine.id), activeLine.currency)}</div>
              <div className="mt-1"><span className="font-semibold">Tx remaining</span>: {formatMoney(txRemaining(activeTx.id), activeTx.currency)}</div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <NumberField
                label="Match amount"
                value={matchDraft.amount}
                onChange={(v) => setMatchDraft((p) => ({ ...p, amount: Math.max(0, v) }))}
                hint={`Currency ${activeLine.currency}`}
              />
              <Field
                label="Note"
                value={matchDraft.note}
                onChange={(v) => setMatchDraft((p) => ({ ...p, note: v }))}
                placeholder="Optional"
                hint="Saved in audit"
              />
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Premium: auto-match creates matches with rule ID and confidence score. Manual matches are also audit logged.
            </div>
          </div>
        )}
      </Modal>

      {/* Rule modal */}
      <Modal
        open={ruleModalOpen}
        title={ruleDraft?.id ? "Edit rule" : "New rule"}
        subtitle="Reconciliation assistant rule settings."
        onClose={() => setRuleModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRuleModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {ruleDraft?.id ? (
                <Button variant="danger" onClick={() => ruleDraft && deleteRule(ruleDraft.id)}>
                  <X className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveRule}>
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        {!ruleDraft ? null : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Name" value={ruleDraft.name} onChange={(v) => setRuleDraft((p) => (p ? { ...p, name: v } : p))} />
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Enabled</div>
                  <div className="mt-1 text-xs text-slate-600">If off, auto-match skips this rule.</div>
                </div>
                <button
                  type="button"
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition",
                    ruleDraft.enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                  )}
                  onClick={() => setRuleDraft((p) => (p ? { ...p, enabled: !p.enabled } : p))}
                  aria-label="Toggle enabled"
                >
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", ruleDraft.enabled ? "left-[22px]" : "left-1")} />
                </button>
              </div>
            </div>

            <NumberField label="Date window (days)" value={ruleDraft.dateWindowDays} onChange={(v) => setRuleDraft((p) => (p ? { ...p, dateWindowDays: Math.max(0, v) } : p))} hint="Max days difference" />
            <NumberField label="Amount tolerance (%)" value={ruleDraft.amountTolerancePct} onChange={(v) => setRuleDraft((p) => (p ? { ...p, amountTolerancePct: clamp(v, 0, 100) } : p))} hint="Percent diff" />
            <NumberField
              label="Min confidence (0-100)"
              value={Math.round(ruleDraft.minConfidence * 100)}
              onChange={(v) => setRuleDraft((p) => (p ? { ...p, minConfidence: clamp(v, 0, 100) / 100 } : p))}
              hint="Auto-match threshold"
            />
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Constraints</div>
              <div className="mt-3 space-y-2">
                <ToggleRow label="Require same vendor" enabled={ruleDraft.requireSameVendor} onChange={(v) => setRuleDraft((p) => (p ? { ...p, requireSameVendor: v } : p))} />
                <ToggleRow label="Require same module" enabled={ruleDraft.requireSameModule} onChange={(v) => setRuleDraft((p) => (p ? { ...p, requireSameModule: v } : p))} />
                <ToggleRow label="Require same marketplace" enabled={ruleDraft.requireSameMarketplace} onChange={(v) => setRuleDraft((p) => (p ? { ...p, requireSameMarketplace: v } : p))} />
                <ToggleRow label="Allow partial match" enabled={ruleDraft.allowPartialMatch} onChange={(v) => setRuleDraft((p) => (p ? { ...p, allowPartialMatch: v } : p))} />
              </div>
            </div>

            <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Tip: strict rules should be placed above looser ones. This demo picks the best scoring rule.
            </div>
          </div>
        )}
      </Modal>

      {/* Mapping modal */}
      <Modal
        open={mappingModalOpen}
        title={mappingDraft?.id ? "Edit ERP mapping" : "New ERP mapping"}
        subtitle="Map to GL codes, cost centers, and tax codes for exports."
        onClose={() => setMappingModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setMappingModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {mappingDraft?.id ? (
                <Button variant="danger" onClick={() => mappingDraft && deleteMapping(mappingDraft.id)}>
                  <X className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveMapping}>
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        {!mappingDraft ? null : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Select
              label="Scope"
              value={mappingDraft.scope}
              onChange={(v) => setMappingDraft((p) => (p ? { ...p, scope: v as any } : p))}
              options={[{ value: "Default", label: "Default" }, { value: "Module", label: "Module" }, { value: "Marketplace", label: "Marketplace" }, { value: "Vendor", label: "Vendor" }]}
            />
            <Field
              label="Key"
              value={mappingDraft.key}
              onChange={(v) => setMappingDraft((p) => (p ? { ...p, key: v } : p))}
              placeholder={mappingDraft.scope === "Default" ? "*" : "Rides & Logistics"}
              hint={mappingDraft.scope === "Default" ? "Use *" : "Module, marketplace, or vendor"}
            />
            <Field label="GL code" value={mappingDraft.glCode} onChange={(v) => setMappingDraft((p) => (p ? { ...p, glCode: v } : p))} placeholder="4000" />
            <Field label="Cost center" value={mappingDraft.costCenter} onChange={(v) => setMappingDraft((p) => (p ? { ...p, costCenter: v } : p))} placeholder="OPS-001" />
            <Field label="Tax code" value={mappingDraft.taxCode} onChange={(v) => setMappingDraft((p) => (p ? { ...p, taxCode: v } : p))} placeholder="VAT18" />
            <div className="md:col-span-2">
              <TextArea label="Memo" value={mappingDraft.memo} onChange={(v) => setMappingDraft((p) => (p ? { ...p, memo: v } : p))} placeholder="Optional memo" rows={3} />
            </div>
            <div className="md:col-span-2">
              <ToggleRow label="Enabled" enabled={mappingDraft.enabled} onChange={(v) => setMappingDraft((p) => (p ? { ...p, enabled: v } : p))} />
            </div>
            <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
              Resolution order: Vendor, Marketplace, Module, Default.
            </div>
          </div>
        )}
      </Modal>

      {/* Report preview */}
      <Modal
        open={reportModalOpen}
        title="Reconciliation report preview"
        subtitle="Audit-ready summary of matching and exceptions."
        onClose={() => setReportModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Close</Button>
            <Button variant="primary" onClick={exportReconciliationReport}>
              <Download className="h-4 w-4" /> Export JSON
            </Button>
          </div>
        }
      >
        <ReportPreview payload={buildReportPayload()} />
      </Modal>
    </div>
  );

  function KpiMini({
    label,
    value,
    tone,
    icon,
  }: {
    label: string;
    value: string;
    tone: "neutral" | "good" | "warn" | "bad" | "info";
    icon: React.ReactNode;
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
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-slate-500">{label}</div>
            <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
          </div>
          <div className={cn("grid h-10 w-10 place-items-center rounded-2xl", bg)}>{icon}</div>
        </div>
      </div>
    );
  }

  function ToggleRow({ label, enabled, onChange }: { label: string; enabled: boolean; onChange: (v: boolean) => void }) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <button
          type="button"
          className={cn(
            "relative h-7 w-12 rounded-full border transition",
            enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
          )}
          onClick={() => onChange(!enabled)}
          aria-label={label}
        >
          <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
        </button>
      </div>
    );
  }

  function PivotSummary({ rows, currency }: { rows: Transaction[]; currency: Currency }) {
    const [dim, setDim] = useState<PivotRowDim>("Vendor");
    const [metric, setMetric] = useState<PivotMetric>("Amount");

    const items = useMemo(() => buildPivot(rows, dim, metric, "amount"), [rows, dim, metric]);

    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Dimension"
            value={dim}
            onChange={(v) => setDim(v as PivotRowDim)}
            options={[
              "Vendor",
              "Service module",
              "Marketplace",
              "Group",
              "Cost center",
              "Tax code",
              "Transaction type",
              "Transaction status",
            ].map((x) => ({ value: x, label: x }))}
          />
          <Select
            label="Metric"
            value={metric}
            onChange={(v) => setMetric(v as PivotMetric)}
            options={[{ value: "Amount", label: "Amount" }, { value: "Count", label: "Count" }]}
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">{dim}</th>
                <th className="px-4 py-3 font-semibold">{metric}</th>
              </tr>
            </thead>
            <tbody>
              {items.slice(0, 10).map((x) => (
                <tr key={x.key} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{x.key}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{metric === "Amount" ? formatMoney(x.value, currency) : x.value}</td>
                </tr>
              ))}
              {!items.length ? (
                <tr>
                  <td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-600">No rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  function PivotTable({ rows, title, dim }: { rows: Transaction[]; title: string; dim: PivotRowDim }) {
    const data = useMemo(() => buildPivot(rows, dim, "Amount", "amount"), [rows, dim]);
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-xs text-slate-500">Top 6</div>
          </div>
          <Pill label="Premium" tone="info" />
        </div>
        <div className="mt-3 space-y-2">
          {data.slice(0, 6).map((d) => (
            <div key={d.key} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
              <div className="truncate text-sm font-semibold text-slate-800">{d.key}</div>
              <div className="text-sm font-semibold text-slate-900">{formatMoney(d.value, "UGX")}</div>
            </div>
          ))}
          {!data.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No data.</div> : null}
        </div>
      </div>
    );
  }

  function resolveMapping(tx: Transaction | null, mappings: ErpMapping[]) {
    if (!tx) return null;
    const enabled = mappings.filter((m) => m.enabled);
    const vendor = enabled.find((m) => m.scope === "Vendor" && m.key === tx.vendor);
    if (vendor) return vendor;
    const mkt = enabled.find((m) => m.scope === "Marketplace" && m.key === tx.marketplace);
    if (mkt) return mkt;
    const mod = enabled.find((m) => m.scope === "Module" && m.key === tx.serviceModule);
    if (mod) return mod;
    const def = enabled.find((m) => m.scope === "Default" && m.key === "*") || null;
    return def;
  }

  function MappingPreview({ tx, mappings, onPickTx }: { tx: Transaction | null; mappings: ErpMapping[]; onPickTx: () => void }) {
    if (!tx)
      return (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
          Select a transaction to preview ERP mapping.
          <div className="mt-3">
            <Button variant="outline" onClick={onPickTx}>
              <ChevronRight className="h-4 w-4" /> Open ledger
            </Button>
          </div>
        </div>
      );

    const m = resolveMapping(tx, mappings);
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{tx.id}</div>
            <div className="mt-1 text-xs text-slate-500">{tx.vendor} • {tx.serviceModule}{tx.marketplace !== "-" ? ` • ${tx.marketplace}` : ""}</div>
            <div className="mt-1 text-xs text-slate-500">Amount: {formatMoney(tx.amount, tx.currency)} • Status {tx.status}</div>
          </div>
          <Pill label="Preview" tone="info" />
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
          <div className="font-semibold text-slate-900">Resolved mapping</div>
          {m ? (
            <>
              <div className="mt-2">Scope: <span className="font-semibold">{m.scope}</span> • Key: <span className="font-semibold">{m.key}</span></div>
              <div className="mt-1">GL: <span className="font-semibold">{m.glCode}</span> • Cost center: <span className="font-semibold">{m.costCenter}</span> • Tax: <span className="font-semibold">{m.taxCode}</span></div>
              {m.memo ? <div className="mt-2">Memo: {m.memo}</div> : null}
            </>
          ) : (
            <div className="mt-2">No enabled mapping. Create a default mapping.</div>
          )}
        </div>
      </div>
    );
  }

  function ReportPreview({ payload }: { payload: any }) {
    return (
      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Summary</div>
          <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
            <MiniStat label="Invoice lines" value={String(payload.summary.invoiceLines)} />
            <MiniStat label="Transactions" value={String(payload.summary.transactions)} />
            <MiniStat label="Matches" value={String(payload.summary.matches)} />
            <MiniStat label="Unmatched lines" value={String(payload.summary.unmatchedLines)} />
            <MiniStat label="Unmatched posted tx" value={String(payload.summary.unmatchedPostedTransactions)} />
            <MiniStat label="Open exceptions" value={String(payload.summary.openExceptions)} />
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">Unmatched lines</div>
              <div className="mt-1 text-xs text-slate-500">Top 8</div>
            </div>
            <Pill label="Audit" tone="info" />
          </div>
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Line</th>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Vendor</th>
                  <th className="px-4 py-3 font-semibold">Amount</th>
                  <th className="px-4 py-3 font-semibold">Remaining</th>
                </tr>
              </thead>
              <tbody>
                {(payload.unmatchedLines || []).slice(0, 8).map((l: any) => (
                  <tr key={l.lineId} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-semibold text-slate-900">{l.lineId}</td>
                    <td className="px-4 py-3 text-slate-700">{l.invoiceNo}</td>
                    <td className="px-4 py-3 text-slate-700">{l.vendor}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(l.amount, "UGX")}</td>
                    <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(l.remaining, "UGX")}</td>
                  </tr>
                ))}
                {!payload.unmatchedLines?.length ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">None</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <div className="text-sm font-semibold text-slate-900">Audit log</div>
          <div className="mt-3 space-y-2">
            {(payload.audit || []).slice(0, 8).map((a: any) => (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Pill label={a.action} tone="neutral" />
                      <Pill label={a.actor} tone="info" />
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{formatDateTime(new Date(a.at).getTime())} • {a.entityRef}</div>
                    <div className="mt-2 text-xs text-slate-700">{a.details}</div>
                  </div>
                  <Pill label="Audit" tone="info" />
                </div>
              </div>
            ))}
            {!payload.audit?.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No audit entries.</div> : null}
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
          This preview is a subset. Export JSON to get the full report.
        </div>
      </div>
    );
  }

  function MiniStat({ label, value }: { label: string; value: string }) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="text-xs font-semibold text-slate-500">{label}</div>
        <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      </div>
    );
  }
}
