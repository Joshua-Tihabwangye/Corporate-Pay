import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Building2,
  Check,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Filter,
  Gauge,
  Link2,
  Plus,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Star,
  Tag,
  Trash2,
  Upload,
  X,
  Settings2,
  MoreVertical,
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

type VendorStatus = "Pending" | "Approved" | "Blocked";

type RiskLevel = "Low" | "Medium" | "High";

type DocType = "Business registration" | "Tax/VAT" | "License" | "Insurance" | "KYC" | "Other";

type DocStatus = "Pending" | "Verified" | "Expired";

type ComplianceDoc = {
  id: string;
  type: DocType;
  name: string;
  status: DocStatus;
  issuedAt?: number;
  expiresAt?: number;
  notes: string;
};

type Contract = {
  id: string;
  title: string;
  startAt: number;
  endAt: number;
  paymentTerms: string;
  discountPct: number;
  slaText: string;
  rateCardName: string;
  notes: string;
};

type Vendor = {
  id: string;
  name: string;
  country: string;
  city: string;
  status: VendorStatus;
  preferred: boolean;
  categories: string[];
  modules: ServiceModule[];
  marketplaces: Marketplace[];
  rating: number; // 0..5
  slaOnTimePct: number; // 0..100
  negotiatedTerms: {
    discountPct: number;
    paymentTerms: string;
    warrantyDays: number;
  };
  riskScore: number; // 0..100 (higher is safer)
  riskLevel: RiskLevel;
  complianceDocs: ComplianceDoc[];
  contracts: Contract[];
  lastActiveAt: number;
  notes: string;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type SpendCategory =
  | "Corporate Rides"
  | "EV Charging"
  | "Office Supplies"
  | "IT Devices"
  | "Facilities Services"
  | "Travel Procurement"
  | "Deals Procurement";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatMoney(n: number, currency = "UGX") {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(v);
  } catch {
    return `${currency} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      const onScroll = () => setIsOpen(false);
      window.addEventListener("scroll", onScroll, true);
      return () => window.removeEventListener("scroll", onScroll, true);
    }
  }, [isOpen]);

  const rect = buttonRef.current?.getBoundingClientRect();
  const top = rect ? rect.bottom + 4 : 0;
  const right = rect ? window.innerWidth - rect.right : 0;

  if (!actions.length) return null;

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
      >
        <MoreVertical className="h-5 w-5" />
      </button>
      <AnimatePresence>
        {isOpen && rect && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
              className="fixed z-50 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
              style={{ top, right }}
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
                    "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm font-medium transition-colors hover:bg-slate-50 disabled:opacity-50",
                    action.variant === "danger"
                      ? "text-rose-600 hover:bg-rose-50"
                      : "text-slate-700"
                  )}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
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
  maxW = "980px",
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
            className="fixed inset-x-0 top-[7vh] z-50 mx-auto w-[min(1040px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[720px]"
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

function statusTone(s: VendorStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Blocked") return "bad" as const;
  return "warn" as const;
}

function riskTone(level: RiskLevel) {
  if (level === "High") return "bad" as const;
  if (level === "Medium") return "warn" as const;
  return "good" as const;
}

function docTone(s: DocStatus) {
  if (s === "Verified") return "good" as const;
  if (s === "Expired") return "bad" as const;
  return "warn" as const;
}

function computeRiskLevel(score: number): RiskLevel {
  if (score < 55) return "High";
  if (score < 80) return "Medium";
  return "Low";
}

function computeRiskScore(v: Vendor): number {
  // logic-based scoring (no external AI)
  const base = 50;
  const ratingBoost = clamp(v.rating * 10, 0, 50);
  const slaBoost = clamp((v.slaOnTimePct - 70) * 0.6, -20, 18);
  const discountBoost = clamp(v.negotiatedTerms.discountPct * 0.8, 0, 12);

  const docPenalty = v.complianceDocs.reduce((a, d) => {
    if (d.status === "Expired") return a + 18;
    if (d.status === "Pending") return a + 8;
    return a;
  }, 0);

  const blockedPenalty = v.status === "Blocked" ? 40 : 0;
  const pendingPenalty = v.status === "Pending" ? 10 : 0;

  const score = base + ratingBoost + slaBoost + discountBoost - docPenalty - blockedPenalty - pendingPenalty;
  return Math.round(clamp(score, 0, 100));
}

function bestVendorScoreForCategory(v: Vendor, cat: SpendCategory) {
  // 0..100 higher is better
  const riskScore = v.riskScore;
  const prefBoost = v.preferred ? 6 : 0;
  const discount = v.negotiatedTerms.discountPct;
  const sla = v.slaOnTimePct;
  const rating = v.rating;

  const hasModule = (m: ServiceModule) => v.modules.includes(m);
  const hasMkt = (m: Marketplace) => v.marketplaces.includes(m);

  let fit = 0;
  if (cat === "Corporate Rides") fit = hasModule("Rides & Logistics") ? 100 : 0;
  if (cat === "EV Charging") fit = hasModule("EVs & Charging") ? 100 : 0;
  if (cat === "Deals Procurement") fit = hasMkt("MyLiveDealz") ? 100 : 0;
  if (cat === "Office Supplies") fit = hasMkt("EVmart") || hasMkt("LivingMart") || hasMkt("GeneratMart") ? 100 : 0;
  if (cat === "IT Devices") fit = hasMkt("GadgetMart") ? 100 : 0;
  if (cat === "Facilities Services") fit = hasMkt("ServiceMart") ? 100 : 0;
  if (cat === "Travel Procurement") fit = hasModule("Travel & Tourism") || hasMkt("ExpressMart") ? 100 : 0;

  const quality = clamp(rating * 12 + sla * 0.25 + discount * 1.2, 0, 100);
  const penalty = v.status !== "Approved" ? 45 : 0;

  return Math.round(clamp(0.45 * fit + 0.35 * quality + 0.2 * riskScore + prefBoost - penalty, 0, 100));
}

export default function CorporatePayVendorCatalogManagementV2() {
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

  const CATEGORIES: SpendCategory[] = [
    "Corporate Rides",
    "EV Charging",
    "Office Supplies",
    "IT Devices",
    "Facilities Services",
    "Travel Procurement",
    "Deals Procurement",
  ];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const now = Date.now();

    const mkDoc = (type: DocType, status: DocStatus, daysToExpire: number, name: string, notes = ""):
      ComplianceDoc => ({
        id: uid("DOC"),
        type,
        name,
        status,
        issuedAt: now - 120 * 24 * 60 * 60 * 1000,
        expiresAt: now + daysToExpire * 24 * 60 * 60 * 1000,
        notes,
      });

    const mkContract = (title: string, discountPct: number, startDaysAgo: number, endDaysAhead: number, rateCardName: string): Contract => ({
      id: uid("CTR"),
      title,
      startAt: now - startDaysAgo * 24 * 60 * 60 * 1000,
      endAt: now + endDaysAhead * 24 * 60 * 60 * 1000,
      paymentTerms: "Net 14",
      discountPct,
      slaText: "On-time delivery 92%+, response < 2h",
      rateCardName,
      notes: "Negotiated for corporate volumes.",
    });

    const seed: Vendor[] = [
      {
        id: "V-001",
        name: "EVzone Rides",
        country: "Uganda",
        city: "Kampala",
        status: "Approved",
        preferred: true,
        categories: ["Mobility", "Corporate transport"],
        modules: ["Rides & Logistics"],
        marketplaces: [],
        rating: 4.6,
        slaOnTimePct: 93,
        negotiatedTerms: { discountPct: 7, paymentTerms: "Net 14", warrantyDays: 0 },
        riskScore: 88,
        riskLevel: "Low",
        complianceDocs: [mkDoc("License", "Verified", 200, "Operations license"), mkDoc("Insurance", "Verified", 80, "Liability insurance")],
        contracts: [mkContract("Ride services master agreement", 7, 120, 240, "Ride rate card v3.pdf")],
        lastActiveAt: now - 2 * 60 * 60 * 1000,
        notes: "Preferred vendor for corporate rides.",
      },
      {
        id: "V-002",
        name: "EVzone Charging",
        country: "Uganda",
        city: "Kampala",
        status: "Approved",
        preferred: true,
        categories: ["Energy", "EV infrastructure"],
        modules: ["EVs & Charging"],
        marketplaces: [],
        rating: 4.3,
        slaOnTimePct: 90,
        negotiatedTerms: { discountPct: 5, paymentTerms: "Net 7", warrantyDays: 0 },
        riskScore: 83,
        riskLevel: "Low",
        complianceDocs: [mkDoc("License", "Verified", 180, "Energy operations license"), mkDoc("Insurance", "Verified", 40, "Equipment insurance")],
        contracts: [mkContract("Charging credits agreement", 5, 60, 300, "Charging rate card.pdf")],
        lastActiveAt: now - 7 * 60 * 60 * 1000,
        notes: "Charging credits supplier.",
      },
      {
        id: "V-003",
        name: "Kampala Office Mart",
        country: "Uganda",
        city: "Kampala",
        status: "Approved",
        preferred: false,
        categories: ["Office supplies", "Consumables"],
        modules: ["E-Commerce"],
        marketplaces: ["EVmart", "GeneratMart"],
        rating: 4.1,
        slaOnTimePct: 86,
        negotiatedTerms: { discountPct: 3, paymentTerms: "Net 14", warrantyDays: 14 },
        riskScore: 74,
        riskLevel: "Medium",
        complianceDocs: [mkDoc("Tax/VAT", "Verified", 140, "VAT certificate"), mkDoc("Business registration", "Verified", 320, "Registration")],
        contracts: [mkContract("Office supplies agreement", 3, 30, 200, "Office supplies rate card.xlsx")],
        lastActiveAt: now - 2 * 24 * 60 * 60 * 1000,
        notes: "Local supplier for office and general supplies.",
      },
      {
        id: "V-004",
        name: "Shenzhen Store",
        country: "China",
        city: "Shenzhen",
        status: "Approved",
        preferred: false,
        categories: ["Imports", "Electronics"],
        modules: ["E-Commerce"],
        marketplaces: ["MyLiveDealz", "GadgetMart"],
        rating: 4.0,
        slaOnTimePct: 82,
        negotiatedTerms: { discountPct: 8, paymentTerms: "Net 30", warrantyDays: 90 },
        riskScore: 68,
        riskLevel: "Medium",
        complianceDocs: [mkDoc("Business registration", "Verified", 300, "Business license"), mkDoc("Insurance", "Pending", 120, "Cargo insurance", "Pending verification")],
        contracts: [mkContract("Cross-border procurement", 8, 10, 180, "Imports rate card.pdf")],
        lastActiveAt: now - 9 * 60 * 60 * 1000,
        notes: "Used for deals procurement. Monitor compliance.",
      },
      {
        id: "V-005",
        name: "ServicePro",
        country: "Uganda",
        city: "Kampala",
        status: "Pending",
        preferred: false,
        categories: ["Facilities", "Maintenance"],
        modules: ["E-Commerce"],
        marketplaces: ["ServiceMart"],
        rating: 3.8,
        slaOnTimePct: 76,
        negotiatedTerms: { discountPct: 0, paymentTerms: "Due on receipt", warrantyDays: 30 },
        riskScore: 60,
        riskLevel: "Medium",
        complianceDocs: [mkDoc("Insurance", "Pending", 60, "Liability insurance", "Awaiting certificate"), mkDoc("License", "Pending", 60, "Trade license")],
        contracts: [],
        lastActiveAt: now - 14 * 24 * 60 * 60 * 1000,
        notes: "Awaiting onboarding checks.",
      },
      {
        id: "V-006",
        name: "Express CN",
        country: "China",
        city: "Wuxi",
        status: "Blocked",
        preferred: false,
        categories: ["Logistics"],
        modules: ["E-Commerce"],
        marketplaces: ["ExpressMart"],
        rating: 2.9,
        slaOnTimePct: 62,
        negotiatedTerms: { discountPct: 0, paymentTerms: "Net 7", warrantyDays: 0 },
        riskScore: 34,
        riskLevel: "High",
        complianceDocs: [mkDoc("Insurance", "Expired", -10, "Cargo insurance", "Expired"), mkDoc("Tax/VAT", "Pending", 90, "Tax certificate")],
        contracts: [],
        lastActiveAt: now - 40 * 24 * 60 * 60 * 1000,
        notes: "Blocked due to expired insurance and SLA breaches.",
      },
    ];

    // Recompute risk score/level once based on docs etc.
    return seed
      .map((v) => {
        const score = computeRiskScore(v);
        return { ...v, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Pending" ? -1 : 1;
        return b.riskScore - a.riskScore;
      });
  });

  // Tabs
  const [tab, setTab] = useState<"directory" | "requests" | "risk" | "contracts" | "recommendations">("directory");

  // Filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"All" | VendorStatus>("All");
  const [risk, setRisk] = useState<"All" | RiskLevel>("All");
  const [moduleFilter, setModuleFilter] = useState<"All" | ServiceModule>("All");
  const [marketplaceFilter, setMarketplaceFilter] = useState<"All" | Marketplace>("All");
  const [preferredOnly, setPreferredOnly] = useState(false);

  // Vendor drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeVendorId, setActiveVendorId] = useState<string | null>(null);
  const activeVendor = useMemo(() => (activeVendorId ? vendors.find((v) => v.id === activeVendorId) || null : null), [activeVendorId, vendors]);

  // Modals
  const [vendorModalOpen, setVendorModalOpen] = useState(false);
  const [vendorDraft, setVendorDraft] = useState<Vendor>(() => ({
    id: "",
    name: "",
    country: "Uganda",
    city: "Kampala",
    status: "Pending",
    preferred: false,
    categories: [""],
    modules: ["E-Commerce"],
    marketplaces: ["Other Marketplace"],
    rating: 4,
    slaOnTimePct: 85,
    negotiatedTerms: { discountPct: 0, paymentTerms: "Net 14", warrantyDays: 30 },
    riskScore: 70,
    riskLevel: "Medium",
    complianceDocs: [],
    contracts: [],
    lastActiveAt: Date.now(),
    notes: "",
  }));

  const [docModalOpen, setDocModalOpen] = useState(false);
  const [docDraft, setDocDraft] = useState<ComplianceDoc>(() => ({
    id: "",
    type: "License",
    name: "",
    status: "Pending",
    issuedAt: Date.now(),
    expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
    notes: "",
  }));

  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [contractDraft, setContractDraft] = useState<Contract>(() => ({
    id: "",
    title: "",
    startAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
    endAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
    paymentTerms: "Net 14",
    discountPct: 0,
    slaText: "",
    rateCardName: "",
    notes: "",
  }));

  // Derived
  const stats = useMemo(() => {
    const total = vendors.length;
    const approved = vendors.filter((v) => v.status === "Approved").length;
    const pending = vendors.filter((v) => v.status === "Pending").length;
    const blocked = vendors.filter((v) => v.status === "Blocked").length;
    const preferred = vendors.filter((v) => v.preferred && v.status === "Approved").length;
    const highRisk = vendors.filter((v) => v.riskLevel === "High").length;

    const expiringDocs = vendors.reduce((acc, v) => {
      const soon = v.complianceDocs.some((d) => d.expiresAt && d.expiresAt < Date.now() + 30 * 24 * 60 * 60 * 1000 && d.status === "Verified");
      return acc + (soon ? 1 : 0);
    }, 0);

    return { total, approved, pending, blocked, preferred, highRisk, expiringDocs };
  }, [vendors]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return vendors
      .filter((v) => (status === "All" ? true : v.status === status))
      .filter((v) => (risk === "All" ? true : v.riskLevel === risk))
      .filter((v) => (preferredOnly ? v.preferred : true))
      .filter((v) => (moduleFilter === "All" ? true : v.modules.includes(moduleFilter)))
      .filter((v) => (marketplaceFilter === "All" ? true : v.marketplaces.includes(marketplaceFilter)))
      .filter((v) => {
        if (!query) return true;
        const blob = `${v.id} ${v.name} ${v.country} ${v.city} ${v.status} ${v.categories.join(" ")} ${v.modules.join(" ")} ${v.marketplaces.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === "Pending" ? -1 : 1;
        if (a.preferred !== b.preferred) return a.preferred ? -1 : 1;
        return b.riskScore - a.riskScore;
      });
  }, [vendors, q, status, risk, preferredOnly, moduleFilter, marketplaceFilter]);

  const pendingRequests = useMemo(() => vendors.filter((v) => v.status === "Pending"), [vendors]);

  const complianceHotspots = useMemo(() => {
    const items = vendors
      .map((v) => {
        const expired = v.complianceDocs.filter((d) => d.status === "Expired").length;
        const pending = v.complianceDocs.filter((d) => d.status === "Pending").length;
        const verified = v.complianceDocs.filter((d) => d.status === "Verified").length;
        const hasInsurance = v.complianceDocs.some((d) => d.type === "Insurance" && d.status === "Verified");
        const hasLicense = v.complianceDocs.some((d) => d.type === "License" && d.status === "Verified");
        const score = v.riskScore;
        const redFlags = (expired > 0 ? 2 : 0) + (pending > 1 ? 1 : 0) + (!hasInsurance ? 1 : 0) + (!hasLicense ? 1 : 0) + (v.status === "Blocked" ? 2 : 0);
        return { vendor: v, expired, pending, verified, hasInsurance, hasLicense, score, redFlags };
      })
      .sort((a, b) => b.redFlags - a.redFlags || a.score - b.score);
    return items;
  }, [vendors]);

  const recommendations = useMemo(() => {
    const approved = vendors.filter((v) => v.status === "Approved");
    return CATEGORIES.map((c) => {
      const scored = approved
        .map((v) => ({ vendor: v, score: bestVendorScoreForCategory(v, c) }))
        .filter((x) => x.score > 0)
        .sort((a, b) => b.score - a.score);
      return { category: c, top: scored.slice(0, 3) };
    });
  }, [vendors]);

  const exportJSON = () => {
    const payload = { vendors, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-vendors.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Vendors JSON downloaded.", kind: "success" });
  };

  const copyJSON = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(vendors, null, 2));
      toast({ title: "Copied", message: "Copied vendors JSON to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const openVendor = (id: string) => {
    setActiveVendorId(id);
    setDrawerOpen(true);
  };

  const refreshVendorRisk = (id: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const score = computeRiskScore(v);
        return { ...v, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );
    toast({ title: "Risk updated", message: "Vendor risk score recalculated.", kind: "success" });
  };

  const setVendorStatus = (id: string, next: VendorStatus) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        const updated = { ...v, status: next };
        const score = computeRiskScore(updated);
        return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );
    toast({ title: "Updated", message: `Vendor status set to ${next}.`, kind: "success" });
  };

  const togglePreferred = (id: string) => {
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== id) return v;
        return { ...v, preferred: !v.preferred };
      })
    );
    toast({ title: "Updated", message: "Preferred vendor updated.", kind: "info" });
  };

  const openNewVendor = () => {
    setVendorDraft({
      id: "",
      name: "",
      country: "Uganda",
      city: "Kampala",
      status: "Pending",
      preferred: false,
      categories: [""],
      modules: ["E-Commerce"],
      marketplaces: ["Other Marketplace"],
      rating: 4,
      slaOnTimePct: 85,
      negotiatedTerms: { discountPct: 0, paymentTerms: "Net 14", warrantyDays: 30 },
      riskScore: 70,
      riskLevel: "Medium",
      complianceDocs: [],
      contracts: [],
      lastActiveAt: Date.now(),
      notes: "",
    });
    setVendorModalOpen(true);
  };

  const openEditVendor = (v: Vendor) => {
    setVendorDraft(JSON.parse(JSON.stringify(v)));
    setVendorModalOpen(true);
  };

  const saveVendor = () => {
    if (!vendorDraft.name.trim()) {
      toast({ title: "Missing name", message: "Vendor name is required.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const isNew = !vendorDraft.id;
    const id = vendorDraft.id || uid("V");

    const cleanCategories = vendorDraft.categories.map((c) => c.trim()).filter(Boolean);
    const next: Vendor = {
      ...vendorDraft,
      id,
      categories: cleanCategories.length ? cleanCategories : ["Other"],
      lastActiveAt: isNew ? now : vendorDraft.lastActiveAt,
    };

    const score = computeRiskScore(next);
    next.riskScore = score;
    next.riskLevel = computeRiskLevel(score);

    setVendors((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      const arr = prev.slice();
      if (idx >= 0) arr[idx] = next;
      else arr.unshift(next);
      return arr;
    });

    toast({ title: "Saved", message: "Vendor saved.", kind: "success" });
    setVendorModalOpen(false);

    // ensure drawer sync
    setActiveVendorId(id);
  };

  const deleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
    if (activeVendorId === id) {
      setActiveVendorId(null);
      setDrawerOpen(false);
    }
    toast({ title: "Deleted", message: "Vendor deleted.", kind: "info" });
  };

  const openNewDoc = () => {
    if (!activeVendor) {
      toast({ title: "Select vendor", message: "Open a vendor first.", kind: "warn" });
      return;
    }
    setDocDraft({
      id: "",
      type: "License",
      name: "",
      status: "Pending",
      issuedAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      expiresAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
      notes: "",
    });
    setDocModalOpen(true);
  };

  const saveDoc = () => {
    if (!activeVendor) return;
    if (!docDraft.name.trim()) {
      toast({ title: "Missing", message: "Document name is required.", kind: "warn" });
      return;
    }

    const doc: ComplianceDoc = { ...docDraft, id: docDraft.id || uid("DOC") };

    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== activeVendor.id) return v;
        const docs = v.complianceDocs.slice();
        const idx = docs.findIndex((d) => d.id === doc.id);
        if (idx >= 0) docs[idx] = doc;
        else docs.unshift(doc);
        const updated = { ...v, complianceDocs: docs };
        const score = computeRiskScore(updated);
        return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );

    toast({ title: "Saved", message: "Compliance document saved.", kind: "success" });
    setDocModalOpen(false);
  };

  const deleteDoc = (docId: string) => {
    if (!activeVendor) return;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== activeVendor.id) return v;
        const updated = { ...v, complianceDocs: v.complianceDocs.filter((d) => d.id !== docId) };
        const score = computeRiskScore(updated);
        return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );
    toast({ title: "Deleted", message: "Document removed.", kind: "info" });
  };

  const openNewContract = () => {
    if (!activeVendor) {
      toast({ title: "Select vendor", message: "Open a vendor first.", kind: "warn" });
      return;
    }
    setContractDraft({
      id: "",
      title: "",
      startAt: Date.now() - 7 * 24 * 60 * 60 * 1000,
      endAt: Date.now() + 180 * 24 * 60 * 60 * 1000,
      paymentTerms: "Net 14",
      discountPct: 0,
      slaText: "On-time delivery 90%+, response < 4h",
      rateCardName: "",
      notes: "",
    });
    setContractModalOpen(true);
  };

  const saveContract = () => {
    if (!activeVendor) return;
    if (!contractDraft.title.trim()) {
      toast({ title: "Missing", message: "Contract title is required.", kind: "warn" });
      return;
    }

    const ctr: Contract = { ...contractDraft, id: contractDraft.id || uid("CTR") };

    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== activeVendor.id) return v;
        const ctrs = v.contracts.slice();
        const idx = ctrs.findIndex((c) => c.id === ctr.id);
        if (idx >= 0) ctrs[idx] = ctr;
        else ctrs.unshift(ctr);
        const updated = {
          ...v,
          contracts: ctrs,
          negotiatedTerms: {
            ...v.negotiatedTerms,
            discountPct: Math.max(v.negotiatedTerms.discountPct, ctr.discountPct),
            paymentTerms: ctr.paymentTerms || v.negotiatedTerms.paymentTerms,
          },
        };
        const score = computeRiskScore(updated);
        return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );

    toast({ title: "Saved", message: "Contract saved.", kind: "success" });
    setContractModalOpen(false);
  };

  const deleteContract = (ctrId: string) => {
    if (!activeVendor) return;
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== activeVendor.id) return v;
        const updated = { ...v, contracts: v.contracts.filter((c) => c.id !== ctrId) };
        const score = computeRiskScore(updated);
        return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
      })
    );
    toast({ title: "Deleted", message: "Contract removed.", kind: "info" });
  };

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="mx-auto max-w-[95%] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Vendor and Catalog Management</div>
                  <div className="mt-1 text-xs text-slate-500">
                    Vendor directory across modules and marketplaces, allowlist and denylist, compliance docs, contracts, and preferred vendor recommendations.
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Total: ${stats.total}`} tone="neutral" />
                    <Pill label={`Approved: ${stats.approved}`} tone="good" />
                    <Pill label={`Pending: ${stats.pending}`} tone={stats.pending ? "warn" : "good"} />
                    <Pill label={`Blocked: ${stats.blocked}`} tone={stats.blocked ? "bad" : "good"} />
                    <Pill label={`Preferred: ${stats.preferred}`} tone="info" />
                    <Pill label={`High risk: ${stats.highRisk}`} tone={stats.highRisk ? "bad" : "good"} />
                    <Pill label={`Docs expiring: ${stats.expiringDocs}`} tone={stats.expiringDocs ? "warn" : "good"} />
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
                <Button variant="outline" onClick={() => setTab("requests")}>
                  <ClipboardList className="h-4 w-4" /> Requests ({pendingRequests.length})
                </Button>
                <Button variant="primary" onClick={openNewVendor}>
                  <Plus className="h-4 w-4" /> New vendor
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "directory", label: "Directory" },
                { id: "requests", label: "Vendor requests" },
                { id: "risk", label: "Risk and compliance" },
                { id: "contracts", label: "Contracts and rate cards" },
                { id: "recommendations", label: "Preferred recommendations" },
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
            {tab === "directory" ? (
              <div className="space-y-4">
                <Section title="Filters" subtitle="Search and slice vendor directory." right={<Pill label="Core" tone="neutral" />}>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Search</div>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                      <Search className="h-4 w-4 text-slate-500" />
                      <input
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        placeholder="Vendor name, module, marketplace..."
                        className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Select
                        label="Status"
                        value={status}
                        onChange={(v) => setStatus(v as any)}
                        options={[
                          { value: "All", label: "All" },
                          { value: "Approved", label: "Approved" },
                          { value: "Pending", label: "Pending" },
                          { value: "Blocked", label: "Blocked" },
                        ]}
                      />
                      <Select
                        label="Risk"
                        value={risk}
                        onChange={(v) => setRisk(v as any)}
                        options={[{ value: "All", label: "All" }, { value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]}
                      />
                      <Select
                        label="Module"
                        value={moduleFilter}
                        onChange={(v) => setModuleFilter(v as any)}
                        options={[{ value: "All", label: "All" }, ...SERVICE_MODULES.map((m) => ({ value: m, label: m }))]}
                      />
                      <Select
                        label="Marketplace"
                        value={marketplaceFilter}
                        onChange={(v) => setMarketplaceFilter(v as any)}
                        options={[{ value: "All", label: "All" }, ...MARKETPLACES.map((m) => ({ value: m, label: m }))]}
                        hint="E-Commerce"
                      />
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-4">
                      <Toggle
                        enabled={preferredOnly}
                        onChange={setPreferredOnly}
                        label="Preferred only"
                        description="Show preferred vendors first"
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          setQ("");
                          setStatus("All");
                          setRisk("All");
                          setModuleFilter("All");
                          setMarketplaceFilter("All");
                          setPreferredOnly(false);
                          toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                      <Button variant="outline" onClick={() => setTab("risk")}>
                        <ShieldAlert className="h-4 w-4" /> Risk
                      </Button>
                      <Button variant="outline" onClick={() => setTab("recommendations")}>
                        <Star className="h-4 w-4" /> Recommendations
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Premium: Vendor risk scoring is logic-based initially. Later, you can enrich it with compliance signals and dispute history.
                  </div>
                </Section>

                <div className="w-full">
                  <Section
                    title="Vendor directory"
                    subtitle="Approve vendors (allowlist) or block (denylist). Open a vendor to view compliance and contracts."
                    right={<Pill label={`${filtered.length} vendor(s)`} tone="neutral" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Risk</th>
                            <th className="px-4 py-3 font-semibold">Rating</th>
                            <th className="px-4 py-3 font-semibold">SLA</th>
                            <th className="px-4 py-3 font-semibold">Terms</th>
                            <th className="px-4 py-3 font-semibold">Modules</th>
                            <th className="px-4 py-3 font-semibold">Marketplaces</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map((v) => (
                            <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="flex items-start justify-between gap-3">
                                  <button className="text-left" onClick={() => openVendor(v.id)}>
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                      {v.preferred ? <Pill label="Preferred" tone="info" /> : null}
                                      <Pill label={v.id} tone="neutral" />
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">{v.city}, {v.country} • Active {timeAgo(v.lastActiveAt)}</div>
                                  </button>
                                </div>
                              </td>
                              <td className="px-4 py-3"><Pill label={v.status} tone={statusTone(v.status)} /></td>
                              <td className="px-4 py-3">
                                <div className="flex flex-col gap-1">
                                  <Pill label={`${v.riskLevel} (${v.riskScore})`} tone={riskTone(v.riskLevel)} />
                                  {v.complianceDocs.some((d) => d.status === "Expired") ? <Pill label="Expired doc" tone="bad" /> : null}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-700"><span className="font-semibold text-slate-900">{v.rating.toFixed(1)}</span> / 5</td>
                              <td className="px-4 py-3 text-slate-700"><span className="font-semibold text-slate-900">{v.slaOnTimePct}%</span> on-time</td>
                              <td className="px-4 py-3 text-slate-700">
                                <div className="text-xs text-slate-600">Discount <span className="font-semibold text-slate-900">{v.negotiatedTerms.discountPct}%</span></div>
                                <div className="mt-1 text-xs text-slate-600">Terms <span className="font-semibold text-slate-900">{v.negotiatedTerms.paymentTerms}</span></div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {v.modules.slice(0, 2).map((m) => <Pill key={m} label={m} tone="neutral" />)}
                                  {v.modules.length > 2 ? <Pill label={`+${v.modules.length - 2}`} tone="neutral" /> : null}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap gap-2">
                                  {v.marketplaces.slice(0, 2).map((m) => <Pill key={m} label={m} tone="neutral" />)}
                                  {v.marketplaces.length > 2 ? <Pill label={`+${v.marketplaces.length - 2}`} tone="neutral" /> : null}
                                  {!v.marketplaces.length ? <Pill label="-" tone="neutral" /> : null}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <ActionMenu
                                  actions={[
                                    {
                                      label: v.preferred ? "Remove preferred" : "Set preferred",
                                      onClick: () => togglePreferred(v.id),
                                      icon: <Star className="h-4 w-4" />,
                                      disabled: v.status !== "Approved",
                                    },
                                    {
                                      label: "Edit",
                                      onClick: () => openEditVendor(v),
                                      icon: <Settings2 className="h-4 w-4" />,
                                    },
                                    v.status !== "Approved"
                                      ? {
                                          label: "Approve",
                                          onClick: () => setVendorStatus(v.id, "Approved"),
                                          icon: <ShieldCheck className="h-4 w-4" />,
                                        }
                                      : {
                                          label: "Block",
                                          onClick: () => setVendorStatus(v.id, "Blocked"),
                                          icon: <ShieldAlert className="h-4 w-4" />,
                                          variant: "danger" as const,
                                        },
                                    {
                                      label: "Open",
                                      onClick: () => openVendor(v.id),
                                      icon: <ChevronRight className="h-4 w-4" />,
                                    },
                                  ]}
                                />
                              </td>
                            </tr>
                          ))}
                          {!filtered.length ? (
                            <tr>
                              <td colSpan={9} className="px-4 py-12 text-center text-sm text-slate-600">No vendors match your filters.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Core: allowlist and denylist. Premium: risk scoring, compliance docs, contracts, and preferred recommendations.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "requests" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Requests" subtitle="Pending vendors awaiting approval." right={<Pill label={`${pendingRequests.length}`} tone={pendingRequests.length ? "warn" : "good"} />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Approve vendors to add them to the allowlist. Block vendors to deny access.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={openNewVendor}>
                        <Plus className="h-4 w-4" /> New vendor
                      </Button>
                      <Button variant="outline" onClick={() => setTab("directory")}>
                        <ChevronRight className="h-4 w-4" /> Directory
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: onboarding can require compliance documents before approval.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Pending approvals" subtitle="Approve or block." right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {pendingRequests.map((v) => (
                        <div key={v.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                <Pill label={v.id} tone="neutral" />
                                <Pill label={`${v.riskLevel} (${v.riskScore})`} tone={riskTone(v.riskLevel)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{v.city}, {v.country} • Rating {v.rating.toFixed(1)} • SLA {v.slaOnTimePct}%</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {v.modules.map((m) => <Pill key={m} label={m} tone="neutral" />)}
                                {v.marketplaces.map((m) => <Pill key={m} label={m} tone="neutral" />)}
                              </div>
                              <div className="mt-2 text-xs text-slate-600">Docs: {v.complianceDocs.length} • Contracts: {v.contracts.length}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => openVendor(v.id)}>
                                <ChevronRight className="h-4 w-4" /> Open
                              </Button>
                              <Button variant="primary" onClick={() => setVendorStatus(v.id, "Approved")}>
                                <ShieldCheck className="h-4 w-4" /> Approve
                              </Button>
                              <Button variant="outline" onClick={() => setVendorStatus(v.id, "Blocked")}>
                                <ShieldAlert className="h-4 w-4" /> Block
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!pendingRequests.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No pending vendors.</div>
                      ) : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "risk" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Risk hotspots" subtitle="High risk or missing compliance." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {complianceHotspots.slice(0, 8).map((x) => (
                        <div key={x.vendor.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <button className="text-left" onClick={() => openVendor(x.vendor.id)}>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{x.vendor.name}</div>
                                <Pill label={x.vendor.status} tone={statusTone(x.vendor.status)} />
                                <Pill label={`${x.vendor.riskLevel} (${x.vendor.riskScore})`} tone={riskTone(x.vendor.riskLevel)} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Expired: {x.expired} • Pending: {x.pending} • Verified: {x.verified}</div>
                              <div className="mt-1 text-xs text-slate-500">Insurance: {x.hasInsurance ? "Yes" : "No"} • License: {x.hasLicense ? "Yes" : "No"}</div>
                            </button>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => refreshVendorRisk(x.vendor.id)}>
                                <Gauge className="h-4 w-4" /> Recalc
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openVendor(x.vendor.id)}>
                                <ChevronRight className="h-4 w-4" /> Open
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: Attach compliance documents and mark them verified to improve risk score.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Compliance overview" subtitle="Doc status across all vendors." right={<Pill label="Premium" tone="info" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Docs</th>
                            <th className="px-4 py-3 font-semibold">Verified</th>
                            <th className="px-4 py-3 font-semibold">Pending</th>
                            <th className="px-4 py-3 font-semibold">Expired</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendors
                            .slice()
                            .sort((a, b) => {
                              const ae = a.complianceDocs.filter((d) => d.status === "Expired").length;
                              const be = b.complianceDocs.filter((d) => d.status === "Expired").length;
                              return be - ae || a.riskScore - b.riskScore;
                            })
                            .slice(0, 10)
                            .map((v) => {
                              const verified = v.complianceDocs.filter((d) => d.status === "Verified").length;
                              const pending = v.complianceDocs.filter((d) => d.status === "Pending").length;
                              const expired = v.complianceDocs.filter((d) => d.status === "Expired").length;
                              return (
                                <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{v.name}</td>
                                  <td className="px-4 py-3 text-slate-700">{v.complianceDocs.length}</td>
                                  <td className="px-4 py-3"><Pill label={`${verified}`} tone={verified ? "good" : "neutral"} /></td>
                                  <td className="px-4 py-3"><Pill label={`${pending}`} tone={pending ? "warn" : "neutral"} /></td>
                                  <td className="px-4 py-3"><Pill label={`${expired}`} tone={expired ? "bad" : "neutral"} /></td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openVendor(v.id)}>
                                        <ChevronRight className="h-4 w-4" /> Open
                                      </Button>
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => refreshVendorRisk(v.id)}>
                                        <Gauge className="h-4 w-4" /> Recalc
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Tip: For enterprise safety, require Insurance + License verified before approval for sensitive categories.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "contracts" ? (
              <div className="space-y-4">
                <Section title="Contracts and rate cards" subtitle="Premium: contract + rate-card storage." right={<Pill label="Premium" tone="info" />}>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Open a vendor to add contract documents and rate cards. Use negotiated terms for approvals and savings insights.
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => setTab("directory")}>
                      <ChevronRight className="h-4 w-4" /> Open directory
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        if (!activeVendorId && vendors[0]) {
                          setActiveVendorId(vendors[0].id);
                        }
                        setDrawerOpen(true);
                      }}
                    >
                      <ChevronRight className="h-4 w-4" /> Open vendor
                    </Button>
                  </div>
                </Section>

                <Section title="Active contracts" subtitle="Across all vendors." right={<Pill label="Premium" tone="info" />}>
                  <div className="space-y-2">
                    {vendors
                      .flatMap((v) => v.contracts.map((c) => ({ vendor: v, contract: c })))
                      .sort((a, b) => b.contract.startAt - a.contract.startAt)
                      .slice(0, 12)
                      .map(({ vendor, contract }) => (
                        <div key={contract.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{contract.title}</div>
                                <Pill label={vendor.name} tone="neutral" />
                                <Pill label={`${contract.discountPct}% discount`} tone={contract.discountPct ? "info" : "neutral"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDate(contract.startAt)} → {fmtDate(contract.endAt)} • {contract.paymentTerms}</div>
                              <div className="mt-2 text-xs text-slate-600">Rate card: {contract.rateCardName || "-"}</div>
                              {contract.slaText ? <div className="mt-2 text-xs text-slate-600">SLA: {contract.slaText}</div> : null}
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openVendor(vendor.id)}>
                                <ChevronRight className="h-4 w-4" /> Open vendor
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    {!vendors.some((v) => v.contracts.length) ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No contracts yet.</div>
                    ) : null}
                  </div>
                </Section>
              </div>
            ) : null}

            {tab === "recommendations" ? (
              <div className="space-y-4">
                <Section title="Recommended vendors" subtitle="Top 3 per spend category." right={<Pill label="Premium" tone="info" />}>
                  <div className="space-y-3">
                    {recommendations.map((r) => (
                      <div key={r.category} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-slate-500" />
                              <div className="text-sm font-semibold text-slate-900">{r.category}</div>
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Top vendors based on fit, savings, and risk.</div>
                          </div>
                          <Pill label={r.top.length ? "Available" : "No vendors"} tone={r.top.length ? "good" : "warn"} />
                        </div>

                        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                          {r.top.map((x) => (
                            <div key={x.vendor.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{x.vendor.name}</div>
                                  <div className="mt-1 text-xs text-slate-500">Score {x.score}/100</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    <Pill label={x.vendor.riskLevel} tone={riskTone(x.vendor.riskLevel)} />
                                    <Pill label={`${x.vendor.rating.toFixed(1)}★`} tone="neutral" />
                                    <Pill label={`${x.vendor.slaOnTimePct}% SLA`} tone="neutral" />
                                    <Pill label={`${x.vendor.negotiatedTerms.discountPct}% off`} tone={x.vendor.negotiatedTerms.discountPct ? "info" : "neutral"} />
                                  </div>
                                </div>
                                {x.vendor.preferred ? <Star className="h-5 w-5 text-amber-500" /> : <Star className="h-5 w-5 text-slate-300" />}
                              </div>
                              <div className="mt-3 flex flex-wrap items-center gap-2">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openVendor(x.vendor.id)}>
                                  <ChevronRight className="h-4 w-4" /> Open
                                </Button>
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => togglePreferred(x.vendor.id)}
                                  disabled={x.vendor.status !== "Approved"}
                                >
                                  <Star className="h-4 w-4" /> Preferred
                                </Button>
                              </div>
                            </div>
                          ))}
                          {!r.top.length ? (
                            <div className="md:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                              No approved vendors match this category yet.
                            </div>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="How recommendations work" subtitle="Premium: preferred vendor recommendations by spend category." right={<Pill label="Premium" tone="info" />}>
                  <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                    Recommendations are based on:
                    <ul className="mt-2 space-y-1">
                      <li>1) Vendor fit (module/marketplace coverage)</li>
                      <li>2) Quality (rating + SLA)</li>
                      <li>3) Savings (negotiated discount)</li>
                      <li>4) Risk score (compliance and history)</li>
                      <li>5) Preferred flag (admin curated)</li>
                    </ul>
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Tip: Approvals can auto-route to preferred vendors, and non-preferred purchases can require additional approvals.
                  </div>
                </Section>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
              R Vendor and Catalog Management v2. Core: vendor directory, allowlist and denylist, metadata. Premium: risk scoring and compliance docs, contracts and rate cards, and preferred vendor recommendations.
            </div>
          </footer>
        </div>
      </div>

      {/* Vendor drawer */}
      <Drawer
        open={drawerOpen}
        title={activeVendor ? activeVendor.name : "Vendor"}
        subtitle={activeVendor ? `${activeVendor.city}, ${activeVendor.country} • ${activeVendor.status} • Risk ${activeVendor.riskScore}/100` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          activeVendor ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <Button variant="outline" onClick={() => openEditVendor(activeVendor)}>
                <Settings2 className="h-4 w-4" /> Edit vendor
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => refreshVendorRisk(activeVendor.id)}>
                  <Gauge className="h-4 w-4" /> Recalc risk
                </Button>
                <Button variant="outline" onClick={openNewDoc}>
                  <Upload className="h-4 w-4" /> Add doc
                </Button>
                <Button variant="outline" onClick={openNewContract}>
                  <Plus className="h-4 w-4" /> Add contract
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeVendor ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeVendor.status} tone={statusTone(activeVendor.status)} />
                    <Pill label={activeVendor.preferred ? "Preferred" : "Standard"} tone={activeVendor.preferred ? "info" : "neutral"} />
                    <Pill label={`${activeVendor.riskLevel} (${activeVendor.riskScore})`} tone={riskTone(activeVendor.riskLevel)} />
                    <Pill label={`${activeVendor.rating.toFixed(1)}★`} tone="neutral" />
                    <Pill label={`${activeVendor.slaOnTimePct}% SLA`} tone="neutral" />
                  </div>
                  <div className="mt-2 text-xs text-slate-600">Categories: {activeVendor.categories.join(", ")}</div>
                  <div className="mt-2 text-xs text-slate-600">Last active: {timeAgo(activeVendor.lastActiveAt)}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => togglePreferred(activeVendor.id)} disabled={activeVendor.status !== "Approved"}>
                    <Star className="h-4 w-4" /> {activeVendor.preferred ? "Unprefer" : "Prefer"}
                  </Button>
                  {activeVendor.status !== "Approved" ? (
                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => setVendorStatus(activeVendor.id, "Approved")}>
                      <ShieldCheck className="h-4 w-4" /> Approve
                    </Button>
                  ) : (
                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => setVendorStatus(activeVendor.id, "Blocked")}>
                      <ShieldAlert className="h-4 w-4" /> Block
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">Negotiated terms</div>
                  <div className="mt-2">Discount: <span className="font-semibold">{activeVendor.negotiatedTerms.discountPct}%</span></div>
                  <div className="mt-1">Payment terms: <span className="font-semibold">{activeVendor.negotiatedTerms.paymentTerms}</span></div>
                  <div className="mt-1">Warranty: <span className="font-semibold">{activeVendor.negotiatedTerms.warrantyDays} day(s)</span></div>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">Coverage</div>
                  <div className="mt-2">Modules: {activeVendor.modules.join(", ") || "-"}</div>
                  <div className="mt-1">Marketplaces: {activeVendor.marketplaces.join(", ") || "-"}</div>
                </div>
              </div>

              {activeVendor.notes ? <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-700 ring-1 ring-slate-200">{activeVendor.notes}</div> : null}
            </div>

            <Section
              title="Compliance documents"
              subtitle="Premium: licenses, insurance, and verification."
              right={<Pill label={`${activeVendor.complianceDocs.length}`} tone="neutral" />}
            >
              <div className="space-y-2">
                {activeVendor.complianceDocs.map((d) => (
                  <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill label={d.type} tone="neutral" />
                          <Pill label={d.status} tone={docTone(d.status)} />
                          <div className="text-sm font-semibold text-slate-900">{d.name}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          Issued {d.issuedAt ? fmtDate(d.issuedAt) : "-"} • Expires {d.expiresAt ? fmtDate(d.expiresAt) : "-"}
                        </div>
                        {d.notes ? <div className="mt-2 text-xs text-slate-600">Notes: {d.notes}</div> : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          className="px-3 py-2 text-xs"
                          onClick={() => {
                            // quick status cycle
                            const next: DocStatus = d.status === "Pending" ? "Verified" : d.status === "Verified" ? "Expired" : "Pending";
                            setVendors((prev) =>
                              prev.map((v) => {
                                if (v.id !== activeVendor.id) return v;
                                const docs = v.complianceDocs.map((x) => (x.id === d.id ? { ...x, status: next } : x));
                                const updated = { ...v, complianceDocs: docs };
                                const score = computeRiskScore(updated);
                                return { ...updated, riskScore: score, riskLevel: computeRiskLevel(score) };
                              })
                            );
                            toast({ title: "Updated", message: "Document status updated.", kind: "success" });
                          }}
                        >
                          <FileCheck2 className="h-4 w-4" /> Toggle status
                        </Button>
                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteDoc(d.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!activeVendor.complianceDocs.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                    No compliance docs yet. Add License and Insurance for enterprise safety.
                  </div>
                ) : null}
              </div>
            </Section>

            <Section
              title="Contracts and rate cards"
              subtitle="Premium: store agreements and rate cards."
              right={<Pill label={`${activeVendor.contracts.length}`} tone="neutral" />}
            >
              <div className="space-y-2">
                {activeVendor.contracts.map((c) => (
                  <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{c.title}</div>
                          <Pill label={`${c.discountPct}% off`} tone={c.discountPct ? "info" : "neutral"} />
                          <Pill label={c.paymentTerms} tone="neutral" />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{fmtDate(c.startAt)} → {fmtDate(c.endAt)}</div>
                        <div className="mt-2 text-xs text-slate-600">Rate card: {c.rateCardName || "-"}</div>
                        {c.slaText ? <div className="mt-2 text-xs text-slate-600">SLA: {c.slaText}</div> : null}
                        {c.notes ? <div className="mt-2 text-xs text-slate-600">Notes: {c.notes}</div> : null}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button
                          variant="outline"
                          className="px-3 py-2 text-xs"
                          onClick={() => {
                            setContractDraft(JSON.parse(JSON.stringify(c)));
                            setContractModalOpen(true);
                          }}
                        >
                          <Settings2 className="h-4 w-4" /> Edit
                        </Button>
                        <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteContract(c.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {!activeVendor.contracts.length ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                    No contracts. Add a contract and rate card for negotiated pricing.
                  </div>
                ) : null}
              </div>
            </Section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">Select a vendor.</div>
        )}
      </Drawer>

      {/* Vendor modal */}
      <Modal
        open={vendorModalOpen}
        title={vendorDraft.id ? "Edit vendor" : "New vendor"}
        subtitle="Core: vendor directory and allowlist/denylist. Premium: compliance and contracts are added per vendor."
        onClose={() => setVendorModalOpen(false)}
        actions={[
          { label: "Save", onClick: saveVendor },
          ...(vendorDraft.id ? [{ label: "Delete", onClick: () => { deleteVendor(vendorDraft.id); setVendorModalOpen(false); }, variant: "danger" as const }] : []),
        ]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setVendorModalOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {vendorDraft.id ? (
                <Button variant="danger" onClick={() => { deleteVendor(vendorDraft.id); setVendorModalOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveVendor}>
                <BadgeCheck className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Vendor name" value={vendorDraft.name} onChange={(v) => setVendorDraft((p) => ({ ...p, name: v }))} placeholder="Vendor name" />
          <Select
            label="Status"
            value={vendorDraft.status}
            onChange={(v) => setVendorDraft((p) => ({ ...p, status: v as VendorStatus }))}
            options={[{ value: "Pending", label: "Pending" }, { value: "Approved", label: "Approved" }, { value: "Blocked", label: "Blocked" }]}
          />
          <Field label="Country" value={vendorDraft.country} onChange={(v) => setVendorDraft((p) => ({ ...p, country: v }))} placeholder="Country" />
          <Field label="City" value={vendorDraft.city} onChange={(v) => setVendorDraft((p) => ({ ...p, city: v }))} placeholder="City" />

          <div className="md:col-span-2">
            <Field
              label="Categories (comma separated)"
              value={vendorDraft.categories.join(", ")}
              onChange={(v) => setVendorDraft((p) => ({ ...p, categories: v.split(",").map((x) => x.trim()) }))}
              placeholder="Office supplies, Consumables"
              hint="Metadata"
            />
          </div>

          <NumberField label="Rating (0-5)" value={vendorDraft.rating} onChange={(v) => setVendorDraft((p) => ({ ...p, rating: clamp(v, 0, 5) }))} hint="Internal" />
          <NumberField label="SLA on-time percent" value={vendorDraft.slaOnTimePct} onChange={(v) => setVendorDraft((p) => ({ ...p, slaOnTimePct: clamp(v, 0, 100) }))} hint="Internal" />
          <NumberField label="Discount percent" value={vendorDraft.negotiatedTerms.discountPct} onChange={(v) => setVendorDraft((p) => ({ ...p, negotiatedTerms: { ...p.negotiatedTerms, discountPct: clamp(v, 0, 100) } }))} />
          <NumberField label="Warranty days" value={vendorDraft.negotiatedTerms.warrantyDays} onChange={(v) => setVendorDraft((p) => ({ ...p, negotiatedTerms: { ...p.negotiatedTerms, warrantyDays: Math.max(0, v) } }))} />
          <Field label="Payment terms" value={vendorDraft.negotiatedTerms.paymentTerms} onChange={(v) => setVendorDraft((p) => ({ ...p, negotiatedTerms: { ...p.negotiatedTerms, paymentTerms: v } }))} placeholder="Net 14" />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Modules</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SERVICE_MODULES.map((m) => {
                const on = vendorDraft.modules.includes(m);
                return (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left",
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() =>
                      setVendorDraft((p) => ({
                        ...p,
                        modules: on ? p.modules.filter((x) => x !== m) : [...p.modules, m],
                      }))
                    }
                  >
                    <div className="text-sm font-semibold text-slate-900">{m}</div>
                    <div className="mt-1 text-xs text-slate-600">{on ? "Enabled" : "Disabled"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={cn("md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4", vendorDraft.modules.includes("E-Commerce") ? "" : "opacity-60")}>
            <div className="text-sm font-semibold text-slate-900">Marketplaces</div>
            <div className="mt-1 text-xs text-slate-600">Only relevant when E-Commerce is enabled.</div>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {MARKETPLACES.map((m) => {
                const on = vendorDraft.marketplaces.includes(m);
                const disabled = !vendorDraft.modules.includes("E-Commerce");
                return (
                  <button
                    key={m}
                    type="button"
                    disabled={disabled}
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left",
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50",
                      disabled && "cursor-not-allowed"
                    )}
                    onClick={() => {
                      if (disabled) return;
                      setVendorDraft((p) => ({
                        ...p,
                        marketplaces: on ? p.marketplaces.filter((x) => x !== m) : [...p.marketplaces, m],
                      }));
                    }}
                  >
                    <div className="text-sm font-semibold text-slate-900">{m}</div>
                    <div className="mt-1 text-xs text-slate-600">{on ? "Enabled" : "Disabled"}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <TextArea label="Notes" value={vendorDraft.notes} onChange={(v) => setVendorDraft((p) => ({ ...p, notes: v }))} placeholder="Vendor notes" rows={3} />
          </div>
        </div>
      </Modal>

      {/* Doc modal */}
      <Modal
        open={docModalOpen}
        title={docDraft.id ? "Edit compliance doc" : "Add compliance doc"}
        subtitle="Premium: store and verify licenses, insurance, and other compliance documents."
        onClose={() => setDocModalOpen(false)}
        actions={[{ label: "Save", onClick: saveDoc }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setDocModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveDoc}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Type"
            value={docDraft.type}
            onChange={(v) => setDocDraft((p) => ({ ...p, type: v as DocType }))}
            options={["Business registration", "Tax/VAT", "License", "Insurance", "KYC", "Other"].map((x) => ({ value: x, label: x }))}
          />
          <Select
            label="Status"
            value={docDraft.status}
            onChange={(v) => setDocDraft((p) => ({ ...p, status: v as DocStatus }))}
            options={["Pending", "Verified", "Expired"].map((x) => ({ value: x, label: x }))}
          />
          <Field label="Document name" value={docDraft.name} onChange={(v) => setDocDraft((p) => ({ ...p, name: v }))} placeholder="Insurance certificate" />
          <Field
            label="Issued date"
            value={docDraft.issuedAt ? new Date(docDraft.issuedAt).toISOString().slice(0, 10) : ""}
            onChange={(v) => setDocDraft((p) => ({ ...p, issuedAt: new Date(v).getTime() }))}
            type="date"
          />
          <Field
            label="Expiry date"
            value={docDraft.expiresAt ? new Date(docDraft.expiresAt).toISOString().slice(0, 10) : ""}
            onChange={(v) => setDocDraft((p) => ({ ...p, expiresAt: new Date(v).getTime() }))}
            type="date"
          />
          <div className="md:col-span-2">
            <TextArea label="Notes" value={docDraft.notes} onChange={(v) => setDocDraft((p) => ({ ...p, notes: v }))} placeholder="Verification notes" rows={3} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Upload is simulated here. In production this stores file metadata and secure URLs.
          </div>
        </div>
      </Modal>

      {/* Contract modal */}
      <Modal
        open={contractModalOpen}
        title={contractDraft.id ? "Edit contract" : "Add contract"}
        subtitle="Premium: contract + rate card storage and negotiated pricing."
        onClose={() => setContractModalOpen(false)}
        actions={[{ label: "Save", onClick: saveContract }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setContractModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveContract}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Title" value={contractDraft.title} onChange={(v) => setContractDraft((p) => ({ ...p, title: v }))} placeholder="Master services agreement" />
          <Field label="Rate card name" value={contractDraft.rateCardName} onChange={(v) => setContractDraft((p) => ({ ...p, rateCardName: v }))} placeholder="Rate card.pdf" />
          <Field label="Start date" type="date" value={new Date(contractDraft.startAt).toISOString().slice(0, 10)} onChange={(v) => setContractDraft((p) => ({ ...p, startAt: new Date(v).getTime() }))} />
          <Field label="End date" type="date" value={new Date(contractDraft.endAt).toISOString().slice(0, 10)} onChange={(v) => setContractDraft((p) => ({ ...p, endAt: new Date(v).getTime() }))} />
          <Field label="Payment terms" value={contractDraft.paymentTerms} onChange={(v) => setContractDraft((p) => ({ ...p, paymentTerms: v }))} placeholder="Net 14" />
          <NumberField label="Discount percent" value={contractDraft.discountPct} onChange={(v) => setContractDraft((p) => ({ ...p, discountPct: clamp(v, 0, 100) }))} />
          <div className="md:col-span-2">
            <TextArea label="SLA text" value={contractDraft.slaText} onChange={(v) => setContractDraft((p) => ({ ...p, slaText: v }))} placeholder="On-time 92%+, response < 2h" rows={3} />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Notes" value={contractDraft.notes} onChange={(v) => setContractDraft((p) => ({ ...p, notes: v }))} placeholder="Optional" rows={3} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Rate card upload is simulated. In production you store files with access control.
          </div>
        </div>
      </Modal>
    </div>
  );
}
