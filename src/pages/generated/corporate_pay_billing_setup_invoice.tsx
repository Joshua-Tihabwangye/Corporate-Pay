import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Hash,
  Info,
  Layers,
  Mail,
  Palette,
  Pencil,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type InvoiceFrequency = "Daily" | "Weekly" | "Monthly" | "Custom";

type PaymentTermMode = "Net" | "DueOnReceipt" | "EOM";

type PaymentTerms = {
  mode: PaymentTermMode;
  netDays: number; // used when mode=Net
  earlyDiscountPct: number;
  earlyDiscountDays: number;
  lateFeeText: string;
};

type Entity = {
  id: string;
  name: string;
  legalName: string;
  country: string;
  city: string;
  address1: string;
  address2: string;
  currency: "UGX" | "USD" | "EUR" | "CNY";
  taxId: string;
  vatNo: string;
  vatEnabled: boolean;
  vatRatePct: number;
  vatInclusive: boolean;
  billingEmail: string;
  phone: string;
  isPrimary: boolean;
};

type InvoiceTemplate = {
  id: string;
  name: string;
  brandName: string;
  accent: string;
  showLogo: boolean;
  headerNote: string;
  footerText: string;
  paymentInstructions: string;
  showVatLine: boolean;
  layout: "Modern" | "Classic";
};

type InvoiceGroup = {
  id: string;
  name: string;
  entityId: string; // entity stream
  frequency: InvoiceFrequency;
  customRule: string;
  apTo: string;
  apCc: string;
  costCode: string;
  templateId: string;
  prefix: string;
  nextSequence: number;
  paymentTermsOverrideEnabled: boolean;
  paymentTermsOverride?: PaymentTerms;
  status: "Active" | "Paused";
  lastInvoicedAt?: number;
  nextInvoiceAt?: number;
  notes: string;
};

type LineItem = {
  id: string;
  description: string;
  module: string;
  marketplace?: string;
  amountUGX: number;
};

