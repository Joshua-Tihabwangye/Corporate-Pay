import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Info,
  Mail,
  MessageSquare,
  Plus,
  Search,
  Shield,
  Star,
  Timer,
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

type FulfillmentType = "Purchase Order" | "Service Booking" | "Delivery" | "Ride Schedule";

type FulfillmentStatus = "Pending" | "Confirmed" | "In progress" | "Completed" | "Cancelled" | "Refunded" | "Rebooked";

type ProofType = "Delivery confirmation" | "Completion log" | "Trip receipt" | "Signature" | "Photo" | "Other";

type ExceptionKind = "Cancellation" | "Refund" | "Rebooking" | "SLA breach";

type ExceptionStatus = "Open" | "Resolved";

type DisputeStatus = "Open" | "In review" | "Resolved";

type Attachment = {
  id: string;
  name: string;
  type: ProofType;
  note: string;
  addedAt: number;
  addedBy: string;
};

type TimelinePoint = {
  id: string;
  label: string;
  at?: number;
  note?: string;
};

type Vendor = {
  id: string;
  name: string;
  country: string;
  status: "Approved" | "Blocked";
  ratingAvg: number;
  ratingCount: number;
  slaOnTimeTargetPct: number;
  penaltyPct: number; // penalty % of order total on breach
  penaltyCapUGX: number;
  categories: string[];
  modules: ServiceModule[];
  marketplaces: Marketplace[];
};

type FulfillmentItem = {
  id: string;
  ref: string;
  type: FulfillmentType;
  status: FulfillmentStatus;
  createdAt: number;
  scheduledAt?: number;
  dueAt: number;
  completedAt?: number;
  module: ServiceModule;
  marketplace?: Marketplace;
  vendorId: string;
  currency: "UGX" | "USD" | "EUR" | "CNY";
  total: number;
  description: string;
  location: string;
  timeline: TimelinePoint[];
  currentStep: number;
  proofs: Attachment[];
  rating?: { stars: number; comment: string; at: number };
};

type ExceptionItem = {
  id: string;
  createdAt: number;
  kind: ExceptionKind;
  status: ExceptionStatus;
  severity: "Info" | "Warning" | "Critical";
  fulfillmentId: string;
  title: string;
  detail: string;
  recommendedAction: string;
};

type Dispute = {
  id: string;
  createdAt: number;
  fulfillmentId: string;
  status: DisputeStatus;
  reason: string;
  autoTriggered: boolean;
  evidence: Attachment[];
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

function fmtDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
}

