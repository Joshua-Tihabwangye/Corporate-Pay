import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Battery,
  Check,
  ChevronRight,
  Copy,
  Download,
  Filter,
  Info,
  MapPin,
  Plus,
  Repeat,
  Search,
  Sparkles,
  Timer,
  Users,
  Zap,
  Crown,
  X,
  Shield,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type RideOrChargeModule = "EVs & Charging" | "Other Service Module";

type ChargerConnector = "Type 2 (AC)" | "CCS2 (DC)" | "GB/T (DC)" | "CHAdeMO (DC)";

type SiteStatus = "Online" | "Limited" | "Offline";

type SessionStatus = "Draft" | "Pending approval" | "Confirmed" | "In progress" | "Completed" | "Cancelled";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type ApprovalRole = "Manager" | "Finance" | "CFO" | "CEO";

type VehicleOwnerType = "Company" | "Employee" | "Visitor";

type ChargePurpose =
  | "Operations"
  | "Office commute"
  | "Delivery"
  | "Executive"
  | "Event"
  | "Visitor"
  | "Other";

type VipExceptionType = "DC fast" | "Priority slot" | "After-hours";

type Attachment = { id: string; name: string; note: string; addedAt: number; addedBy: string };

type ChargingSite = {
  id: string;
  name: string;
  city: string;
  address: string;
  operator: string;
  status: SiteStatus;
  reliabilityPct: number; // 0..100
  connectors: Array<{
    connector: ChargerConnector;
    powerKW: number;
    count: number;
    priceUGXPerKWh: number;
  }>;
};

type Vehicle = {
  id: string;
  label: string; // plate or nickname
  ownerType: VehicleOwnerType;
  ownerName: string;
  group: string;
  costCenter: string;
  vip: boolean;
  batteryKWh: number;
};

type ChargeSession = {
  id: string;
  ref: string;
  vehicleId: string;
  bookedBy: string;
  createdAt: number;
  scheduledAt: number;
  durationMins: number;
  siteId: string;
  connector: ChargerConnector;
  expectedKWh: number;
  maxBudgetUGX: number;
  purpose: ChargePurpose;
  purposeOther?: string;
  tags: string[];
  costCenter: string;
  projectTag: string;
  module: RideOrChargeModule;
  status: SessionStatus;
  policyNotes: string[];
  proofs: Attachment[];
  result?: { kWhDelivered: number; costUGX: number; endedAt: number };
};

type ApprovalStep = {
  id: string;
  role: ApprovalRole;
  assignee: string;
  status: ApprovalStatus;
  requestedAt: number;
  decidedAt?: number;
  note?: string;
  slaHours: number;
};

type ApprovalRequest = {
  id: string;
  createdAt: number;
  createdBy: string;
  status: ApprovalStatus;
  scope: "Session" | "Fleet plan" | "VIP Exception";
  scopeId: string;
  reason: string;
  flags: string[];
  steps: ApprovalStep[];
};

type VipException = {
  id: string;
  vehicleId: string;
  exceptionType: VipExceptionType;
  validFrom: number;
  validTo: number;
  requestedBy: string;
  status: ApprovalStatus;
  reason: string;
  approvalId?: string;
};