type SimInvoice = {
  invoiceGroupId: string;
  entityId: string;
  month: string; // YYYY-MM
  cyclesInMonth: number;
  monthSubtotal: number;
  monthVat: number;
  monthTotal: number;
  perCycleSubtotal: number;
  perCycleVat: number;
  perCycleTotal: number;
  invoiceNoPreview: string;
  issueDate: Date;
  dueDate: Date;
  lineItems: LineItem[];
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

function fmtDate(d: Date) {
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function startOfMonth(yyyymm: string) {
  const [y, m] = yyyymm.split("-").map((x) => Number(x));
  return new Date(y, (m || 1) - 1, 1, 10, 0, 0, 0);
}

function endOfMonth(yyyymm: string) {
  const s = startOfMonth(yyyymm);
  const e = new Date(s);
  e.setMonth(e.getMonth() + 1);
  e.setDate(0);
  return e;
}

function monthDays(yyyymm: string) {
  const e = endOfMonth(yyyymm);
  return e.getDate();
}

function cyclesForFrequency(freq: InvoiceFrequency, yyyymm: string) {
  const days = monthDays(yyyymm);
  if (freq === "Daily") return days;
  if (freq === "Weekly") return Math.max(1, Math.round(days / 7));
  if (freq === "Monthly") return 1;
  // Custom, assume 2 cycles for demo
  return 2;
}

function issueDateForFrequency(freq: InvoiceFrequency, yyyymm: string) {
  const s = startOfMonth(yyyymm);
  if (freq === "Monthly") return s;
  if (freq === "Weekly") return addDays(s, 6);
  if (freq === "Daily") return addDays(s, 0);
  return addDays(s, 14);
}

function computeDueDate(issue: Date, terms: PaymentTerms) {
  if (terms.mode === "DueOnReceipt") return issue;
  if (terms.mode === "EOM") return endOfMonth(`${issue.getFullYear()}-${String(issue.getMonth() + 1).padStart(2, "0")}`);
  return addDays(issue, Math.max(0, terms.netDays));
}

function vatForAmount(entity: Entity, amount: number) {
  if (!entity.vatEnabled || entity.vatRatePct <= 0) return { vat: 0, subtotal: amount };
  const r = entity.vatRatePct / 100;
  if (entity.vatInclusive) {
    const vat = amount - amount / (1 + r);
    const subtotal = amount - vat;
    return { vat, subtotal };
  }
  const vat = amount * r;
  const subtotal = amount;
  return { vat, subtotal };
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

function Toggle({ enabled, onChange, label, description }: { enabled: boolean; onChange: (v: boolean) => void; label: string; description?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-4">
      <div>
        <div className="text-sm font-semibold text-slate-900">{label}</div>
        {description ? <div className="mt-1 text-xs text-slate-600">{description}</div> : null}
      </div>
      <button
        type="button"
        className={cn("relative h-7 w-12 rounded-full border transition", enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
        onClick={() => onChange(!enabled)}
        aria-label={label}
      >
        <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", enabled ? "left-[22px]" : "left-1")} />
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
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
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
                {t.kind === "error" || t.kind === "warn" ? <Info className="h-5 w-5" /> : <Check className="h-5 w-5" />}
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

function InvoicePreview({
  entity,
  template,
  invoiceNo,
  issueDate,
  dueDate,
  terms,
  lines,
}: {
  entity: Entity;
  template: InvoiceTemplate;
  invoiceNo: string;
  issueDate: Date;
  dueDate: Date;
  terms: PaymentTerms;
  lines: LineItem[];
}) {
  const totals = useMemo(() => {
    let subtotal = 0;
    let vat = 0;
    for (const l of lines) {
      const t = vatForAmount(entity, l.amountUGX);
      subtotal += t.subtotal;
      vat += t.vat;
    }
    const total = entity.vatEnabled && !entity.vatInclusive ? subtotal + vat : subtotal + vat; // always show total
    return { subtotal, vat, total };
  }, [entity, lines]);

  const termsLabel = useMemo(() => {
    if (terms.mode === "DueOnReceipt") return "Due on receipt";
    if (terms.mode === "EOM") return "Due end of month";
    return `Net ${terms.netDays}`;
  }, [terms]);

  return (
    <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white">
      <div className="px-5 py-4" style={{ background: "linear-gradient(135deg, rgba(3,205,140,0.12), rgba(255,255,255,0))" }}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "grid h-11 w-11 place-items-center rounded-2xl text-white",
                template.showLogo ? "" : "opacity-70"
              )}
              style={{ background: template.accent || EVZ.green }}
            >
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-900">{template.brandName || "CorporatePay"}</div>
              <div className="mt-1 text-xs text-slate-600">Invoice</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs font-semibold text-slate-500">Invoice No</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{invoiceNo}</div>
          </div>
        </div>

        {template.headerNote ? (
          <div className="mt-3 rounded-2xl bg-white/70 p-3 text-xs text-slate-700 ring-1 ring-slate-200">{template.headerNote}</div>
        ) : null}
      </div>

      <div className="px-5 py-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-500">From</div>
            <div className="mt-1 text-sm font-semibold text-slate-900">{entity.legalName}</div>
            <div className="mt-1 text-xs text-slate-600">
              {entity.address1}
              {entity.address2 ? `, ${entity.address2}` : ""}
              <br />
              {entity.city}, {entity.country}
              <br />
              Tax ID: {entity.taxId || "-"} • VAT: {entity.vatNo || "-"}
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-500">Dates</div>
            <div className="mt-1 text-xs text-slate-600">Issue: <span className="font-semibold text-slate-900">{fmtDate(issueDate)}</span></div>
            <div className="mt-1 text-xs text-slate-600">Due: <span className="font-semibold text-slate-900">{fmtDate(dueDate)}</span></div>
            <div className="mt-2">
              <Pill label={termsLabel} tone="info" />
            </div>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {lines.slice(0, 6).map((l) => (
                <tr key={l.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-slate-900">{l.description}</td>
                  <td className="px-4 py-3 text-slate-700">{l.module}{l.marketplace ? ` • ${l.marketplace}` : ""}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(l.amountUGX)}</td>
                </tr>
              ))}
              {lines.length > 6 ? (
                <tr className="border-t border-slate-100">
                  <td className="px-4 py-3 text-xs text-slate-600" colSpan={3}>
                    + {lines.length - 6} more line(s)
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
            <div className="font-semibold text-slate-900">Payment instructions</div>
            <div className="mt-1 text-slate-700">{template.paymentInstructions || "-"}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between text-xs text-slate-600">
              <span className="font-semibold">Subtotal</span>
              <span className="font-semibold text-slate-900">{formatUGX(totals.subtotal)}</span>
            </div>
            {template.showVatLine ? (
              <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">VAT</span>
                <span className="font-semibold text-slate-900">{formatUGX(totals.vat)}</span>
              </div>
            ) : null}
            <div className="mt-2 flex items-center justify-between text-sm text-slate-900">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatUGX(totals.total)}</span>
            </div>
          </div>
        </div>

        {template.footerText ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">{template.footerText}</div>
        ) : null}
      </div>
    </div>
  );
}

export default function CorporatePayBillingSetupInvoiceGroupsV2() {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"entities" | "invoiceGroups" | "templates" | "simulation" | "terms">("invoiceGroups");

  const [terms, setTerms] = useState<PaymentTerms>({
    mode: "Net",
    netDays: 7,
    earlyDiscountPct: 0,
    earlyDiscountDays: 0,
    lateFeeText: "Late fees apply as per agreement.",
  });

  const [entities, setEntities] = useState<Entity[]>(() => [
    {
      id: "ENT-UG",
      name: "Uganda HQ",
      legalName: "Acme Group Limited (Uganda)",
      country: "Uganda",
      city: "Kampala",
      address1: "Plot 12, Nkrumah Road",
      address2: "Suite 5",
      currency: "UGX",
      taxId: "TIN-123-456-789",
      vatNo: "VAT-UG-00991",
      vatEnabled: true,
      vatRatePct: 18,
      vatInclusive: false,
      billingEmail: "ap-ug@acme.com",
      phone: "+256 700 000 000",
      isPrimary: true,
    },
    {
      id: "ENT-CN",
      name: "China Branch",
      legalName: "Acme Group Co., Ltd. (China)",
      country: "China",
      city: "Wuxi",
      address1: "Room 265, No. 3 Gaolang East Road",
      address2: "Xinwu District",
      currency: "CNY",
      taxId: "CN-TAX-0001",
      vatNo: "CN-VAT-0001",
      vatEnabled: true,
      vatRatePct: 13,
      vatInclusive: false,
      billingEmail: "ap-cn@acme.com",
      phone: "+86 177 0000 0000",
      isPrimary: false,
    },
  ]);

  const [templates, setTemplates] = useState<InvoiceTemplate[]>(() => [
    {
      id: "TPL-01",
      name: "Default modern",
      brandName: "EVzone CorporatePay",
      accent: EVZ.green,
      showLogo: true,
      headerNote: "Thank you for your business.",
      footerText: "This invoice is generated electronically and is valid without signature.",
      paymentInstructions: "Pay via bank transfer. Reference the invoice number.",
      showVatLine: true,
      layout: "Modern",
    },
    {
      id: "TPL-02",
      name: "Finance classic",
      brandName: "EVzone CorporatePay",
      accent: EVZ.orange,
      showLogo: true,
      headerNote: "Accounts Payable: please include cost code on remittance advice.",
      footerText: "Payment terms apply as agreed.",
      paymentInstructions: "Bank transfer only. Contact finance for details.",
      showVatLine: true,
      layout: "Classic",
    },
  ]);

  const [invoiceGroups, setInvoiceGroups] = useState<InvoiceGroup[]>(() => {
    const now = Date.now();
    return [
      {
        id: "IG-MAIN-UG",
        name: "Main corporate",
        entityId: "ENT-UG",
        frequency: "Weekly",
        customRule: "",
        apTo: "ap@acme.com",
        apCc: "finance@acme.com",
        costCode: "ACME-MAIN",
        templateId: "TPL-01",
        prefix: "ACME",
        nextSequence: 1042,
        paymentTermsOverrideEnabled: false,
        status: "Active",
        lastInvoicedAt: now - 7 * 24 * 60 * 60 * 1000,
        nextInvoiceAt: now + 2 * 24 * 60 * 60 * 1000,
        notes: "Primary stream for Uganda HQ.",
      },
      {
        id: "IG-SALES-TRAVEL",
        name: "Sales travel",
        entityId: "ENT-UG",
        frequency: "Monthly",
        customRule: "",
        apTo: "sales-ap@acme.com",
        apCc: "finance@acme.com",
        costCode: "ACME-SALES",
        templateId: "TPL-02",
        prefix: "ACME-SALES",
        nextSequence: 88,
        paymentTermsOverrideEnabled: true,
        paymentTermsOverride: { mode: "Net", netDays: 14, earlyDiscountPct: 0, earlyDiscountDays: 0, lateFeeText: "Late fees apply.", },
        status: "Active",
        lastInvoicedAt: now - 28 * 24 * 60 * 60 * 1000,
        nextInvoiceAt: now + 3 * 24 * 60 * 60 * 1000,
        notes: "Sales commutes and client rides.",
      },
      {
        id: "IG-CN-PROC",
        name: "China procurement",
        entityId: "ENT-CN",
        frequency: "Weekly",
        customRule: "",
        apTo: "ap-cn@acme.com",
        apCc: "finance@acme.com",
        costCode: "CN-PROC",
        templateId: "TPL-01",
        prefix: "ACME-CN",
        nextSequence: 221,
        paymentTermsOverrideEnabled: false,
        status: "Active",
        lastInvoicedAt: now - 8 * 24 * 60 * 60 * 1000,
        nextInvoiceAt: now + 1 * 24 * 60 * 60 * 1000,
        notes: "Separate legal entity stream.",
      },
    ];
  });

  // Premium simulation dataset (editable per group)
  const defaultLines = useMemo(() => {
    const mk = (id: string, desc: string, mod: string, amt: number, mkt?: string): LineItem => ({
      id,
      description: desc,
      module: mod,
      marketplace: mkt,
      amountUGX: amt,
    });

    return {
      "IG-MAIN-UG": [
        mk("L1", "Corporate rides", "Rides & Logistics", 8200000),
        mk("L2", "EV charging credits", "EVs & Charging", 4100000),
        mk("L3", "EVmart purchases", "E-Commerce", 2400000, "EVmart"),
        mk("L4", "MyLiveDealz deals", "E-Commerce", 3100000, "MyLiveDealz"),
      ],
      "IG-SALES-TRAVEL": [
        mk("L1", "Sales travel rides", "Rides & Logistics", 5200000),
      ],
      "IG-CN-PROC": [
        mk("L1", "GadgetMart procurement", "E-Commerce", 6000000, "GadgetMart"),
        mk("L2", "ExpressMart logistics", "E-Commerce", 1100000, "ExpressMart"),
      ],
    } as Record<string, LineItem[]>;
  }, []);

  const [simMonth, setSimMonth] = useState(() => {
    const now = new Date();
    const next = new Date(now);
    next.setMonth(next.getMonth() + 1);
    return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
  });

  const [simIncludeVat, setSimIncludeVat] = useState(true);
  const [simLinesByGroup, setSimLinesByGroup] = useState<Record<string, LineItem[]>>(() => JSON.parse(JSON.stringify(defaultLines)));

  // Selection
  const [entityModalOpen, setEntityModalOpen] = useState(false);
  const [entityDraft, setEntityDraft] = useState<Entity>(() => ({
    id: "",
    name: "",
    legalName: "",
    country: "",
    city: "",
    address1: "",
    address2: "",
    currency: "UGX",
    taxId: "",
    vatNo: "",
    vatEnabled: true,
    vatRatePct: 18,
    vatInclusive: false,
    billingEmail: "",
    phone: "",
    isPrimary: false,
  }));

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<InvoiceTemplate>(() => ({
    id: "",
    name: "",
    brandName: "EVzone CorporatePay",
    accent: EVZ.green,
    showLogo: true,
    headerNote: "",
    footerText: "",
    paymentInstructions: "",
    showVatLine: true,
    layout: "Modern",
  }));

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [groupDraft, setGroupDraft] = useState<InvoiceGroup>(() => ({
    id: "",
    name: "",
    entityId: "ENT-UG",
    frequency: "Monthly",
    customRule: "",
    apTo: "",
    apCc: "",
    costCode: "",
    templateId: "TPL-01",
    prefix: "INV",
    nextSequence: 1,
    paymentTermsOverrideEnabled: false,
    paymentTermsOverride: undefined,
    status: "Active",
    notes: "",
  }));

  const [previewGroupId, setPreviewGroupId] = useState<string>(() => invoiceGroups[0]?.id || "");

  const [termsOverrideModalOpen, setTermsOverrideModalOpen] = useState(false);
  const [termsOverrideDraft, setTermsOverrideDraft] = useState<PaymentTerms>({ ...terms });

  // Derived
  const entityById = useMemo(() => {
    const m: Record<string, Entity> = {};
    entities.forEach((e) => (m[e.id] = e));
    return m;
  }, [entities]);

  const templateById = useMemo(() => {
    const m: Record<string, InvoiceTemplate> = {};
    templates.forEach((t) => (m[t.id] = t));
    return m;
  }, [templates]);

  const groupById = useMemo(() => {
    const m: Record<string, InvoiceGroup> = {};
    invoiceGroups.forEach((g) => (m[g.id] = g));
    return m;
  }, [invoiceGroups]);

  const nextInvoiceDate = useMemo(() => {
    const dates = invoiceGroups
      .filter((g) => g.status === "Active" && g.nextInvoiceAt)
      .map((g) => g.nextInvoiceAt as number)
      .sort((a, b) => a - b);
    return dates.length ? new Date(dates[0]) : null;
  }, [invoiceGroups]);

  const simInvoices: SimInvoice[] = useMemo(() => {
    return invoiceGroups
      .filter((g) => g.status === "Active")
      .map((g) => {
        const entity = entityById[g.entityId];
        const lines = simLinesByGroup[g.id] || [];
        const cycles = cyclesForFrequency(g.frequency, simMonth);

        let subtotal = 0;
        let vat = 0;
        for (const l of lines) {
          const t = vatForAmount(entity, l.amountUGX);
          subtotal += t.subtotal;
          vat += t.vat;
        }

        const issue = issueDateForFrequency(g.frequency, simMonth);
        const useTerms = g.paymentTermsOverrideEnabled && g.paymentTermsOverride ? g.paymentTermsOverride : terms;
        const due = computeDueDate(issue, useTerms);

        const monthSubtotal = subtotal;
        const monthVat = simIncludeVat ? vat : 0;
        const monthTotal = monthSubtotal + monthVat;

        const perCycleSubtotal = Math.round(monthSubtotal / Math.max(1, cycles));
        const perCycleVat = Math.round(monthVat / Math.max(1, cycles));
        const perCycleTotal = perCycleSubtotal + perCycleVat;

        const seq = g.nextSequence;
        const invNo = `${g.prefix}-${simMonth.replace("-", "")}-${String(seq).padStart(4, "0")}`;

        return {
          invoiceGroupId: g.id,
          entityId: g.entityId,
          month: simMonth,
          cyclesInMonth: cycles,
          monthSubtotal,
          monthVat,
          monthTotal,
          perCycleSubtotal,
          perCycleVat,
          perCycleTotal,
          invoiceNoPreview: invNo,
          issueDate: issue,
          dueDate: due,
          lineItems: lines,
        };
      })
      .sort((a, b) => a.entityId.localeCompare(b.entityId) || a.invoiceGroupId.localeCompare(b.invoiceGroupId));
  }, [invoiceGroups, entityById, simLinesByGroup, simMonth, simIncludeVat, terms]);

  const estimatedMonthTotal = useMemo(() => simInvoices.reduce((a, b) => a + b.monthTotal, 0), [simInvoices]);

  // Actions
  const exportJSON = () => {
    const payload = {
      entities,
      templates,
      invoiceGroups,
      paymentTerms: terms,
      simulation: { month: simMonth, includeVat: simIncludeVat, linesByGroup: simLinesByGroup },
      exportedAt: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    const blob = new Blob([text], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-billing-setup.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Downloaded billing configuration.", kind: "success" });
  };

  const saveDraft = () => toast({ title: "Saved", message: "Billing setup saved (demo).", kind: "success" });

  const openNewEntity = () => {
    setEntityDraft({
      id: "",
      name: "",
      legalName: "",
      country: "",
      city: "",
      address1: "",
      address2: "",
      currency: "UGX",
      taxId: "",
      vatNo: "",
      vatEnabled: true,
      vatRatePct: 18,
      vatInclusive: false,
      billingEmail: "",
      phone: "",
      isPrimary: false,
    });
    setEntityModalOpen(true);
  };

  const openEditEntity = (e: Entity) => {
    setEntityDraft(JSON.parse(JSON.stringify(e)));
    setEntityModalOpen(true);
  };

  const saveEntity = () => {
    if (!entityDraft.name.trim() || !entityDraft.legalName.trim() || !entityDraft.country.trim()) {
      toast({ title: "Missing fields", message: "Entity name, legal name, and country are required.", kind: "warn" });
      return;
    }
    const id = entityDraft.id || uid("ENT");
    setEntities((prev) => {
      let next = prev.slice();
      if (entityDraft.isPrimary) next = next.map((x) => ({ ...x, isPrimary: false }));
      const idx = next.findIndex((x) => x.id === id);
      const row: Entity = { ...entityDraft, id };
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });
    toast({ title: "Saved", message: "Entity saved.", kind: "success" });
    setEntityModalOpen(false);
  };

  const deleteEntity = (id: string) => {
    const e = entities.find((x) => x.id === id);
    if (e?.isPrimary) {
      toast({ title: "Blocked", message: "You cannot delete the primary entity.", kind: "warn" });
      return;
    }
    const used = invoiceGroups.some((g) => g.entityId === id);
    if (used) {
      toast({ title: "Blocked", message: "Entity is used by an invoice group.", kind: "warn" });
      return;
    }
    setEntities((p) => p.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Entity deleted.", kind: "info" });
  };

  const openNewTemplate = () => {
    setTemplateDraft({
      id: "",
      name: "",
      brandName: "EVzone CorporatePay",
      accent: EVZ.green,
      showLogo: true,
      headerNote: "",
      footerText: "",
      paymentInstructions: "Pay via bank transfer. Reference the invoice number.",
      showVatLine: true,
      layout: "Modern",
    });
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (t: InvoiceTemplate) => {
    setTemplateDraft(JSON.parse(JSON.stringify(t)));
    setTemplateModalOpen(true);
  };

  const saveTemplate = () => {
    if (!templateDraft.name.trim()) {
      toast({ title: "Missing name", message: "Template name is required.", kind: "warn" });
      return;
    }
    const id = templateDraft.id || uid("TPL");
    const row: InvoiceTemplate = { ...templateDraft, id };
    setTemplates((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((x) => x.id === id);
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });
    toast({ title: "Saved", message: "Template saved.", kind: "success" });
    setTemplateModalOpen(false);
  };

  const deleteTemplate = (id: string) => {
    const used = invoiceGroups.some((g) => g.templateId === id);
    if (used) {
      toast({ title: "Blocked", message: "Template is used by an invoice group.", kind: "warn" });
      return;
    }
    setTemplates((p) => p.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Template deleted.", kind: "info" });
  };

  const duplicateTemplate = (id: string) => {
    const src = templates.find((t) => t.id === id);
    if (!src) return;
    const copy: InvoiceTemplate = { ...JSON.parse(JSON.stringify(src)), id: uid("TPL"), name: `${src.name} (Copy)` };
    setTemplates((p) => [copy, ...p]);
    toast({ title: "Duplicated", message: "Template duplicated.", kind: "success" });
  };

  const openNewGroup = () => {
    setGroupDraft({
      id: "",
      name: "",
      entityId: entities.find((e) => e.isPrimary)?.id || entities[0]?.id || "",
      frequency: "Monthly",
      customRule: "",
      apTo: "",
      apCc: "",
      costCode: "",
      templateId: templates[0]?.id || "",
      prefix: "INV",
      nextSequence: 1,
      paymentTermsOverrideEnabled: false,
      paymentTermsOverride: undefined,
      status: "Active",
      notes: "",
    });
    setGroupModalOpen(true);
  };

  const openEditGroup = (g: InvoiceGroup) => {
    setGroupDraft(JSON.parse(JSON.stringify(g)));
    setGroupModalOpen(true);
  };

  const saveGroup = () => {
    if (!groupDraft.name.trim() || !groupDraft.apTo.trim() || !groupDraft.costCode.trim()) {
      toast({ title: "Missing fields", message: "Group name, AP recipient, and cost code are required.", kind: "warn" });
      return;
    }
    const id = groupDraft.id || uid("IG");
    const row: InvoiceGroup = { ...groupDraft, id };

    // ensure override terms exist if enabled
    if (row.paymentTermsOverrideEnabled && !row.paymentTermsOverride) {
      row.paymentTermsOverride = { ...terms };
    }

    setInvoiceGroups((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((x) => x.id === id);
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });
    toast({ title: "Saved", message: "Invoice group saved.", kind: "success" });
    setGroupModalOpen(false);
  };

  const deleteGroup = (id: string) => {
    setInvoiceGroups((p) => p.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Invoice group deleted.", kind: "info" });
  };

  const cloneGroup = (id: string) => {
    const src = invoiceGroups.find((g) => g.id === id);
    if (!src) return;
    const copy: InvoiceGroup = { ...JSON.parse(JSON.stringify(src)), id: uid("IG"), name: `${src.name} (Copy)`, nextSequence: 1 };
    setInvoiceGroups((p) => [copy, ...p]);
    toast({ title: "Cloned", message: "Invoice group cloned.", kind: "success" });
  };

  const toggleGroupPause = (id: string) => {
    setInvoiceGroups((prev) => prev.map((g) => (g.id === id ? { ...g, status: g.status === "Active" ? "Paused" : "Active" } : g)));
    toast({ title: "Updated", message: "Invoice group status updated.", kind: "info" });
  };

  const openTermsOverride = () => {
    const g = groupById[groupDraft.id || ""];
    const initial = groupDraft.paymentTermsOverride || (g?.paymentTermsOverride ?? terms);
    setTermsOverrideDraft({ ...initial });
    setTermsOverrideModalOpen(true);
  };

  const applyTermsOverrideToDraft = () => {
    setGroupDraft((p) => ({ ...p, paymentTermsOverride: { ...termsOverrideDraft }, paymentTermsOverrideEnabled: true }));
    setTermsOverrideModalOpen(false);
    toast({ title: "Applied", message: "Payment terms override applied to group draft.", kind: "success" });
  };

  const editSimLine = (groupId: string, lineId: string, patch: Partial<LineItem>) => {
    setSimLinesByGroup((prev) => {
      const next = { ...prev };
      const lines = (next[groupId] || []).map((l) => (l.id === lineId ? { ...l, ...patch } : l));
      next[groupId] = lines;
      return next;
    });
  };

  const addSimLine = (groupId: string) => {
    setSimLinesByGroup((prev) => {
      const next = { ...prev };
      const lines = next[groupId] ? next[groupId].slice() : [];
      lines.push({ id: uid("LI"), description: "New line", module: "Rides & Logistics", marketplace: "", amountUGX: 0 });
      next[groupId] = lines;
      return next;
    });
  };

  const removeSimLine = (groupId: string, lineId: string) => {
    setSimLinesByGroup((prev) => {
      const next = { ...prev };
      next[groupId] = (next[groupId] || []).filter((l) => l.id !== lineId);
      return next;
    });
  };

  const copySimulationJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(simInvoices, null, 2));
      toast({ title: "Copied", message: "Simulation JSON copied to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  // Preview
  const previewInvoice = useMemo(() => {
    const g = invoiceGroups.find((x) => x.id === previewGroupId) || invoiceGroups[0];
    if (!g) return null;
    const e = entityById[g.entityId] || entities[0];
    const t = templateById[g.templateId] || templates[0];
    const inv = simInvoices.find((x) => x.invoiceGroupId === g.id);
    const invoiceNo = inv?.invoiceNoPreview || `${g.prefix}-${simMonth.replace("-", "")}-${String(g.nextSequence).padStart(4, "0")}`;
    const issueDate = inv?.issueDate || issueDateForFrequency(g.frequency, simMonth);
    const dueDate = inv?.dueDate || computeDueDate(issueDate, g.paymentTermsOverrideEnabled && g.paymentTermsOverride ? g.paymentTermsOverride : terms);
    const lines = inv?.lineItems || simLinesByGroup[g.id] || [];
    const useTerms = g.paymentTermsOverrideEnabled && g.paymentTermsOverride ? g.paymentTermsOverride : terms;
    return { entity: e, template: t, invoiceNo, issueDate, dueDate, terms: useTerms, lines };
  }, [previewGroupId, invoiceGroups, entityById, templateById, entities, templates, simInvoices, simMonth, simLinesByGroup, terms]);

  const termsLabel = useMemo(() => {
    if (terms.mode === "DueOnReceipt") return "Due on receipt";
    if (terms.mode === "EOM") return "Due end of month";
    return `Net ${terms.netDays}`;
  }, [terms]);

  const entityOptions = useMemo(() => entities.map((e) => e.id), [entities]);

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
                  <div className="text-sm font-semibold text-slate-900">Billing Setup and Invoice Groups</div>
                  <div className="mt-1 text-xs text-slate-500">Invoice schedules, invoice groups, multi-entity tax settings, branded templates, and invoice simulations.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Entities: ${entities.length}`} tone="neutral" />
                    <Pill label={`Invoice groups: ${invoiceGroups.length}`} tone="neutral" />
                    <Pill label={`Terms: ${termsLabel}`} tone="info" />
                    {nextInvoiceDate ? <Pill label={`Next invoice: ${fmtDate(nextInvoiceDate)}`} tone="neutral" /> : <Pill label="No upcoming invoices" tone="warn" />}
                    <Pill label={`Next month estimate: ${formatUGX(estimatedMonthTotal)}`} tone={estimatedMonthTotal > 0 ? "good" : "neutral"} />
                    <Pill label="Premium simulations" tone="info" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="outline" onClick={saveDraft}>
                  <Save className="h-4 w-4" /> Save
                </Button>
                <Button variant="outline" onClick={copySimulationJSON}>
                  <Copy className="h-4 w-4" /> Copy simulation
                </Button>
                <Button variant="outline" onClick={openNewTemplate}>
                  <Palette className="h-4 w-4" /> New template
                </Button>
                <Button variant="primary" onClick={openNewGroup}>
                  <Plus className="h-4 w-4" /> New invoice group
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "invoiceGroups", label: "Invoice groups" },
                { id: "entities", label: "Entities and tax" },
                { id: "templates", label: "Templates" },
                { id: "simulation", label: "Billing simulation" },
                { id: "terms", label: "Payment terms" },
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
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="lg:col-span-7 space-y-4">
                <AnimatePresence mode="wait">
                  {tab === "invoiceGroups" ? (
                    <motion.div key="invoiceGroups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Invoice groups"
                        subtitle="Different AP recipients, cost codes, templates, and frequencies. Each group is tied to a legal entity stream."
                        right={
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" onClick={openNewGroup}>
                              <Plus className="h-4 w-4" /> Add
                            </Button>
                          </div>
                        }
                      >
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Group</th>
                                <th className="px-4 py-3 font-semibold">Entity</th>
                                <th className="px-4 py-3 font-semibold">Frequency</th>
                                <th className="px-4 py-3 font-semibold">AP recipients</th>
                                <th className="px-4 py-3 font-semibold">Cost code</th>
                                <th className="px-4 py-3 font-semibold">Template</th>
                                <th className="px-4 py-3 font-semibold">Status</th>
                                <th className="px-4 py-3 font-semibold">Next invoice</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceGroups.map((g) => {
                                const e = entityById[g.entityId];
                                const t = templateById[g.templateId];
                                return (
                                  <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{g.name}</div>
                                      <div className="mt-1 text-xs text-slate-500">{g.prefix} • Seq {g.nextSequence}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{e ? e.name : g.entityId}</td>
                                    <td className="px-4 py-3">
                                      <Pill label={g.frequency} tone="neutral" />
                                      {g.frequency === "Custom" && g.customRule ? <div className="mt-1 text-xs text-slate-500">{g.customRule}</div> : null}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      <div className="text-xs">To: <span className="font-semibold">{g.apTo}</span></div>
                                      {g.apCc ? <div className="mt-1 text-xs text-slate-500">CC: {g.apCc}</div> : null}
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{g.costCode}</td>
                                    <td className="px-4 py-3 text-slate-700">{t ? t.name : g.templateId}</td>
                                    <td className="px-4 py-3">
                                      <Pill label={g.status} tone={g.status === "Active" ? "good" : "warn"} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">
                                      {g.nextInvoiceAt ? (
                                        <>
                                          <div className="text-sm font-semibold text-slate-900">{fmtDate(new Date(g.nextInvoiceAt))}</div>
                                          <div className="mt-1 text-xs text-slate-500">Last: {g.lastInvoicedAt ? fmtDate(new Date(g.lastInvoicedAt)) : "-"}</div>
                                        </>
                                      ) : (
                                        <div className="text-xs text-slate-500">-</div>
                                      )}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setPreviewGroupId(g.id); toast({ title: "Preview", message: "Invoice preview updated.", kind: "info" }); }}>
                                          <FileText className="h-4 w-4" /> Preview
                                        </Button>
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditGroup(g)}>
                                          <Pencil className="h-4 w-4" /> Edit
                                        </Button>
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => cloneGroup(g.id)}>
                                          <Layers className="h-4 w-4" /> Clone
                                        </Button>
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toggleGroupPause(g.id)}>
                                          {g.status === "Active" ? "Pause" : "Activate"}
                                        </Button>
                                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteGroup(g.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                              {!invoiceGroups.length ? (
                                <tr>
                                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-slate-600">No invoice groups configured.</td>
                                </tr>
                              ) : null}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: each legal entity can have separate invoice streams. Use different invoice groups tied to each entity.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {tab === "entities" ? (
                    <motion.div key="entities" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Entities and tax, VAT"
                        subtitle="Tax and VAT settings are per entity or branch."
                        right={<Button variant="primary" onClick={openNewEntity}><Plus className="h-4 w-4" /> Add entity</Button>}
                      >
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Entity</th>
                                <th className="px-4 py-3 font-semibold">Country</th>
                                <th className="px-4 py-3 font-semibold">Currency</th>
                                <th className="px-4 py-3 font-semibold">Tax ID</th>
                                <th className="px-4 py-3 font-semibold">VAT</th>
                                <th className="px-4 py-3 font-semibold">Billing contact</th>
                                <th className="px-4 py-3 font-semibold">Primary</th>
                                <th className="px-4 py-3 font-semibold">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {entities.map((e) => (
                                <tr key={e.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900">{e.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">{e.legalName}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{e.country}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.currency}</td>
                                  <td className="px-4 py-3 text-slate-700">{e.taxId || "-"}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Pill label={e.vatEnabled ? "VAT on" : "VAT off"} tone={e.vatEnabled ? "good" : "neutral"} />
                                      {e.vatEnabled ? <Pill label={`${e.vatRatePct}%`} tone="info" /> : null}
                                      {e.vatEnabled ? <Pill label={e.vatInclusive ? "Inclusive" : "Exclusive"} tone="neutral" /> : null}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{e.billingEmail || "-"}</td>
                                  <td className="px-4 py-3">{e.isPrimary ? <Pill label="Primary" tone="good" /> : <Pill label="No" tone="neutral" />}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditEntity(e)}>
                                        <Pencil className="h-4 w-4" /> Edit
                                      </Button>
                                      <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteEntity(e.id)}>
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                          Tip: VAT inclusive means VAT is included in item amounts. VAT exclusive adds VAT on top.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {tab === "templates" ? (
                    <motion.div key="templates" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Invoice templates"
                        subtitle="Premium: branded templates per invoice group."
                        right={<Button variant="primary" onClick={openNewTemplate}><Plus className="h-4 w-4" /> New</Button>}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                          {templates.map((t) => (
                            <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                                    <Pill label={t.layout} tone="neutral" />
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: t.accent }} />
                                      Accent
                                    </span>
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">Brand: {t.brandName}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill label={t.showVatLine ? "VAT line" : "No VAT line"} tone={t.showVatLine ? "info" : "neutral"} />
                                    <Pill label={t.showLogo ? "Logo" : "No logo"} tone={t.showLogo ? "good" : "neutral"} />
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditTemplate(t)}>
                                    <Pencil className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => duplicateTemplate(t.id)}>
                                    <Layers className="h-4 w-4" /> Duplicate
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteTemplate(t.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              {t.headerNote ? <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">{t.headerNote}</div> : null}
                            </div>
                          ))}
                        </div>

                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: assign templates per invoice group for separate branded streams.
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {tab === "simulation" ? (
                    <motion.div key="simulation" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Billing simulation"
                        subtitle="Premium: what would next month invoice look like by invoice group and entity."
                        right={<Pill label="Premium" tone="info" />}
                      >
                        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                          <Field label="Simulation month" value={simMonth} onChange={setSimMonth} placeholder="YYYY-MM" hint="Example: 2026-02" />
                          <Toggle enabled={simIncludeVat} onChange={setSimIncludeVat} label="Include VAT" description="Uses entity VAT settings" />
                          <div className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="text-xs font-semibold text-slate-500">Estimate</div>
                            <div className="mt-1 text-2xl font-semibold text-slate-900">{formatUGX(estimatedMonthTotal)}</div>
                            <div className="mt-1 text-xs text-slate-600">All entities combined</div>
                          </div>
                        </div>

                        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Entity</th>
                                <th className="px-4 py-3 font-semibold">Invoice group</th>
                                <th className="px-4 py-3 font-semibold">Frequency</th>
                                <th className="px-4 py-3 font-semibold">Cycles</th>
                                <th className="px-4 py-3 font-semibold">Month total</th>
                                <th className="px-4 py-3 font-semibold">Per-cycle estimate</th>
                                <th className="px-4 py-3 font-semibold">Invoice preview</th>
                              </tr>
                            </thead>
                            <tbody>
                              {simInvoices.map((s) => {
                                const g = groupById[s.invoiceGroupId];
                                const e = entityById[s.entityId];
                                return (
                                  <tr key={`${s.invoiceGroupId}-${s.entityId}`} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-4 py-3 text-slate-700">{e?.name || s.entityId}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{g?.name || s.invoiceGroupId}</div>
                                      <div className="mt-1 text-xs text-slate-500">Cost code: {g?.costCode || "-"}</div>
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{g?.frequency || "-"}</td>
                                    <td className="px-4 py-3 text-slate-700">{s.cyclesInMonth}</td>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{formatUGX(s.monthTotal)}</div>
                                      {simIncludeVat ? <div className="mt-1 text-xs text-slate-500">VAT: {formatUGX(s.monthVat)}</div> : <div className="mt-1 text-xs text-slate-500">VAT not included</div>}
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="font-semibold text-slate-900">{formatUGX(s.perCycleTotal)}</div>
                                      <div className="mt-1 text-xs text-slate-500">Issue: {fmtDate(s.issueDate)} • Due: {fmtDate(s.dueDate)}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setPreviewGroupId(s.invoiceGroupId)}>
                                          <FileText className="h-4 w-4" /> Preview
                                        </Button>
                                        <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { addSimLine(s.invoiceGroupId); toast({ title: "Added", message: "Line item added.", kind: "success" }); }}>
                                          <Plus className="h-4 w-4" /> Line
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Edit line items</div>
                              <div className="mt-1 text-xs text-slate-500">Adjust forecast inputs. Totals update automatically.</div>
                            </div>
                            <Pill label={previewGroupId || "Select a group"} tone="info" />
                          </div>

                          {previewGroupId ? (
                            <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                              <table className="min-w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-600">
                                  <tr>
                                    <th className="px-4 py-3 font-semibold">Description</th>
                                    <th className="px-4 py-3 font-semibold">Module</th>
                                    <th className="px-4 py-3 font-semibold">Marketplace</th>
                                    <th className="px-4 py-3 font-semibold">Amount</th>
                                    <th className="px-4 py-3 font-semibold">Actions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {(simLinesByGroup[previewGroupId] || []).map((l) => (
                                    <tr key={l.id} className="border-t border-slate-100">
                                      <td className="px-4 py-3">
                                        <input
                                          value={l.description}
                                          onChange={(e) => editSimLine(previewGroupId, l.id, { description: e.target.value })}
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          value={l.module}
                                          onChange={(e) => editSimLine(previewGroupId, l.id, { module: e.target.value })}
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          value={l.marketplace || ""}
                                          onChange={(e) => editSimLine(previewGroupId, l.id, { marketplace: e.target.value })}
                                          placeholder="Optional"
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <input
                                          type="number"
                                          value={l.amountUGX}
                                          onChange={(e) => editSimLine(previewGroupId, l.id, { amountUGX: Number(e.target.value || 0) })}
                                          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                                        />
                                      </td>
                                      <td className="px-4 py-3">
                                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => removeSimLine(previewGroupId, l.id)}>
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </td>
                                    </tr>
                                  ))}
                                  {!(simLinesByGroup[previewGroupId] || []).length ? (
                                    <tr>
                                      <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-600">No line items. Add one above.</td>
                                    </tr>
                                  ) : null}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="mt-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                              Select an invoice group to edit its simulation inputs.
                            </div>
                          )}
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}

                  {tab === "terms" ? (
                    <motion.div key="terms" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                      <Section
                        title="Payment terms"
                        subtitle="Global default terms. Invoice groups can override if needed."
                        right={<Pill label="Core" tone="neutral" />}
                      >
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <Select
                            label="Mode"
                            value={terms.mode}
                            onChange={(v) => setTerms((p) => ({ ...p, mode: v as PaymentTermMode }))}
                            options={["Net", "DueOnReceipt", "EOM"]}
                            hint="Due date rule"
                          />
                          <NumberField
                            label="Net days"
                            value={terms.netDays}
                            onChange={(v) => setTerms((p) => ({ ...p, netDays: Math.max(0, v) }))}
                            disabled={terms.mode !== "Net"}
                            hint={terms.mode !== "Net" ? "Not used" : "Applies to all groups"}
                          />
                          <NumberField
                            label="Early discount percent"
                            value={terms.earlyDiscountPct}
                            onChange={(v) => setTerms((p) => ({ ...p, earlyDiscountPct: clamp(v, 0, 100) }))}
                            hint="Optional"
                          />
                          <NumberField
                            label="Early discount days"
                            value={terms.earlyDiscountDays}
                            onChange={(v) => setTerms((p) => ({ ...p, earlyDiscountDays: Math.max(0, v) }))}
                            disabled={terms.earlyDiscountPct <= 0}
                            hint="Optional"
                          />
                          <div className="md:col-span-2">
                            <TextArea
                              label="Late fee text"
                              value={terms.lateFeeText}
                              onChange={(v) => setTerms((p) => ({ ...p, lateFeeText: v }))}
                              placeholder="Late fees apply..."
                              rows={3}
                            />
                          </div>
                        </div>

                        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: invoice groups can have different terms if required by a specific AP desk.
                        </div>
                      </Section>

                      <Section title="Group overrides" subtitle="View and edit overrides by invoice group." right={<Pill label="Premium" tone="info" /> }>
                        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">Invoice group</th>
                                <th className="px-4 py-3 font-semibold">Override</th>
                                <th className="px-4 py-3 font-semibold">Terms</th>
                                <th className="px-4 py-3 font-semibold">Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {invoiceGroups.map((g) => {
                                const useTerms = g.paymentTermsOverrideEnabled && g.paymentTermsOverride ? g.paymentTermsOverride : terms;
                                const label = useTerms.mode === "DueOnReceipt" ? "Due on receipt" : useTerms.mode === "EOM" ? "EOM" : `Net ${useTerms.netDays}`;
                                return (
                                  <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-semibold text-slate-900">{g.name}</td>
                                    <td className="px-4 py-3">
                                      <Pill label={g.paymentTermsOverrideEnabled ? "Yes" : "No"} tone={g.paymentTermsOverrideEnabled ? "info" : "neutral"} />
                                    </td>
                                    <td className="px-4 py-3 text-slate-700">{label}</td>
                                    <td className="px-4 py-3">
                                      <Button
                                        variant="outline"
                                        className="px-3 py-2 text-xs"
                                        onClick={() => {
                                          setGroupDraft(JSON.parse(JSON.stringify(g)));
                                          setTermsOverrideDraft({ ...(g.paymentTermsOverride || terms) });
                                          setTermsOverrideModalOpen(true);
                                          setGroupModalOpen(true);
                                          toast({ title: "Edit", message: "Edit group and apply override.", kind: "info" });
                                        }}
                                      >
                                        <Pencil className="h-4 w-4" /> Edit
                                      </Button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </Section>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Right rail: preview */}
              <div className="lg:col-span-5 space-y-4">
                <Section title="Invoice preview" subtitle="Branded template preview for the selected invoice group." right={<Pill label="Premium" tone="info" />}>
                  <div className="grid grid-cols-1 gap-3">
                    <Select
                      label="Preview invoice group"
                      value={previewGroupId}
                      onChange={setPreviewGroupId}
                      options={invoiceGroups.map((g) => g.id)}
                      hint="Choose a group"
                    />
                    {previewInvoice ? (
                      <InvoicePreview
                        entity={previewInvoice.entity}
                        template={previewInvoice.template}
                        invoiceNo={previewInvoice.invoiceNo}
                        issueDate={previewInvoice.issueDate}
                        dueDate={previewInvoice.dueDate}
                        terms={previewInvoice.terms}
                        lines={previewInvoice.lines}
                      />
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No preview available.</div>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => toast({ title: "PDF", message: "In production, this exports PDF.", kind: "info" })}>
                      <FileText className="h-4 w-4" /> Export PDF
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Send", message: "In production, this sends to AP recipients.", kind: "info" })}>
                      <Mail className="h-4 w-4" /> Send test
                    </Button>
                    <Button variant="outline" onClick={() => toast({ title: "Numbering", message: "Invoice number preview is based on prefix and sequence.", kind: "info" })}>
                      <Hash className="h-4 w-4" /> Numbering
                    </Button>
                  </div>
                </Section>

                <Section title="Premium billing simulation" subtitle="How next month could look per entity and invoice group." right={<Sparkles className="h-5 w-5 text-emerald-700" />}>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    <ul className="space-y-1">
                      <li>1) Uses VAT settings per entity</li>
                      <li>2) Uses frequency to estimate cycles per month</li>
                      <li>3) Uses payment terms to compute due date</li>
                      <li>4) Uses template and invoice group prefix for number preview</li>
                    </ul>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="primary" onClick={() => setTab("simulation")}>
                      <CalendarClock className="h-4 w-4" /> Open simulation
                    </Button>
                    <Button variant="outline" onClick={() => setTab("templates")}>
                      <Palette className="h-4 w-4" /> Edit templates
                    </Button>
                  </div>
                </Section>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              N Billing Setup and Invoice Groups v2: invoice frequency, invoice groups, entity tax and VAT, payment terms, branded templates, multi-entity invoice streams, and next month billing simulations.
            </div>
          </div>
        </div>
      </div>

      {/* Entity modal */}
      <Modal
        open={entityModalOpen}
        title={entityDraft.id ? "Edit entity" : "New entity"}
        subtitle="Tax and VAT settings are configured per entity or branch."
        onClose={() => setEntityModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setEntityModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveEntity}><BadgeCheck className="h-4 w-4" /> Save</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Entity name" value={entityDraft.name} onChange={(v) => setEntityDraft((p) => ({ ...p, name: v }))} placeholder="Uganda HQ" />
          <Field label="Legal name" value={entityDraft.legalName} onChange={(v) => setEntityDraft((p) => ({ ...p, legalName: v }))} placeholder="Legal registered name" />
          <Field label="Country" value={entityDraft.country} onChange={(v) => setEntityDraft((p) => ({ ...p, country: v }))} placeholder="Uganda" />
          <Field label="City" value={entityDraft.city} onChange={(v) => setEntityDraft((p) => ({ ...p, city: v }))} placeholder="Kampala" />
          <Field label="Address line 1" value={entityDraft.address1} onChange={(v) => setEntityDraft((p) => ({ ...p, address1: v }))} placeholder="Street, building" />
          <Field label="Address line 2" value={entityDraft.address2} onChange={(v) => setEntityDraft((p) => ({ ...p, address2: v }))} placeholder="Suite, floor" />
          <Select label="Currency" value={entityDraft.currency} onChange={(v) => setEntityDraft((p) => ({ ...p, currency: v as any }))} options={["UGX", "USD", "EUR", "CNY"]} />
          <Field label="Billing email" value={entityDraft.billingEmail} onChange={(v) => setEntityDraft((p) => ({ ...p, billingEmail: v }))} placeholder="ap@company.com" />
          <Field label="Phone" value={entityDraft.phone} onChange={(v) => setEntityDraft((p) => ({ ...p, phone: v }))} placeholder="+256..." />
          <Field label="Tax ID" value={entityDraft.taxId} onChange={(v) => setEntityDraft((p) => ({ ...p, taxId: v }))} placeholder="TIN..." />
          <Field label="VAT number" value={entityDraft.vatNo} onChange={(v) => setEntityDraft((p) => ({ ...p, vatNo: v }))} placeholder="VAT..." />
          <Toggle enabled={entityDraft.vatEnabled} onChange={(v) => setEntityDraft((p) => ({ ...p, vatEnabled: v }))} label="VAT enabled" description="If off, VAT line can be hidden" />
          <NumberField label="VAT rate percent" value={entityDraft.vatRatePct} onChange={(v) => setEntityDraft((p) => ({ ...p, vatRatePct: clamp(v, 0, 100) }))} disabled={!entityDraft.vatEnabled} />
          <Toggle enabled={entityDraft.vatInclusive} onChange={(v) => setEntityDraft((p) => ({ ...p, vatInclusive: v }))} label="VAT inclusive" description="If on, VAT is included in amounts" />
          <Toggle enabled={entityDraft.isPrimary} onChange={(v) => setEntityDraft((p) => ({ ...p, isPrimary: v }))} label="Primary entity" description="Used for defaults" />
        </div>
      </Modal>

      {/* Template modal */}
      <Modal
        open={templateModalOpen}
        title={templateDraft.id ? "Edit template" : "New template"}
        subtitle="Premium: branded invoice templates per invoice group."
        onClose={() => setTemplateModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            <div className="flex items-center gap-2">
              <Button variant="primary" onClick={saveTemplate}><BadgeCheck className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Template name" value={templateDraft.name} onChange={(v) => setTemplateDraft((p) => ({ ...p, name: v }))} placeholder="Default modern" />
          <Field label="Brand name" value={templateDraft.brandName} onChange={(v) => setTemplateDraft((p) => ({ ...p, brandName: v }))} placeholder="EVzone CorporatePay" />
          <Select label="Layout" value={templateDraft.layout} onChange={(v) => setTemplateDraft((p) => ({ ...p, layout: v as any }))} options={["Modern", "Classic"]} />
          <Select
            label="Accent color"
            value={templateDraft.accent}
            onChange={(v) => setTemplateDraft((p) => ({ ...p, accent: v }))}
            options={[EVZ.green, EVZ.orange, "#2563EB", "#0F172A", "#7C3AED"]}
            hint="Pick a preset"
          />
          <Toggle enabled={templateDraft.showLogo} onChange={(v) => setTemplateDraft((p) => ({ ...p, showLogo: v }))} label="Show logo" />
          <Toggle enabled={templateDraft.showVatLine} onChange={(v) => setTemplateDraft((p) => ({ ...p, showVatLine: v }))} label="Show VAT line" />
          <div className="md:col-span-2">
            <TextArea label="Header note" value={templateDraft.headerNote} onChange={(v) => setTemplateDraft((p) => ({ ...p, headerNote: v }))} placeholder="Optional note" rows={3} />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Payment instructions" value={templateDraft.paymentInstructions} onChange={(v) => setTemplateDraft((p) => ({ ...p, paymentInstructions: v }))} placeholder="How to pay" rows={3} />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Footer text" value={templateDraft.footerText} onChange={(v) => setTemplateDraft((p) => ({ ...p, footerText: v }))} placeholder="Footer" rows={3} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Tip: set different templates for different AP recipients using invoice groups.
          </div>
        </div>
      </Modal>

      {/* Invoice group modal */}
      <Modal
        open={groupModalOpen}
        title={groupDraft.id ? "Edit invoice group" : "New invoice group"}
        subtitle="Frequency, AP recipients, cost codes, templates, and per-group terms."
        onClose={() => setGroupModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setGroupModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {groupDraft.id ? (
                <Button variant="danger" onClick={() => { deleteGroup(groupDraft.id); setGroupModalOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveGroup}><BadgeCheck className="h-4 w-4" /> Save</Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Group name" value={groupDraft.name} onChange={(v) => setGroupDraft((p) => ({ ...p, name: v }))} placeholder="Main corporate" />
          <Select
            label="Entity stream"
            value={groupDraft.entityId}
            onChange={(v) => setGroupDraft((p) => ({ ...p, entityId: v }))}
            options={entityOptions}
            hint="Separate streams per entity"
          />
          <Select
            label="Frequency"
            value={groupDraft.frequency}
            onChange={(v) => setGroupDraft((p) => ({ ...p, frequency: v as InvoiceFrequency }))}
            options={["Daily", "Weekly", "Monthly", "Custom"]}
          />
          <Field
            label="Custom rule"
            value={groupDraft.customRule}
            onChange={(v) => setGroupDraft((p) => ({ ...p, customRule: v }))}
            placeholder="Example: Every 15 days"
            disabled={groupDraft.frequency !== "Custom"}
            hint={groupDraft.frequency !== "Custom" ? "Not used" : "Describe schedule"}
          />
          <Field label="AP to" value={groupDraft.apTo} onChange={(v) => setGroupDraft((p) => ({ ...p, apTo: v }))} placeholder="ap@company.com" />
          <Field label="AP cc" value={groupDraft.apCc} onChange={(v) => setGroupDraft((p) => ({ ...p, apCc: v }))} placeholder="finance@company.com" hint="Optional" />
          <Field label="Cost code" value={groupDraft.costCode} onChange={(v) => setGroupDraft((p) => ({ ...p, costCode: v }))} placeholder="ACME-MAIN" />
          <Select
            label="Template"
            value={groupDraft.templateId}
            onChange={(v) => setGroupDraft((p) => ({ ...p, templateId: v }))}
            options={templates.map((t) => t.id)}
            hint="Branded per group"
          />
          <Field label="Invoice prefix" value={groupDraft.prefix} onChange={(v) => setGroupDraft((p) => ({ ...p, prefix: v }))} placeholder="ACME" />
          <NumberField label="Next sequence" value={groupDraft.nextSequence} onChange={(v) => setGroupDraft((p) => ({ ...p, nextSequence: Math.max(1, v) }))} hint="Controls numbering" />
          <Select label="Status" value={groupDraft.status} onChange={(v) => setGroupDraft((p) => ({ ...p, status: v as any }))} options={["Active", "Paused"]} />
          <Toggle
            enabled={groupDraft.paymentTermsOverrideEnabled}
            onChange={(v) => setGroupDraft((p) => ({ ...p, paymentTermsOverrideEnabled: v, paymentTermsOverride: v ? (p.paymentTermsOverride || { ...terms }) : undefined }))}
            label="Override payment terms"
            description="Different terms for this AP desk"
          />
          <div className={cn("md:col-span-2", !groupDraft.paymentTermsOverrideEnabled && "opacity-60")}>
            <Button
              variant="outline"
              className="w-full"
              disabled={!groupDraft.paymentTermsOverrideEnabled}
              onClick={openTermsOverride}
            >
              <CalendarClock className="h-4 w-4" /> Edit override terms
            </Button>
          </div>
          <div className="md:col-span-2">
            <TextArea label="Notes" value={groupDraft.notes} onChange={(v) => setGroupDraft((p) => ({ ...p, notes: v }))} placeholder="Optional notes" rows={3} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: invoice groups allow different templates and AP recipients per entity, enabling separate invoice streams.
          </div>
        </div>
      </Modal>

      {/* Terms override modal */}
      <Modal
        open={termsOverrideModalOpen}
        title="Payment terms override"
        subtitle="This override is applied to the invoice group draft."
        onClose={() => setTermsOverrideModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTermsOverrideModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={applyTermsOverrideToDraft}><BadgeCheck className="h-4 w-4" /> Apply</Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Mode"
            value={termsOverrideDraft.mode}
            onChange={(v) => setTermsOverrideDraft((p) => ({ ...p, mode: v as PaymentTermMode }))}
            options={["Net", "DueOnReceipt", "EOM"]}
          />
          <NumberField
            label="Net days"
            value={termsOverrideDraft.netDays}
            onChange={(v) => setTermsOverrideDraft((p) => ({ ...p, netDays: Math.max(0, v) }))}
            disabled={termsOverrideDraft.mode !== "Net"}
          />
          <NumberField
            label="Early discount percent"
            value={termsOverrideDraft.earlyDiscountPct}
            onChange={(v) => setTermsOverrideDraft((p) => ({ ...p, earlyDiscountPct: clamp(v, 0, 100) }))}
          />
          <NumberField
            label="Early discount days"
            value={termsOverrideDraft.earlyDiscountDays}
            onChange={(v) => setTermsOverrideDraft((p) => ({ ...p, earlyDiscountDays: Math.max(0, v) }))}
            disabled={termsOverrideDraft.earlyDiscountPct <= 0}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Late fee text"
              value={termsOverrideDraft.lateFeeText}
              onChange={(v) => setTermsOverrideDraft((p) => ({ ...p, lateFeeText: v }))}
              rows={3}
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            This is a premium feature used when an invoice group requires special terms.
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          N Billing Setup and Invoice Groups v2. Core: invoice frequency, invoice groups, tax and VAT per entity, and payment terms. Premium: multi-entity invoice streams, branded templates per group, and next month billing simulation.
        </div>
      </footer>
    </div>
  );
}