function fmtDateTime(ts: number) {
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

function formatMoney(n: number, currency: FulfillmentItem["currency"]) {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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
            className="fixed inset-x-0 top-[7vh] z-50 mx-auto w-[min(1020px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
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
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[760px]"
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

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <FileText className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function statusTone(s: FulfillmentStatus) {
  if (s === "Completed") return "good" as const;
  if (s === "In progress" || s === "Confirmed") return "info" as const;
  if (s === "Cancelled" || s === "Refunded") return "bad" as const;
  if (s === "Rebooked") return "warn" as const;
  return "neutral" as const;
}

function severityTone(s: ExceptionItem["severity"]) {
  if (s === "Critical") return "bad" as const;
  if (s === "Warning") return "warn" as const;
  return "info" as const;
}

function disputeTone(s: DisputeStatus) {
  if (s === "Resolved") return "good" as const;
  if (s === "In review") return "info" as const;
  return "warn" as const;
}

function calcSlaBreach(item: FulfillmentItem, now: number) {
  if (item.status === "Cancelled" || item.status === "Refunded") return { breached: false, overdueDays: 0, lateDays: 0 };
  if (item.completedAt) {
    const lateDays = Math.max(0, Math.ceil((item.completedAt - item.dueAt) / (24 * 60 * 60 * 1000)));
    return { breached: lateDays > 0, overdueDays: 0, lateDays };
  }
  const overdueDays = Math.max(0, Math.ceil((now - item.dueAt) / (24 * 60 * 60 * 1000)));
  return { breached: overdueDays > 0, overdueDays, lateDays: 0 };
}

function calcPenaltyUGX(item: FulfillmentItem, vendor: Vendor | undefined) {
  if (!vendor) return 0;
  if (item.currency !== "UGX") return 0; // demo: penalties computed in UGX only
  const raw = Math.round((item.total * vendor.penaltyPct) / 100);
  return Math.min(raw, Math.max(0, vendor.penaltyCapUGX));
}

export default function CorporatePayOrdersFulfillmentV2() {
  const now = Date.now();

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

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [settings, setSettings] = useState(() => ({
    autoDisputeOnSlaBreach: true,
    autoPenaltyCalc: true,
    penaltyApprovalThresholdUGX: 500000,
    requireApprovalForPenalty: true,
  }));

  const [vendors, setVendors] = useState<Vendor[]>(() => [
    {
      id: "V-011",
      name: "Kampala Auto Supplier",
      country: "Uganda",
      status: "Approved",
      ratingAvg: 4.1,
      ratingCount: 28,
      slaOnTimeTargetPct: 90,
      penaltyPct: 2,
      penaltyCapUGX: 2500000,
      categories: ["Vehicles", "Fleet"],
      modules: ["E-Commerce"],
      marketplaces: ["EVmart", "ServiceMart"],
    },
    {
      id: "V-010",
      name: "Shenzhen EV Motors",
      country: "China",
      status: "Approved",
      ratingAvg: 4.2,
      ratingCount: 41,
      slaOnTimeTargetPct: 85,
      penaltyPct: 1,
      penaltyCapUGX: 3000000,
      categories: ["Vehicles", "Imports"],
      modules: ["E-Commerce"],
      marketplaces: ["MyLiveDealz", "EVmart"],
    },
    {
      id: "V-001",
      name: "EVzone Rides",
      country: "Uganda",
      status: "Approved",
      ratingAvg: 4.6,
      ratingCount: 290,
      slaOnTimeTargetPct: 95,
      penaltyPct: 1,
      penaltyCapUGX: 800000,
      categories: ["Mobility"],
      modules: ["Rides & Logistics"],
      marketplaces: [],
    },
    {
      id: "V-002",
      name: "EVzone Charging",
      country: "Uganda",
      status: "Approved",
      ratingAvg: 4.3,
      ratingCount: 120,
      slaOnTimeTargetPct: 92,
      penaltyPct: 1,
      penaltyCapUGX: 600000,
      categories: ["Energy"],
      modules: ["EVs & Charging"],
      marketplaces: [],
    },
    {
      id: "V-020",
      name: "Express CN",
      country: "China",
      status: "Blocked",
      ratingAvg: 2.9,
      ratingCount: 15,
      slaOnTimeTargetPct: 80,
      penaltyPct: 2,
      penaltyCapUGX: 1500000,
      categories: ["Logistics"],
      modules: ["E-Commerce"],
      marketplaces: ["ExpressMart"],
    },
  ]);

  const vendorById = useMemo(() => Object.fromEntries(vendors.map((v) => [v.id, v])) as Record<string, Vendor>, [vendors]);

  const mkTimeline = (labels: string[], startAt: number) => {
    const pts: TimelinePoint[] = labels.map((l) => ({ id: uid("TL"), label: l }));
    // mark first step at creation
    pts[0] = { ...pts[0], at: startAt, note: "Created" };
    return pts;
  };

  const [items, setItems] = useState<FulfillmentItem[]>(() => {
    const DAY = 24 * 60 * 60 * 1000;
    const t0 = Date.now();

    const poCreated = t0 - 8 * DAY;
    const poDue = t0 + 24 * DAY;

    const rideCreated = t0 - 2 * DAY;
    const rideDue = t0 - 1 * DAY + 2 * 60 * 60 * 1000;

    const deliveryCreated = t0 - 12 * DAY;
    const deliveryDue = t0 - 2 * DAY;

    const serviceCreated = t0 - 5 * DAY;
    const serviceDue = t0 - 2 * DAY;

    return [
      {
        id: "FUL-PO-001",
        ref: "PO-001",
        type: "Purchase Order",
        status: "In progress",
        createdAt: poCreated,
        dueAt: poDue,
        module: "E-Commerce",
        marketplace: "EVmart",
        vendorId: "V-011",
        currency: "UGX",
        total: 88000000,
        description: "Electric SUV procurement (high value asset)",
        location: "Millennium House, Nsambya Road 472, Kampala",
        timeline: mkTimeline(["PO created", "PO issued", "Vendor accepted", "Deposit paid", "In transit", "Delivered", "Commissioned", "Closed"], poCreated),
        currentStep: 4,
        proofs: [
          { id: uid("PR"), name: "PO.pdf", type: "Other", note: "Purchase order document", addedAt: poCreated + 2 * 60 * 60 * 1000, addedBy: "Procurement" },
          { id: uid("PR"), name: "Deposit receipt.jpg", type: "Photo", note: "Deposit paid proof", addedAt: poCreated + 4 * DAY, addedBy: "Finance" },
        ],
      },
      {
        id: "FUL-RIDE-101",
        ref: "SCH-RIDE-101",
        type: "Ride Schedule",
        status: "Completed",
        createdAt: rideCreated,
        scheduledAt: rideCreated + 2 * 60 * 60 * 1000,
        dueAt: rideDue,
        completedAt: rideDue - 12 * 60 * 1000,
        module: "Rides & Logistics",
        vendorId: "V-001",
        currency: "UGX",
        total: 165000,
        description: "Airport pickup schedule for visiting client",
        location: "Entebbe Airport → Kampala HQ",
        timeline: mkTimeline(["Scheduled", "Driver assigned", "Picked up", "Dropped off"], rideCreated),
        currentStep: 3,
        proofs: [
          { id: uid("PR"), name: "Trip receipt.pdf", type: "Trip receipt", note: "Receipt and route", addedAt: rideDue, addedBy: "System" },
        ],
        rating: { stars: 5, comment: "On time and professional.", at: rideDue + 10 * 60 * 1000 },
      },
      {
        id: "FUL-DEL-009",
        ref: "DEL-009",
        type: "Delivery",
        status: "Cancelled",
        createdAt: deliveryCreated,
        dueAt: deliveryDue,
        module: "E-Commerce",
        marketplace: "ExpressMart",
        vendorId: "V-020",
        currency: "UGX",
        total: 340000,
        description: "Document courier to branch",
        location: "Kampala HQ → Jinja",
        timeline: mkTimeline(["Created", "Pickup", "In transit", "Delivered"], deliveryCreated),
        currentStep: 1,
        proofs: [],
      },
      {
        id: "FUL-SVC-044",
        ref: "SVC-044",
        type: "Service Booking",
        status: "Completed",
        createdAt: serviceCreated,
        dueAt: serviceDue,
        completedAt: serviceDue - 3 * 60 * 60 * 1000,
        module: "E-Commerce",
        marketplace: "ServiceMart",
        vendorId: "V-011",
        currency: "UGX",
        total: 540000,
        description: "Office maintenance service booking",
        location: "Kampala HQ",
        timeline: mkTimeline(["Booked", "Confirmed", "In service", "Completed"], serviceCreated),
        currentStep: 3,
        proofs: [
          { id: uid("PR"), name: "Completion log.txt", type: "Completion log", note: "Work completed and signed", addedAt: serviceDue - 2 * 60 * 60 * 1000, addedBy: "Vendor" },
          { id: uid("PR"), name: "Signature.png", type: "Signature", note: "Site sign-off", addedAt: serviceDue - 2 * 60 * 60 * 1000, addedBy: "Admin" },
        ],
        rating: { stars: 4, comment: "Good work. Arrived slightly earlier.", at: serviceDue - 30 * 60 * 1000 },
      },
    ];
  });

  const [exceptions, setExceptions] = useState<ExceptionItem[]>(() => {
    const t0 = Date.now();
    return [
      {
        id: "EX-001",
        createdAt: t0 - 2 * 24 * 60 * 60 * 1000,
        kind: "Cancellation",
        status: "Open",
        severity: "Warning",
        fulfillmentId: "FUL-DEL-009",
        title: "Delivery cancelled",
        detail: "Delivery request was cancelled after pickup delay.",
        recommendedAction: "Refund or rebook with an approved vendor.",
      },
    ];
  });

  const [disputes, setDisputes] = useState<Dispute[]>(() => []);

  // UI
  const [tab, setTab] = useState<"overview" | "items" | "exceptions" | "sla" | "disputes">("overview");

  const [q, setQ] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | FulfillmentType>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | FulfillmentStatus>("All");
  const [moduleFilter, setModuleFilter] = useState<"All" | ServiceModule>("All");
  const [vendorFilter, setVendorFilter] = useState<"All" | string>("All");
  const [breachOnly, setBreachOnly] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeItem = useMemo(() => (activeId ? items.find((i) => i.id === activeId) || null : null), [activeId, items]);
  const activeVendor = useMemo(() => (activeItem ? vendorById[activeItem.vendorId] : null), [activeItem, vendorById]);

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState(() => ({
    type: "Purchase Order" as FulfillmentType,
    module: "E-Commerce" as ServiceModule,
    marketplace: "EVmart" as Marketplace,
    vendorId: "V-011",
    currency: "UGX" as FulfillmentItem["currency"],
    total: 0,
    description: "",
    location: "",
    dueInDays: 7,
  }));

  const [proofOpen, setProofOpen] = useState(false);
  const [proofDraft, setProofDraft] = useState<{ type: ProofType; name: string; note: string }>({ type: "Photo", name: "", note: "" });

  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingDraft, setRatingDraft] = useState<{ stars: number; comment: string; acknowledge: boolean }>({ stars: 5, comment: "", acknowledge: false });

  const kpis = useMemo(() => {
    const open = items.filter((i) => !["Completed", "Cancelled", "Refunded"].includes(i.status)).length;
    const completed7d = items.filter((i) => i.completedAt && Date.now() - i.completedAt < 7 * 24 * 60 * 60 * 1000).length;
    const breached = items.filter((i) => calcSlaBreach(i, now).breached).length;
    const openExceptions = exceptions.filter((e) => e.status === "Open").length;
    const openDisputes = disputes.filter((d) => d.status !== "Resolved").length;
    return { open, completed7d, breached, openExceptions, openDisputes };
  }, [items, exceptions, disputes, now]);

  const filteredItems = useMemo(() => {
    const query = q.trim().toLowerCase();
    return items
      .filter((i) => (typeFilter === "All" ? true : i.type === typeFilter))
      .filter((i) => (statusFilter === "All" ? true : i.status === statusFilter))
      .filter((i) => (moduleFilter === "All" ? true : i.module === moduleFilter))
      .filter((i) => (vendorFilter === "All" ? true : i.vendorId === vendorFilter))
      .filter((i) => {
        if (!breachOnly) return true;
        return calcSlaBreach(i, now).breached;
      })
      .filter((i) => {
        if (!query) return true;
        const v = vendorById[i.vendorId];
        const blob = `${i.id} ${i.ref} ${i.type} ${i.status} ${i.module} ${i.marketplace || ""} ${v?.name || ""} ${i.description} ${i.location}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [items, q, typeFilter, statusFilter, moduleFilter, vendorFilter, breachOnly, vendorById, now]);

  const vendorStats = useMemo(() => {
    const byVendor: Record<string, { totalCompleted: number; onTime: number; breached: number; penaltiesUGX: number }> = {};

    for (const it of items) {
      const v = vendorById[it.vendorId];
      byVendor[it.vendorId] = byVendor[it.vendorId] || { totalCompleted: 0, onTime: 0, breached: 0, penaltiesUGX: 0 };

      const sla = calcSlaBreach(it, now);
      if (sla.breached) {
        byVendor[it.vendorId].breached += 1;
        if (settings.autoPenaltyCalc) {
          byVendor[it.vendorId].penaltiesUGX += calcPenaltyUGX(it, v);
        }
      }

      if (it.status === "Completed") {
        byVendor[it.vendorId].totalCompleted += 1;
        const onTime = it.completedAt ? it.completedAt <= it.dueAt : true;
        if (onTime) byVendor[it.vendorId].onTime += 1;
      }
    }

    return vendors
      .map((v) => {
        const s = byVendor[v.id] || { totalCompleted: 0, onTime: 0, breached: 0, penaltiesUGX: 0 };
        const onTimePct = s.totalCompleted ? Math.round((s.onTime / s.totalCompleted) * 100) : 100;
        return { vendor: v, ...s, onTimePct };
      })
      .sort((a, b) => b.penaltiesUGX - a.penaltiesUGX || b.breached - a.breached || a.vendor.name.localeCompare(b.vendor.name));
  }, [items, vendors, vendorById, settings.autoPenaltyCalc, now]);

  const openItem = (id: string) => {
    setActiveId(id);
    setDrawerOpen(true);
  };

  const addException = (x: Omit<ExceptionItem, "id" | "createdAt" | "status"> & { status?: ExceptionStatus; createdAt?: number }) => {
    const row: ExceptionItem = {
      id: uid("EX"),
      createdAt: x.createdAt ?? Date.now(),
      status: x.status ?? "Open",
      ...x,
    };
    setExceptions((p) => [row, ...p]);
    return row;
  };

  const ensureSlaScan = () => {
    let createdDisputes = 0;
    let createdExceptions = 0;

    for (const it of items) {
      const sla = calcSlaBreach(it, now);
      if (!sla.breached) continue;

      const hasExc = exceptions.some((e) => e.kind === "SLA breach" && e.fulfillmentId === it.id);
      if (!hasExc) {
        const msg = it.completedAt
          ? `Completed ${sla.lateDays} day(s) late.`
          : `Overdue by ${sla.overdueDays} day(s).`;
        addException({
          kind: "SLA breach",
          severity: "Critical",
          fulfillmentId: it.id,
          title: "SLA breach detected",
          detail: msg,
          recommendedAction: "Review penalty and open a dispute if needed.",
        });
        createdExceptions += 1;
      }

      if (settings.autoDisputeOnSlaBreach) {
        const hasDispute = disputes.some((d) => d.fulfillmentId === it.id && d.reason.toLowerCase().includes("sla breach"));
        if (!hasDispute) {
          setDisputes((p) => [
            {
              id: uid("DSP"),
              createdAt: Date.now(),
              fulfillmentId: it.id,
              status: "Open",
              reason: "SLA breach auto-trigger",
              autoTriggered: true,
              evidence: [],
            },
            ...p,
          ]);
          createdDisputes += 1;
        }
      }
    }

    toast({
      title: "SLA scan completed",
      message: `Exceptions created: ${createdExceptions}. Disputes created: ${createdDisputes}.`,
      kind: createdExceptions || createdDisputes ? "success" : "info",
    });
  };

  const exportCSV = () => {
    const rows = filteredItems.map((it) => {
      const v = vendorById[it.vendorId];
      const sla = calcSlaBreach(it, now);
      const penaltyUGX = settings.autoPenaltyCalc ? calcPenaltyUGX(it, v) : 0;
      return {
        id: it.id,
        ref: it.ref,
        type: it.type,
        status: it.status,
        module: it.module,
        marketplace: it.marketplace || "-",
        vendor: v?.name || it.vendorId,
        dueAt: fmtDateTime(it.dueAt),
        completedAt: it.completedAt ? fmtDateTime(it.completedAt) : "-",
        currency: it.currency,
        total: it.total,
        slaBreach: sla.breached ? "Yes" : "No",
        penaltyUGX,
        location: it.location,
      };
    });

    const columns = [
      "id",
      "ref",
      "type",
      "status",
      "module",
      "marketplace",
      "vendor",
      "dueAt",
      "completedAt",
      "currency",
      "total",
      "slaBreach",
      "penaltyUGX",
      "location",
    ];

    const esc = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const head = columns.join(",");
    const body = rows.map((r) => columns.map((c) => esc((r as any)[c])).join(",")).join("\n");
    const csv = `${head}\n${body}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-fulfillment.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", message: "Fulfillment CSV downloaded.", kind: "success" });
  };

  const exportJSON = () => {
    const payload = { items, exceptions, disputes, vendors, settings, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-fulfillment.json";
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported", message: "Fulfillment JSON downloaded.", kind: "success" });
  };

  const createItem = () => {
    if (!draft.description.trim()) {
      toast({ title: "Missing", message: "Add a description.", kind: "warn" });
      return;
    }
    if (!draft.location.trim()) {
      toast({ title: "Missing", message: "Add a location.", kind: "warn" });
      return;
    }
    if (!draft.total || draft.total <= 0) {
      toast({ title: "Missing", message: "Add a total amount showing expected cost.", kind: "warn" });
      return;
    }

    const DAY = 24 * 60 * 60 * 1000;
    const createdAt = Date.now();
    const dueAt = createdAt + clamp(draft.dueInDays, 0, 365) * DAY;

    const type = draft.type;
    const timeline =
      type === "Purchase Order"
        ? ["Created", "Confirmed", "In progress", "Delivered", "Completed"]
        : type === "Service Booking"
        ? ["Booked", "Confirmed", "In service", "Completed"]
        : type === "Delivery"
        ? ["Created", "Picked up", "In transit", "Delivered"]
        : ["Scheduled", "Driver assigned", "Picked up", "Dropped off"];

    const tl: TimelinePoint[] = timeline.map((l) => ({ id: uid("TL"), label: l }));
    tl[0] = { ...tl[0], at: createdAt, note: "Created" };

    const item: FulfillmentItem = {
      id: uid("FUL"),
      ref: `${type === "Purchase Order" ? "PO" : type === "Service Booking" ? "SVC" : type === "Delivery" ? "DEL" : "SCH"}-${Math.floor(100 + Math.random() * 900)}`,
      type,
      status: "Pending",
      createdAt,
      dueAt,
      module: draft.module,
      marketplace: draft.module === "E-Commerce" ? draft.marketplace : undefined,
      vendorId: draft.vendorId,
      currency: draft.currency,
      total: Math.round(draft.total),
      description: draft.description.trim(),
      location: draft.location.trim(),
      timeline: tl,
      currentStep: 0,
      proofs: [],
    };

    setItems((p) => [item, ...p]);
    setCreateOpen(false);
    setTab("items");
    toast({ title: "Created", message: "New request created.", kind: "success" });
  };

  const advanceItem = (id: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        if (it.status === "Cancelled" || it.status === "Refunded") return it;

        const nextStep = Math.min(it.timeline.length - 1, it.currentStep + 1);
        const timeline = it.timeline.slice();
        if (!timeline[nextStep].at) timeline[nextStep] = { ...timeline[nextStep], at: Date.now() };

        let status: FulfillmentStatus = it.status;
        if (nextStep === 0) status = "Pending";
        else if (nextStep === it.timeline.length - 1) status = "Completed";
        else if (nextStep >= 1 && nextStep <= 2) status = "Confirmed";
        else status = "In progress";

        const completedAt = status === "Completed" ? Date.now() : it.completedAt;

        return { ...it, timeline, currentStep: nextStep, status, completedAt };
      })
    );

    toast({ title: "Updated", message: "Status advanced.", kind: "success" });
  };

  const cancelItem = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Cancelled" } : it)));
    addException({
      kind: "Cancellation",
      severity: "Warning",
      fulfillmentId: id,
      title: "Cancelled",
      detail: "Request was cancelled by admin.",
      recommendedAction: "Rebook if needed.",
    });
    toast({ title: "Cancelled", message: "Item cancelled.", kind: "warn" });
  };

  const refundItem = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Refunded" } : it)));
    addException({
      kind: "Refund",
      severity: "Warning",
      fulfillmentId: id,
      title: "Refund initiated",
      detail: "Refund recorded (demo).",
      recommendedAction: "Verify refund settlement in Transactions.",
    });
    toast({ title: "Refunded", message: "Refund recorded.", kind: "info" });
  };

  const rebookItem = (id: string) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, status: "Rebooked" } : it)));
    addException({
      kind: "Rebooking",
      severity: "Info",
      fulfillmentId: id,
      title: "Rebook requested",
      detail: "Item rebook requested. Create a new request to replace it.",
      recommendedAction: "Create a new booking and link reference.",
    });
    toast({ title: "Rebooked", message: "Rebooking logged.", kind: "info" });
  };

  const addProof = () => {
    if (!activeItem) return;
    if (!proofDraft.name.trim()) {
      toast({ title: "Missing", message: "Add a proof name.", kind: "warn" });
      return;
    }
    const p: Attachment = {
      id: uid("PR"),
      name: proofDraft.name.trim(),
      type: proofDraft.type,
      note: proofDraft.note.trim(),
      addedAt: Date.now(),
      addedBy: "You",
    };
    setItems((prev) => prev.map((it) => (it.id === activeItem.id ? { ...it, proofs: [p, ...it.proofs] } : it)));
    setProofOpen(false);
    toast({ title: "Added", message: "Proof attached.", kind: "success" });
  };

  const createDispute = (reason: string, autoTriggered = false) => {
    if (!activeItem) return;
    if (!reason.trim()) {
      toast({ title: "Missing", message: "Add a dispute reason.", kind: "warn" });
      return;
    }
    const d: Dispute = {
      id: uid("DSP"),
      createdAt: Date.now(),
      fulfillmentId: activeItem.id,
      status: "Open",
      reason: reason.trim(),
      autoTriggered,
      evidence: [],
    };
    setDisputes((p) => [d, ...p]);
    toast({ title: "Dispute opened", message: "Dispute created.", kind: "success" });
  };

  const openRating = () => {
    if (!activeItem) return;
    setRatingDraft({ stars: 5, comment: "", acknowledge: false });
    setRatingOpen(true);
  };

  const submitRating = () => {
    if (!activeItem) return;
    if (!ratingDraft.acknowledge) {
      toast({ title: "Required", message: "Acknowledge that rating is recorded.", kind: "warn" });
      return;
    }
    const stars = clamp(Math.round(ratingDraft.stars), 1, 5);
    const comment = ratingDraft.comment.trim();
    const at = Date.now();

    setItems((prev) => prev.map((it) => (it.id === activeItem.id ? { ...it, rating: { stars, comment, at } } : it)));

    // update vendor rating avg
    setVendors((prev) =>
      prev.map((v) => {
        if (v.id !== activeItem.vendorId) return v;
        const newCount = v.ratingCount + 1;
        const newAvg = (v.ratingAvg * v.ratingCount + stars) / newCount;
        return { ...v, ratingAvg: Math.round(newAvg * 10) / 10, ratingCount: newCount };
      })
    );

    setRatingOpen(false);
    toast({ title: "Thanks", message: "Vendor feedback recorded.", kind: "success" });
  };

  // NOTE: Small safety fix for an edge case: when active item changes, close rating modal.
  useEffect(() => {
    setRatingOpen(false);
  }, [activeId]);

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
                  <div className="text-sm font-semibold text-slate-900">Orders, Service Requests and Fulfillment</div>
                  <div className="mt-1 text-xs text-slate-500">Track POs, bookings, deliveries, and ride schedules with timelines, proofs, exceptions, SLAs, and dispute triggers.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Open: ${kpis.open}`} tone={kpis.open ? "warn" : "good"} />
                    <Pill label={`Completed 7d: ${kpis.completed7d}`} tone="good" />
                    <Pill label={`SLA breaches: ${kpis.breached}`} tone={kpis.breached ? "bad" : "good"} />
                    <Pill label={`Exceptions: ${kpis.openExceptions}`} tone={kpis.openExceptions ? "warn" : "good"} />
                    <Pill label={`Disputes: ${kpis.openDisputes}`} tone={kpis.openDisputes ? "warn" : "good"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={ensureSlaScan}>
                  <Timer className="h-4 w-4" /> SLA scan
                </Button>
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="primary" onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" /> New
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "items", label: "All fulfillment" },
                { id: "exceptions", label: "Exceptions" },
                { id: "sla", label: "SLA and penalties" },
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
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Fulfillment health"
                    subtitle="Status timelines and proofs for end-to-end operational visibility."
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <KPI title="Open items" value={`${kpis.open}`} sub="Pending, confirmed, in progress" icon={<CalendarClock className="h-5 w-5" />} tone={kpis.open ? "warn" : "good"} />
                      <KPI title="Completed" value={`${kpis.completed7d}`} sub="Last 7 days" icon={<Check className="h-5 w-5" />} tone="good" />
                      <KPI title="SLA breaches" value={`${kpis.breached}`} sub="Overdue or late" icon={<AlertTriangle className="h-5 w-5" />} tone={kpis.breached ? "bad" : "good"} />
                      <KPI title="Disputes" value={`${kpis.openDisputes}`} sub="Open or in review" icon={<Shield className="h-5 w-5" />} tone={kpis.openDisputes ? "warn" : "good"} />
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Item</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Due</th>
                            <th className="px-4 py-3 font-semibold">SLA</th>
                            <th className="px-4 py-3 font-semibold">Proofs</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.slice(0, 6).map((it) => {
                            const v = vendorById[it.vendorId];
                            const sla = calcSlaBreach(it, now);
                            return (
                              <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{it.ref}</div>
                                  <div className="mt-1 text-xs text-slate-500">{it.module}{it.marketplace ? ` • ${it.marketplace}` : ""}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{it.type}</td>
                                <td className="px-4 py-3 text-slate-700">{v?.name || it.vendorId}</td>
                                <td className="px-4 py-3"><Pill label={it.status} tone={statusTone(it.status)} /></td>
                                <td className="px-4 py-3 text-slate-700">{fmtDate(it.dueAt)}</td>
                                <td className="px-4 py-3">
                                  {sla.breached ? <Pill label="Breached" tone="bad" /> : <Pill label="OK" tone="good" />}
                                  <div className="mt-1 text-xs text-slate-500">{sla.overdueDays ? `${sla.overdueDays} day(s) overdue` : sla.lateDays ? `${sla.lateDays} day(s) late` : "On track"}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{it.proofs.length}</td>
                                <td className="px-4 py-3">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openItem(it.id)}>
                                    <ChevronRight className="h-4 w-4" /> Open
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          {!items.length ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-10">
                                <Empty title="No fulfillment" subtitle="Create your first order or booking." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: SLA breaches can auto-create disputes and calculate penalties.
                    </div>
                  </Section>

                  <Section title="Automation settings" subtitle="Premium controls for dispute triggers and penalty calculations." right={<Pill label="Premium" tone="info" /> }>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Toggle
                        enabled={settings.autoDisputeOnSlaBreach}
                        onChange={(v) => setSettings((p) => ({ ...p, autoDisputeOnSlaBreach: v }))}
                        label="Auto dispute on SLA breach"
                        description="Creates a dispute record when overdue or late."
                      />
                      <Toggle
                        enabled={settings.autoPenaltyCalc}
                        onChange={(v) => setSettings((p) => ({ ...p, autoPenaltyCalc: v }))}
                        label="Auto penalty calculation"
                        description="Estimates penalty amounts per vendor terms."
                      />
                      <Toggle
                        enabled={settings.requireApprovalForPenalty}
                        onChange={(v) => setSettings((p) => ({ ...p, requireApprovalForPenalty: v }))}
                        label="Require approval for penalties"
                        description="If penalty exceeds threshold, route to approval chain."
                      />
                      <div className={cn(!settings.requireApprovalForPenalty && "opacity-60")}>
                        <NumberField
                          label="Penalty approval threshold"
                          value={settings.penaltyApprovalThresholdUGX}
                          onChange={(v) => setSettings((p) => ({ ...p, penaltyApprovalThresholdUGX: Math.max(0, v) }))}
                          hint="UGX"
                          disabled={!settings.requireApprovalForPenalty}
                        />
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={ensureSlaScan}>
                        <Timer className="h-4 w-4" /> Run SLA scan
                      </Button>
                      <Button variant="outline" onClick={() => setTab("sla")}>
                        <ChevronRight className="h-4 w-4" /> View SLA
                      </Button>
                      <Button variant="outline" onClick={() => setTab("disputes")}>
                        <ChevronRight className="h-4 w-4" /> View disputes
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Exceptions snapshot" subtitle="Open issues needing attention." right={<Pill label={`${exceptions.filter((e) => e.status === "Open").length}`} tone={exceptions.filter((e) => e.status === "Open").length ? "warn" : "good"} />}>
                    <div className="space-y-2">
                      {exceptions
                        .filter((e) => e.status === "Open")
                        .slice(0, 5)
                        .map((e) => (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={e.kind} tone="neutral" />
                                  <Pill label={e.severity} tone={severityTone(e.severity)} />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{e.title}</div>
                                <div className="mt-1 text-xs text-slate-500">{timeAgo(e.createdAt)} • {e.fulfillmentId}</div>
                                <div className="mt-2 text-sm text-slate-700">{e.detail}</div>
                              </div>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { openItem(e.fulfillmentId); setTab("items"); }}>
                                <ChevronRight className="h-4 w-4" /> Open
                              </Button>
                            </div>
                          </div>
                        ))}
                      {!exceptions.filter((e) => e.status === "Open").length ? (
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No open exceptions.</div>
                      ) : null}
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" className="w-full" onClick={() => setTab("exceptions")}>
                        <ChevronRight className="h-4 w-4" /> Open exceptions
                      </Button>
                    </div>
                  </Section>

                  <Section title="Quality feedback" subtitle="Premium: vendor rating loop after fulfillment." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {vendors
                        .filter((v) => v.status === "Approved")
                        .slice(0, 5)
                        .map((v) => (
                          <div key={v.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                <div className="mt-1 text-xs text-slate-500">Rating {v.ratingAvg.toFixed(1)} • {v.ratingCount} reviews</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={`SLA target ${v.slaOnTimeTargetPct}%`} tone="neutral" />
                                  <Pill label={`Penalty ${v.penaltyPct}%`} tone="neutral" />
                                </div>
                              </div>
                              <Star className="h-5 w-5 text-amber-500" />
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Ratings can be required after completion for specific categories.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "items" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Filters" subtitle="Search and filter all fulfillment." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-600">Search</div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="ref, vendor, location..."
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Select
                          label="Type"
                          value={typeFilter}
                          onChange={(v) => setTypeFilter(v as any)}
                          options={[{ value: "All", label: "All" }, ...(["Purchase Order", "Service Booking", "Delivery", "Ride Schedule"] as FulfillmentType[]).map((x) => ({ value: x, label: x }))]}
                        />
                        <Select
                          label="Status"
                          value={statusFilter}
                          onChange={(v) => setStatusFilter(v as any)}
                          options={[{ value: "All", label: "All" }, ...(["Pending", "Confirmed", "In progress", "Completed", "Cancelled", "Refunded", "Rebooked"] as FulfillmentStatus[]).map((x) => ({ value: x, label: x }))]}
                        />
                        <Select
                          label="Module"
                          value={moduleFilter}
                          onChange={(v) => setModuleFilter(v as any)}
                          options={[{ value: "All", label: "All" }, ...SERVICE_MODULES.map((m) => ({ value: m, label: m }))]}
                        />
                        <Select
                          label="Vendor"
                          value={vendorFilter}
                          onChange={setVendorFilter}
                          options={[{ value: "All", label: "All" }, ...vendors.map((v) => ({ value: v.id, label: v.name }))]}
                        />
                      </div>
                      <div className="mt-3">
                        <Toggle
                          enabled={breachOnly}
                          onChange={setBreachOnly}
                          label="SLA breach only"
                          description="Overdue or completed late"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQ("");
                            setTypeFilter("All");
                            setStatusFilter("All");
                            setModuleFilter("All");
                            setVendorFilter("All");
                            setBreachOnly(false);
                            toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                          }}
                        >
                          <Filter className="h-4 w-4" /> Reset
                        </Button>
                        <Button variant="outline" onClick={exportCSV}>
                          <Download className="h-4 w-4" /> CSV
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Proofs are required for delivery and completion confirmation in regulated programs.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section
                    title="All fulfillment"
                    subtitle="Track orders, bookings, deliveries, and ride schedules with proofs and exceptions."
                    right={<Pill label={`${filteredItems.length}`} tone="neutral" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Ref</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Due</th>
                            <th className="px-4 py-3 font-semibold">SLA</th>
                            <th className="px-4 py-3 font-semibold">Proofs</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredItems.map((it) => {
                            const v = vendorById[it.vendorId];
                            const sla = calcSlaBreach(it, now);
                            return (
                              <tr key={it.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{it.ref}</div>
                                  <div className="mt-1 text-xs text-slate-500">{it.module}{it.marketplace ? ` • ${it.marketplace}` : ""}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{it.type}</td>
                                <td className="px-4 py-3 text-slate-700">{v?.name || it.vendorId}</td>
                                <td className="px-4 py-3"><Pill label={it.status} tone={statusTone(it.status)} /></td>
                                <td className="px-4 py-3 text-slate-700">{fmtDate(it.dueAt)}</td>
                                <td className="px-4 py-3">
                                  {sla.breached ? <Pill label="Breached" tone="bad" /> : <Pill label="OK" tone="good" />}
                                  <div className="mt-1 text-xs text-slate-500">{sla.overdueDays ? `${sla.overdueDays} overdue` : sla.lateDays ? `${sla.lateDays} late` : ""}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{it.proofs.length}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openItem(it.id)}>
                                      <ChevronRight className="h-4 w-4" /> Open
                                    </Button>
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => advanceItem(it.id)}
                                      disabled={it.status === "Completed" || it.status === "Cancelled" || it.status === "Refunded"}
                                      title={it.status === "Completed" ? "Already completed" : "Advance timeline"}
                                    >
                                      <Check className="h-4 w-4" /> Advance
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                          {!filteredItems.length ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-10">
                                <Empty title="No results" subtitle="Try changing your filters." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "exceptions" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Exceptions" subtitle="Cancellations, refunds, rebooking, SLA breaches." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Use this queue to resolve exceptions and keep the audit trail clean.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={ensureSlaScan}>
                        <Timer className="h-4 w-4" /> Scan SLA
                      </Button>
                      <Button variant="outline" onClick={() => setTab("items")}>
                        <ChevronRight className="h-4 w-4" /> Open fulfillment
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Exceptions queue" subtitle="Resolve, refund, rebook, or dispute." right={<Pill label={`${exceptions.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {exceptions.map((e) => (
                        <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={e.kind} tone="neutral" />
                                <Pill label={e.severity} tone={severityTone(e.severity)} />
                                <Pill label={e.status} tone={e.status === "Resolved" ? "good" : "warn"} />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{e.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(e.createdAt)} • {e.fulfillmentId}</div>
                              <div className="mt-2 text-sm text-slate-700">{e.detail}</div>
                              <div className="mt-2 text-xs text-slate-600">Recommended: {e.recommendedAction}</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openItem(e.fulfillmentId)}>
                                <ChevronRight className="h-4 w-4" /> Open
                              </Button>
                              {e.status === "Open" ? (
                                <Button
                                  variant="primary"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    setExceptions((p) => p.map((x) => (x.id === e.id ? { ...x, status: "Resolved" } : x)));
                                    toast({ title: "Resolved", message: "Exception resolved.", kind: "success" });
                                  }}
                                >
                                  <Check className="h-4 w-4" /> Resolve
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                      {!exceptions.length ? <Empty title="No exceptions" subtitle="Everything is running smoothly." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "sla" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="SLA and penalties" subtitle="Premium: vendor SLA tracking and penalties." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Penalty calculations are estimates. In production, you can require approvals and generate credit notes.
                    </div>
                    <div className="mt-3 space-y-2">
                      <Toggle
                        enabled={settings.autoPenaltyCalc}
                        onChange={(v) => setSettings((p) => ({ ...p, autoPenaltyCalc: v }))}
                        label="Auto calculate penalties"
                        description="Uses vendor penalty terms"
                      />
                      <Toggle
                        enabled={settings.autoDisputeOnSlaBreach}
                        onChange={(v) => setSettings((p) => ({ ...p, autoDisputeOnSlaBreach: v }))}
                        label="Auto dispute on breach"
                        description="Creates disputes when breach detected"
                      />
                    </div>
                    <div className="mt-3">
                      <Button variant="primary" className="w-full" onClick={ensureSlaScan}>
                        <Timer className="h-4 w-4" /> Run SLA scan
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Vendor SLA tracking" subtitle="On-time rate, breaches, penalties, and ratings." right={<Pill label="Premium" tone="info" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Target</th>
                            <th className="px-4 py-3 font-semibold">On-time</th>
                            <th className="px-4 py-3 font-semibold">Breaches</th>
                            <th className="px-4 py-3 font-semibold">Penalty estimate</th>
                            <th className="px-4 py-3 font-semibold">Rating</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorStats.map((s) => (
                            <tr key={s.vendor.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{s.vendor.name}</div>
                                <div className="mt-1 text-xs text-slate-500">{s.vendor.country} • {s.vendor.status}</div>
                              </td>
                              <td className="px-4 py-3"><Pill label={`${s.vendor.slaOnTimeTargetPct}%`} tone="neutral" /></td>
                              <td className="px-4 py-3">
                                <Pill
                                  label={`${s.onTimePct}%`}
                                  tone={s.onTimePct >= s.vendor.slaOnTimeTargetPct ? "good" : s.onTimePct >= s.vendor.slaOnTimeTargetPct - 5 ? "warn" : "bad"}
                                />
                                <div className="mt-1 text-xs text-slate-500">{s.totalCompleted} completed</div>
                              </td>
                              <td className="px-4 py-3"><Pill label={`${s.breached}`} tone={s.breached ? "warn" : "good"} /></td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(s.penaltiesUGX)}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  <span className="font-semibold text-slate-900">{s.vendor.ratingAvg.toFixed(1)}</span>
                                  <span className="text-xs text-slate-500">({s.vendor.ratingCount})</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                          {!vendorStats.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10">
                                <Empty title="No vendors" subtitle="No vendor stats available." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: penalties can create credit notes or adjustments in Invoices and Statements.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "disputes" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Disputes" subtitle="Auto triggers on SLA breach and manual disputes." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Disputes can be triggered automatically on SLA breach or opened manually with evidence.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={ensureSlaScan}>
                        <Timer className="h-4 w-4" /> Scan SLA
                      </Button>
                      <Button variant="outline" onClick={() => setTab("items")}>
                        <ChevronRight className="h-4 w-4" /> Open fulfillment
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Dispute list" subtitle="Open, review, resolve." right={<Pill label={`${disputes.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {disputes.map((d) => {
                        const it = items.find((x) => x.id === d.fulfillmentId);
                        const v = it ? vendorById[it.vendorId] : null;
                        return (
                          <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={d.status} tone={disputeTone(d.status)} />
                                  <Pill label={d.autoTriggered ? "Auto" : "Manual"} tone={d.autoTriggered ? "info" : "neutral"} />
                                  {it ? <Pill label={it.ref} tone="neutral" /> : null}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{d.reason}</div>
                                <div className="mt-1 text-xs text-slate-500">Created {fmtDateTime(d.createdAt)}</div>
                                {it ? <div className="mt-2 text-xs text-slate-600">Vendor: {v?.name || it.vendorId} • Type: {it.type} • Total: {formatMoney(it.total, it.currency)}</div> : null}
                              </div>
                              <div className="flex flex-wrap items-center gap-2">
                                {it ? (
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openItem(it.id)}>
                                    <ChevronRight className="h-4 w-4" /> Open item
                                  </Button>
                                ) : null}
                                {d.status !== "Resolved" ? (
                                  <Button
                                    variant="primary"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setDisputes((p) => p.map((x) => (x.id === d.id ? { ...x, status: "Resolved" } : x)));
                                      toast({ title: "Resolved", message: "Dispute resolved.", kind: "success" });
                                    }}
                                  >
                                    <Check className="h-4 w-4" /> Resolve
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {!disputes.length ? <Empty title="No disputes" subtitle="Run SLA scan or create a dispute from an item." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              T Orders, Service Requests and Fulfillment v2. Core: track POs, bookings, deliveries, and ride schedules with timelines and proofs plus exception handling. Premium: vendor SLA tracking and penalties, quality feedback loop, and automated dispute triggers.
            </div>
          </footer>
        </div>
      </div>

      {/* Create modal */}
      <Modal
        open={createOpen}
        title="Create request"
        subtitle="Create a PO, service booking, delivery, or ride schedule for tracking."
        onClose={() => setCreateOpen(false)}
        actions={[{ label: "Create", onClick: createItem }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createItem}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Type"
            value={draft.type}
            onChange={(v) => setDraft((p) => ({ ...p, type: v as FulfillmentType }))}
            options={["Purchase Order", "Service Booking", "Delivery", "Ride Schedule"].map((x) => ({ value: x, label: x }))}
          />
          <Select
            label="Module"
            value={draft.module}
            onChange={(v) => setDraft((p) => ({ ...p, module: v as ServiceModule }))}
            options={SERVICE_MODULES.map((m) => ({ value: m, label: m }))}
          />
          <Select
            label="Marketplace"
            value={draft.marketplace}
            onChange={(v) => setDraft((p) => ({ ...p, marketplace: v as Marketplace }))}
            options={MARKETPLACES.map((m) => ({ value: m, label: m }))}
            disabled={draft.module !== "E-Commerce"}
            hint={draft.module !== "E-Commerce" ? "Only for E-Commerce" : ""}
          />
          <Select
            label="Vendor"
            value={draft.vendorId}
            onChange={(v) => setDraft((p) => ({ ...p, vendorId: v }))}
            options={vendors.map((v) => ({ value: v.id, label: `${v.name} (${v.status})` }))}
          />
          <Select
            label="Currency"
            value={draft.currency}
            onChange={(v) => setDraft((p) => ({ ...p, currency: v as any }))}
            options={(["UGX", "USD", "EUR", "CNY"] as const).map((c) => ({ value: c, label: c }))}
          />
          <NumberField label="Total" value={draft.total} onChange={(v) => setDraft((p) => ({ ...p, total: Math.max(0, v) }))} hint="Expected cost" />
          <div className="md:col-span-2">
            <Field label="Location" value={draft.location} onChange={(v) => setDraft((p) => ({ ...p, location: v }))} placeholder="Delivery or service location" />
          </div>
          <div className="md:col-span-2">
            <TextArea label="Description" value={draft.description} onChange={(v) => setDraft((p) => ({ ...p, description: v }))} placeholder="What needs to be delivered or done" rows={4} />
          </div>
          <NumberField label="Due in (days)" value={draft.dueInDays} onChange={(v) => setDraft((p) => ({ ...p, dueInDays: clamp(v, 0, 365) }))} hint="SLA baseline" />
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            For high value items, create RFQ first, then convert to PO. This page focuses on tracking and fulfillment.
          </div>
        </div>
      </Modal>

      {/* Proof modal */}
      <Modal
        open={proofOpen}
        title="Add proof"
        subtitle="Upload delivery confirmations or completion logs (simulated)."
        onClose={() => setProofOpen(false)}
        actions={[{ label: "Add", onClick: addProof }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setProofOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={addProof}>
              <BadgeCheck className="h-4 w-4" /> Add
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Proof type"
            value={proofDraft.type}
            onChange={(v) => setProofDraft((p) => ({ ...p, type: v as ProofType }))}
            options={(["Delivery confirmation", "Completion log", "Trip receipt", "Signature", "Photo", "Other"] as ProofType[]).map((x) => ({ value: x, label: x }))}
          />
          <Field label="File name" value={proofDraft.name} onChange={(v) => setProofDraft((p) => ({ ...p, name: v }))} placeholder="photo.jpg" />
          <div className="md:col-span-2">
            <TextArea label="Note" value={proofDraft.note} onChange={(v) => setProofDraft((p) => ({ ...p, note: v }))} rows={3} placeholder="Optional" />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            In production, files are stored securely and referenced by signed URLs.
          </div>
        </div>
      </Modal>

      {/* Rating modal */}
      <Modal
        open={ratingOpen}
        title="Rate vendor"
        subtitle="Premium: quality feedback loop after fulfillment."
        onClose={() => setRatingOpen(false)}
        actions={[{ label: "Submit", onClick: submitRating }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRatingOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitRating}>
              <Star className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Stars</div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={cn(
                    "inline-flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold",
                    ratingDraft.stars >= n ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                  onClick={() => setRatingDraft((p) => ({ ...p, stars: n }))}
                >
                  <Star className={cn("h-4 w-4", ratingDraft.stars >= n ? "text-amber-500" : "text-slate-300")} />
                  {n}
                </button>
              ))}
            </div>
          </div>
          <TextArea label="Comment" value={ratingDraft.comment} onChange={(v) => setRatingDraft((p) => ({ ...p, comment: v }))} placeholder="Optional feedback" rows={4} />
          <label className="flex items-start gap-3 rounded-3xl border border-slate-200 bg-white p-4">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-slate-300"
              checked={ratingDraft.acknowledge}
              onChange={(e) => setRatingDraft((p) => ({ ...p, acknowledge: e.target.checked }))}
            />
            <div>
              <div className="text-sm font-semibold text-slate-900">Acknowledge</div>
              <div className="mt-1 text-xs text-slate-600">This feedback is stored and can be used to improve vendor performance.</div>
            </div>
          </label>
        </div>
      </Modal>

      {/* Item drawer */}
      <Drawer
        open={drawerOpen}
        title={activeItem ? `${activeItem.ref} • ${activeItem.type}` : "Fulfillment"}
        subtitle={activeItem ? `${activeItem.module}${activeItem.marketplace ? ` • ${activeItem.marketplace}` : ""} • ${vendorById[activeItem.vendorId]?.name || activeItem.vendorId}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          activeItem ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Actions are audit logged in production.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setProofDraft({ type: "Photo", name: "", note: "" });
                    setProofOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add proof
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (!activeItem) return;
                    createDispute("Manual dispute", false);
                    setTab("disputes");
                  }}
                >
                  <Shield className="h-4 w-4" /> Dispute
                </Button>
                <Button
                  variant="primary"
                  onClick={() => advanceItem(activeItem.id)}
                  disabled={activeItem.status === "Completed" || activeItem.status === "Cancelled" || activeItem.status === "Refunded"}
                >
                  <Check className="h-4 w-4" /> Advance
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeItem ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeItem.status} tone={statusTone(activeItem.status)} />
                    <Pill label={activeItem.currency} tone="neutral" />
                    {activeVendor ? <Pill label={`Vendor SLA ${activeVendor.slaOnTimeTargetPct}%`} tone="neutral" /> : null}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{activeItem.description}</div>
                  <div className="mt-1 text-xs text-slate-500">Created {fmtDateTime(activeItem.createdAt)} • Due {fmtDateTime(activeItem.dueAt)}</div>
                  <div className="mt-2 text-sm text-slate-700">Location: <span className="font-semibold">{activeItem.location}</span></div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Total</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(activeItem.total, activeItem.currency)}</div>
                  <div className="mt-1 text-xs text-slate-500">Proofs {activeItem.proofs.length}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Button variant="outline" onClick={() => cancelItem(activeItem.id)} disabled={activeItem.status === "Completed" || activeItem.status === "Cancelled" || activeItem.status === "Refunded"}>
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button variant="outline" onClick={() => refundItem(activeItem.id)} disabled={activeItem.status === "Refunded"}>
                  <Wallet className="h-4 w-4" /> Refund
                </Button>
                <Button variant="outline" onClick={() => rebookItem(activeItem.id)} disabled={activeItem.status === "Rebooked"}>
                  <CalendarClock className="h-4 w-4" /> Rebook
                </Button>
              </div>
            </div>

            {/* SLA card */}
            <Section title="SLA status" subtitle="Overdue checks and penalty estimate." right={<Pill label="Premium" tone="info" />}>
              {(() => {
                const sla = calcSlaBreach(activeItem, now);
                const penaltyUGX = settings.autoPenaltyCalc ? calcPenaltyUGX(activeItem, activeVendor || undefined) : 0;
                const requiresApproval = settings.requireApprovalForPenalty && penaltyUGX >= settings.penaltyApprovalThresholdUGX;

                return (
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          {sla.breached ? <Pill label="Breached" tone="bad" /> : <Pill label="OK" tone="good" />}
                          {sla.overdueDays ? <Pill label={`${sla.overdueDays} day(s) overdue`} tone="warn" /> : null}
                          {sla.lateDays ? <Pill label={`${sla.lateDays} day(s) late`} tone="warn" /> : null}
                        </div>
                        <div className="mt-2 text-xs text-slate-600">Due: {fmtDateTime(activeItem.dueAt)}{activeItem.completedAt ? ` • Completed: ${fmtDateTime(activeItem.completedAt)}` : ""}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Penalty estimate</div>
                        <div className="mt-1 text-lg font-semibold text-slate-900">{formatUGX(penaltyUGX)}</div>
                        {requiresApproval ? <div className="mt-1 text-xs font-semibold text-amber-700">Approval required</div> : <div className="mt-1 text-xs text-slate-500">No approval needed</div>}
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => createDispute("SLA breach dispute", true)} disabled={!sla.breached}>
                        <Shield className="h-4 w-4" /> Open dispute
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({ title: "Penalty", message: "In production, penalties can create credit notes or adjustments.", kind: "info" });
                        }}
                        disabled={!sla.breached || !settings.autoPenaltyCalc}
                      >
                        <FileText className="h-4 w-4" /> Create credit note
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Automated dispute triggers run via SLA scan. You can run the scan from the page header.
                    </div>
                  </div>
                );
              })()}
            </Section>

            {/* Timeline */}
            <Section title="Status timeline" subtitle="Timeline plus completion logs." right={<Pill label="Core" tone="neutral" />}>
              <div className="space-y-2">
                {activeItem.timeline.map((t, idx) => {
                  const done = idx < activeItem.currentStep;
                  const current = idx === activeItem.currentStep;
                  return (
                    <div key={t.id} className={cn("rounded-3xl border p-4", current ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Pill label={`Step ${idx + 1}`} tone="neutral" />
                            {done ? <Pill label="Done" tone="good" /> : current ? <Pill label="Current" tone="info" /> : <Pill label="Next" tone="neutral" />}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">{t.label}</div>
                          <div className="mt-1 text-xs text-slate-500">{t.at ? fmtDateTime(t.at) : "Not reached"}{t.note ? ` • ${t.note}` : ""}</div>
                        </div>
                        {current && activeItem.status !== "Completed" && activeItem.status !== "Cancelled" && activeItem.status !== "Refunded" ? (
                          <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => advanceItem(activeItem.id)}>
                            <Check className="h-4 w-4" /> Advance
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Section>

            {/* Proofs */}
            <Section
              title="Proofs"
              subtitle="Delivery confirmations, completion logs, receipts."
              right={
                <Button
                  variant="outline"
                  onClick={() => {
                    setProofDraft({ type: "Photo", name: "", note: "" });
                    setProofOpen(true);
                  }}
                >
                  <Plus className="h-4 w-4" /> Add
                </Button>
              }
            >
              <div className="space-y-2">
                {activeItem.proofs.map((p) => (
                  <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Pill label={p.type} tone="neutral" />
                          <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        </div>
                        <div className="mt-1 text-xs text-slate-500">Added {fmtDateTime(p.addedAt)} • {p.addedBy}</div>
                        {p.note ? <div className="mt-2 text-xs text-slate-600">Note: {p.note}</div> : null}
                      </div>
                      <Button
                        variant="outline"
                        className="px-3 py-2 text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(p.name);
                            toast({ title: "Copied", message: "Proof filename copied.", kind: "success" });
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
                {!activeItem.proofs.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No proofs attached.</div> : null}
              </div>
            </Section>

            {/* Rating */}
            <Section title="Vendor feedback" subtitle="Rate vendor after completion." right={<Pill label="Premium" tone="info" />}>
              {activeItem.status === "Completed" ? (
                <div className="rounded-3xl border border-slate-200 bg-white p-4">
                  {activeItem.rating ? (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Star className="h-5 w-5 text-amber-500" />
                          <div className="text-sm font-semibold text-slate-900">{activeItem.rating.stars} star(s)</div>
                          <Pill label={fmtDateTime(activeItem.rating.at)} tone="neutral" />
                        </div>
                        {activeItem.rating.comment ? <div className="mt-2 text-sm text-slate-700">{activeItem.rating.comment}</div> : <div className="mt-2 text-sm text-slate-600">No comment.</div>}
                      </div>
                      <Button variant="outline" onClick={openRating}>
                        <Star className="h-4 w-4" /> Update
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">No rating yet</div>
                        <div className="mt-1 text-xs text-slate-500">Premium: ratings can be required for some modules.</div>
                      </div>
                      <Button variant="primary" onClick={openRating}>
                        <Star className="h-4 w-4" /> Rate now
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">Rating is available once the item is completed.</div>
              )}
            </Section>
          </div>
        ) : (
          <Empty title="No item selected" subtitle="Select a fulfillment item to view details." />
        )}
      </Drawer>
    </div>
  );

  function KPI({ title, value, sub, icon, tone }: { title: string; value: string; sub: string; icon: React.ReactNode; tone: "neutral" | "good" | "warn" | "bad" | "info" }) {
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
}