type RecurringPlan = {
  id: string;
  name: string;
  days: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
  timeLocal: string; // HH:MM
  siteId: string;
  connector: ChargerConnector;
  durationMins: number;
  expectedKWh: number;
  maxBudgetUGX: number;
  purpose: ChargePurpose;
  tags: string[];
  vehicles: string[];
  enabled: boolean;
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

function toLocalInput(ts: number) {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function parseLocalInput(s: string) {
  const ts = new Date(s).getTime();
  return Number.isFinite(ts) ? ts : Date.now();
}

function hourOf(ts: number) {
  return new Date(ts).getHours();
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function isAfterHours(ts: number, workStart = "06:00", workEnd = "22:00") {
  const d = new Date(ts);
  const mins = d.getHours() * 60 + d.getMinutes();
  const parse = (s: string) => {
    const [h, m] = s.split(":").map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  };
  const start = parse(workStart);
  const end = parse(workEnd);
  return mins < start || mins > end;
}

function isPeakTariffHour(h: number) {
  // simple demo: peak 7-9 and 17-20
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
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
  const menuRef = React.useRef<HTMLDivElement>(null);

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
        <Zap className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function statusTone(s: SessionStatus) {
  if (s === "Completed") return "good" as const;
  if (s === "In progress" || s === "Confirmed") return "info" as const;
  if (s === "Pending approval") return "warn" as const;
  if (s === "Cancelled") return "bad" as const;
  return "neutral" as const;
}

function approvalTone(s: ApprovalStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  return "warn" as const;
}

function siteTone(s: SiteStatus) {
  if (s === "Online") return "good" as const;
  if (s === "Limited") return "warn" as const;
  return "bad" as const;
}

function makeRef(prefix: string) {
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function defaultApprovalSteps(flags: string[]) {
  // best-practice: Manager -> Finance, add CFO for high-risk
  const needCFO = flags.some((f) => f.includes("DC") || f.includes("VIP") || f.includes("Priority"));
  const base: Array<{ role: ApprovalRole; slaHours: number }> = [
    { role: "Manager", slaHours: 8 },
    { role: "Finance", slaHours: 12 },
  ];
  if (needCFO) base.push({ role: "CFO", slaHours: 24 });
  return base;
}

export default function CorporatePayEVChargingSchedulingV2() {
  const now = Date.now();

  const PURPOSES: ChargePurpose[] = ["Operations", "Office commute", "Delivery", "Executive", "Event", "Visitor", "Other"];
  const CONNECTORS: ChargerConnector[] = ["Type 2 (AC)", "CCS2 (DC)", "GB/T (DC)", "CHAdeMO (DC)"];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Corporate policy defaults
  const [policy, setPolicy] = useState(() => ({
    workStart: "06:00",
    workEnd: "22:00",
    requirePurpose: true,
    requireProjectTag: true,
    requireCostCenter: true,
    dcRequiresApproval: true,
    priorityRequiresApproval: true,
    maxKWhPerSession: 60,
    maxBudgetUGXPerSession: 500000,
    peakHourThreshold: 5, // sessions per hour
  }));

  const [sites] = useState<ChargingSite[]>(() => [
    {
      id: "SITE-UG-HQ",
      name: "Kampala HQ Charging",
      city: "Kampala",
      address: "Kampala HQ, Nsambya",
      operator: "EVzone",
      status: "Online",
      reliabilityPct: 96,
      connectors: [
        { connector: "Type 2 (AC)", powerKW: 22, count: 4, priceUGXPerKWh: 850 },
        { connector: "CCS2 (DC)", powerKW: 60, count: 2, priceUGXPerKWh: 1200 },
      ],
    },
    {
      id: "SITE-UG-EBB",
      name: "Entebbe Airport Fast Hub",
      city: "Entebbe",
      address: "Entebbe Airport Road",
      operator: "Partner CPO",
      status: "Limited",
      reliabilityPct: 88,
      connectors: [
        { connector: "CCS2 (DC)", powerKW: 120, count: 2, priceUGXPerKWh: 1450 },
        { connector: "CHAdeMO (DC)", powerKW: 50, count: 1, priceUGXPerKWh: 1400 },
      ],
    },
    {
      id: "SITE-UG-JJA",
      name: "Jinja Road Hub",
      city: "Wakiso",
      address: "Jinja Road",
      operator: "EVzone",
      status: "Online",
      reliabilityPct: 92,
      connectors: [
        { connector: "Type 2 (AC)", powerKW: 11, count: 6, priceUGXPerKWh: 800 },
        { connector: "CCS2 (DC)", powerKW: 60, count: 1, priceUGXPerKWh: 1200 },
      ],
    },
  ]);

  const [vehicles] = useState<Vehicle[]>(() => [
    { id: "VEH-001", label: "Company EV 01", ownerType: "Company", ownerName: "Acme Fleet", group: "Operations", costCenter: "OPS-001", vip: false, batteryKWh: 62 },
    { id: "VEH-002", label: "Company EV 02", ownerType: "Company", ownerName: "Acme Fleet", group: "Operations", costCenter: "OPS-001", vip: false, batteryKWh: 62 },
    { id: "VEH-003", label: "Employee EV (John)", ownerType: "Employee", ownerName: "John S.", group: "Sales", costCenter: "SALES-TRAVEL", vip: false, batteryKWh: 50 },
    { id: "VEH-004", label: "Executive EV", ownerType: "Employee", ownerName: "Irene K.", group: "Operations", costCenter: "OPS-001", vip: true, batteryKWh: 75 },
    { id: "VEH-005", label: "Visitor EV", ownerType: "Visitor", ownerName: "Alex Chen", group: "Sales", costCenter: "SALES-TRAVEL", vip: true, batteryKWh: 70 },
  ]);

  const siteById = useMemo(() => Object.fromEntries(sites.map((s) => [s.id, s])) as Record<string, ChargingSite>, [sites]);
  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])) as Record<string, Vehicle>, [vehicles]);

  const [vipExceptions, setVipExceptions] = useState<VipException[]>(() => {
    const DAY = 24 * 60 * 60 * 1000;
    return [
      {
        id: "VX-001",
        vehicleId: "VEH-004",
        exceptionType: "DC fast",
        validFrom: now - 3 * DAY,
        validTo: now + 30 * DAY,
        requestedBy: "Org Admin",
        status: "Approved",
        reason: "Executive charging allowance",
        approvalId: "APR-EX-001",
      },
    ];
  });

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => {
    const H = 60 * 60 * 1000;
    const createdAt = now - 3 * H;
    return [
      {
        id: "APR-001",
        createdAt,
        createdBy: "Charging Coordinator",
        status: "Pending",
        scope: "Session",
        scopeId: "CS-001",
        reason: "Visitor VIP requested DC fast at Airport",
        flags: ["VIP", "DC"],
        steps: defaultApprovalSteps(["VIP", "DC"]).map((s) => ({
          id: uid("AS"),
          role: s.role,
          assignee: s.role === "Manager" ? "Manager" : s.role === "Finance" ? "Finance Desk" : "CFO",
          status: "Pending",
          requestedAt: createdAt,
          slaHours: s.slaHours,
        })),
      },
    ];
  });

  const [plans, setPlans] = useState<RecurringPlan[]>(() => [
    {
      id: "PLAN-001",
      name: "Daily depot top-up",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      timeLocal: "19:30",
      siteId: "SITE-UG-HQ",
      connector: "Type 2 (AC)",
      durationMins: 120,
      expectedKWh: 35,
      maxBudgetUGX: 35000,
      purpose: "Operations",
      tags: ["Depot", "Operations"],
      vehicles: ["VEH-001", "VEH-002"],
      enabled: true,
    },
  ]);

  const [sessions, setSessions] = useState<ChargeSession[]>(() => {
    const H = 60 * 60 * 1000;
    const DAY = 24 * 60 * 60 * 1000;
    const s1 = now + 1 * DAY + 9 * H;
    const s2 = now + 1 * DAY + 18 * H;
    const s3 = now + 2 * DAY + 7 * H;

    return [
      {
        id: "CS-001",
        ref: makeRef("CHG"),
        vehicleId: "VEH-005",
        bookedBy: "Charging Coordinator",
        createdAt: now - 3 * H,
        scheduledAt: s1,
        durationMins: 40,
        siteId: "SITE-UG-EBB",
        connector: "CCS2 (DC)",
        expectedKWh: 45,
        maxBudgetUGX: 120000,
        purpose: "Visitor",
        tags: ["VIP", "Airport"],
        costCenter: "SALES-TRAVEL",
        projectTag: "Roadshow",
        module: "EVs & Charging",
        status: "Pending approval",
        policyNotes: ["VIP", "DC fast"],
        proofs: [],
      },
      {
        id: "CS-002",
        ref: makeRef("CHG"),
        vehicleId: "VEH-001",
        bookedBy: "Charging Coordinator",
        createdAt: now - 90 * 60 * 1000,
        scheduledAt: s2,
        durationMins: 120,
        siteId: "SITE-UG-HQ",
        connector: "Type 2 (AC)",
        expectedKWh: 30,
        maxBudgetUGX: 30000,
        purpose: "Operations",
        tags: ["Depot"],
        costCenter: "OPS-001",
        projectTag: "Daily ops",
        module: "EVs & Charging",
        status: "Confirmed",
        policyNotes: [],
        proofs: [],
      },
      {
        id: "CS-003",
        ref: makeRef("CHG"),
        vehicleId: "VEH-003",
        bookedBy: "Charging Coordinator",
        createdAt: now - 2 * H,
        scheduledAt: s3,
        durationMins: 60,
        siteId: "SITE-UG-JJA",
        connector: "Type 2 (AC)",
        expectedKWh: 25,
        maxBudgetUGX: 25000,
        purpose: "Office commute",
        tags: ["Commute"],
        costCenter: "SALES-TRAVEL",
        projectTag: "Commute program",
        module: "EVs & Charging",
        status: "Confirmed",
        policyNotes: [],
        proofs: [],
      },
    ];
  });

  // UI
  const [tab, setTab] = useState<"overview" | "sessions" | "sites" | "recurring" | "vip" | "approvals" | "insights">("overview");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SessionStatus>("All");
  const [vehicleFilter, setVehicleFilter] = useState<"All" | string>("All");
  const [siteFilter, setSiteFilter] = useState<"All" | string>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const activeSession = useMemo(() => (activeSessionId ? sessions.find((s) => s.id === activeSessionId) || null : null), [activeSessionId, sessions]);

  // Create wizard
  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<0 | 1 | 2>(0);
  const [draft, setDraft] = useState(() => ({
    vehicleId: vehicles[0]?.id || "",
    bookedBy: "Charging Coordinator",
    scheduledAt: toLocalInput(now + 24 * 60 * 60 * 1000),
    durationMins: 60,
    siteId: sites[0]?.id || "",
    connector: "Type 2 (AC)" as ChargerConnector,
    expectedKWh: 25,
    maxBudgetUGX: 25000,
    purpose: "Operations" as ChargePurpose,
    purposeOther: "",
    tags: "Operations",
    costCenter: "OPS-001",
    projectTag: "Charging",
    prioritySlot: false,
  }));

  // Bulk fleet booking
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState(() => ({
    name: "Fleet morning top-up",
    siteId: sites[0]?.id || "",
    startAt: toLocalInput(now + 2 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
    intervalMins: 20,
    durationMins: 40,
    connector: "Type 2 (AC)" as ChargerConnector,
    expectedKWh: 18,
    maxBudgetUGX: 18000,
    purpose: "Operations" as ChargePurpose,
    tags: "Fleet",
    costCenter: "OPS-001",
    projectTag: "Fleet plan",
    vehicleIds: ["VEH-001", "VEH-002"],
    prioritySlot: false,
  }));

  // VIP exception request
  const [vipReqOpen, setVipReqOpen] = useState(false);
  const [vipReqDraft, setVipReqDraft] = useState(() => ({
    vehicleId: "VEH-004",
    exceptionType: "DC fast" as VipExceptionType,
    validDays: 30,
    reason: "",
  }));

  // Helpers
  const vehicleLabel = (id: string) => vehicleById[id]?.label || id;
  const ownerLabel = (id: string) => {
    const v = vehicleById[id];
    if (!v) return "-";
    return `${v.ownerName} (${v.ownerType})`;
  };

  const hasVipException = (vehicleId: string, exType: VipExceptionType, whenTs: number) => {
    return vipExceptions.some((x) => x.vehicleId === vehicleId && x.exceptionType === exType && x.status === "Approved" && whenTs >= x.validFrom && whenTs <= x.validTo);
  };

  const sessionFlags = (args: {
    whenTs: number;
    connector: ChargerConnector;
    prioritySlot: boolean;
    expectedKWh: number;
    maxBudgetUGX: number;
    vehicleId: string;
  }) => {
    const flags: string[] = [];

    const after = isAfterHours(args.whenTs, policy.workStart, policy.workEnd);
    const peak = isPeakTariffHour(hourOf(args.whenTs));
    const isDC = args.connector.includes("DC");
    const vip = !!vehicleById[args.vehicleId]?.vip;

    if (after) flags.push("After-hours");
    if (peak) flags.push("Peak tariff");
    if (vip) flags.push("VIP");
    if (args.prioritySlot) flags.push("Priority slot");
    if (isDC) flags.push("DC fast");
    if (args.expectedKWh > policy.maxKWhPerSession) flags.push("Above kWh limit");
    if (args.maxBudgetUGX > policy.maxBudgetUGXPerSession) flags.push("Above budget limit");

    return { flags, after, peak, vip, isDC };
  };

  const policyCheckDraft = useMemo(() => {
    const whenTs = parseLocalInput(draft.scheduledAt);
    const requiredErrors: string[] = [];

    if (policy.requirePurpose && (!draft.purpose || (draft.purpose === "Other" && !draft.purposeOther.trim()))) requiredErrors.push("Purpose required");
    if (policy.requireCostCenter && !draft.costCenter.trim()) requiredErrors.push("Cost center required");
    if (policy.requireProjectTag && !draft.projectTag.trim()) requiredErrors.push("Project tag required");

    const f = sessionFlags({
      whenTs,
      connector: draft.connector,
      prioritySlot: draft.prioritySlot,
      expectedKWh: draft.expectedKWh,
      maxBudgetUGX: draft.maxBudgetUGX,
      vehicleId: draft.vehicleId,
    });

    // Determine approvals
    let needsApproval = false;

    // DC policy
    if (f.isDC && policy.dcRequiresApproval && !hasVipException(draft.vehicleId, "DC fast", whenTs)) needsApproval = true;

    // Priority policy
    if (draft.prioritySlot && policy.priorityRequiresApproval && !hasVipException(draft.vehicleId, "Priority slot", whenTs)) needsApproval = true;

    // After-hours policy
    if (f.after && !hasVipException(draft.vehicleId, "After-hours", whenTs)) needsApproval = true;

    // If above limits, route to approvals
    if (draft.expectedKWh > policy.maxKWhPerSession || draft.maxBudgetUGX > policy.maxBudgetUGXPerSession) needsApproval = true;

    // VIP can still require approval for DC or priority
    if (f.vip && (f.isDC || draft.prioritySlot || f.after)) needsApproval = true;

    // If required fields missing, cannot create
    const canCreate = requiredErrors.length === 0;

    // Suggest off-peak
    const suggestion = f.peak ? "Consider scheduling 30-60 minutes earlier or later to avoid peak tariff." : "No peak tariff warning.";

    // Choose approval flags
    const approvalFlags = f.flags.filter((x) => x !== "Peak tariff");

    const hasActiveVipException =
      (f.isDC && hasVipException(draft.vehicleId, "DC fast", whenTs)) ||
      (draft.prioritySlot && hasVipException(draft.vehicleId, "Priority slot", whenTs)) ||
      (f.after && hasVipException(draft.vehicleId, "After-hours", whenTs));

    return { whenTs, requiredErrors, ...f, needsApproval, canCreate, suggestion, approvalFlags, hasActiveVipException };
  }, [draft, policy, vipExceptions, vehicleById]);

  const filteredSessions = useMemo(() => {
    const query = q.trim().toLowerCase();
    return sessions
      .filter((s) => (statusFilter === "All" ? true : s.status === statusFilter))
      .filter((s) => (vehicleFilter === "All" ? true : s.vehicleId === vehicleFilter))
      .filter((s) => (siteFilter === "All" ? true : s.siteId === siteFilter))
      .filter((s) => {
        if (!query) return true;
        const v = vehicleById[s.vehicleId];
        const site = siteById[s.siteId];
        const blob = `${s.ref} ${s.id} ${v?.label || ""} ${v?.ownerName || ""} ${site?.name || ""} ${s.connector} ${s.purpose} ${s.tags.join(" ")} ${s.costCenter} ${s.projectTag}`;
        return blob.toLowerCase().includes(query);
      })
      .slice()
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }, [sessions, q, statusFilter, vehicleFilter, siteFilter, vehicleById, siteById]);

  // Peak planning insights
  const upcoming = useMemo(() => sessions.filter((s) => s.scheduledAt > now && s.status !== "Cancelled"), [sessions, now]);
  const hourBuckets = useMemo(() => {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const s of upcoming) counts[hourOf(s.scheduledAt)] += 1;
    return counts;
  }, [upcoming]);

  const peakHour = useMemo(() => {
    let bestH = 0;
    let best = -1;
    hourBuckets.forEach((c, h) => {
      if (c > best) {
        best = c;
        bestH = h;
      }
    });
    return { hour: bestH, count: best };
  }, [hourBuckets]);

  const peakDetected = peakHour.count >= policy.peakHourThreshold;

  const siteCapacityByHour = useMemo(() => {
    // capacity by site per hour = total connector count at that site
    const capBySite: Record<string, number> = {};
    for (const s of sites) capBySite[s.id] = s.connectors.reduce((a, c) => a + c.count, 0);

    const booked: Record<string, number[]> = {};
    for (const s of sites) booked[s.id] = Array.from({ length: 24 }, () => 0);

    for (const cs of upcoming) {
      const h = hourOf(cs.scheduledAt);
      booked[cs.siteId][h] += 1;
    }

    const congested = Object.keys(booked)
      .flatMap((siteId) =>
        booked[siteId]
          .map((count, h) => ({ siteId, h, count, cap: capBySite[siteId] || 1 }))
          .filter((x) => x.count > x.cap)
      )
      .sort((a, b) => b.count - a.count);

    return { capBySite, booked, congested };
  }, [upcoming, sites]);

  const kpis = useMemo(() => {
    const open = sessions.filter((s) => ["Draft", "Pending approval", "Confirmed"].includes(s.status)).length;
    const pendingApprovals = approvals.filter((a) => a.status === "Pending").length;
    const vipPending = approvals.filter((a) => a.status === "Pending" && a.flags.some((f) => f.toLowerCase().includes("vip"))).length;
    const dcCount = sessions.filter((s) => s.connector.includes("DC")).length;
    return { open, pendingApprovals, vipPending, dcCount };
  }, [sessions, approvals]);

  // Actions
  const openSession = (id: string) => {
    setActiveSessionId(id);
    setDrawerOpen(true);
  };

  const createApproval = (args: { scope: ApprovalRequest["scope"]; scopeId: string; createdBy: string; reason: string; flags: string[] }) => {
    const createdAt = Date.now();
    const assigneeByRole: Record<ApprovalRole, string> = { Manager: "Manager", Finance: "Finance Desk", CFO: "CFO", CEO: "CEO" };
    const steps = defaultApprovalSteps(args.flags).map((s) => ({
      id: uid("AS"),
      role: s.role,
      assignee: assigneeByRole[s.role],
      status: "Pending" as ApprovalStatus,
      requestedAt: createdAt,
      slaHours: s.slaHours,
    }));

    const row: ApprovalRequest = {
      id: uid("APR"),
      createdAt,
      createdBy: args.createdBy,
      status: "Pending",
      scope: args.scope,
      scopeId: args.scopeId,
      reason: args.reason,
      flags: args.flags,
      steps,
    };

    setApprovals((p) => [row, ...p]);
    return row;
  };

  const submitDraft = () => {
    if (!policyCheckDraft.canCreate) {
      toast({ title: "Fix required fields", message: policyCheckDraft.requiredErrors.join(" • "), kind: "warn" });
      return;
    }

    const createdAt = Date.now();
    const id = uid("CS");

    const tags = draft.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 12);

    const purposeOther = draft.purpose === "Other" ? draft.purposeOther.trim() : undefined;

    const session: ChargeSession = {
      id,
      ref: makeRef("CHG"),
      vehicleId: draft.vehicleId,
      bookedBy: draft.bookedBy,
      createdAt,
      scheduledAt: policyCheckDraft.whenTs,
      durationMins: clamp(draft.durationMins, 10, 360),
      siteId: draft.siteId,
      connector: draft.connector,
      expectedKWh: Math.max(1, draft.expectedKWh),
      maxBudgetUGX: Math.max(0, draft.maxBudgetUGX),
      purpose: draft.purpose,
      purposeOther,
      tags,
      costCenter: draft.costCenter.trim(),
      projectTag: draft.projectTag.trim(),
      module: "EVs & Charging",
      status: policyCheckDraft.needsApproval ? "Pending approval" : "Confirmed",
      policyNotes: policyCheckDraft.flags.filter((f) => !f.endsWith("required")),
      proofs: [],
    };

    setSessions((p) => [session, ...p]);

    if (policyCheckDraft.needsApproval) {
      createApproval({
        scope: "Session",
        scopeId: session.id,
        createdBy: session.bookedBy,
        reason: "Policy exception required for EV charging session",
        flags: policyCheckDraft.approvalFlags.length ? policyCheckDraft.approvalFlags : ["Policy exception"],
      });
    }

    toast({ title: "Created", message: policyCheckDraft.needsApproval ? "Session created and sent for approval." : "Session confirmed.", kind: "success" });
    setCreateOpen(false);
    setCreateStep(0);
    setTab("sessions");
  };

  const runBulkFleetBooking = () => {
    const startTs = parseLocalInput(bulkDraft.startAt);
    const baseCreatedAt = Date.now();

    if (!bulkDraft.vehicleIds.length) {
      toast({ title: "No vehicles", message: "Select at least one vehicle.", kind: "warn" });
      return;
    }

    const out: ChargeSession[] = [];
    let needsApprovalAny = false;

    bulkDraft.vehicleIds.forEach((vid, idx) => {
      const whenTs = startTs + idx * bulkDraft.intervalMins * 60 * 1000;
      const flags = sessionFlags({
        whenTs,
        connector: bulkDraft.connector,
        prioritySlot: bulkDraft.prioritySlot,
        expectedKWh: bulkDraft.expectedKWh,
        maxBudgetUGX: bulkDraft.maxBudgetUGX,
        vehicleId: vid,
      }).flags;

      const needsApproval = flags.some((f) => f === "After-hours" || f === "DC fast" || f === "Priority slot" || f === "VIP");
      needsApprovalAny = needsApprovalAny || needsApproval;

      out.push({
        id: uid("CS"),
        ref: makeRef("FLT"),
        vehicleId: vid,
        bookedBy: "Charging Coordinator",
        createdAt: baseCreatedAt,
        scheduledAt: whenTs,
        durationMins: clamp(bulkDraft.durationMins, 10, 360),
        siteId: bulkDraft.siteId,
        connector: bulkDraft.connector,
        expectedKWh: Math.max(1, bulkDraft.expectedKWh),
        maxBudgetUGX: Math.max(0, bulkDraft.maxBudgetUGX),
        purpose: bulkDraft.purpose,
        tags: bulkDraft.tags.split(",").map((x) => x.trim()).filter(Boolean),
        costCenter: bulkDraft.costCenter,
        projectTag: bulkDraft.projectTag,
        module: "EVs & Charging",
        status: needsApproval ? "Pending approval" : "Confirmed",
        policyNotes: flags.filter((f) => f !== "Peak tariff"),
        proofs: [],
      });
    });

    setSessions((p) => [...out, ...p]);

    if (needsApprovalAny) {
      const flags = Array.from(new Set(out.flatMap((s) => s.policyNotes))).filter(Boolean);
      createApproval({
        scope: "Fleet plan",
        scopeId: uid("PLANRUN"),
        createdBy: "Charging Coordinator",
        reason: `Bulk fleet charging requires policy approval (${out.filter((s) => s.status === "Pending approval").length} pending).`,
        flags: flags.length ? flags : ["Bulk charging"],
      });
    }

    toast({ title: "Bulk created", message: `Created ${out.length} session(s).`, kind: "success" });
    setBulkOpen(false);
    setTab("sessions");
  };

  const approveNext = (approvalId: string) => {
    const ts = Date.now();
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== approvalId) return a;
        const idx = a.steps.findIndex((s) => s.status === "Pending");
        if (idx < 0) return a;
        const steps = a.steps.slice();
        steps[idx] = { ...steps[idx], status: "Approved", decidedAt: ts, note: "Approved" };
        const all = steps.every((s) => s.status === "Approved");
        return { ...a, steps, status: all ? "Approved" : "Pending" };
      })
    );

    // Apply side effects when fully approved
    setTimeout(() => {
      setApprovals((prev) => {
        const a = prev.find((x) => x.id === approvalId);
        if (!a || a.status !== "Approved") return prev;

        if (a.scope === "Session") {
          setSessions((sp) => sp.map((s) => (s.id === a.scopeId ? { ...s, status: "Confirmed" } : s)));
        }
        if (a.scope === "VIP Exception") {
          setVipExceptions((vx) => vx.map((x) => (x.approvalId === a.id ? { ...x, status: "Approved" } : x)));
        }

        toast({ title: "Approved", message: "Approval progressed.", kind: "success" });
        return prev;
      });
    }, 0);
  };

  const rejectApproval = (approvalId: string) => {
    const ts = Date.now();
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== approvalId) return a;
        const idx = a.steps.findIndex((s) => s.status === "Pending");
        const steps = a.steps.slice();
        if (idx >= 0) steps[idx] = { ...steps[idx], status: "Rejected", decidedAt: ts, note: "Rejected" };
        return { ...a, steps, status: "Rejected" };
      })
    );

    const a = approvals.find((x) => x.id === approvalId);
    if (a?.scope === "Session") {
      setSessions((sp) => sp.map((s) => (s.id === a.scopeId ? { ...s, status: "Cancelled", policyNotes: [...s.policyNotes, "Rejected"] } : s)));
    }

    toast({ title: "Rejected", message: "Approval rejected.", kind: "warn" });
  };

  const requestVipException = () => {
    const DAY = 24 * 60 * 60 * 1000;
    if (!vipReqDraft.reason.trim()) {
      toast({ title: "Missing", message: "Add a reason.", kind: "warn" });
      return;
    }

    const createdAt = Date.now();
    const ex: VipException = {
      id: uid("VX"),
      vehicleId: vipReqDraft.vehicleId,
      exceptionType: vipReqDraft.exceptionType,
      validFrom: createdAt,
      validTo: createdAt + clamp(vipReqDraft.validDays, 1, 365) * DAY,
      requestedBy: "Org Admin",
      status: "Pending",
      reason: vipReqDraft.reason.trim(),
    };

    const flags = ["VIP", vipReqDraft.exceptionType === "DC fast" ? "DC" : vipReqDraft.exceptionType === "Priority slot" ? "Priority" : "After-hours"];
    const apr = createApproval({ scope: "VIP Exception", scopeId: ex.id, createdBy: ex.requestedBy, reason: ex.reason, flags });
    ex.approvalId = apr.id;

    setVipExceptions((p) => [ex, ...p]);
    toast({ title: "Requested", message: "VIP exception requested and routed to approvals.", kind: "success" });
    setVipReqOpen(false);
    setTab("approvals");
  };

  const exportCSV = () => {
    const rows = filteredSessions.map((s) => {
      const v = vehicleById[s.vehicleId];
      const site = siteById[s.siteId];
      return {
        ref: s.ref,
        status: s.status,
        when: fmtDateTime(s.scheduledAt),
        vehicle: v?.label || s.vehicleId,
        owner: v ? `${v.ownerName} (${v.ownerType})` : "-",
        site: site?.name || s.siteId,
        connector: s.connector,
        expectedKWh: s.expectedKWh,
        maxBudgetUGX: s.maxBudgetUGX,
        purpose: s.purpose === "Other" ? s.purposeOther || "Other" : s.purpose,
        tags: s.tags.join(";"),
        costCenter: s.costCenter,
        projectTag: s.projectTag,
        policyNotes: s.policyNotes.join(";"),
      };
    });

    const cols = Object.keys(rows[0] || { ref: "" });
    const esc = (v: any) => {
      const s = String(v ?? "");
      if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };

    const head = cols.join(",");
    const body = rows.map((r) => cols.map((c) => esc((r as any)[c])).join(",")).join("\n");
    const csv = `${head}\n${body}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporate-ev-charging-sessions.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", message: "Sessions CSV downloaded.", kind: "success" });
  };

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
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Corporate EV Charging Scheduling</div>
                  <div className="mt-1 text-xs text-slate-500">Pre-book charging sessions for employees, visitors, and company vehicles. Enforce purpose tagging, coordinate bulk plans, and handle VIP exceptions with approvals.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Open: ${kpis.open}`} tone={kpis.open ? "warn" : "good"} />
                    <Pill label={`Approvals: ${kpis.pendingApprovals}`} tone={kpis.pendingApprovals ? "warn" : "good"} />
                    <Pill label={`VIP pending: ${kpis.vipPending}`} tone={kpis.vipPending ? "warn" : "good"} />
                    <Pill label={`DC sessions: ${kpis.dcCount}`} tone={kpis.dcCount ? "info" : "neutral"} />
                    <Pill label={peakDetected ? `Peak hour: ${peakHour.hour}:00 (${peakHour.count})` : `Peak hour: ${peakHour.hour}:00`} tone={peakDetected ? "warn" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>
                  <Users className="h-4 w-4" /> Bulk fleet plan
                </Button>
                <Button variant="primary" onClick={() => { setCreateOpen(true); setCreateStep(0); }}>
                  <Plus className="h-4 w-4" /> New session
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "sessions", label: "Sessions" },
                { id: "sites", label: "Sites" },
                { id: "recurring", label: "Recurring" },
                { id: "vip", label: "VIP" },
                { id: "approvals", label: "Approvals" },
                { id: "insights", label: "Insights" },
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
                    title="Upcoming sessions"
                    subtitle="Next scheduled sessions across all sites."
                    right={<Pill label={`${upcoming.length} upcoming`} tone={upcoming.length ? "info" : "neutral"} />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">When</th>
                            <th className="px-4 py-3 font-semibold">Vehicle</th>
                            <th className="px-4 py-3 font-semibold">Site</th>
                            <th className="px-4 py-3 font-semibold">Connector</th>
                            <th className="px-4 py-3 font-semibold">Purpose</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcoming
                            .slice()
                            .sort((a, b) => a.scheduledAt - b.scheduledAt)
                            .slice(0, 7)
                            .map((s) => {
                              const v = vehicleById[s.vehicleId];
                              const site = siteById[s.siteId];
                              const peakTariff = isPeakTariffHour(hourOf(s.scheduledAt));
                              return (
                                <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3 text-slate-700">{fmtDateTime(s.scheduledAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <div className="font-semibold text-slate-900">{v?.label || s.vehicleId}</div>
                                      {v?.vip ? <Pill label="VIP" tone="info" /> : null}
                                      <Pill label={v ? v.ownerType : "-"} tone="neutral" />
                                      {peakTariff ? <Pill label="Peak" tone="warn" /> : <Pill label="Off-peak" tone="good" />}
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">{v ? `${v.ownerName} • ${v.costCenter}` : "-"}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700">{site?.name || s.siteId}</td>
                                  <td className="px-4 py-3">
                                    <Pill label={s.connector} tone={s.connector.includes("DC") ? "info" : "neutral"} />
                                    <div className="mt-1 text-xs text-slate-500">{s.expectedKWh} kWh • {s.durationMins} min</div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Pill label={s.purpose === "Other" ? s.purposeOther || "Other" : s.purpose} tone="neutral" />
                                    <div className="mt-1 text-xs text-slate-500">{s.tags.slice(0, 3).join(", ")}{s.tags.length > 3 ? "…" : ""}</div>
                                  </td>
                                  <td className="px-4 py-3"><Pill label={s.status} tone={statusTone(s.status)} /></td>
                                  <td className="px-4 py-3">
                                    <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openSession(s.id)}>
                                      <ChevronRight className="h-4 w-4" /> Open
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          {!upcoming.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10">
                                <Empty title="No upcoming sessions" subtitle="Create a new charging session or run a recurring plan." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    {siteCapacityByHour.congested.length ? (
                      <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                        Congestion risk: {siteById[siteCapacityByHour.congested[0].siteId]?.name || siteCapacityByHour.congested[0].siteId} at {siteCapacityByHour.congested[0].h}:00 is over capacity ({siteCapacityByHour.congested[0].count}/{siteCapacityByHour.congested[0].cap}).
                      </div>
                    ) : peakDetected ? (
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Smart scheduling: peak hour detected around {peakHour.hour}:00. Consider off-peak scheduling or distributing sessions across sites.
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Smart scheduling: no peak congestion detected in upcoming sessions.
                      </div>
                    )}
                  </Section>

                  <Section title="Policy guardrails" subtitle="Purpose enforcement, limits, and approvals." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Toggle enabled={policy.requirePurpose} onChange={(v) => setPolicy((p) => ({ ...p, requirePurpose: v }))} label="Require purpose" description="Purpose stored for reporting and audits." />
                      <Toggle enabled={policy.requireProjectTag} onChange={(v) => setPolicy((p) => ({ ...p, requireProjectTag: v }))} label="Require project tag" description="Used for chargeback and analytics." />
                      <Toggle enabled={policy.requireCostCenter} onChange={(v) => setPolicy((p) => ({ ...p, requireCostCenter: v }))} label="Require cost center" description="Enforced on creation." />
                      <Toggle enabled={policy.dcRequiresApproval} onChange={(v) => setPolicy((p) => ({ ...p, dcRequiresApproval: v }))} label="DC requires approval" description="DC fast charging is approval-gated." />
                      <Toggle enabled={policy.priorityRequiresApproval} onChange={(v) => setPolicy((p) => ({ ...p, priorityRequiresApproval: v }))} label="Priority requires approval" description="Priority slot requests require approval." />
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-sm font-semibold text-slate-900">Limits</div>
                        <div className="mt-3 grid grid-cols-1 gap-3">
                          <NumberField label="Max kWh per session" value={policy.maxKWhPerSession} onChange={(v) => setPolicy((p) => ({ ...p, maxKWhPerSession: Math.max(1, v) }))} hint="kWh" />
                          <NumberField label="Max budget per session" value={policy.maxBudgetUGXPerSession} onChange={(v) => setPolicy((p) => ({ ...p, maxBudgetUGXPerSession: Math.max(0, v) }))} hint="UGX" />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Working hours: {policy.workStart} to {policy.workEnd}. After-hours sessions require approval unless an exception is active.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Sites" subtitle="Operational health and pricing." right={<Pill label={`${sites.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {sites.map((s) => (
                        <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                <Pill label={s.status} tone={siteTone(s.status)} />
                                <Pill label={`${s.reliabilityPct}%`} tone={s.reliabilityPct >= 90 ? "good" : s.reliabilityPct >= 80 ? "warn" : "bad"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{s.city} • {s.operator}</div>
                              <div className="mt-2 text-xs text-slate-600">Connectors: {s.connectors.reduce((a, c) => a + c.count, 0)} total</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setTab("sites"); setSiteFilter(s.id); toast({ title: "Filtered", message: "Showing sessions for this site.", kind: "info" }); }}>
                              <ChevronRight className="h-4 w-4" /> View
                            </Button>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {s.connectors.slice(0, 3).map((c) => (
                              <Pill key={`${s.id}-${c.connector}`} label={`${c.connector} • ${c.powerKW}kW`} tone={c.connector.includes("DC") ? "info" : "neutral"} />
                            ))}
                            {s.connectors.length > 3 ? <Pill label="+more" tone="neutral" /> : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>

                  <Section title="Approvals" subtitle="Policy exceptions and VIP handling." right={<Pill label={`${approvals.filter((a) => a.status === "Pending").length}`} tone={approvals.filter((a) => a.status === "Pending").length ? "warn" : "good"} />}>
                    <div className="space-y-2">
                      {approvals.filter((a) => a.status === "Pending").slice(0, 4).map((a) => (
                        <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={a.scope} tone="neutral" />
                                <Pill label={a.status} tone={approvalTone(a.status)} />
                                <Pill label={`${a.steps.filter((s) => s.status === "Pending").length} step(s)`} tone="info" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{a.reason}</div>
                              <div className="mt-1 text-xs text-slate-500">{timeAgo(a.createdAt)} • {a.createdBy}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveNext(a.id)}>
                                <Check className="h-4 w-4" /> Approve
                              </Button>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectApproval(a.id)}>
                                <X className="h-4 w-4" /> Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!approvals.filter((a) => a.status === "Pending").length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No pending approvals.</div> : null}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setTab("approvals")}>
                        <ChevronRight className="h-4 w-4" /> Open approvals
                      </Button>
                      <Button variant="outline" onClick={() => setVipReqOpen(true)}>
                        <Crown className="h-4 w-4" /> VIP exception
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "sessions" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Search and filters" subtitle="Coordinator view" right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-600">Search</div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="ref, vehicle, site, tag..."
                          className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                        />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <Select
                          label="Status"
                          value={statusFilter}
                          onChange={(v) => setStatusFilter(v as any)}
                          options={[
                            { value: "All", label: "All" },
                            ...(["Draft", "Pending approval", "Confirmed", "In progress", "Completed", "Cancelled"] as SessionStatus[]).map((x) => ({ value: x, label: x })),
                          ]}
                        />
                        <Select
                          label="Vehicle"
                          value={vehicleFilter}
                          onChange={setVehicleFilter}
                          options={[{ value: "All", label: "All" }, ...vehicles.map((v) => ({ value: v.id, label: v.label }))]}
                        />
                        <Select
                          label="Site"
                          value={siteFilter}
                          onChange={setSiteFilter}
                          options={[{ value: "All", label: "All" }, ...sites.map((s) => ({ value: s.id, label: s.name }))]}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQ("");
                            setStatusFilter("All");
                            setVehicleFilter("All");
                            setSiteFilter("All");
                            toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                          }}
                        >
                          <Filter className="h-4 w-4" /> Reset
                        </Button>
                        <Button variant="outline" onClick={exportCSV}>
                          <Download className="h-4 w-4" /> CSV
                        </Button>
                        <Button variant="primary" onClick={() => setCreateOpen(true)}>
                          <Plus className="h-4 w-4" /> New
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Best practice: store purpose tags, cost center, and project tag on every charging session.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Sessions" subtitle="Pre-booked corporate charging sessions." right={<Pill label={`${filteredSessions.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Ref</th>
                            <th className="px-4 py-3 font-semibold">When</th>
                            <th className="px-4 py-3 font-semibold">Vehicle</th>
                            <th className="px-4 py-3 font-semibold">Site</th>
                            <th className="px-4 py-3 font-semibold">kWh and budget</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredSessions.map((s) => {
                            const v = vehicleById[s.vehicleId];
                            const site = siteById[s.siteId];
                            return (
                              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">{s.ref}</div>
                                  <div className="mt-1 text-xs text-slate-500">{s.id}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{fmtDateTime(s.scheduledAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-semibold text-slate-900">{v?.label || s.vehicleId}</div>
                                    {v?.vip ? <Pill label="VIP" tone="info" /> : null}
                                    <Pill label={v ? v.ownerType : "-"} tone="neutral" />
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">{v ? `${v.ownerName} • ${v.costCenter}` : "-"}</div>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{site?.name || s.siteId}</td>
                                <td className="px-4 py-3">
                                  <Pill label={`${s.expectedKWh} kWh`} tone="neutral" />
                                  <div className="mt-1 text-xs text-slate-500">Budget {formatUGX(s.maxBudgetUGX)} • {s.connector}</div>
                                </td>
                                <td className="px-4 py-3"><Pill label={s.status} tone={statusTone(s.status)} /></td>
                                <td className="px-4 py-3">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openSession(s.id)}>
                                    <ChevronRight className="h-4 w-4" /> Open
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                          {!filteredSessions.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10">
                                <Empty title="No sessions" subtitle="Create a session or change filters." />
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

            {tab === "sites" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Charging sites" subtitle="Status, reliability, and connectors." right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {sites.map((s) => (
                        <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                <Pill label={s.status} tone={siteTone(s.status)} />
                                <Pill label={`${s.reliabilityPct}%`} tone={s.reliabilityPct >= 90 ? "good" : s.reliabilityPct >= 80 ? "warn" : "bad"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{s.city} • {s.operator}</div>
                              <div className="mt-1 text-xs text-slate-500">{s.address}</div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setSiteFilter(s.id); setTab("sessions"); toast({ title: "Filtered", message: "Showing sessions for this site.", kind: "info" }); }}>
                              <ChevronRight className="h-4 w-4" /> Sessions
                            </Button>
                          </div>
                          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                            <table className="min-w-full text-left text-sm">
                              <thead className="bg-slate-50 text-xs text-slate-600">
                                <tr>
                                  <th className="px-4 py-3 font-semibold">Connector</th>
                                  <th className="px-4 py-3 font-semibold">Power</th>
                                  <th className="px-4 py-3 font-semibold">Count</th>
                                  <th className="px-4 py-3 font-semibold">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {s.connectors.map((c) => (
                                  <tr key={`${s.id}-${c.connector}-${c.powerKW}`} className="border-t border-slate-100">
                                    <td className="px-4 py-3"><Pill label={c.connector} tone={c.connector.includes("DC") ? "info" : "neutral"} /></td>
                                    <td className="px-4 py-3 text-slate-700">{c.powerKW} kW</td>
                                    <td className="px-4 py-3 text-slate-700">{c.count}</td>
                                    <td className="px-4 py-3 text-slate-700">{formatUGX(c.priceUGXPerKWh)} / kWh</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Site utilization" subtitle="Premium: detect over-capacity time windows." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="text-sm font-semibold text-slate-900">Over-capacity alerts</div>
                      <div className="mt-1 text-xs text-slate-500">If sessions scheduled exceed connector capacity per hour.</div>
                      <div className="mt-3 space-y-2">
                        {siteCapacityByHour.congested.slice(0, 6).map((c) => (
                          <div key={`${c.siteId}-${c.h}`} className="rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
                            {siteById[c.siteId]?.name || c.siteId} at {c.h}:00 is over capacity ({c.count}/{c.cap}).
                          </div>
                        ))}
                        {!siteCapacityByHour.congested.length ? (
                          <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No over-capacity windows detected.</div>
                        ) : null}
                      </div>

                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Premium: you can add load management rules and stagger sessions by connector power.
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "recurring" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6 space-y-4">
                  <Section title="Recurring plans" subtitle="Core: recurring charging schedules." right={<Pill label={`${plans.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {plans.map((p) => (
                        <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                                <Pill label={p.enabled ? "Enabled" : "Disabled"} tone={p.enabled ? "good" : "neutral"} />
                                <Pill label={p.timeLocal} tone="neutral" />
                                <Pill label={p.connector.includes("DC") ? "DC" : "AC"} tone={p.connector.includes("DC") ? "info" : "neutral"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Days: {p.days.join(", ")}</div>
                              <div className="mt-1 text-xs text-slate-500">Site: {siteById[p.siteId]?.name || p.siteId}</div>
                              <div className="mt-2 text-xs text-slate-600">Vehicles: {p.vehicles.map((id) => vehicleById[id]?.label || id).join(", ")}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setPlans((prev) => prev.map((x) => (x.id === p.id ? { ...x, enabled: !x.enabled } : x)));
                                  toast({ title: "Updated", message: "Plan updated.", kind: "success" });
                                }}
                              >
                                <Repeat className="h-4 w-4" /> Toggle
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  const base = Date.now() + 2 * 24 * 60 * 60 * 1000;
                                  const [hh, mm] = p.timeLocal.split(":").map((x) => Number(x));
                                  const dt = new Date(base);
                                  dt.setHours(hh || 0, mm || 0, 0, 0);
                                  const whenTs = dt.getTime();

                                  const out: ChargeSession[] = p.vehicles.map((vid) => {
                                    const flags = sessionFlags({
                                      whenTs,
                                      connector: p.connector,
                                      prioritySlot: false,
                                      expectedKWh: p.expectedKWh,
                                      maxBudgetUGX: p.maxBudgetUGX,
                                      vehicleId: vid,
                                    }).flags;

                                    const needsApproval = flags.some((f) => f === "After-hours" || f === "DC fast" || f === "VIP");

                                    return {
                                      id: uid("CS"),
                                      ref: makeRef("RC"),
                                      vehicleId: vid,
                                      bookedBy: "Charging Coordinator",
                                      createdAt: Date.now(),
                                      scheduledAt: whenTs,
                                      durationMins: p.durationMins,
                                      siteId: p.siteId,
                                      connector: p.connector,
                                      expectedKWh: p.expectedKWh,
                                      maxBudgetUGX: p.maxBudgetUGX,
                                      purpose: p.purpose,
                                      tags: p.tags,
                                      costCenter: vehicleById[vid]?.costCenter || "OPS-001",
                                      projectTag: p.name,
                                      module: "EVs & Charging",
                                      status: needsApproval ? "Pending approval" : "Confirmed",
                                      policyNotes: flags.filter((x) => x !== "Peak tariff"),
                                      proofs: [],
                                    };
                                  });

                                  setSessions((sp) => [...out, ...sp]);
                                  const anyPending = out.some((s) => s.status === "Pending approval");
                                  if (anyPending) {
                                    createApproval({
                                      scope: "Fleet plan",
                                      scopeId: p.id,
                                      createdBy: "Charging Coordinator",
                                      reason: "Recurring plan generated sessions requiring approval",
                                      flags: Array.from(new Set(out.flatMap((x) => x.policyNotes))).filter(Boolean),
                                    });
                                  }

                                  toast({ title: "Generated", message: `Created ${out.length} session(s) from plan.`, kind: "success" });
                                  setTab("sessions");
                                }}
                                disabled={!p.enabled}
                                title={!p.enabled ? "Enable plan first" : ""}
                              >
                                <Sparkles className="h-4 w-4" /> Generate
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!plans.length ? <Empty title="No plans" subtitle="Create a recurring charging plan." /> : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: plans can be extended with tariff calendars and site load constraints.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <Section title="Best practices" subtitle="Operational tips" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Use off-peak windows for depot top-ups</li>
                        <li>2) Stagger sessions by 15-30 minutes to avoid connector contention</li>
                        <li>3) Enforce purpose tags and cost centers for chargeback</li>
                        <li>4) Maintain VIP exceptions with approvals and audit trails</li>
                      </ul>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Tip: Link these approvals to your global Approval Workflow Builder so Corporate Travel and EV Charging share the same governance.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "vip" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6 space-y-4">
                  <Section title="Vehicles" subtitle="Company, employee, and visitor EVs." right={<Pill label={`${vehicles.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {vehicles.map((v) => (
                        <div key={v.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{v.label}</div>
                                <Pill label={v.ownerType} tone="neutral" />
                                {v.vip ? <Pill label="VIP" tone="info" /> : null}
                                <Pill label={`${v.batteryKWh}kWh`} tone="neutral" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Owner: {v.ownerName}</div>
                              <div className="mt-1 text-xs text-slate-500">Cost center: {v.costCenter} • Group: {v.group}</div>
                            </div>
                            <Button
                              variant="primary"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setDraft((p) => ({
                                  ...p,
                                  vehicleId: v.id,
                                  category: v.vip ? "Premium" : "Standard",
                                  connector: v.vip ? "CCS2 (DC)" : "Type 2 (AC)",
                                  purpose: v.ownerType === "Visitor" ? "Visitor" : "Operations",
                                  tags: v.vip ? "VIP" : "Operations",
                                  costCenter: v.costCenter,
                                  projectTag: v.ownerType === "Visitor" ? "Visitor charging" : "Charging",
                                  prioritySlot: v.vip,
                                }));
                                setCreateStep(1);
                                setCreateOpen(true);
                              }}
                            >
                              <Zap className="h-4 w-4" /> Schedule
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <Section title="VIP exceptions" subtitle="Premium: DC, priority slot, after-hours" right={<Pill label="Premium" tone="info" />}>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => setVipReqOpen(true)}>
                        <Crown className="h-4 w-4" /> Request exception
                      </Button>
                      <Button variant="outline" onClick={() => setTab("approvals")}>
                        <ChevronRight className="h-4 w-4" /> View approvals
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {vipExceptions.map((x) => (
                        <div key={x.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label={x.exceptionType} tone="neutral" />
                                <Pill label={x.status} tone={approvalTone(x.status)} />
                                <Pill label={`${fmtDate(x.validFrom)} to ${fmtDate(x.validTo)}`} tone="info" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{vehicleLabel(x.vehicleId)}</div>
                              <div className="mt-1 text-xs text-slate-500">Requested by {x.requestedBy} • {x.reason}</div>
                              {x.approvalId ? <div className="mt-2 text-xs text-slate-500">Approval: {x.approvalId}</div> : null}
                            </div>
                            <Crown className={cn("h-5 w-5", x.status === "Approved" ? "text-amber-500" : "text-slate-300")} />
                          </div>
                        </div>
                      ))}
                      {!vipExceptions.length ? <Empty title="No VIP exceptions" subtitle="Request an exception to allow DC, priority, or after-hours." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "approvals" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Approvals" subtitle="Policy exceptions for DC, priority, after-hours." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Approvals are required before a session is sent to the station booking engine.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => setVipReqOpen(true)}>
                        <Crown className="h-4 w-4" /> VIP exception
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Tip", message: "Map these approvals to your global Approval Workflow Builder.", kind: "info" })}>
                        <Info className="h-4 w-4" /> Tip
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Approval requests" subtitle="Approve or reject with audit trail." right={<Pill label={`${approvals.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {approvals
                        .slice()
                        .sort((a, b) => b.createdAt - a.createdAt)
                        .map((a) => {
                          const pendingIdx = a.steps.findIndex((s) => s.status === "Pending");
                          const pending = pendingIdx >= 0 ? a.steps[pendingIdx] : null;
                          return (
                            <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={a.scope} tone="neutral" />
                                    <Pill label={a.status} tone={approvalTone(a.status)} />
                                    <Pill label={a.id} tone="neutral" />
                                  </div>
                                  <div className="mt-2 text-sm font-semibold text-slate-900">{a.reason}</div>
                                  <div className="mt-1 text-xs text-slate-500">Created {timeAgo(a.createdAt)} • {a.createdBy}</div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {a.flags.map((f, idx) => <Pill key={`${a.id}-f-${idx}`} label={f} tone={f.toLowerCase().includes("vip") ? "info" : "neutral"} />)}
                                  </div>
                                  {pending ? (
                                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                      Next: <span className="font-semibold">{pending.role}</span> ({pending.assignee}) • SLA {pending.slaHours}h
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveNext(a.id)} disabled={a.status !== "Pending"}>
                                    <Check className="h-4 w-4" /> Approve
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectApproval(a.id)} disabled={a.status !== "Pending"}>
                                    <X className="h-4 w-4" /> Reject
                                  </Button>
                                  {a.scope === "Session" ? (
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        openSession(a.scopeId);
                                      }}
                                    >
                                      <ChevronRight className="h-4 w-4" /> Open session
                                    </Button>
                                  ) : null}
                                </div>
                              </div>

                              <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                {a.steps.map((s) => (
                                  <div key={s.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                      <div className="text-sm font-semibold text-slate-800">{s.role}</div>
                                      <Pill label={s.status} tone={approvalTone(s.status)} />
                                    </div>
                                    <div className="mt-1 text-xs text-slate-500">Assignee: {s.assignee} • SLA {s.slaHours}h</div>
                                    {s.decidedAt ? <div className="mt-1 text-xs text-slate-500">Decided {fmtDateTime(s.decidedAt)} • {s.note || ""}</div> : null}
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      {!approvals.length ? <Empty title="No approvals" subtitle="Policy exceptions will appear here." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "insights" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Peak tariff detection" subtitle="Premium: recommend off-peak scheduling." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Peak hour</div>
                          <div className="mt-1 text-xs text-slate-500">Upcoming sessions by hour (0-23)</div>
                        </div>
                        <Pill label={`${peakHour.hour}:00 • ${peakHour.count}`} tone={peakDetected ? "warn" : "neutral"} />
                      </div>
                      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                        {hourBuckets.map((c, h) => (
                          <div key={h} className="rounded-2xl border border-slate-200 bg-white p-2 text-center">
                            <div className="text-xs font-semibold text-slate-700">{h}</div>
                            <div className={cn("mt-2 h-2 rounded-full", isPeakTariffHour(h) ? "bg-amber-200" : "bg-emerald-200")} />
                            <div className="mt-2 text-xs text-slate-500">{c}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Suggestion: avoid peak tariff windows (7-9 and 17-20) for non-urgent charging. Use AC off-peak top-ups.
                      </div>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Smart recommendations" subtitle="Next best coordinator actions." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Reco
                        title="Bulk schedule a fleet top-up"
                        detail="Use bulk fleet plan to create staged sessions and reduce congestion."
                        cta="Bulk plan"
                        onClick={() => setBulkOpen(true)}
                      />
                      <Reco
                        title="Resolve pending approvals"
                        detail={`There are ${approvals.filter((a) => a.status === "Pending").length} approval request(s) pending.`}
                        cta="Open approvals"
                        onClick={() => setTab("approvals")}
                      />
                      <Reco
                        title="Create a VIP exception"
                        detail="For recurring executive DC fast charging, request an approved VIP exception with audit trail."
                        cta="Request"
                        onClick={() => setVipReqOpen(true)}
                      />
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: you can extend this with tariff calendars, dynamic pricing, and station reliability predictions.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              Corporate EV Charging Scheduling v2. Core: pre-book sessions, book on behalf, enforce purpose and tags. Premium: bulk fleet booking, VIP exceptions with approvals, and smart peak time insights.
            </div>
          </footer>
        </div>
      </div>

      {/* Session drawer */}
      <Drawer
        open={drawerOpen}
        title={activeSession ? `${activeSession.ref} • ${activeSession.connector}` : "Session"}
        subtitle={activeSession ? `${vehicleLabel(activeSession.vehicleId)} • ${fmtDateTime(activeSession.scheduledAt)} • ${siteById[activeSession.siteId]?.name || activeSession.siteId}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          activeSession ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">In production, this links to station reservation and session telemetry.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSessions((p) => p.map((s) => (s.id === activeSession.id ? { ...s, status: "Cancelled" } : s)));
                    toast({ title: "Cancelled", message: "Session cancelled.", kind: "warn" });
                    setDrawerOpen(false);
                  }}
                  disabled={activeSession.status === "Cancelled" || activeSession.status === "Completed"}
                >
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // simulate completion with receipt
                    const endedAt = Date.now();
                    const delivered = Math.min(activeSession.expectedKWh, Math.max(1, Math.round(activeSession.expectedKWh * 0.92)));
                    const site = siteById[activeSession.siteId];
                    const price = site?.connectors.find((c) => c.connector === activeSession.connector)?.priceUGXPerKWh || 900;
                    const cost = Math.round(delivered * price);

                    setSessions((p) =>
                      p.map((s) =>
                        s.id === activeSession.id
                          ? {
                            ...s,
                            status: "Completed",
                            proofs: [{ id: uid("AT"), name: "Charge receipt.pdf", note: "Receipt", addedAt: endedAt, addedBy: "System" }, ...s.proofs],
                            result: { kWhDelivered: delivered, costUGX: cost, endedAt },
                          }
                          : s
                      )
                    );
                    toast({ title: "Completed", message: "Session marked completed.", kind: "success" });
                  }}
                  disabled={activeSession.status !== "Confirmed"}
                  title={activeSession.status !== "Confirmed" ? "Only confirmed sessions can complete" : ""}
                >
                  <Check className="h-4 w-4" /> Complete
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeSession ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeSession.status} tone={statusTone(activeSession.status)} />
                    <Pill label={activeSession.connector} tone={activeSession.connector.includes("DC") ? "info" : "neutral"} />
                    {vehicleById[activeSession.vehicleId]?.vip ? <Pill label="VIP" tone="info" /> : null}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{vehicleLabel(activeSession.vehicleId)}</div>
                  <div className="mt-1 text-xs text-slate-500">Owner: {ownerLabel(activeSession.vehicleId)}</div>
                  <div className="mt-2 text-xs text-slate-500">Booked by {activeSession.bookedBy} • Created {timeAgo(activeSession.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Scheduled</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{fmtDateTime(activeSession.scheduledAt)}</div>
                  <div className="mt-2 text-xs text-slate-500">Budget</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{formatUGX(activeSession.maxBudgetUGX)}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-600">Site</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{siteById[activeSession.siteId]?.name || activeSession.siteId}</div>
                  <div className="mt-1 text-xs text-slate-500">{siteById[activeSession.siteId]?.address || ""}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-600">Plan</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{activeSession.expectedKWh} kWh • {activeSession.durationMins} min</div>
                  <div className="mt-1 text-xs text-slate-500">Cost center {activeSession.costCenter} • Project {activeSession.projectTag}</div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                <div className="font-semibold text-slate-900">Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeSession.tags.length ? activeSession.tags.map((t, idx) => <Pill key={`${activeSession.id}-t-${idx}`} label={t} tone="neutral" />) : <Pill label="None" tone="neutral" />}
                </div>
                <div className="mt-3 text-xs text-slate-600">Purpose: {activeSession.purpose === "Other" ? activeSession.purposeOther || "Other" : activeSession.purpose}</div>
              </div>

              {activeSession.policyNotes.length ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  <div className="font-semibold">Policy notes</div>
                  <ul className="mt-2 space-y-1">
                    {activeSession.policyNotes.map((n, idx) => (
                      <li key={`${activeSession.id}-pn-${idx}`}>• {n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {activeSession.result ? (
                <div className="mt-3 rounded-2xl bg-emerald-50 p-3 text-xs text-emerald-900 ring-1 ring-emerald-200">
                  Completed: {activeSession.result.kWhDelivered} kWh • Cost {formatUGX(activeSession.result.costUGX)} • Ended {fmtDateTime(activeSession.result.endedAt)}
                </div>
              ) : null}
            </div>

            <Section title="Proofs" subtitle="Receipts and meter logs" right={<Pill label={`${activeSession.proofs.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {activeSession.proofs.map((p) => (
                  <div key={p.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{p.name}</div>
                        <div className="mt-1 text-xs text-slate-500">{fmtDateTime(p.addedAt)} • {p.addedBy}</div>
                        {p.note ? <div className="mt-2 text-xs text-slate-600">Note: {p.note}</div> : null}
                      </div>
                      <Button
                        variant="outline"
                        className="px-3 py-2 text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(p.name);
                            toast({ title: "Copied", message: "Proof name copied.", kind: "success" });
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
                {!activeSession.proofs.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No proofs yet.</div> : null}
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Create session modal */}
      <Modal
        open={createOpen}
        title="New charging session"
        subtitle="Book on behalf. Purpose tags and policy enforcement are required."
        onClose={() => setCreateOpen(false)}
        actions={[{ label: "Create", onClick: submitDraft }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={() => setCreateStep((s) => (s > 0 ? ((s - 1) as any) : s))} disabled={createStep === 0}>
                Back
              </Button>
              {createStep < 2 ? (
                <Button variant="primary" onClick={() => setCreateStep((s) => ((s + 1) as any))}>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="primary" onClick={submitDraft}>
                  <BadgeCheck className="h-4 w-4" /> Create
                </Button>
              )}
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4">
          <div className="flex flex-wrap gap-2">
            {[0, 1, 2].map((s) => (
              <button
                key={s}
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                  createStep === s ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                )}
                style={createStep === s ? { background: EVZ.green } : undefined}
                onClick={() => setCreateStep(s as any)}
              >
                {s === 0 ? "Vehicle" : s === 1 ? "Session" : "Policy check"}
              </button>
            ))}
          </div>

          {createStep === 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Vehicle"
                value={draft.vehicleId}
                onChange={(v) => {
                  const veh = vehicleById[v];
                  setDraft((p) => ({ ...p, vehicleId: v, costCenter: veh?.costCenter || p.costCenter, prioritySlot: !!veh?.vip }));
                }}
                options={vehicles.map((v) => ({ value: v.id, label: `${v.label} (${v.ownerType})${v.vip ? " • VIP" : ""}` }))}
              />
              <Field label="Booked by" value={draft.bookedBy} onChange={(v) => setDraft((p) => ({ ...p, bookedBy: v }))} placeholder="Charging Coordinator" />
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Vehicle context</div>
                    <div className="mt-1 text-xs text-slate-600">VIP, battery size, and default cost center.</div>
                  </div>
                  <Battery className="h-5 w-5 text-slate-400" />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {vehicleById[draft.vehicleId]?.vip ? <Pill label="VIP" tone="info" /> : <Pill label="Standard" tone="neutral" />}
                  <Pill label={`${vehicleById[draft.vehicleId]?.batteryKWh || 0} kWh`} tone="neutral" />
                  <Pill label={vehicleById[draft.vehicleId]?.costCenter || "-"} tone="neutral" />
                  <Pill label={vehicleById[draft.vehicleId]?.ownerType || "-"} tone="neutral" />
                </div>
                <div className="mt-2 text-xs text-slate-500">Owner: {vehicleById[draft.vehicleId]?.ownerName || "-"}</div>
              </div>
            </div>
          ) : null}

          {createStep === 1 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field
                label="Scheduled time"
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(v) => setDraft((p) => ({ ...p, scheduledAt: v }))}
                hint="Local time"
              />
              <NumberField label="Duration" value={draft.durationMins} onChange={(v) => setDraft((p) => ({ ...p, durationMins: clamp(v, 10, 360) }))} hint="Minutes" />
              <Select label="Site" value={draft.siteId} onChange={(v) => setDraft((p) => ({ ...p, siteId: v }))} options={sites.map((s) => ({ value: s.id, label: `${s.name} (${s.status})` }))} />
              <Select label="Connector" value={draft.connector} onChange={(v) => setDraft((p) => ({ ...p, connector: v as ChargerConnector }))} options={CONNECTORS.map((c) => ({ value: c, label: c }))} />
              <NumberField label="Expected energy" value={draft.expectedKWh} onChange={(v) => setDraft((p) => ({ ...p, expectedKWh: Math.max(1, v) }))} hint="kWh" />
              <NumberField label="Max budget" value={draft.maxBudgetUGX} onChange={(v) => setDraft((p) => ({ ...p, maxBudgetUGX: Math.max(0, v) }))} hint="UGX" />
              <Select label="Purpose" value={draft.purpose} onChange={(v) => setDraft((p) => ({ ...p, purpose: v as ChargePurpose }))} options={PURPOSES.map((p) => ({ value: p, label: p }))} />
              <Field label="Tags" value={draft.tags} onChange={(v) => setDraft((p) => ({ ...p, tags: v }))} placeholder="Comma separated" hint="Example: Fleet,Airport" />
              <Field label="Cost center" value={draft.costCenter} onChange={(v) => setDraft((p) => ({ ...p, costCenter: v }))} placeholder="OPS-001" />
              <Field label="Project tag" value={draft.projectTag} onChange={(v) => setDraft((p) => ({ ...p, projectTag: v }))} placeholder="Charging program" />
              <div className="rounded-3xl border border-slate-200 bg-white p-4 md:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Priority slot</div>
                    <div className="mt-1 text-xs text-slate-600">Premium: request priority reservation, approval-gated.</div>
                  </div>
                  <button
                    type="button"
                    className={cn("relative h-7 w-12 rounded-full border transition", draft.prioritySlot ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                    onClick={() => setDraft((p) => ({ ...p, prioritySlot: !p.prioritySlot }))}
                    aria-label="Toggle priority"
                  >
                    <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", draft.prioritySlot ? "left-[22px]" : "left-1")} />
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <TextArea
                  label="If purpose is Other"
                  value={draft.purposeOther}
                  onChange={(v) => setDraft((p) => ({ ...p, purposeOther: v }))}
                  placeholder="Explain the purpose"
                  rows={3}
                  disabled={draft.purpose !== "Other"}
                  hint={draft.purpose !== "Other" ? "Disabled" : "Required when Other"}
                />
              </div>
            </div>
          ) : null}

          {createStep === 2 ? (
            <div className="space-y-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Policy check</div>
                    <div className="mt-1 text-xs text-slate-600">This preview shows why approval may be required.</div>
                  </div>
                  {policyCheckDraft.needsApproval ? <Pill label="Approval required" tone="warn" /> : <Pill label="No approval" tone="good" />}
                </div>

                {policyCheckDraft.requiredErrors.length ? (
                  <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                    <div className="font-semibold">Missing</div>
                    <ul className="mt-2 space-y-1">
                      {policyCheckDraft.requiredErrors.map((e, idx) => (
                        <li key={`err-${idx}`}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Scheduled</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{fmtDateTime(policyCheckDraft.whenTs)}</div>
                    <div className="mt-1 text-xs text-slate-500">After-hours: {policyCheckDraft.after ? "Yes" : "No"}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Tariff</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{policyCheckDraft.peak ? "Peak" : "Off-peak"}</div>
                    <div className="mt-1 text-xs text-slate-500">{policyCheckDraft.suggestion}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">Flags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {policyCheckDraft.flags.length ? policyCheckDraft.flags.map((f, idx) => <Pill key={`flag-${idx}`} label={f} tone={f.endsWith("required") ? "bad" : f === "Peak tariff" ? "warn" : "neutral"} />) : <Pill label="None" tone="neutral" />}
                    {policyCheckDraft.hasActiveVipException ? <Pill label="VIP exception active" tone="info" /> : null}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  If approval is required, the session is created in Pending approval and routed to Manager then Finance, and optionally CFO for VIP, DC fast, or priority.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Bulk fleet modal */}
      <Modal
        open={bulkOpen}
        title="Bulk fleet charging plan"
        subtitle="Premium: schedule many vehicles with staggered slots."
        onClose={() => setBulkOpen(false)}
        actions={[{ label: "Create", onClick: runBulkFleetBooking }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={runBulkFleetBooking}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Plan name" value={bulkDraft.name} onChange={(v) => setBulkDraft((p) => ({ ...p, name: v }))} />
          <Select label="Site" value={bulkDraft.siteId} onChange={(v) => setBulkDraft((p) => ({ ...p, siteId: v }))} options={sites.map((s) => ({ value: s.id, label: s.name }))} />
          <Field label="Start time" type="datetime-local" value={bulkDraft.startAt} onChange={(v) => setBulkDraft((p) => ({ ...p, startAt: v }))} />
          <NumberField label="Interval" value={bulkDraft.intervalMins} onChange={(v) => setBulkDraft((p) => ({ ...p, intervalMins: clamp(v, 5, 120) }))} hint="Minutes" />
          <NumberField label="Duration" value={bulkDraft.durationMins} onChange={(v) => setBulkDraft((p) => ({ ...p, durationMins: clamp(v, 10, 360) }))} hint="Minutes" />
          <Select label="Connector" value={bulkDraft.connector} onChange={(v) => setBulkDraft((p) => ({ ...p, connector: v as ChargerConnector }))} options={CONNECTORS.map((c) => ({ value: c, label: c }))} />
          <NumberField label="Expected kWh" value={bulkDraft.expectedKWh} onChange={(v) => setBulkDraft((p) => ({ ...p, expectedKWh: Math.max(1, v) }))} hint="kWh" />
          <NumberField label="Max budget" value={bulkDraft.maxBudgetUGX} onChange={(v) => setBulkDraft((p) => ({ ...p, maxBudgetUGX: Math.max(0, v) }))} hint="UGX" />
          <Field label="Tags" value={bulkDraft.tags} onChange={(v) => setBulkDraft((p) => ({ ...p, tags: v }))} hint="Comma separated" />
          <Field label="Cost center" value={bulkDraft.costCenter} onChange={(v) => setBulkDraft((p) => ({ ...p, costCenter: v }))} />
          <Field label="Project tag" value={bulkDraft.projectTag} onChange={(v) => setBulkDraft((p) => ({ ...p, projectTag: v }))} />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">Vehicles</div>
                <div className="mt-1 text-xs text-slate-600">Select vehicles to schedule in sequence.</div>
              </div>
              <Pill label={`${bulkDraft.vehicleIds.length} selected`} tone={bulkDraft.vehicleIds.length ? "info" : "neutral"} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {vehicles.map((v) => {
                const on = bulkDraft.vehicleIds.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    className={cn(
                      "rounded-2xl border px-3 py-3 text-left",
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() =>
                      setBulkDraft((p) => ({
                        ...p,
                        vehicleIds: on ? p.vehicleIds.filter((id) => id !== v.id) : [...p.vehicleIds, v.id],
                      }))
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">{v.label}</div>
                      {v.vip ? <Pill label="VIP" tone="info" /> : null}
                    </div>
                    <div className="mt-1 text-xs text-slate-500">{v.ownerName} • {v.costCenter}</div>
                  </button>
                );
              })}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Bulk plan creates sessions and creates one fleet-plan approval if any session violates policy.
            </div>
          </div>
        </div>
      </Modal>

      {/* VIP exception modal */}
      <Modal
        open={vipReqOpen}
        title="Request VIP charging exception"
        subtitle="Premium: allow DC fast, priority slots, or after-hours through approvals."
        onClose={() => setVipReqOpen(false)}
        actions={[{ label: "Submit", onClick: requestVipException }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setVipReqOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={requestVipException}>
              <Shield className="h-4 w-4" /> Submit
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Vehicle"
            value={vipReqDraft.vehicleId}
            onChange={(v) => setVipReqDraft((p) => ({ ...p, vehicleId: v }))}
            options={vehicles.map((v) => ({ value: v.id, label: `${v.label}${v.vip ? " • VIP" : ""}` }))}
          />
          <Select
            label="Exception type"
            value={vipReqDraft.exceptionType}
            onChange={(v) => setVipReqDraft((p) => ({ ...p, exceptionType: v as VipExceptionType }))}
            options={[
              { value: "DC fast", label: "DC fast" },
              { value: "Priority slot", label: "Priority slot" },
              { value: "After-hours", label: "After-hours" },
            ]}
          />
          <NumberField label="Valid days" value={vipReqDraft.validDays} onChange={(v) => setVipReqDraft((p) => ({ ...p, validDays: clamp(v, 1, 365) }))} hint="1 to 365" />
          <div className="md:col-span-2">
            <TextArea label="Reason" value={vipReqDraft.reason} onChange={(v) => setVipReqDraft((p) => ({ ...p, reason: v }))} placeholder="Explain the business justification" rows={4} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Best practice: CFO is added automatically for DC or priority exceptions.
          </div>
        </div>
      </Modal>
    </div>
  );

  function Reco({ title, detail, cta, onClick }: { title: string; detail: string; cta: string; onClick: () => void }) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">{title}</div>
            <div className="mt-1 text-sm text-slate-600">{detail}</div>
          </div>
          <Button variant="outline" className="px-3 py-2 text-xs" onClick={onClick}>
            <ChevronRight className="h-4 w-4" /> {cta}
          </Button>
        </div>
      </div>
    );
  }
}
