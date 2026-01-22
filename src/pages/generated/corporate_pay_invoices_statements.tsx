import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Info,
  Layers,
  Mail,
  MessageSquare,
  Paperclip,
  Pencil,
  Plus,
  Save,
  Search,
  Shield,
  Sparkles,
  Trash2,
  X,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type DisputeStatus = "Open" | "In review" | "Resolved" | "Rejected";

type CreditNoteStatus = "Pending" | "Approved" | "Rejected";

type Entity = {
  id: string;
  name: string;
  legalName: string;
  country: string;
  city: string;
  address: string;
  currency: "UGX" | "USD" | "EUR" | "CNY";
  taxId: string;
  vatNo: string;
  vatEnabled: boolean;
  vatRatePct: number;
  billingEmail: string;
};

type InvoiceGroup = {
  id: string;
  name: string;
  entityId: string;
  apTo: string;
  apCc: string;
  costCode: string;
  templateName: string;
  prefix: string;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  entityId: string;
  invoiceGroupId: string;
  issueDate: number;
  dueDate: number;
  status: InvoiceStatus;
  currency: Entity["currency"];
  subtotal: number;
  vat: number;
  total: number;
  paidAmount: number;
  balance: number;
  createdAt: number;
  sentAt?: number;
  paidAt?: number;
  notes: string;
};

type LineItem = {
  id: string;
  invoiceId: string;
  description: string;
  serviceModule: string;
  marketplace?: string;
  vendor: string;
  group: string;
  costCenter: string;
  projectTag: string;
  amount: number;
};

type RawEvent = {
  id: string;
  lineItemId: string;
  ts: number;
  kind: "Trip" | "Order" | "Charging" | "Service";
  reference: string;
  serviceModule: string;
  marketplace?: string;
  vendor: string;
  group: string;
  costCenter: string;
  projectTag: string;
  amount: number;
  details: string;
};

type CreditNote = {
  id: string;
  invoiceId: string;
  createdAt: number;
  createdBy: string;
  amount: number;
  reason: string;
  status: CreditNoteStatus;
  approvalReason?: string;
  decidedBy?: string;
  decidedAt?: number;
};

type Evidence = {
  id: string;
  name: string;
  note: string;
  uploadedBy: string;
  uploadedAt: number;
};

type DisputeTicket = {
  id: string;
  invoiceId: string;
  createdAt: number;
  createdBy: string;
  status: DisputeStatus;
  category: "Wrong amount" | "Duplicate" | "Missing service" | "VAT/tax" | "Other";
  description: string;
  messages: Array<{ at: number; by: string; message: string }>;
  evidence: Evidence[];
};

type ExplorerRow = LineItem & {
  invoiceNo: string;
  invoiceStatus: InvoiceStatus;
  entityId: string;
  invoiceGroupId: string;
  issueDate: number;
  dueDate: number;
  currency: Entity["currency"];
};

type PivotDim =
  | "Service module"
  | "Marketplace"
  | "Vendor"
  | "Group"
  | "Cost center"
  | "Project tag"
  | "Invoice status"
  | "Invoice group"
  | "Entity";

type PivotMetric = "Amount" | "Count";

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

function formatCompact(n: number) {
  const v = Math.round(n);
  return v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function formatMoney(n: number, currency: string) {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${currency} ${formatCompact(v)}`;
  }
}

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
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

function pct(used: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((used / total) * 100);
}

function statusTone(s: InvoiceStatus | DisputeStatus | CreditNoteStatus) {
  if (s === "Paid" || s === "Approved" || s === "Resolved") return "good" as const;
  if (s === "Overdue" || s === "Rejected") return "bad" as const;
  if (s === "Draft" || s === "Pending" || s === "In review") return "warn" as const;
  return "neutral" as const;
}

function riskToneByOverdue(dueDate: number, status: InvoiceStatus) {
  if (status === "Overdue") return "bad" as const;
  if (status === "Sent") {
    const mins = (dueDate - Date.now()) / 60000;
    if (mins <= 0) return "bad" as const;
    if (mins <= 60 * 48) return "warn" as const;
    return "info" as const;
  }
  return "neutral" as const;
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
  onClick?: () => void;
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

function Section({ title, subtitle, right, children }: { title: string; subtitle?: string; right?: React.ReactNode; children: React.ReactNode }) {
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
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0, up: false });

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = actions.length * 40 + 20; // approx
      const spaceBelow = window.innerHeight - rect.bottom;
      const up = spaceBelow < menuHeight && rect.top > menuHeight;

      setPos({
        top: up ? rect.top - 8 : rect.bottom + 8,
        left: rect.right,
        up,
      });

      const close = () => setIsOpen(false);
      window.addEventListener("scroll", close, { capture: true });
      window.addEventListener("resize", close);
      return () => {
        window.removeEventListener("scroll", close, { capture: true });
        window.removeEventListener("resize", close);
      };
    }
  }, [isOpen, actions.length]);

  if (!actions.length) return null;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      {isOpen &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[9998]" onClick={() => setIsOpen(false)} />
            <div
              className="fixed z-[9999] w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl ring-1 ring-slate-200"
              style={{
                top: pos.up ? "auto" : pos.top,
                bottom: pos.up ? window.innerHeight - pos.top : "auto",
                left: pos.left - 192, // align right edge to button right
              }}
            >
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  disabled={action.disabled}
                  className={cn(
                    "flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50",
                    action.variant === "danger"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700"
                  )}
                >
                  {action.icon && <span className="mr-2 h-4 w-4">{action.icon}</span>}
                  {action.label}
                </button>
              ))}
            </div>
          </>,
          document.body
        )}
    </>
  );
}

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "960px",
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
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.985 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-0 top-[7vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="max-h-[72vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
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
  actions,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
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
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[10vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[640px]"
            )}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 text-xs text-slate-600">{subtitle}</div> : null}
              </div>
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="h-full min-h-0 overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
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

function downloadText(filename: string, content: string, mime = "text/plain") {
  const blob = new Blob([content], { type: mime });
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
  const body = rows
    .map((r) => columns.map((c) => esc(r[c.key])).join(","))
    .join("\n");
  return `${head}\n${body}`;
}

function groupSum<T>(items: T[], keyFn: (x: T) => string, valFn: (x: T) => number) {
  const m: Record<string, number> = {};
  for (const it of items) {
    const k = keyFn(it);
    m[k] = (m[k] || 0) + valFn(it);
  }
  const out = Object.keys(m)
    .map((k) => ({ key: k, value: m[k] }))
    .sort((a, b) => b.value - a.value);
  return out;
}

function buildPivot(rows: ExplorerRow[], rowDim: PivotDim, colDim: PivotDim | "None", metric: PivotMetric) {
  const get = (r: ExplorerRow, dim: PivotDim) => {
    if (dim === "Service module") return r.serviceModule || "-";
    if (dim === "Marketplace") return r.marketplace || "-";
    if (dim === "Vendor") return r.vendor || "-";
    if (dim === "Group") return r.group || "-";
    if (dim === "Cost center") return r.costCenter || "-";
    if (dim === "Project tag") return r.projectTag || "-";
    if (dim === "Invoice status") return r.invoiceStatus;
    if (dim === "Invoice group") return r.invoiceGroupId;
    if (dim === "Entity") return r.entityId;
    return "-";
  };

  const rowKeys = Array.from(new Set(rows.map((r) => get(r, rowDim)))).sort();
  const colKeys = colDim === "None" ? ["All"] : Array.from(new Set(rows.map((r) => get(r, colDim)))).sort();

  const matrix: Record<string, Record<string, number>> = {};
  const rowTotals: Record<string, number> = {};
  const colTotals: Record<string, number> = {};
  let grand = 0;

  for (const r of rows) {
    const rk = get(r, rowDim);
    const ck = colDim === "None" ? "All" : get(r, colDim);
    const v = metric === "Count" ? 1 : r.amount;

    matrix[rk] = matrix[rk] || {};
    matrix[rk][ck] = (matrix[rk][ck] || 0) + v;
    rowTotals[rk] = (rowTotals[rk] || 0) + v;
    colTotals[ck] = (colTotals[ck] || 0) + v;
    grand += v;
  }

  return { rowKeys, colKeys, matrix, rowTotals, colTotals, grand };
}

export default function CorporatePayInvoicesStatementsV2() {
  // Sample master data
  const [entities] = useState<Entity[]>(() => [
    {
      id: "ENT-UG",
      name: "Uganda HQ",
      legalName: "Acme Group Limited (Uganda)",
      country: "Uganda",
      city: "Kampala",
      address: "Plot 12, Nkrumah Road, Suite 5",
      currency: "UGX",
      taxId: "TIN-123-456-789",
      vatNo: "VAT-UG-00991",
      vatEnabled: true,
      vatRatePct: 18,
      billingEmail: "ap-ug@acme.com",
    },
    {
      id: "ENT-CN",
      name: "China Branch",
      legalName: "Acme Group Co., Ltd. (China)",
      country: "China",
      city: "Wuxi",
      address: "Room 265, No. 3 Gaolang East Road, Xinwu District",
      currency: "CNY",
      taxId: "CN-TAX-0001",
      vatNo: "CN-VAT-0001",
      vatEnabled: true,
      vatRatePct: 13,
      billingEmail: "ap-cn@acme.com",
    },
  ]);

  const [invoiceGroups] = useState<InvoiceGroup[]>(() => [
    {
      id: "IG-MAIN-UG",
      name: "Main corporate",
      entityId: "ENT-UG",
      apTo: "ap@acme.com",
      apCc: "finance@acme.com",
      costCode: "ACME-MAIN",
      templateName: "Default modern",
      prefix: "ACME",
    },
    {
      id: "IG-SALES-TRAVEL",
      name: "Sales travel",
      entityId: "ENT-UG",
      apTo: "sales-ap@acme.com",
      apCc: "finance@acme.com",
      costCode: "ACME-SALES",
      templateName: "Finance classic",
      prefix: "ACME-SALES",
    },
    {
      id: "IG-CN-PROC",
      name: "China procurement",
      entityId: "ENT-CN",
      apTo: "ap-cn@acme.com",
      apCc: "finance@acme.com",
      costCode: "CN-PROC",
      templateName: "Default modern",
      prefix: "ACME-CN",
    },
  ]);

  const entityById = useMemo(() => Object.fromEntries(entities.map((e) => [e.id, e])) as Record<string, Entity>, [entities]);
  const groupById = useMemo(() => Object.fromEntries(invoiceGroups.map((g) => [g.id, g])) as Record<string, InvoiceGroup>, [invoiceGroups]);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Sample invoices
  const baseNow = Date.now();
  const day = 24 * 60 * 60 * 1000;

  const [invoices, setInvoices] = useState<Invoice[]>(() => [
    {
      id: "INV-0001",
      invoiceNo: "ACME-202601-1042",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: baseNow - 7 * day,
      dueDate: baseNow + 1 * day,
      status: "Sent",
      currency: "UGX",
      subtotal: 14000000,
      vat: 2520000,
      total: 16520000,
      paidAmount: 0,
      balance: 16520000,
      createdAt: baseNow - 8 * day,
      sentAt: baseNow - 7 * day,
      notes: "Weekly corporate spend",
    },
    {
      id: "INV-0002",
      invoiceNo: "ACME-SALES-202512-0088",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-SALES-TRAVEL",
      issueDate: baseNow - 38 * day,
      dueDate: baseNow - 24 * day,
      status: "Overdue",
      currency: "UGX",
      subtotal: 5200000,
      vat: 936000,
      total: 6136000,
      paidAmount: 0,
      balance: 6136000,
      createdAt: baseNow - 39 * day,
      sentAt: baseNow - 38 * day,
      notes: "Monthly travel rides",
    },
    {
      id: "INV-0003",
      invoiceNo: "ACME-202512-1038",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: baseNow - 22 * day,
      dueDate: baseNow - 15 * day,
      status: "Paid",
      currency: "UGX",
      subtotal: 12200000,
      vat: 2196000,
      total: 14396000,
      paidAmount: 14396000,
      balance: 0,
      createdAt: baseNow - 23 * day,
      sentAt: baseNow - 22 * day,
      paidAt: baseNow - 16 * day,
      notes: "Weekly corporate spend",
    },
    {
      id: "INV-0004",
      invoiceNo: "ACME-CN-202512-0221",
      entityId: "ENT-CN",
      invoiceGroupId: "IG-CN-PROC",
      issueDate: baseNow - 14 * day,
      dueDate: baseNow - 7 * day,
      status: "Paid",
      currency: "CNY",
      subtotal: 68000,
      vat: 8840,
      total: 76840,
      paidAmount: 76840,
      balance: 0,
      createdAt: baseNow - 15 * day,
      sentAt: baseNow - 14 * day,
      paidAt: baseNow - 7 * day,
      notes: "Procurement stream",
    },
    {
      id: "INV-0005",
      invoiceNo: "ACME-202601-1043",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: baseNow - 1 * day,
      dueDate: baseNow + 6 * day,
      status: "Draft",
      currency: "UGX",
      subtotal: 9100000,
      vat: 1638000,
      total: 10748000,
      paidAmount: 0,
      balance: 10748000,
      createdAt: baseNow - 1 * day,
      notes: "Draft awaiting review",
    },
  ]);

  // Sample line items
  const [lineItems, setLineItems] = useState<LineItem[]>(() => [
    // INV-0001 (UG main)
    { id: "LI-1001", invoiceId: "INV-0001", description: "Corporate rides", serviceModule: "Rides & Logistics", marketplace: "", vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute", amount: 8200000 },
    { id: "LI-1002", invoiceId: "INV-0001", description: "EV charging credits", serviceModule: "EVs & Charging", marketplace: "", vendor: "EVzone Charging", group: "Operations", costCenter: "OPS-001", projectTag: "Fleet charging", amount: 4100000 },
    { id: "LI-1003", invoiceId: "INV-0001", description: "EVmart purchases", serviceModule: "E-Commerce", marketplace: "EVmart", vendor: "Kampala Office Mart", group: "Procurement", costCenter: "PROC-001", projectTag: "Office supplies", amount: 2400000 },
    { id: "LI-1004", invoiceId: "INV-0001", description: "MyLiveDealz deals", serviceModule: "E-Commerce", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", group: "Procurement", costCenter: "PROC-001", projectTag: "High value", amount: 3100000 },

    // INV-0002 (Sales travel)
    { id: "LI-2001", invoiceId: "INV-0002", description: "Sales travel rides", serviceModule: "Rides & Logistics", marketplace: "", vendor: "EVzone Rides", group: "Sales", costCenter: "SALES-TRAVEL", projectTag: "Client meetings", amount: 5200000 },

    // INV-0003 (Paid)
    { id: "LI-3001", invoiceId: "INV-0003", description: "Corporate rides", serviceModule: "Rides & Logistics", marketplace: "", vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute", amount: 7100000 },
    { id: "LI-3002", invoiceId: "INV-0003", description: "ServiceMart services", serviceModule: "E-Commerce", marketplace: "ServiceMart", vendor: "ServicePro", group: "Admin", costCenter: "ADMIN-CORE", projectTag: "Facilities", amount: 2300000 },
    { id: "LI-3003", invoiceId: "INV-0003", description: "Charging credits", serviceModule: "EVs & Charging", marketplace: "", vendor: "EVzone Charging", group: "Operations", costCenter: "OPS-001", projectTag: "Fleet charging", amount: 2800000 },

    // INV-0004 (China)
    { id: "LI-4001", invoiceId: "INV-0004", description: "GadgetMart procurement", serviceModule: "E-Commerce", marketplace: "GadgetMart", vendor: "Shenzhen Tech", group: "Procurement", costCenter: "PROC-001", projectTag: "Devices", amount: 60000 },
    { id: "LI-4002", invoiceId: "INV-0004", description: "ExpressMart logistics", serviceModule: "E-Commerce", marketplace: "ExpressMart", vendor: "Express CN", group: "Procurement", costCenter: "PROC-001", projectTag: "Shipping", amount: 8000 },

    // INV-0005 (Draft)
    { id: "LI-5001", invoiceId: "INV-0005", description: "Corporate rides", serviceModule: "Rides & Logistics", marketplace: "", vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute", amount: 4800000 },
    { id: "LI-5002", invoiceId: "INV-0005", description: "MyLiveDealz deals", serviceModule: "E-Commerce", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", group: "Procurement", costCenter: "PROC-001", projectTag: "High value", amount: 2300000 },
    { id: "LI-5003", invoiceId: "INV-0005", description: "Facilities services", serviceModule: "E-Commerce", marketplace: "ServiceMart", vendor: "ServicePro", group: "Admin", costCenter: "ADMIN-CORE", projectTag: "Facilities", amount: 2000000 },
  ]);

  // Sample raw events
  const [rawEvents, setRawEvents] = useState<RawEvent[]>(() => {
    const mk = (lineItemId: string, kind: RawEvent["kind"], reference: string, amount: number, desc: string, extra?: Partial<RawEvent>) => ({
      id: uid("EVT"),
      lineItemId,
      ts: baseNow - Math.round(Math.random() * 10) * day,
      kind,
      reference,
      serviceModule: extra?.serviceModule || "Rides & Logistics",
      marketplace: extra?.marketplace,
      vendor: extra?.vendor || "EVzone",
      group: extra?.group || "Operations",
      costCenter: extra?.costCenter || "OPS-001",
      projectTag: extra?.projectTag || "General",
      amount,
      details: desc,
      ...extra,
    });

    const out: RawEvent[] = [];
    // LI-1001 rides
    out.push(mk("LI-1001", "Trip", "TRP-84001", 165000, "Airport pickup", { vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute" }));
    out.push(mk("LI-1001", "Trip", "TRP-84002", 98000, "City commute", { vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute" }));
    out.push(mk("LI-1001", "Trip", "TRP-84003", 120000, "Client meeting", { vendor: "EVzone Rides", group: "Operations", costCenter: "OPS-001", projectTag: "Office commute" }));

    // LI-1004 MyLiveDealz
    out.push(mk("LI-1004", "Order", "ORD-MLD-4401", 900000, "Deal order", { serviceModule: "E-Commerce", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", group: "Procurement", costCenter: "PROC-001", projectTag: "High value" }));
    out.push(mk("LI-1004", "Order", "ORD-MLD-4402", 1100000, "Deal order", { serviceModule: "E-Commerce", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", group: "Procurement", costCenter: "PROC-001", projectTag: "High value" }));

    // LI-2001 sales travel rides
    out.push(mk("LI-2001", "Trip", "TRP-99001", 85000, "Client site", { vendor: "EVzone Rides", group: "Sales", costCenter: "SALES-TRAVEL", projectTag: "Client meetings" }));
    out.push(mk("LI-2001", "Trip", "TRP-99002", 132000, "Airport drop", { vendor: "EVzone Rides", group: "Sales", costCenter: "SALES-TRAVEL", projectTag: "Client meetings" }));

    // LI-4001 gadget procurement
    out.push(mk("LI-4001", "Order", "ORD-GAD-1001", 24000, "Device purchase", { serviceModule: "E-Commerce", marketplace: "GadgetMart", vendor: "Shenzhen Tech", group: "Procurement", costCenter: "PROC-001", projectTag: "Devices" }));
    out.push(mk("LI-4001", "Order", "ORD-GAD-1002", 36000, "Device purchase", { serviceModule: "E-Commerce", marketplace: "GadgetMart", vendor: "Shenzhen Tech", group: "Procurement", costCenter: "PROC-001", projectTag: "Devices" }));

    return out;
  });

  // Credit notes
  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => [
    {
      id: "CN-001",
      invoiceId: "INV-0001",
      createdAt: baseNow - 2 * day,
      createdBy: "Finance Desk",
      amount: 200000,
      reason: "Service cancellation credit",
      status: "Pending",
    },
    {
      id: "CN-002",
      invoiceId: "INV-0002",
      createdAt: baseNow - 12 * day,
      createdBy: "Finance Desk",
      amount: 150000,
      reason: "Duplicate trip adjustment",
      status: "Approved",
      approvalReason: "Approved for accuracy",
      decidedBy: "Org Admin",
      decidedAt: baseNow - 11 * day,
    },
  ]);

  // Disputes
  const [disputes, setDisputes] = useState<DisputeTicket[]>(() => [
    {
      id: "DSP-010",
      invoiceId: "INV-0001",
      createdAt: baseNow - 18 * 60 * 60 * 1000,
      createdBy: "Procurement Desk",
      status: "In review",
      category: "Wrong amount",
      description: "MyLiveDealz line seems higher than expected. Please reconcile raw events.",
      messages: [
        { at: baseNow - 18 * 60 * 60 * 1000, by: "Procurement Desk", message: "Please verify ORD-MLD counts." },
        { at: baseNow - 16 * 60 * 60 * 1000, by: "Finance Desk", message: "Reviewing events and vendor confirmations." },
      ],
      evidence: [
        { id: "EV-01", name: "Vendor quote.pdf", note: "Initial quote", uploadedBy: "Procurement Desk", uploadedAt: baseNow - 18 * 60 * 60 * 1000 },
      ],
    },
  ]);

  const [tab, setTab] = useState<"invoices" | "explorer" | "statements" | "creditNotes" | "disputes">("invoices");

  // Filters
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InvoiceStatus>("All");
  const [entityFilter, setEntityFilter] = useState<"All" | string>("All");
  const [groupFilter, setGroupFilter] = useState<"All" | string>("All");

  // Selection
  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  const [explainOpen, setExplainOpen] = useState(false);
  const [explainLineId, setExplainLineId] = useState<string | null>(null);

  const [creditModalOpen, setCreditModalOpen] = useState(false);
  const [creditDraft, setCreditDraft] = useState<{ invoiceId: string; amount: number; reason: string; attachmentNote: string }>({
    invoiceId: "INV-0001",
    amount: 100000,
    reason: "",
    attachmentNote: "",
  });

  const [creditDecisionOpen, setCreditDecisionOpen] = useState(false);
  const [creditDecisionId, setCreditDecisionId] = useState<string | null>(null);
  const [creditDecisionWhy, setCreditDecisionWhy] = useState("");
  const [creditDecisionAck, setCreditDecisionAck] = useState(false);

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [disputeDraft, setDisputeDraft] = useState<{ invoiceId: string; category: DisputeTicket["category"]; description: string; evidenceName: string; evidenceNote: string }>({
    invoiceId: "INV-0001",
    category: "Wrong amount",
    description: "",
    evidenceName: "",
    evidenceNote: "",
  });

  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [ticketMsg, setTicketMsg] = useState("");
  const [ticketEvidenceName, setTicketEvidenceName] = useState("");
  const [ticketEvidenceNote, setTicketEvidenceNote] = useState("");

  // Explorer
  const [pivotRowDim, setPivotRowDim] = useState<PivotDim>("Service module");
  const [pivotColDim, setPivotColDim] = useState<PivotDim | "None">("Invoice status");
  const [pivotMetric, setPivotMetric] = useState<PivotMetric>("Amount");
  const [pivotCellOpen, setPivotCellOpen] = useState(false);
  const [pivotCellFilter, setPivotCellFilter] = useState<{ rowKey: string; colKey: string } | null>(null);

  // Helpers
  const findInvoice = (id: string) => invoices.find((x) => x.id === id) || null;

  const derivedInvoices = useMemo(() => {
    // Ensure overdue status is consistent
    return invoices.map((inv) => {
      const isOverdue = inv.balance > 0 && inv.status !== "Draft" && Date.now() > inv.dueDate;
      if (isOverdue && inv.status !== "Overdue") return { ...inv, status: "Overdue" as const };
      return inv;
    });
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    const query = q.trim().toLowerCase();
    return derivedInvoices
      .filter((i) => (statusFilter === "All" ? true : i.status === statusFilter))
      .filter((i) => (entityFilter === "All" ? true : i.entityId === entityFilter))
      .filter((i) => (groupFilter === "All" ? true : i.invoiceGroupId === groupFilter))
      .filter((i) => {
        if (!query) return true;
        const e = entityById[i.entityId];
        const g = groupById[i.invoiceGroupId];
        const blob = `${i.invoiceNo} ${i.id} ${i.status} ${e?.name || ""} ${g?.name || ""} ${g?.costCode || ""}`.toLowerCase();
        return blob.includes(query);
      })
      .sort((a, b) => b.issueDate - a.issueDate);
  }, [derivedInvoices, q, statusFilter, entityFilter, groupFilter, entityById, groupById]);

  const invoiceOpenDisputeMap = useMemo(() => {
    const m: Record<string, number> = {};
    for (const d of disputes) {
      if (d.status === "Resolved" || d.status === "Rejected") continue;
      m[d.invoiceId] = (m[d.invoiceId] || 0) + 1;
    }
    return m;
  }, [disputes]);

  const summary = useMemo(() => {
    const total = filteredInvoices.reduce((a, b) => a + b.total, 0);
    const balance = filteredInvoices.reduce((a, b) => a + b.balance, 0);
    const overdue = filteredInvoices.filter((i) => i.status === "Overdue").length;
    const paid = filteredInvoices.filter((i) => i.status === "Paid").length;
    const sent = filteredInvoices.filter((i) => i.status === "Sent").length;
    const draft = filteredInvoices.filter((i) => i.status === "Draft").length;
    return { total, balance, overdue, paid, sent, draft };
  }, [filteredInvoices]);

  const activeInvoice = useMemo(() => (activeInvoiceId ? findInvoice(activeInvoiceId) : null), [activeInvoiceId, derivedInvoices]);

  const activeInvoiceLines = useMemo(() => {
    if (!activeInvoice) return [];
    return lineItems.filter((l) => l.invoiceId === activeInvoice.id).slice().sort((a, b) => b.amount - a.amount);
  }, [activeInvoice, lineItems]);

  const activeInvoiceCredits = useMemo(() => {
    if (!activeInvoice) return [];
    return creditNotes.filter((c) => c.invoiceId === activeInvoice.id).slice().sort((a, b) => b.createdAt - a.createdAt);
  }, [activeInvoice, creditNotes]);

  const activeInvoiceDisputes = useMemo(() => {
    if (!activeInvoice) return [];
    return disputes.filter((d) => d.invoiceId === activeInvoice.id).slice().sort((a, b) => b.createdAt - a.createdAt);
  }, [activeInvoice, disputes]);

  const breakdownDimOptions: Array<{ value: string; label: string }> = [
    { value: "serviceModule", label: "Service module" },
    { value: "marketplace", label: "Marketplace" },
    { value: "vendor", label: "Vendor" },
    { value: "group", label: "Group" },
    { value: "costCenter", label: "Cost center" },
    { value: "projectTag", label: "Project tag" },
  ];
  const [breakdownBy, setBreakdownBy] = useState<string>("serviceModule");

  const activeBreakdown = useMemo(() => {
    const keyFn = (l: LineItem) => {
      const v = (l as any)[breakdownBy];
      return (v && String(v).trim()) || "-";
    };
    return groupSum(activeInvoiceLines, keyFn, (l) => l.amount);
  }, [activeInvoiceLines, breakdownBy]);

  // Explain charge modal
  const explainLine = useMemo(() => {
    if (!explainLineId) return null;
    return lineItems.find((l) => l.id === explainLineId) || null;
  }, [explainLineId, lineItems]);

  const explainEvents = useMemo(() => {
    if (!explainLineId) return [];
    return rawEvents
      .filter((e) => e.lineItemId === explainLineId)
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [rawEvents, explainLineId]);

  const explainSummary = useMemo(() => {
    if (!explainLine || !explainEvents.length) return null;
    const total = explainEvents.reduce((a, b) => a + b.amount, 0);
    const byKind = groupSum(explainEvents, (e) => e.kind, (e) => e.amount);
    const byVendor = groupSum(explainEvents, (e) => e.vendor, (e) => e.amount);
    return { total, byKind, byVendor };
  }, [explainLine, explainEvents]);

  // Explorer rows
  const explorerRows: ExplorerRow[] = useMemo(() => {
    const invById = Object.fromEntries(derivedInvoices.map((i) => [i.id, i])) as Record<string, Invoice>;
    return lineItems
      .map((l) => {
        const inv = invById[l.invoiceId];
        if (!inv) return null;
        return {
          ...l,
          marketplace: l.marketplace || "-",
          invoiceNo: inv.invoiceNo,
          invoiceStatus: inv.status,
          entityId: inv.entityId,
          invoiceGroupId: inv.invoiceGroupId,
          issueDate: inv.issueDate,
          dueDate: inv.dueDate,
          currency: inv.currency,
        } as ExplorerRow;
      })
      .filter(Boolean) as ExplorerRow[];
  }, [lineItems, derivedInvoices]);

  const explorerFiltered = useMemo(() => {
    // Reuse invoice filters to limit explorer scope
    const invoiceIds = new Set(filteredInvoices.map((i) => i.id));
    return explorerRows.filter((r) => invoiceIds.has(r.invoiceId));
  }, [explorerRows, filteredInvoices]);

  const pivot = useMemo(() => buildPivot(explorerFiltered, pivotRowDim, pivotColDim, pivotMetric), [explorerFiltered, pivotRowDim, pivotColDim, pivotMetric]);

  const pivotDims: Array<{ value: PivotDim; label: string }> = [
    { value: "Service module", label: "Service module" },
    { value: "Marketplace", label: "Marketplace" },
    { value: "Vendor", label: "Vendor" },
    { value: "Group", label: "Group" },
    { value: "Cost center", label: "Cost center" },
    { value: "Project tag", label: "Project tag" },
    { value: "Invoice status", label: "Invoice status" },
    { value: "Invoice group", label: "Invoice group" },
    { value: "Entity", label: "Entity" },
  ];

  // Statements
  const [statementMonth, setStatementMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const statementRows = useMemo(() => {
    // Simple statement by entity and invoice group for the chosen month
    const [y, m] = statementMonth.split("-").map((x) => Number(x));
    const start = new Date(y, (m || 1) - 1, 1).getTime();
    const end = new Date(y, (m || 1), 0, 23, 59, 59, 999).getTime();

    const inv = derivedInvoices.filter((i) => i.issueDate >= start && i.issueDate <= end);
    const byEntity = Object.fromEntries(entities.map((e) => [e.id, { entity: e, invoices: [] as Invoice[] }])) as any;
    inv.forEach((i) => (byEntity[i.entityId]?.invoices.push(i)));

    const rows: Array<{ entityId: string; entityName: string; invoiceCount: number; issued: number; paid: number; balance: number }> = [];
    Object.keys(byEntity).forEach((eid) => {
      const e = byEntity[eid].entity as Entity;
      const list = byEntity[eid].invoices as Invoice[];
      const issued = list.reduce((a, b) => a + b.total, 0);
      const paid = list.reduce((a, b) => a + b.paidAmount, 0);
      const balance = list.reduce((a, b) => a + b.balance, 0);
      if (!list.length) return;
      rows.push({ entityId: eid, entityName: e.name, invoiceCount: list.length, issued, paid, balance });
    });

    rows.sort((a, b) => b.issued - a.issued);
    return rows;
  }, [statementMonth, derivedInvoices, entities]);

  // Credit notes table
  const creditNotesSorted = useMemo(() => creditNotes.slice().sort((a, b) => b.createdAt - a.createdAt), [creditNotes]);

  const disputesSorted = useMemo(() => disputes.slice().sort((a, b) => {
    if (a.status !== b.status) return a.status === "Open" ? -1 : a.status === "In review" ? -1 : 1;
    return b.createdAt - a.createdAt;
  }), [disputes]);

  // Actions
  const openInvoice = (id: string) => {
    setActiveInvoiceId(id);
    setInvoiceDrawerOpen(true);
  };

  const exportInvoicesCSV = () => {
    const rows = filteredInvoices.map((i) => ({
      invoiceNo: i.invoiceNo,
      entity: entityById[i.entityId]?.name || i.entityId,
      invoiceGroup: groupById[i.invoiceGroupId]?.name || i.invoiceGroupId,
      issueDate: fmtDate(i.issueDate),
      dueDate: fmtDate(i.dueDate),
      status: i.status,
      total: formatMoney(i.total, i.currency),
      paid: formatMoney(i.paidAmount, i.currency),
      balance: formatMoney(i.balance, i.currency),
    }));

    const csv = toCSV(rows, [
      { key: "invoiceNo", label: "Invoice No" },
      { key: "entity", label: "Entity" },
      { key: "invoiceGroup", label: "Invoice Group" },
      { key: "issueDate", label: "Issue Date" },
      { key: "dueDate", label: "Due Date" },
      { key: "status", label: "Status" },
      { key: "total", label: "Total" },
      { key: "paid", label: "Paid" },
      { key: "balance", label: "Balance" },
    ]);

    downloadText("invoices.csv", csv, "text/csv");
    toast({ title: "Exported", message: "Invoice list CSV downloaded.", kind: "success" });
  };

  const exportInvoiceLinesCSV = (invoiceId: string) => {
    const inv = findInvoice(invoiceId);
    if (!inv) return;
    const lines = lineItems.filter((l) => l.invoiceId === invoiceId);
    const rows = lines.map((l) => ({
      invoiceNo: inv.invoiceNo,
      description: l.description,
      serviceModule: l.serviceModule,
      marketplace: l.marketplace || "-",
      vendor: l.vendor,
      group: l.group,
      costCenter: l.costCenter,
      projectTag: l.projectTag,
      amount: formatMoney(l.amount, inv.currency),
    }));
    const csv = toCSV(rows, [
      { key: "invoiceNo", label: "Invoice No" },
      { key: "description", label: "Description" },
      { key: "serviceModule", label: "Service Module" },
      { key: "marketplace", label: "Marketplace" },
      { key: "vendor", label: "Vendor" },
      { key: "group", label: "Group" },
      { key: "costCenter", label: "Cost Center" },
      { key: "projectTag", label: "Project Tag" },
      { key: "amount", label: "Amount" },
    ]);
    downloadText(`invoice-${inv.invoiceNo}-lines.csv`, csv, "text/csv");
    toast({ title: "Exported", message: "Invoice line items CSV downloaded.", kind: "success" });
  };

  const printInvoice = (invoiceId: string) => {
    const inv = findInvoice(invoiceId);
    if (!inv) return;
    const e = entityById[inv.entityId];
    const g = groupById[inv.invoiceGroupId];
    const lines = lineItems.filter((l) => l.invoiceId === invoiceId);

    const html = `
      <html>
        <head>
          <title>${inv.invoiceNo}</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 24px; }
            .row { display:flex; justify-content:space-between; gap:12px; }
            .muted { color:#64748b; font-size:12px; }
            .title { font-size:18px; font-weight:700; }
            table { width:100%; border-collapse:collapse; margin-top:16px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; font-size:12px; }
            th { background:#f8fafc; text-align:left; }
            .totals { margin-top: 16px; width: 320px; margin-left:auto; }
            .totals .row { padding: 6px 0; }
          </style>
        </head>
        <body>
          <div class="row">
            <div>
              <div class="title">Invoice</div>
              <div class="muted">${inv.invoiceNo}</div>
              <div class="muted">Entity: ${e?.legalName || e?.name || inv.entityId}</div>
              <div class="muted">Invoice group: ${g?.name || inv.invoiceGroupId} • Cost code: ${g?.costCode || "-"}</div>
            </div>
            <div style="text-align:right">
              <div class="muted">Issue: ${fmtDate(inv.issueDate)}</div>
              <div class="muted">Due: ${fmtDate(inv.dueDate)}</div>
              <div class="muted">Status: ${inv.status}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Module</th>
                <th>Marketplace</th>
                <th>Vendor</th>
                <th>Group</th>
                <th>Cost center</th>
                <th>Project tag</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${lines
                .map(
                  (l) => `
                <tr>
                  <td>${l.description}</td>
                  <td>${l.serviceModule}</td>
                  <td>${l.marketplace || "-"}</td>
                  <td>${l.vendor}</td>
                  <td>${l.group}</td>
                  <td>${l.costCenter}</td>
                  <td>${l.projectTag}</td>
                  <td style="text-align:right">${formatMoney(l.amount, inv.currency)}</td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>

          <div class="totals">
            <div class="row"><div>Subtotal</div><div><b>${formatMoney(inv.subtotal, inv.currency)}</b></div></div>
            <div class="row"><div>VAT</div><div><b>${formatMoney(inv.vat, inv.currency)}</b></div></div>
            <div class="row"><div>Total</div><div><b>${formatMoney(inv.total, inv.currency)}</b></div></div>
            <div class="row"><div>Paid</div><div><b>${formatMoney(inv.paidAmount, inv.currency)}</b></div></div>
            <div class="row"><div>Balance</div><div><b>${formatMoney(inv.balance, inv.currency)}</b></div></div>
          </div>

          <div class="muted" style="margin-top:20px">Generated by EVzone CorporatePay</div>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Popup blocked", message: "Allow popups to print/export PDF.", kind: "warn" });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    toast({ title: "Print ready", message: "Use Print to PDF to save.", kind: "info" });
  };

  const openCredit = (invoiceId: string) => {
    setCreditDraft({ invoiceId, amount: 100000, reason: "", attachmentNote: "" });
    setCreditModalOpen(true);
  };

  const submitCredit = () => {
    if (!creditDraft.invoiceId) return;
    if (creditDraft.amount <= 0) {
      toast({ title: "Invalid", message: "Credit amount must be greater than zero.", kind: "warn" });
      return;
    }
    if (creditDraft.reason.trim().length < 8) {
      toast({ title: "Reason required", message: "Provide a clear reason (min 8 chars).", kind: "warn" });
      return;
    }

    const inv = findInvoice(creditDraft.invoiceId);
    if (!inv) return;

    const row: CreditNote = {
      id: uid("CN"),
      invoiceId: creditDraft.invoiceId,
      createdAt: Date.now(),
      createdBy: "You",
      amount: creditDraft.amount,
      reason: creditDraft.reason.trim(),
      status: "Pending",
    };

    setCreditNotes((p) => [row, ...p]);
    setCreditModalOpen(false);
    toast({ title: "Submitted", message: "Credit note submitted for approval.", kind: "success" });

    // Add evidence as raw event note (demo)
    if (creditDraft.attachmentNote.trim()) {
      setRawEvents((p) => [
        {
          id: uid("EVT"),
          lineItemId: lineItems.find((l) => l.invoiceId === inv.id)?.id || "",
          ts: Date.now(),
          kind: "Service",
          reference: `CN-EVID-${row.id}`,
          serviceModule: "Finance & Payments",
          marketplace: "-",
          vendor: "CorporatePay",
          group: "Finance",
          costCenter: groupById[inv.invoiceGroupId]?.costCode || "-",
          projectTag: "Credit note",
          amount: 0,
          details: `Evidence note: ${creditDraft.attachmentNote.trim()}`,
        },
        ...p,
      ]);
    }
  };

  const openCreditDecision = (creditId: string) => {
    setCreditDecisionId(creditId);
    setCreditDecisionWhy("");
    setCreditDecisionAck(false);
    setCreditDecisionOpen(true);
  };

  const decideCredit = (decision: "Approved" | "Rejected") => {
    if (!creditDecisionId) return;
    if (creditDecisionWhy.trim().length < 8 || !creditDecisionAck) {
      toast({ title: "Blocked", message: "Add a reason and confirm acknowledgement.", kind: "warn" });
      return;
    }

    const id = creditDecisionId;
    const now = Date.now();

    setCreditNotes((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              status: decision,
              approvalReason: creditDecisionWhy.trim(),
              decidedBy: "You",
              decidedAt: now,
            }
          : c
      )
    );

    if (decision === "Approved") {
      const cnRow = creditNotes.find((x) => x.id === id);
      if (cnRow) {
        setInvoices((prev) =>
          prev.map((inv) => {
            if (inv.id !== cnRow.invoiceId) return inv;
            const nextTotal = Math.max(0, inv.total - cnRow.amount);
            const nextBalance = Math.max(0, inv.balance - cnRow.amount);
            const nextStatus: InvoiceStatus = nextBalance <= 0 ? "Paid" : inv.status;
            return { ...inv, total: nextTotal, balance: nextBalance, status: nextStatus };
          })
        );
      }
      toast({ title: "Approved", message: "Credit note approved and applied to invoice.", kind: "success" });
    } else {
      toast({ title: "Rejected", message: "Credit note rejected.", kind: "info" });
    }

    setCreditDecisionOpen(false);
    setCreditDecisionId(null);
  };

  const openDispute = (invoiceId: string) => {
    setDisputeDraft({ invoiceId, category: "Wrong amount", description: "", evidenceName: "", evidenceNote: "" });
    setDisputeModalOpen(true);
  };

  const submitDispute = () => {
    if (disputeDraft.description.trim().length < 12) {
      toast({ title: "More details needed", message: "Describe the issue (min 12 chars).", kind: "warn" });
      return;
    }
    const id = uid("DSP");
    const now = Date.now();

    const evidence: Evidence[] = disputeDraft.evidenceName.trim()
      ? [
          {
            id: uid("EV"),
            name: disputeDraft.evidenceName.trim(),
            note: disputeDraft.evidenceNote.trim() || "Evidence attached",
            uploadedBy: "You",
            uploadedAt: now,
          },
        ]
      : [];

    const row: DisputeTicket = {
      id,
      invoiceId: disputeDraft.invoiceId,
      createdAt: now,
      createdBy: "You",
      status: "Open",
      category: disputeDraft.category,
      description: disputeDraft.description.trim(),
      messages: [{ at: now, by: "You", message: disputeDraft.description.trim() }],
      evidence,
    };

    setDisputes((p) => [row, ...p]);
    setDisputeModalOpen(false);
    toast({ title: "Created", message: "Dispute ticket created.", kind: "success" });
  };

  const openTicket = (id: string) => {
    setTicketId(id);
    setTicketOpen(true);
    setTicketMsg("");
    setTicketEvidenceName("");
    setTicketEvidenceNote("");
  };

  const activeTicket = useMemo(() => (ticketId ? disputes.find((d) => d.id === ticketId) || null : null), [ticketId, disputes]);

  const addTicketMessage = () => {
    if (!ticketId || !ticketMsg.trim()) return;
    const now = Date.now();
    setDisputes((prev) =>
      prev.map((d) => (d.id === ticketId ? { ...d, status: d.status === "Open" ? "In review" : d.status, messages: [...d.messages, { at: now, by: "You", message: ticketMsg.trim() }] } : d))
    );
    setTicketMsg("");
    toast({ title: "Sent", message: "Message added.", kind: "success" });
  };

  const addTicketEvidence = () => {
    if (!ticketId || !ticketEvidenceName.trim()) {
      toast({ title: "Missing", message: "Evidence name is required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === ticketId
          ? {
              ...d,
              status: d.status === "Open" ? "In review" : d.status,
              evidence: [
                ...d.evidence,
                {
                  id: uid("EV"),
                  name: ticketEvidenceName.trim(),
                  note: ticketEvidenceNote.trim() || "Evidence attached",
                  uploadedBy: "You",
                  uploadedAt: now,
                },
              ],
            }
          : d
      )
    );
    setTicketEvidenceName("");
    setTicketEvidenceNote("");
    toast({ title: "Uploaded", message: "Evidence added.", kind: "success" });
  };

  const setTicketStatus = (next: DisputeStatus) => {
    if (!ticketId) return;
    setDisputes((prev) => prev.map((d) => (d.id === ticketId ? { ...d, status: next } : d)));
    toast({ title: "Updated", message: `Ticket set to ${next}.",`, kind: "info" });
  };

  const openExplain = (lineId: string) => {
    setExplainLineId(lineId);
    setExplainOpen(true);
  };

  const exportPivotCSV = () => {
    const rows: Array<Record<string, any>> = [];
    pivot.rowKeys.forEach((rk) => {
      const row: Record<string, any> = { row: rk };
      pivot.colKeys.forEach((ck) => {
        row[ck] = pivot.matrix[rk]?.[ck] || 0;
      });
      row["Total"] = pivot.rowTotals[rk] || 0;
      rows.push(row);
    });

    const columns = [{ key: "row", label: pivotRowDim }, ...pivot.colKeys.map((k) => ({ key: k, label: k })), { key: "Total", label: "Total" }];
    const csv = toCSV(rows, columns);
    downloadText("invoice-explorer-pivot.csv", csv, "text/csv");
    toast({ title: "Exported", message: "Pivot CSV downloaded.", kind: "success" });
  };

  const pivotCellRows = useMemo(() => {
    if (!pivotCellFilter) return [];
    const { rowKey, colKey } = pivotCellFilter;
    const get = (r: ExplorerRow, dim: PivotDim) => {
      if (dim === "Service module") return r.serviceModule || "-";
      if (dim === "Marketplace") return r.marketplace || "-";
      if (dim === "Vendor") return r.vendor || "-";
      if (dim === "Group") return r.group || "-";
      if (dim === "Cost center") return r.costCenter || "-";
      if (dim === "Project tag") return r.projectTag || "-";
      if (dim === "Invoice status") return r.invoiceStatus;
      if (dim === "Invoice group") return r.invoiceGroupId;
      if (dim === "Entity") return r.entityId;
      return "-";
    };

    return explorerFiltered
      .filter((r) => get(r, pivotRowDim) === rowKey)
      .filter((r) => (pivotColDim === "None" ? true : get(r, pivotColDim) === colKey));
  }, [pivotCellFilter, explorerFiltered, pivotRowDim, pivotColDim]);

  // Rendering
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
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Invoices and Statements</div>
                  <div className="mt-1 text-xs text-slate-500">Invoices, line items, exports, credit notes and disputes. Premium explorer and charge drilldowns.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Total: ${formatMoney(summary.total, "UGX")}`} tone="neutral" />
                    <Pill label={`Balance: ${formatMoney(summary.balance, "UGX")}`} tone={summary.balance > 0 ? "warn" : "good"} />
                    <Pill label={`Overdue: ${summary.overdue}`} tone={summary.overdue ? "bad" : "good"} />
                    <Pill label={`Paid: ${summary.paid}`} tone="good" />
                    <Pill label={`Sent: ${summary.sent}`} tone="info" />
                    <Pill label={`Draft: ${summary.draft}`} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {tab === "invoices" ? (
                  <>
                    <Button variant="outline" onClick={exportInvoicesCSV}>
                      <Download className="h-4 w-4" /> Export CSV
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (!filteredInvoices.length) {
                          toast({ title: "Nothing to export", message: "No invoices in current filter.", kind: "info" });
                          return;
                        }
                        printInvoice(filteredInvoices[0].id);
                      }}
                      title="Print first invoice in list (demo)"
                    >
                      <FileText className="h-4 w-4" /> Export PDF
                    </Button>
                  </>
                ) : null}

                {tab === "explorer" ? (
                  <Button variant="outline" onClick={exportPivotCSV}>
                    <Download className="h-4 w-4" /> Export pivot CSV
                  </Button>
                ) : null}

                <Button
                  variant="primary"
                  onClick={() => {
                    setTab("invoices");
                    toast({ title: "Tip", message: "Open an invoice to export PDF or raise a dispute.", kind: "info" });
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Quick actions
                </Button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "invoices", label: "Invoices" },
                { id: "explorer", label: "Invoice explorer" },
                { id: "statements", label: "Statements" },
                { id: "creditNotes", label: "Credit notes" },
                { id: "disputes", label: "Disputes" },
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
            {tab === "invoices" ? (
              <div className="flex flex-col gap-4">
                <div className="space-y-4">
                  <Section
                    title="Filters"
                    subtitle="Search and narrow invoice list."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <Field label="Search" value={q} onChange={setQ} placeholder="Invoice no, entity, cost code..." />
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select
                        label="Status"
                        value={statusFilter}
                        onChange={(v) => setStatusFilter(v as any)}
                        options={[
                          { value: "All", label: "All" },
                          { value: "Draft", label: "Draft" },
                          { value: "Sent", label: "Sent" },
                          { value: "Paid", label: "Paid" },
                          { value: "Overdue", label: "Overdue" },
                        ]}
                      />
                      <Select
                        label="Entity"
                        value={entityFilter}
                        onChange={(v) => setEntityFilter(v as any)}
                        options={[{ value: "All", label: "All" }, ...entities.map((e) => ({ value: e.id, label: e.name }))]}
                      />
                      <div className="sm:col-span-2">
                        <Select
                          label="Invoice group"
                          value={groupFilter}
                          onChange={(v) => setGroupFilter(v as any)}
                          options={[{ value: "All", label: "All" }, ...invoiceGroups.map((g) => ({ value: g.id, label: g.name }))]}
                        />
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQ("");
                          setStatusFilter("All");
                          setEntityFilter("All");
                          setGroupFilter("All");
                          toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                      <Button variant="outline" onClick={() => setTab("explorer")}>
                        <Layers className="h-4 w-4" /> Explorer
                      </Button>
                    </div>

                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: invoice explorer supports pivot-like analysis and drilldown to line items.
                    </div>
                  </Section>

                  <Section
                    title="Quick insights"
                    subtitle="Top contributors in current filter."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    {(() => {
                      const ids = new Set(filteredInvoices.map((i) => i.id));
                      const ls = lineItems.filter((l) => ids.has(l.invoiceId));
                      const topVendor = groupSum(ls, (x) => x.vendor, (x) => x.amount)[0];
                      const topModule = groupSum(ls, (x) => x.serviceModule, (x) => x.amount)[0];
                      return (
                        <div className="space-y-3">
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Top vendor</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{topVendor?.key || "-"}</div>
                                <div className="mt-1 text-xs text-slate-600">{topVendor ? formatMoney(topVendor.value, "UGX") : "-"}</div>
                              </div>
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                <BarChart3 className="h-5 w-5" />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-xs font-semibold text-slate-500">Top module</div>
                                <div className="mt-1 text-sm font-semibold text-slate-900">{topModule?.key || "-"}</div>
                                <div className="mt-1 text-xs text-slate-600">{topModule ? formatMoney(topModule.value, "UGX") : "-"}</div>
                              </div>
                              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700 ring-1 ring-slate-200">
                                <Layers className="h-5 w-5" />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                            Tip: open an invoice to see vendor and project tag breakdown.
                          </div>
                        </div>
                      );
                    })()}
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section
                    title="Invoice list"
                    subtitle="Statuses: draft, sent, paid, overdue. Click an invoice to open details."
                    right={<Pill label={`${filteredInvoices.length} invoice(s)`} tone="neutral" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Invoice</th>
                            <th className="px-4 py-3 font-semibold">Entity</th>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">Issue</th>
                            <th className="px-4 py-3 font-semibold">Due</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Total</th>
                            <th className="px-4 py-3 font-semibold">Balance</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredInvoices.map((i) => {
                            const e = entityById[i.entityId];
                            const g = groupById[i.invoiceGroupId];
                            const hasDispute = !!invoiceOpenDisputeMap[i.id];
                            const dueTone = riskToneByOverdue(i.dueDate, i.status);

                            return (
                              <tr key={i.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{i.invoiceNo}</div>
                                  <div className="mt-1 text-xs text-slate-500">{i.id} • {g?.costCode || "-"}</div>
                                  {hasDispute ? <div className="mt-2"><Pill label={`${invoiceOpenDisputeMap[i.id]} dispute`} tone="warn" /></div> : null}
                                </td>
                                <td className="px-4 py-3 text-slate-700">{e?.name || i.entityId}</td>
                                <td className="px-4 py-3 text-slate-700">{g?.name || i.invoiceGroupId}</td>
                                <td className="px-4 py-3 text-slate-700">{fmtDate(i.issueDate)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1">
                                    <Pill label={fmtDate(i.dueDate)} tone={dueTone} />
                                    <div className="text-xs text-slate-500">{timeAgo(i.dueDate)}</div>
                                  </div>
                                </td>
                                <td className="px-4 py-3"><Pill label={i.status} tone={statusTone(i.status)} /></td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(i.total, i.currency)}</td>
                                <td className={cn("px-4 py-3 font-semibold", i.balance > 0 ? "text-slate-900" : "text-emerald-700")}>
                                  {formatMoney(i.balance, i.currency)}
                                </td>
                                <td className="px-4 py-3">
  <div className="flex justify-end">
                                    <ActionMenu
                                      actions={[
                                        {
                                          label: "Open details",
                                          icon: <ChevronRight className="h-4 w-4" />,
                                          onClick: () => openInvoice(i.id),
                                        },
                                        {
                                          label: "Download PDF",
                                          icon: <FileText className="h-4 w-4" />,
                                          onClick: () => printInvoice(i.id),
                                        },
                                        {
                                          label: "Create credit note",
                                          icon: <Shield className="h-4 w-4" />,
                                          onClick: () => openCredit(i.id),
                                        },
                                        {
                                          label: "Raise dispute",
                                          icon: <MessageSquare className="h-4 w-4" />,
                                          onClick: () => openDispute(i.id),
                                        },
                                      ]}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {!filteredInvoices.length ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-600">No invoices match your filters.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Core exports: CSV is available. PDF export uses print to PDF.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "explorer" ? (
              <div className="flex flex-col gap-4">
                <Section
                  title="Pivot table"
                  subtitle="Totals are computed in real time."
                  right={
                    <Pill
                      label={pivotMetric === "Amount" ? formatMoney(pivot.grand, "UGX") : `${pivot.grand} events`}
                      tone="neutral"
                    />
                  }
                >
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">{pivotRowDim}</th>
                          {pivot.colKeys.map((c) => (
                            <th key={c} className="px-4 py-3 font-semibold">
                              {c}
                            </th>
                          ))}
                          <th className="px-4 py-3 font-semibold">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pivot.rowKeys.map((rk) => (
                          <tr key={rk} className="border-t border-slate-100 hover:bg-slate-50/60">
                            <td className="px-4 py-3 font-semibold text-slate-900">{rk}</td>
                            {pivot.colKeys.map((ck) => {
                              const v = pivot.matrix[rk]?.[ck] || 0;
                              return (
                                <td key={ck} className="px-4 py-3">
                                  <button
                                    type="button"
                                    className="rounded-xl px-3 py-2 text-sm font-semibold text-slate-900 hover:bg-slate-100"
                                    onClick={() => {
                                      setPivotCellFilter({ rowKey: rk, colKey: ck });
                                      setPivotCellOpen(true);
                                    }}
                                  >
                                    {pivotMetric === "Amount" ? formatMoney(v, "UGX") : v}
                                  </button>
                                </td>
                              );
                            })}
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {pivotMetric === "Amount" ? formatMoney(pivot.rowTotals[rk] || 0, "UGX") : pivot.rowTotals[rk] || 0}
                            </td>
                          </tr>
                        ))}

                        {!pivot.rowKeys.length ? (
                          <tr>
                            <td
                              colSpan={pivot.colKeys.length + 2}
                              className="px-4 py-12 text-center text-sm text-slate-600"
                            >
                              No data in current scope.
                            </td>
                          </tr>
                        ) : (
                          <tr className="border-t border-slate-200 bg-slate-50">
                            <td className="px-4 py-3 font-semibold text-slate-900">Total</td>
                            {pivot.colKeys.map((ck) => (
                              <td key={ck} className="px-4 py-3 font-semibold text-slate-900">
                                {pivotMetric === "Amount"
                                  ? formatMoney(pivot.colTotals[ck] || 0, "UGX")
                                  : pivot.colTotals[ck] || 0}
                              </td>
                            ))}
                            <td className="px-4 py-3 font-semibold text-slate-900">
                              {pivotMetric === "Amount" ? formatMoney(pivot.grand, "UGX") : pivot.grand}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Premium: drilldown supports explain charge linking to raw events.
                  </div>
                </Section>

                <div className="space-y-4">
                  <Section
                    title="Interactive invoice explorer"
                    subtitle="Premium: pivot-like analysis across line items."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                      <Select
                        label="Row dimension"
                        value={pivotRowDim}
                        onChange={(v) => setPivotRowDim(v as PivotDim)}
                        options={pivotDims.map((d) => ({ value: d.value, label: d.label }))}
                      />
                      <Select
                        label="Column dimension"
                        value={pivotColDim}
                        onChange={(v) => setPivotColDim(v as any)}
                        options={[{ value: "None", label: "None" }, ...pivotDims.map((d) => ({ value: d.value, label: d.label }))]}
                      />
                      <Select
                        label="Metric"
                        value={pivotMetric}
                        onChange={(v) => setPivotMetric(v as PivotMetric)}
                        options={[
                          { value: "Amount", label: "Amount" },
                          { value: "Count", label: "Count" },
                        ]}
                        hint="Amount sums line items"
                      />
                    </div>

                    <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Click a cell to drill down and view the underlying line items.
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setTab("invoices")}>
                        <ChevronRight className="h-4 w-4" /> Back to invoices
                      </Button>
                      <Button variant="outline" onClick={exportPivotCSV}>
                        <Download className="h-4 w-4" /> CSV
                      </Button>
                    </div>
                  </Section>

                  <Section
                    title="Scope"
                    subtitle="Explorer uses invoice filters from Invoices tab."
                    right={<Pill label={`${explorerFiltered.length} line(s)`} tone="neutral" />}
                  >
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      To change scope, go to Invoices tab and adjust entity, status, or invoice group.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "statements" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Statement period" subtitle="Monthly statement summary." right={<Pill label="Core" tone="neutral" /> }>
                    <Field label="Month" value={statementMonth} onChange={setStatementMonth} placeholder="YYYY-MM" hint="Example: 2026-01" />
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          const csv = toCSV(
                            statementRows.map((r) => ({
                              entity: r.entityName,
                              invoices: r.invoiceCount,
                              issued: formatMoney(r.issued, entityById[r.entityId].currency),
                              paid: formatMoney(r.paid, entityById[r.entityId].currency),
                              balance: formatMoney(r.balance, entityById[r.entityId].currency),
                            })),
                            [
                              { key: "entity", label: "Entity" },
                              { key: "invoices", label: "Invoice Count" },
                              { key: "issued", label: "Issued" },
                              { key: "paid", label: "Paid" },
                              { key: "balance", label: "Balance" },
                            ]
                          );
                          downloadText(`statement-${statementMonth}.csv`, csv, "text/csv");
                          toast({ title: "Exported", message: "Statement CSV downloaded.", kind: "success" });
                        }}
                      >
                        <Download className="h-4 w-4" /> Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // print statement (simple)
                          const html = `
                            <html><head><title>Statement ${statementMonth}</title>
                            <style>body{font-family: ui-sans-serif, system-ui; padding:24px;} table{width:100%; border-collapse:collapse; margin-top:16px;} th,td{border:1px solid #e2e8f0; padding:10px; font-size:12px;} th{background:#f8fafc; text-align:left;}</style>
                            </head><body>
                            <h2>Statement ${statementMonth}</h2>
                            <table><thead><tr><th>Entity</th><th>Invoice count</th><th>Issued</th><th>Paid</th><th>Balance</th></tr></thead><tbody>
                            ${statementRows
                              .map((r) => {
                                const cur = entityById[r.entityId].currency;
                                return `<tr><td>${r.entityName}</td><td>${r.invoiceCount}</td><td>${formatMoney(r.issued, cur)}</td><td>${formatMoney(r.paid, cur)}</td><td>${formatMoney(r.balance, cur)}</td></tr>`;
                              })
                              .join("")}
                            </tbody></table>
                            <div style="margin-top:16px; color:#64748b; font-size:12px">Generated by EVzone CorporatePay</div>
                            </body></html>
                          `;
                          const w = window.open("", "_blank");
                          if (!w) {
                            toast({ title: "Popup blocked", message: "Allow popups to print/export PDF.", kind: "warn" });
                            return;
                          }
                          w.document.open();
                          w.document.write(html);
                          w.document.close();
                          w.focus();
                          w.print();
                          toast({ title: "Print ready", message: "Use Print to PDF to save.", kind: "info" });
                        }}
                      >
                        <FileText className="h-4 w-4" /> Export PDF
                      </Button>
                    </div>
                  </Section>

                  <Section title="What is included" subtitle="Statements are based on invoice issue date." right={<Pill label="Info" tone="info" /> }>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Issued totals are the sum of invoice totals</li>
                        <li>2) Paid totals are the sum of paid amounts</li>
                        <li>3) Balance totals are remaining amounts</li>
                      </ul>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Statement summary" subtitle="Per entity totals for the selected month." right={<Pill label={`${statementRows.length} entity`} tone="neutral" /> }>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Entity</th>
                            <th className="px-4 py-3 font-semibold">Invoices</th>
                            <th className="px-4 py-3 font-semibold">Issued</th>
                            <th className="px-4 py-3 font-semibold">Paid</th>
                            <th className="px-4 py-3 font-semibold">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {statementRows.map((r) => {
                            const cur = entityById[r.entityId].currency;
                            return (
                              <tr key={r.entityId} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{r.entityName}</td>
                                <td className="px-4 py-3 text-slate-700">{r.invoiceCount}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(r.issued, cur)}</td>
                                <td className="px-4 py-3 font-semibold text-emerald-700">{formatMoney(r.paid, cur)}</td>
                                <td className={cn("px-4 py-3 font-semibold", r.balance > 0 ? "text-slate-900" : "text-emerald-700")}>
                                  {formatMoney(r.balance, cur)}
                                </td>
                              </tr>
                            );
                          })}
                          {!statementRows.length ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-12 text-center text-sm text-slate-600">No invoices issued in this month.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Statements support multi-entity organizations and separate invoice streams.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "creditNotes" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Create adjustment" subtitle="Credit notes are approval-gated." right={<Pill label="Core" tone="neutral" /> }>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Credit notes reduce invoice balance and total once approved.
                    </div>
                    <Button variant="primary" onClick={() => openCredit(filteredInvoices[0]?.id || invoices[0]?.id || "INV-0001")}>
                      <Plus className="h-4 w-4" /> New credit note
                    </Button>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: approvals are tracked in audit logs and can be routed by rules.
                    </div>
                  </Section>

                  <Section title="Pending approvals" subtitle="Approve or reject." right={<Pill label="Premium" tone="info" /> }>
                    <div className="space-y-2">
                      {creditNotesSorted.filter((c) => c.status === "Pending").map((c) => {
                        const inv = findInvoice(c.invoiceId);
                        return (
                          <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{c.id}</div>
                                  <Pill label={c.status} tone={statusTone(c.status)} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">Invoice: {inv?.invoiceNo || c.invoiceId}</div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(c.amount, inv?.currency || "UGX")}</div>
                                <div className="mt-2 text-xs text-slate-600">Reason: {c.reason}</div>
                              </div>
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openCreditDecision(c.id)}>
                                <Shield className="h-4 w-4" /> Review
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {!creditNotesSorted.some((c) => c.status === "Pending") ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                          No pending credit notes.
                        </div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="All credit notes" subtitle="Adjustments and approvals history." right={<Pill label={`${creditNotesSorted.length}`} tone="neutral" /> }>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">ID</th>
                            <th className="px-4 py-3 font-semibold">Invoice</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Reason</th>
                            <th className="px-4 py-3 font-semibold">Created</th>
                            <th className="px-4 py-3 font-semibold">Decision</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditNotesSorted.map((c) => {
                            const inv = findInvoice(c.invoiceId);
                            return (
                              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{c.id}</td>
                                <td className="px-4 py-3 text-slate-700">{inv?.invoiceNo || c.invoiceId}</td>
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(c.amount, inv?.currency || "UGX")}</td>
                                <td className="px-4 py-3"><Pill label={c.status} tone={statusTone(c.status)} /></td>
                                <td className="px-4 py-3 text-slate-700">{c.reason}</td>
                                <td className="px-4 py-3 text-slate-700">{fmtDate(c.createdAt)}</td>
                                <td className="px-4 py-3 text-slate-700">
                                  {c.status !== "Pending" ? (
                                    <div>
                                      <div className="text-xs text-slate-500">By {c.decidedBy || "-"} • {c.decidedAt ? fmtDate(c.decidedAt) : "-"}</div>
                                      {c.approvalReason ? <div className="mt-1 text-xs text-slate-600">Why: {c.approvalReason}</div> : null}
                                    </div>
                                  ) : (
                                    <Pill label="Pending" tone="warn" />
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                          {!creditNotesSorted.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-600">No credit notes.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "disputes" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Create dispute" subtitle="Ticketing with evidence attachments." right={<Pill label="Premium" tone="info" /> }>
                    <Button
                      variant="primary"
                      onClick={() => openDispute(filteredInvoices[0]?.id || invoices[0]?.id || "INV-0001")}
                    >
                      <Plus className="h-4 w-4" /> New ticket
                    </Button>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Disputes are linked to invoices and track messages, evidence, and resolution.
                    </div>
                  </Section>

                  <Section title="Statuses" subtitle="Resolve or reject after review." right={<Pill label="Core" tone="neutral" /> }>
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: disputes can pause payment enforcement until resolved.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Tickets" subtitle="Open, in review, resolved." right={<Pill label={`${disputesSorted.length}`} tone="neutral" /> }>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Ticket</th>
                            <th className="px-4 py-3 font-semibold">Invoice</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Evidence</th>
                            <th className="px-4 py-3 font-semibold">Updated</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {disputesSorted.map((d) => {
                            const inv = findInvoice(d.invoiceId);
                            const lastMsg = d.messages[d.messages.length - 1];
                            return (
                              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{d.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">By {d.createdBy}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{inv?.invoiceNo || d.invoiceId}</td>
                                <td className="px-4 py-3"><Pill label={d.status} tone={statusTone(d.status)} /></td>
                                <td className="px-4 py-3 text-slate-700">{d.category}</td>
                                <td className="px-4 py-3">
                                  <Pill label={`${d.evidence.length}`} tone={d.evidence.length ? "info" : "neutral"} />
                                </td>
                                <td className="px-4 py-3 text-slate-700">{lastMsg ? timeAgo(lastMsg.at) : timeAgo(d.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openTicket(d.id)}>
                                      <MessageSquare className="h-4 w-4" /> Open
                                    </Button>
                                    {d.status !== "Resolved" ? (
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setTicketId(d.id); setTicketOpen(true); setTicketStatus("Resolved"); }}>
                                        <Check className="h-4 w-4" /> Resolve
                                      </Button>
                                    ) : null}
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!disputesSorted.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-600">No dispute tickets.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Ticket detail includes evidence attachments and message thread.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              O Invoices and Statements v2. Core: invoice list, statuses, line item breakdown, export CSV/PDF, credit notes with approvals. Premium: pivot explorer, explain charge drilldown, dispute workflow.
            </div>
          </footer>
        </div>
      </div>

      {/* Invoice drawer */}
      <Drawer
        open={invoiceDrawerOpen}
        title={activeInvoice ? activeInvoice.invoiceNo : "Invoice"}
        subtitle={activeInvoice ? `${entityById[activeInvoice.entityId]?.name || activeInvoice.entityId} • ${groupById[activeInvoice.invoiceGroupId]?.name || activeInvoice.invoiceGroupId}` : ""}
        onClose={() => setInvoiceDrawerOpen(false)}
        actions={[
          { label: "Lines CSV", onClick: () => activeInvoice && exportInvoiceLinesCSV(activeInvoice.id) },
          { label: "PDF", onClick: () => activeInvoice && printInvoice(activeInvoice.id) },
          { label: "Credit", onClick: () => activeInvoice && openCredit(activeInvoice.id) },
          { label: "Dispute", onClick: () => activeInvoice && openDispute(activeInvoice.id) },
        ]}
        footer={
          activeInvoice ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Exports and disputes are audit logged in production.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => exportInvoiceLinesCSV(activeInvoice.id)}>
                  <Download className="h-4 w-4" /> Lines CSV
                </Button>
                <Button variant="outline" onClick={() => printInvoice(activeInvoice.id)}>
                  <FileText className="h-4 w-4" /> PDF
                </Button>
                <Button variant="outline" onClick={() => openCredit(activeInvoice.id)}>
                  <Shield className="h-4 w-4" /> Credit
                </Button>
                <Button variant="primary" onClick={() => openDispute(activeInvoice.id)}>
                  <MessageSquare className="h-4 w-4" /> Dispute
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeInvoice ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeInvoice.status} tone={statusTone(activeInvoice.status)} />
                    <Pill label={`Issue ${fmtDate(activeInvoice.issueDate)}`} tone="neutral" />
                    <Pill label={`Due ${fmtDate(activeInvoice.dueDate)}`} tone={riskToneByOverdue(activeInvoice.dueDate, activeInvoice.status)} />
                    {invoiceOpenDisputeMap[activeInvoice.id] ? <Pill label={`${invoiceOpenDisputeMap[activeInvoice.id]} dispute`} tone="warn" /> : null}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">Notes: {activeInvoice.notes || "-"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(activeInvoice.total, activeInvoice.currency)}</div>
                  <div className="mt-1 text-xs text-slate-600">Balance: {formatMoney(activeInvoice.balance, activeInvoice.currency)}</div>
                </div>
              </div>
            </div>

            <Section
              title="Line items"
              subtitle="Breakdown by module, marketplace, vendor, group, cost center, and project tag."
              right={
                <Select
                  label="Group by"
                  value={breakdownBy}
                  onChange={setBreakdownBy}
                  options={breakdownDimOptions}
                  hint="Breakdown"
                />
              }
            >
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Key</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBreakdown.slice(0, 10).map((b) => (
                        <tr key={b.key} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-900">{b.key}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(b.value, activeInvoice.currency)}</td>
                        </tr>
                      ))}
                      {!activeBreakdown.length ? (
                        <tr>
                          <td colSpan={2} className="px-4 py-10 text-center text-sm text-slate-600">No line items.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>

                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Description</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                        <th className="px-4 py-3 font-semibold">Explain</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeInvoiceLines.slice(0, 10).map((l) => (
                        <tr key={l.id} className="border-t border-slate-100">
                          <td className="px-4 py-3">
                            <div className="font-semibold text-slate-900">{l.description}</div>
                            <div className="mt-1 text-xs text-slate-500">{l.serviceModule}{l.marketplace ? ` • ${l.marketplace}` : ""} • {l.vendor}</div>
                            <div className="mt-1 text-xs text-slate-500">{l.group} • {l.costCenter} • {l.projectTag}</div>
                          </td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(l.amount, activeInvoice.currency)}</td>
                          <td className="px-4 py-3">
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openExplain(l.id)}>
                              <Sparkles className="h-4 w-4" /> Explain
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {!activeInvoiceLines.length ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-10 text-center text-sm text-slate-600">No line items.</td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            </Section>

            <Section title="Adjustments" subtitle="Credit notes are approval-gated." right={<Pill label={`${activeInvoiceCredits.length}`} tone="neutral" /> }>
              <div className="space-y-2">
                {activeInvoiceCredits.map((c) => (
                  <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{c.id}</div>
                          <Pill label={c.status} tone={statusTone(c.status)} />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{fmtDate(c.createdAt)} • {c.createdBy}</div>
                        <div className="mt-2 text-sm font-semibold text-slate-900">{formatMoney(c.amount, activeInvoice.currency)}</div>
                        <div className="mt-2 text-xs text-slate-600">Reason: {c.reason}</div>
                        {c.status !== "Pending" && c.approvalReason ? <div className="mt-2 text-xs text-slate-600">Decision: {c.approvalReason}</div> : null}
                      </div>
                      {c.status === "Pending" ? (
                        <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openCreditDecision(c.id)}>
                          <Shield className="h-4 w-4" /> Review
                        </Button>
                      ) : (
                        <Pill label="Final" tone="neutral" />
                      )}
                    </div>
                  </div>
                ))}
                {!activeInvoiceCredits.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No adjustments.</div> : null}
              </div>
            </Section>

            <Section title="Disputes" subtitle="Ticketing and evidence attachments." right={<Pill label={`${activeInvoiceDisputes.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {activeInvoiceDisputes.map((d) => (
                  <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{d.id}</div>
                          <Pill label={d.status} tone={statusTone(d.status)} />
                          <Pill label={d.category} tone="neutral" />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Created {timeAgo(d.createdAt)} • By {d.createdBy}</div>
                        <div className="mt-2 text-xs text-slate-600">{d.description}</div>
                        <div className="mt-2 text-xs text-slate-500">Evidence: {d.evidence.length} • Messages: {d.messages.length}</div>
                      </div>
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openTicket(d.id)}>
                        <MessageSquare className="h-4 w-4" /> Open
                      </Button>
                    </div>
                  </div>
                ))}
                {!activeInvoiceDisputes.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No disputes for this invoice.</div> : null}
              </div>
            </Section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Select an invoice.</div>
        )}
      </Drawer>

      {/* Explain modal */}
      <Modal
        open={explainOpen}
        title="Explain charge"
        subtitle="Premium: drill down from line item to raw events."
        onClose={() => setExplainOpen(false)}
        actions={[{ label: "Export raw", onClick: () => toast({ title: "Export", message: "In production, raw events export to CSV.", kind: "info" }) }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExplainOpen(false)}>Close</Button>
            <Button variant="outline" onClick={() => toast({ title: "Export", message: "In production, raw events export to CSV.", kind: "info" })}>
              <Download className="h-4 w-4" /> Export raw
            </Button>
          </div>
        }
      >
        {explainLine ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">{explainLine.description}</div>
                  <div className="mt-1 text-xs text-slate-500">{explainLine.serviceModule}{explainLine.marketplace ? ` • ${explainLine.marketplace}` : ""} • {explainLine.vendor}</div>
                  <div className="mt-1 text-xs text-slate-500">{explainLine.group} • {explainLine.costCenter} • {explainLine.projectTag}</div>
                </div>
                <Pill label={explainLine.id} tone="neutral" />
              </div>
            </div>

            {explainSummary ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Summary</div>
                    <div className="mt-1 text-xs text-slate-500">Based on {explainEvents.length} raw event(s).</div>
                  </div>
                  <Pill label={formatMoney(explainSummary.total, "UGX")} tone="info" />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-600">By type</div>
                    <div className="mt-2 space-y-1">
                      {explainSummary.byKind.map((x) => (
                        <div key={x.key} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{x.key}</span>
                          <span className="font-semibold text-slate-900">{formatMoney(x.value, "UGX")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                    <div className="text-xs font-semibold text-slate-600">By vendor</div>
                    <div className="mt-2 space-y-1">
                      {explainSummary.byVendor.map((x) => (
                        <div key={x.key} className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">{x.key}</span>
                          <span className="font-semibold text-slate-900">{formatMoney(x.value, "UGX")}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Explain charge: each raw event is linked to a trip, order, charging session, or service record.
                </div>
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No raw events available for this line in demo.</div>
            )}

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Time</th>
                    <th className="px-4 py-3 font-semibold">Type</th>
                    <th className="px-4 py-3 font-semibold">Reference</th>
                    <th className="px-4 py-3 font-semibold">Module</th>
                    <th className="px-4 py-3 font-semibold">Vendor</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {explainEvents.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3 text-slate-700">{fmtDate(e.ts)}</td>
                      <td className="px-4 py-3"><Pill label={e.kind} tone="neutral" /></td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{e.reference}</td>
                      <td className="px-4 py-3 text-slate-700">{e.serviceModule}{e.marketplace ? ` • ${e.marketplace}` : ""}</td>
                      <td className="px-4 py-3 text-slate-700">{e.vendor}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(e.amount, "UGX")}</td>
                      <td className="px-4 py-3 text-slate-700">{e.details}</td>
                    </tr>
                  ))}
                  {!explainEvents.length ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No raw events.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Credit note modal */}
      <Modal
        open={creditModalOpen}
        title="Create credit note"
        subtitle="Core: adjustments are approval-gated."
        onClose={() => setCreditModalOpen(false)}
        actions={[{ label: "Submit", onClick: submitCredit }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCreditModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitCredit}>
              <BadgeCheck className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Invoice"
            value={creditDraft.invoiceId}
            onChange={(v) => setCreditDraft((p) => ({ ...p, invoiceId: v }))}
            options={derivedInvoices.map((i) => ({ value: i.id, label: i.invoiceNo }))}
            hint="Select invoice"
          />
          <Field
            label="Amount"
            value={String(creditDraft.amount)}
            onChange={(v) => setCreditDraft((p) => ({ ...p, amount: Math.max(0, Number(v || 0)) }))}
            type="number"
            hint="UGX"
          />
          <div className="md:col-span-2">
            <TextArea
              label="Reason"
              value={creditDraft.reason}
              onChange={(v) => setCreditDraft((p) => ({ ...p, reason: v }))}
              placeholder="Example: duplicate line, service cancellation, pricing correction"
              hint="Minimum 8 characters"
              rows={4}
            />
          </div>
          <div className="md:col-span-2">
            <TextArea
              label="Evidence note"
              value={creditDraft.attachmentNote}
              onChange={(v) => setCreditDraft((p) => ({ ...p, attachmentNote: v }))}
              placeholder="Optional: reference document or evidence"
              hint="Optional"
              rows={3}
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            This credit note will appear in the approval queue. Approving applies it to the invoice totals.
          </div>
        </div>
      </Modal>

      {/* Credit decision modal */}
      <Modal
        open={creditDecisionOpen}
        title="Credit note approval"
        subtitle="Approval-gated adjustments require a reason."
        onClose={() => setCreditDecisionOpen(false)}
        actions={[
          { label: "Reject", onClick: () => decideCredit("Rejected"), variant: "danger" },
          { label: "Approve", onClick: () => decideCredit("Approved") },
        ]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCreditDecisionOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => decideCredit("Rejected")}>
                <X className="h-4 w-4" /> Reject
              </Button>
              <Button variant="primary" onClick={() => decideCredit("Approved")}>
                <Check className="h-4 w-4" /> Approve
              </Button>
            </div>
          </div>
        }
      >
        {(() => {
          const c = creditNotes.find((x) => x.id === creditDecisionId);
          if (!c) return <div className="text-sm text-slate-600">Select a credit note.</div>;
          const inv = findInvoice(c.invoiceId);
          return (
            <div className="space-y-3">
              <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                <div><span className="font-semibold">Credit:</span> {c.id}</div>
                <div className="mt-1"><span className="font-semibold">Invoice:</span> {inv?.invoiceNo || c.invoiceId}</div>
                <div className="mt-1"><span className="font-semibold">Amount:</span> {formatMoney(c.amount, inv?.currency || "UGX")}</div>
                <div className="mt-1"><span className="font-semibold">Reason:</span> {c.reason}</div>
              </div>
              <TextArea
                label="Decision reason"
                value={creditDecisionWhy}
                onChange={setCreditDecisionWhy}
                placeholder="Example: verified raw events and vendor confirmation"
                hint="Minimum 8 characters"
                rows={3}
              />
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-3">
                <input type="checkbox" checked={creditDecisionAck} onChange={(e) => setCreditDecisionAck(e.target.checked)} className="mt-1 h-4 w-4 rounded border-slate-300" />
                <div className="text-sm font-semibold text-slate-800">I confirm this decision is authorized and will be audit logged.</div>
              </label>
            </div>
          );
        })()}
      </Modal>

      {/* Dispute create modal */}
      <Modal
        open={disputeModalOpen}
        title="Create dispute ticket"
        subtitle="Premium: ticketing with evidence attachments."
        onClose={() => setDisputeModalOpen(false)}
        actions={[{ label: "Create", onClick: submitDispute }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDisputeModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitDispute}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Invoice"
            value={disputeDraft.invoiceId}
            onChange={(v) => setDisputeDraft((p) => ({ ...p, invoiceId: v }))}
            options={derivedInvoices.map((i) => ({ value: i.id, label: i.invoiceNo }))}
          />
          <Select
            label="Category"
            value={disputeDraft.category}
            onChange={(v) => setDisputeDraft((p) => ({ ...p, category: v as any }))}
            options={[
              { value: "Wrong amount", label: "Wrong amount" },
              { value: "Duplicate", label: "Duplicate" },
              { value: "Missing service", label: "Missing service" },
              { value: "VAT/tax", label: "VAT/tax" },
              { value: "Other", label: "Other" },
            ]}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Description"
              value={disputeDraft.description}
              onChange={(v) => setDisputeDraft((p) => ({ ...p, description: v }))}
              placeholder="Describe the dispute and what you expect to change."
              hint="Minimum 12 characters"
              rows={4}
            />
          </div>
          <Field
            label="Evidence name"
            value={disputeDraft.evidenceName}
            onChange={(v) => setDisputeDraft((p) => ({ ...p, evidenceName: v }))}
            placeholder="Example: screenshot.png"
            hint="Optional"
          />
          <Field
            label="Evidence note"
            value={disputeDraft.evidenceNote}
            onChange={(v) => setDisputeDraft((p) => ({ ...p, evidenceNote: v }))}
            placeholder="What this evidence shows"
            hint="Optional"
          />
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Evidence is stored securely in production. This demo stores metadata only.
          </div>
        </div>
      </Modal>

      {/* Ticket modal */}
      <Modal
        open={ticketOpen}
        title={activeTicket ? `Ticket ${activeTicket.id}` : "Ticket"}
        subtitle={activeTicket ? `${activeTicket.status} • Invoice ${findInvoice(activeTicket.invoiceId)?.invoiceNo || activeTicket.invoiceId}` : ""}
        onClose={() => setTicketOpen(false)}
        actions={[
          { label: "In review", onClick: () => setTicketStatus("In review") },
          { label: "Reject", onClick: () => setTicketStatus("Rejected"), variant: "danger" },
          { label: "Resolve", onClick: () => setTicketStatus("Resolved") },
        ]}
        footer={
          activeTicket ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => setTicketOpen(false)}>Close</Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setTicketStatus("In review")}>
                  <Info className="h-4 w-4" /> In review
                </Button>
                <Button variant="outline" onClick={() => setTicketStatus("Rejected")}>
                  <X className="h-4 w-4" /> Reject
                </Button>
                <Button variant="primary" onClick={() => setTicketStatus("Resolved")}>
                  <Check className="h-4 w-4" /> Resolve
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeTicket ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeTicket.status} tone={statusTone(activeTicket.status)} />
                    <Pill label={activeTicket.category} tone="neutral" />
                    <Pill label={`Evidence ${activeTicket.evidence.length}`} tone={activeTicket.evidence.length ? "info" : "neutral"} />
                  </div>
                  <div className="mt-2 text-sm text-slate-700">{activeTicket.description}</div>
                  <div className="mt-2 text-xs text-slate-500">Created {timeAgo(activeTicket.createdAt)} • By {activeTicket.createdBy}</div>
                </div>
              </div>
            </div>

            <Section title="Messages" subtitle="Conversation thread" right={<Pill label={`${activeTicket.messages.length}`} tone="neutral" /> }>
              <div className="space-y-2">
                {activeTicket.messages
                  .slice()
                  .sort((a, b) => a.at - b.at)
                  .map((m, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{m.by}</div>
                          <div className="mt-1 text-sm text-slate-700">{m.message}</div>
                          <div className="mt-1 text-xs text-slate-500">{fmtDate(m.at)} • {timeAgo(m.at)}</div>
                        </div>
                        <MessageSquare className="h-5 w-5 text-slate-400" />
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3">
                <TextArea label="Add message" value={ticketMsg} onChange={setTicketMsg} placeholder="Write a message" rows={3} />
                <div className="flex justify-end">
                  <Button variant="primary" onClick={addTicketMessage} disabled={!ticketMsg.trim()}>
                    <Check className="h-4 w-4" /> Send
                  </Button>
                </div>
              </div>
            </Section>

            <Section title="Evidence" subtitle="Attachments metadata" right={<Pill label={`${activeTicket.evidence.length}`} tone="neutral" /> }>
              <div className="space-y-2">
                {activeTicket.evidence.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                          <Pill label={e.id} tone="neutral" />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Uploaded {timeAgo(e.uploadedAt)} • {e.uploadedBy}</div>
                        <div className="mt-2 text-xs text-slate-600">Note: {e.note}</div>
                      </div>
                      <Paperclip className="h-5 w-5 text-slate-400" />
                    </div>
                  </div>
                ))}
                {!activeTicket.evidence.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No evidence attached.</div> : null}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                <Field label="Evidence name" value={ticketEvidenceName} onChange={setTicketEvidenceName} placeholder="file.png" />
                <Field label="Evidence note" value={ticketEvidenceNote} onChange={setTicketEvidenceNote} placeholder="What it shows" />
                <div className="md:col-span-2 flex justify-end">
                  <Button variant="primary" onClick={addTicketEvidence}>
                    <Plus className="h-4 w-4" /> Add evidence
                  </Button>
                </div>
              </div>
            </Section>
          </div>
        ) : (
          <div className="text-sm text-slate-600">Select a ticket.</div>
        )}
      </Modal>

      {/* Pivot cell drilldown */}
      <Modal
        open={pivotCellOpen}
        title="Explorer drilldown"
        subtitle="Premium: items behind the pivot cell."
        onClose={() => setPivotCellOpen(false)}
        actions={[{ label: "Close", onClick: () => setPivotCellOpen(false) }]}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setPivotCellOpen(false)}>Close</Button>
          </div>
        }
      >
        {pivotCellFilter ? (
          <div className="space-y-3">
            <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
              Row: <span className="font-semibold">{pivotCellFilter.rowKey}</span>
              {pivotColDim !== "None" ? (
                <>
                  <br />
                  Column: <span className="font-semibold">{pivotCellFilter.colKey}</span>
                </>
              ) : null}
              <div className="mt-2 text-xs text-slate-600">Items: {pivotCellRows.length}</div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Invoice</th>
                    <th className="px-4 py-3 font-semibold">Line</th>
                    <th className="px-4 py-3 font-semibold">Vendor</th>
                    <th className="px-4 py-3 font-semibold">Amount</th>
                    <th className="px-4 py-3 font-semibold">Explain</th>
                  </tr>
                </thead>
                <tbody>
                  {pivotCellRows.slice(0, 50).map((r) => (
                    <tr key={`${r.invoiceId}-${r.id}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                      <td className="px-4 py-3">
                        <button className="text-left" onClick={() => { openInvoice(r.invoiceId); setPivotCellOpen(false); }}>
                          <div className="font-semibold text-slate-900">{r.invoiceNo}</div>
                          <div className="mt-1 text-xs text-slate-500">{r.invoiceStatus}</div>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{r.description}</td>
                      <td className="px-4 py-3 text-slate-700">{r.vendor}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatMoney(r.amount, "UGX")}</td>
                      <td className="px-4 py-3">
                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { openExplain(r.id); setPivotCellOpen(false); }}>
                          <Sparkles className="h-4 w-4" /> Explain
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {!pivotCellRows.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">No rows.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>

            <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Premium: drilldown can link to the full raw events for each line item.
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
