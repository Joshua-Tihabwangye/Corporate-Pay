import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  CalendarDays,
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Copy,
  Crown,
  Download,
  Filter,
  Info,
  Mail,
  MapPin,
  MessageSquare,
  Plane,
  Plus,
  Repeat,
  Search,
  Shield,
  Sparkles,
  Star,
  Tag,
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
  | "Rides & Logistics"
  | "Travel & Tourism"
  | "Other Service Module";

type RideCategory = "Standard" | "Premium";

type BookingStatus = "Draft" | "Pending approval" | "Confirmed" | "Completed" | "Cancelled";

type TripPurpose =
  | "Client meeting"
  | "Airport"
  | "Office commute"
  | "Event"
  | "Visitor"
  | "Other";

type TravelerType = "Employee" | "Visitor";

type ApprovalStatus = "Pending" | "Approved" | "Rejected";

type ApprovalRole = "Manager" | "Finance" | "CFO" | "CEO";

type VipExceptionType = "Premium rides" | "After-hours";

type Attachment = { id: string; name: string; note: string; addedAt: number; addedBy: string };

type Employee = {
  id: string;
  name: string;
  group: string;
  costCenter: string;
  vip: boolean;
  email?: string;
  phone?: string;
};

type Visitor = {
  id: string;
  name: string;
  company: string;
  hostEmployeeId: string;
  vip: boolean;
  phone?: string;
};

type Event = {
  id: string;
  name: string;
  location: string;
  startAt: number;
  endAt: number;
  organizer: string;
  attendees: Array<{ type: TravelerType; id: string }>;
  notes: string;
};

type RecurringCommute = {
  id: string;
  name: string;
  days: Array<"Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun">;
  timeLocal: string; // HH:MM
  pickup: string;
  dropoff: string;
  category: RideCategory;
  purpose: TripPurpose;
  tags: string[];
  employees: string[];
  enabled: boolean;
};

type Booking = {
  id: string;
  ref: string;
  travelerType: TravelerType;
  travelerId: string;
  bookedBy: string; // coordinator
  createdAt: number;
  scheduledAt: number;
  pickup: string;
  dropoff: string;
  category: RideCategory;
  purpose: TripPurpose;
  purposeOther?: string;
  tags: string[];
  costCenter: string;
  projectTag: string;
  module: ServiceModule;
  status: BookingStatus;
  eventId?: string;
  recurringId?: string;
  proofs: Attachment[];
  vipRequested: boolean;
  policyNotes: string[];
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
  scope: "Booking" | "Event" | "VIP Exception";
  scopeId: string;
  reason: string;
  policyFlags: string[];
  steps: ApprovalStep[];
};

type VipException = {
  id: string;
  travelerType: TravelerType;
  travelerId: string;
  exceptionType: VipExceptionType;
  validFrom: number;
  validTo: number;
  status: ApprovalStatus;
  requestedBy: string;
  reason: string;
  approvalId?: string;
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
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
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
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
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
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
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
        <CalendarDays className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function statusTone(s: BookingStatus) {
  if (s === "Completed") return "good" as const;
  if (s === "Confirmed") return "info" as const;
  if (s === "Pending approval") return "warn" as const;
  if (s === "Cancelled") return "bad" as const;
  return "neutral" as const;
}

function approvalTone(s: ApprovalStatus) {
  if (s === "Approved") return "good" as const;
  if (s === "Rejected") return "bad" as const;
  return "warn" as const;
}

function isAfterHours(ts: number, windowStart = "06:00", windowEnd = "22:00") {
  const d = new Date(ts);
  const hh = d.getHours();
  const mm = d.getMinutes();
  const mins = hh * 60 + mm;

  const parse = (s: string) => {
    const [h, m] = s.split(":").map((x) => Number(x));
    return (h || 0) * 60 + (m || 0);
  };

  const start = parse(windowStart);
  const end = parse(windowEnd);

  // assumes start < end
  return mins < start || mins > end;
}

function hourOf(ts: number) {
  return new Date(ts).getHours();
}

function makeRef(prefix: string) {
  return `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
}

function defaultStepsForFlags(flags: string[]): Array<{ role: ApprovalRole; slaHours: number }> {
  // simple best-practice template
  const needsCFO = flags.some((f) => f.includes("VIP") || f.includes("Premium") || f.includes("CapEx") || f.includes("Executive"));
  const needsCEO = flags.some((f) => f.includes("CEO"));

  const steps: Array<{ role: ApprovalRole; slaHours: number }> = [
    { role: "Manager", slaHours: 8 },
    { role: "Finance", slaHours: 12 },
  ];

  if (needsCFO && !steps.some((s) => s.role === "CFO")) steps.push({ role: "CFO", slaHours: 24 });
  if (needsCEO) steps.push({ role: "CEO", slaHours: 24 });

  return steps;
}

export default function CorporatePayCorporateTravelSchedulingV2() {
  const now = Date.now();

  const PURPOSES: TripPurpose[] = ["Client meeting", "Airport", "Office commute", "Event", "Visitor", "Other"];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Corporate policy defaults used for enforcement
  const [policy, setPolicy] = useState(() => ({
    workStart: "06:00",
    workEnd: "22:00",
    requirePurpose: true,
    requireProjectTag: true,
    requireCostCenter: true,
    premiumRequiresApproval: true,
    vipPremiumAllowedWithApproval: true,
    enforceVisitorHost: true,
    peakHourThreshold: 6, // bookings per hour
  }));

  const [employees] = useState<Employee[]>(() => [
    { id: "E-001", name: "Mary N.", group: "Operations", costCenter: "OPS-001", vip: false, email: "mary@acme.com" },
    { id: "E-002", name: "John S.", group: "Sales", costCenter: "SALES-TRAVEL", vip: false, email: "john@acme.com" },
    { id: "E-003", name: "Irene K.", group: "Operations", costCenter: "OPS-001", vip: true, email: "irene@acme.com" },
    { id: "E-004", name: "Daisy O.", group: "Finance", costCenter: "FIN-OPS", vip: false, email: "daisy@acme.com" },
    { id: "E-005", name: "Procurement Desk", group: "Procurement", costCenter: "PROC-001", vip: false },
  ]);

  const [visitors, setVisitors] = useState<Visitor[]>(() => [
    { id: "VST-01", name: "Alex Chen", company: "Shenzhen Motors", hostEmployeeId: "E-003", vip: true, phone: "+86 177 0000 0000" },
    { id: "VST-02", name: "Sarah Kato", company: "Partner Co", hostEmployeeId: "E-001", vip: false, phone: "+256 701 222 222" },
  ]);

  const employeeById = useMemo(() => Object.fromEntries(employees.map((e) => [e.id, e])) as Record<string, Employee>, [employees]);
  const visitorById = useMemo(() => Object.fromEntries(visitors.map((v) => [v.id, v])) as Record<string, Visitor>, [visitors]);

  const [events, setEvents] = useState<Event[]>(() => {
    const DAY = 24 * 60 * 60 * 1000;
    const start = now + 2 * DAY + 10 * 60 * 60 * 1000;
    return [
      {
        id: "EVT-001",
        name: "Investor Roadshow",
        location: "Kampala Serena",
        startAt: start,
        endAt: start + 3 * 60 * 60 * 1000,
        organizer: "Travel Coordinator",
        attendees: [
          { type: "Employee", id: "E-001" },
          { type: "Employee", id: "E-002" },
          { type: "Employee", id: "E-003" },
          { type: "Visitor", id: "VST-01" },
        ],
        notes: "Bulk bookings required. VIP guest attending.",
      },
    ];
  });

  const [recurring, setRecurring] = useState<RecurringCommute[]>(() => [
    {
      id: "RC-001",
      name: "Office commute - Operations",
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      timeLocal: "07:30",
      pickup: "Home",
      dropoff: "Kampala HQ",
      category: "Standard",
      purpose: "Office commute",
      tags: ["Commute"],
      employees: ["E-001", "E-003"],
      enabled: true,
    },
    {
      id: "RC-002",
      name: "Airport run - Sales",
      days: ["Mon", "Wed", "Fri"],
      timeLocal: "05:30",
      pickup: "Kampala HQ",
      dropoff: "Entebbe Airport",
      category: "Premium",
      purpose: "Airport",
      tags: ["Airport"],
      employees: ["E-002"],
      enabled: false,
    },
  ]);

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const H = 60 * 60 * 1000;
    const DAY = 24 * 60 * 60 * 1000;

    const b1At = now + 1 * DAY + 9 * H;
    const b2At = now + 2 * DAY + 8 * H;
    const b3At = now + 2 * DAY + 18 * H;

    return [
      {
        id: "BK-001",
        ref: makeRef("TRV"),
        travelerType: "Visitor",
        travelerId: "VST-01",
        bookedBy: "Travel Coordinator",
        createdAt: now - 5 * H,
        scheduledAt: b1At,
        pickup: "Entebbe Airport",
        dropoff: "Kampala HQ",
        category: "Premium",
        purpose: "Visitor",
        tags: ["VIP", "Airport"],
        costCenter: "SALES-TRAVEL",
        projectTag: "Roadshow",
        module: "Rides & Logistics",
        status: "Pending approval",
        vipRequested: true,
        policyNotes: ["Premium requested", "VIP traveler"],
        proofs: [],
      },
      {
        id: "BK-002",
        ref: makeRef("TRV"),
        travelerType: "Employee",
        travelerId: "E-001",
        bookedBy: "Travel Coordinator",
        createdAt: now - 2 * H,
        scheduledAt: b2At,
        pickup: "Kampala HQ",
        dropoff: "Kampala Serena",
        category: "Standard",
        purpose: "Event",
        tags: ["Event"],
        costCenter: "OPS-001",
        projectTag: "Investor Roadshow",
        module: "Rides & Logistics",
        status: "Confirmed",
        eventId: "EVT-001",
        vipRequested: false,
        policyNotes: [],
        proofs: [],
      },
      {
        id: "BK-003",
        ref: makeRef("TRV"),
        travelerType: "Employee",
        travelerId: "E-002",
        bookedBy: "Travel Coordinator",
        createdAt: now - 90 * 60 * 1000,
        scheduledAt: b3At,
        pickup: "Kampala Serena",
        dropoff: "Kampala HQ",
        category: "Standard",
        purpose: "Event",
        tags: ["Event", "Return"],
        costCenter: "SALES-TRAVEL",
        projectTag: "Investor Roadshow",
        module: "Rides & Logistics",
        status: "Confirmed",
        eventId: "EVT-001",
        vipRequested: false,
        policyNotes: [],
        proofs: [],
      },
    ];
  });

  const [vipExceptions, setVipExceptions] = useState<VipException[]>(() => {
    const DAY = 24 * 60 * 60 * 1000;
    return [
      {
        id: "VX-001",
        travelerType: "Employee",
        travelerId: "E-003",
        exceptionType: "Premium rides",
        validFrom: now - 3 * DAY,
        validTo: now + 30 * DAY,
        status: "Approved",
        requestedBy: "Org Admin",
        reason: "Executive travel allowance",
        approvalId: "APR-EX-001",
      },
    ];
  });

  const [approvals, setApprovals] = useState<ApprovalRequest[]>(() => {
    const H = 60 * 60 * 1000;
    const mkSteps = (flags: string[], requestedAt: number) => {
      const base = defaultStepsForFlags(flags);
      const assigneeByRole: Record<ApprovalRole, string> = { Manager: "Manager", Finance: "Finance Desk", CFO: "CFO", CEO: "CEO" };
      return base.map((s) => ({
        id: uid("AS"),
        role: s.role,
        assignee: assigneeByRole[s.role],
        status: "Pending" as ApprovalStatus,
        requestedAt,
        slaHours: s.slaHours,
      }));
    };

    const createdAt = now - 5 * H;
    return [
      {
        id: "APR-001",
        createdAt,
        createdBy: "Travel Coordinator",
        status: "Pending",
        scope: "Booking",
        scopeId: "BK-001",
        reason: "VIP airport pickup requires premium category",
        policyFlags: ["VIP traveler", "Premium requested"],
        steps: mkSteps(["VIP", "Premium"], createdAt),
      },
    ];
  });

  // UI state
  const [tab, setTab] = useState<"overview" | "bookings" | "events" | "recurring" | "vip" | "insights" | "approvals">("overview");

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | BookingStatus>("All");
  const [typeFilter, setTypeFilter] = useState<"All" | TravelerType>("All");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeBookingId, setActiveBookingId] = useState<string | null>(null);
  const activeBooking = useMemo(() => (activeBookingId ? bookings.find((b) => b.id === activeBookingId) || null : null), [activeBookingId, bookings]);

  const [createOpen, setCreateOpen] = useState(false);
  const [createStep, setCreateStep] = useState<0 | 1 | 2>(0);

  const [draft, setDraft] = useState(() => ({
    travelerType: "Employee" as TravelerType,
    travelerId: "E-001",
    bookedBy: "Travel Coordinator",
    scheduledAt: toLocalInput(now + 24 * 60 * 60 * 1000),
    pickup: "Kampala HQ",
    dropoff: "Entebbe Airport",
    category: "Standard" as RideCategory,
    purpose: "Airport" as TripPurpose,
    purposeOther: "",
    tags: "Airport,Client",
    costCenter: "OPS-001",
    projectTag: "Business travel",
    module: "Rides & Logistics" as ServiceModule,
    vipRequested: false,
  }));

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkDraft, setBulkDraft] = useState(() => ({
    eventId: "EVT-001",
    pickup: "Kampala HQ",
    dropoff: "Kampala Serena",
    category: "Standard" as RideCategory,
    createReturn: true,
    returnPickup: "Kampala Serena",
    returnDropoff: "Kampala HQ",
    offsetMinsBeforeStart: 30,
    returnMinsAfterEnd: 15,
    purpose: "Event" as TripPurpose,
    tags: "Event",
    costCenter: "OPS-001",
    projectTag: "Investor Roadshow",
  }));

  const [vipReqOpen, setVipReqOpen] = useState(false);
  const [vipReqDraft, setVipReqDraft] = useState(() => ({
    travelerType: "Employee" as TravelerType,
    travelerId: "E-003",
    exceptionType: "Premium rides" as VipExceptionType,
    validDays: 30,
    reason: "",
  }));

  // Derived
  const travelerLabel = (t: TravelerType, id: string) => {
    return t === "Employee" ? employeeById[id]?.name || id : visitorById[id]?.name || id;
  };

  const travelerVip = (t: TravelerType, id: string) => {
    return t === "Employee" ? !!employeeById[id]?.vip : !!visitorById[id]?.vip;
  };

  const hostNameForVisitor = (id: string) => {
    const v = visitorById[id];
    if (!v) return "-";
    return employeeById[v.hostEmployeeId]?.name || v.hostEmployeeId;
  };

  const upcomingBookings = useMemo(() => bookings.filter((b) => b.scheduledAt > now && b.status !== "Cancelled"), [bookings, now]);
  const pendingApprovalsCount = useMemo(() => approvals.filter((a) => a.status === "Pending").length, [approvals]);
  const upcomingEvents = useMemo(() => events.filter((e) => e.startAt > now).sort((a, b) => a.startAt - b.startAt), [events, now]);

  const filteredBookings = useMemo(() => {
    const query = q.trim().toLowerCase();
    return bookings
      .filter((b) => (statusFilter === "All" ? true : b.status === statusFilter))
      .filter((b) => (typeFilter === "All" ? true : b.travelerType === typeFilter))
      .filter((b) => {
        if (!query) return true;
        const blob = `${b.ref} ${b.id} ${travelerLabel(b.travelerType, b.travelerId)} ${b.pickup} ${b.dropoff} ${b.purpose} ${b.tags.join(" ")} ${b.costCenter} ${b.projectTag}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => a.scheduledAt - b.scheduledAt);
  }, [bookings, q, statusFilter, typeFilter, employeeById, visitorById]);

  // Smart scheduling: peak hour detection
  const hourBuckets = useMemo(() => {
    const counts = Array.from({ length: 24 }, () => 0);
    for (const b of upcomingBookings) {
      counts[hourOf(b.scheduledAt)] += 1;
    }
    return counts;
  }, [upcomingBookings]);

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

  const kpis = useMemo(() => {
    const open = bookings.filter((b) => ["Draft", "Pending approval", "Confirmed"].includes(b.status)).length;
    const dueToday = bookings.filter((b) => {
      const d = new Date(b.scheduledAt);
      const n = new Date(now);
      return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
    }).length;
    const vipPending = approvals.filter((a) => a.status === "Pending" && a.policyFlags.some((f) => f.toLowerCase().includes("vip"))).length;
    return { open, dueToday, vipPending };
  }, [bookings, approvals, now]);

  const policyCheckForDraft = useMemo(() => {
    const scheduledAt = parseLocalInput(draft.scheduledAt);
    const flags: string[] = [];

    const tVip = travelerVip(draft.travelerType, draft.travelerId);
    const afterHours = isAfterHours(scheduledAt, policy.workStart, policy.workEnd);

    if (policy.requirePurpose && (!draft.purpose || (draft.purpose === "Other" && !draft.purposeOther.trim()))) flags.push("Purpose required");
    if (policy.requireProjectTag && !draft.projectTag.trim()) flags.push("Project tag required");
    if (policy.requireCostCenter && !draft.costCenter.trim()) flags.push("Cost center required");

    if (draft.travelerType === "Visitor" && policy.enforceVisitorHost) {
      const v = visitorById[draft.travelerId];
      if (!v?.hostEmployeeId) flags.push("Visitor host required");
    }

    if (afterHours) flags.push("After-hours");

    const hasActiveVipException = vipExceptions.some((x) => {
      if (x.status !== "Approved") return false;
      if (x.travelerType !== draft.travelerType || x.travelerId !== draft.travelerId) return false;
      if (x.exceptionType !== "After-hours" && x.exceptionType !== "Premium rides") return false;
      const ts = scheduledAt;
      return ts >= x.validFrom && ts <= x.validTo;
    });

    const premium = draft.category === "Premium";
    if (premium && policy.premiumRequiresApproval) flags.push("Premium requested");

    if (draft.vipRequested || tVip) flags.push("VIP traveler");

    const needsApproval =
      flags.some((f) => ["After-hours", "Premium requested", "VIP traveler"].includes(f)) && !hasActiveVipException;

    const errors = flags.filter((f) => f.endsWith("required"));

    const summary = {
      scheduledAt,
      flags,
      errors,
      needsApproval,
      hasActiveVipException,
      afterHours,
      premium,
      tVip,
    };

    return summary;
  }, [draft, policy, vipExceptions, visitorById, travelerVip]);

  // Actions
  const openBooking = (id: string) => {
    setActiveBookingId(id);
    setDrawerOpen(true);
  };

  const createApprovalRequest = (args: { scope: ApprovalRequest["scope"]; scopeId: string; reason: string; flags: string[]; createdBy: string }) => {
    const createdAt = Date.now();
    const stepsBase = defaultStepsForFlags(args.flags);
    const assigneeByRole: Record<ApprovalRole, string> = { Manager: "Manager", Finance: "Finance Desk", CFO: "CFO", CEO: "CEO" };
    const steps: ApprovalStep[] = stepsBase.map((s) => ({
      id: uid("AS"),
      role: s.role,
      assignee: assigneeByRole[s.role],
      status: "Pending",
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
      policyFlags: args.flags,
      steps,
    };

    setApprovals((p) => [row, ...p]);
    return row;
  };

  const submitDraft = () => {
    const check = policyCheckForDraft;
    if (check.errors.length) {
      toast({ title: "Fix required fields", message: check.errors.join(" • "), kind: "warn" });
      return;
    }

    const createdAt = Date.now();
    const id = uid("BK");

    const tags = draft.tags
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .slice(0, 10);

    const purposeOther = draft.purpose === "Other" ? draft.purposeOther.trim() : undefined;

    const booking: Booking = {
      id,
      ref: makeRef("TRV"),
      travelerType: draft.travelerType,
      travelerId: draft.travelerId,
      bookedBy: draft.bookedBy,
      createdAt,
      scheduledAt: check.scheduledAt,
      pickup: draft.pickup.trim(),
      dropoff: draft.dropoff.trim(),
      category: draft.category,
      purpose: draft.purpose,
      purposeOther,
      tags,
      costCenter: draft.costCenter.trim(),
      projectTag: draft.projectTag.trim(),
      module: draft.module,
      status: check.needsApproval ? "Pending approval" : "Confirmed",
      vipRequested: draft.vipRequested || check.tVip,
      policyNotes: check.flags.filter((f) => !f.endsWith("required")),
      proofs: [],
    };

    setBookings((p) => [booking, ...p]);

    if (check.needsApproval) {
      createApprovalRequest({
        scope: "Booking",
        scopeId: booking.id,
        createdBy: draft.bookedBy,
        reason: "Policy exception required for this booking",
        flags: check.flags.filter((f) => !f.endsWith("required")),
      });
    }

    toast({ title: "Created", message: check.needsApproval ? "Booking created and sent for approval." : "Booking confirmed.", kind: "success" });
    setCreateOpen(false);
    setCreateStep(0);
    setTab("bookings");
  };

  const runBulkBooking = () => {
    const evt = events.find((e) => e.id === bulkDraft.eventId);
    if (!evt) {
      toast({ title: "Missing", message: "Select an event.", kind: "warn" });
      return;
    }

    const startAt = evt.startAt;
    const endAt = evt.endAt;

    const out: Booking[] = [];

    const goAt = startAt - bulkDraft.offsetMinsBeforeStart * 60 * 1000;
    const returnAt = endAt + bulkDraft.returnMinsAfterEnd * 60 * 1000;

    const createdAt = Date.now();

    for (const a of evt.attendees) {
      const travelerName = travelerLabel(a.type, a.id);
      const vip = travelerVip(a.type, a.id);

      const flags: string[] = [];
      if (bulkDraft.category === "Premium" && policy.premiumRequiresApproval) flags.push("Premium requested");
      if (vip) flags.push("VIP traveler");
      if (isAfterHours(goAt, policy.workStart, policy.workEnd)) flags.push("After-hours");

      const needsApproval = flags.length > 0;

      out.push({
        id: uid("BK"),
        ref: makeRef("EVT"),
        travelerType: a.type,
        travelerId: a.id,
        bookedBy: "Travel Coordinator",
        createdAt,
        scheduledAt: goAt,
        pickup: bulkDraft.pickup,
        dropoff: bulkDraft.dropoff,
        category: bulkDraft.category,
        purpose: bulkDraft.purpose,
        tags: bulkDraft.tags.split(",").map((x) => x.trim()).filter(Boolean),
        costCenter: bulkDraft.costCenter,
        projectTag: bulkDraft.projectTag,
        module: "Rides & Logistics",
        status: needsApproval ? "Pending approval" : "Confirmed",
        eventId: evt.id,
        vipRequested: vip,
        policyNotes: flags,
        proofs: [],
      });

      if (bulkDraft.createReturn) {
        const flags2: string[] = [];
        if (bulkDraft.category === "Premium" && policy.premiumRequiresApproval) flags2.push("Premium requested");
        if (vip) flags2.push("VIP traveler");
        if (isAfterHours(returnAt, policy.workStart, policy.workEnd)) flags2.push("After-hours");
        const needsApproval2 = flags2.length > 0;

        out.push({
          id: uid("BK"),
          ref: makeRef("EVT"),
          travelerType: a.type,
          travelerId: a.id,
          bookedBy: "Travel Coordinator",
          createdAt,
          scheduledAt: returnAt,
          pickup: bulkDraft.returnPickup,
          dropoff: bulkDraft.returnDropoff,
          category: bulkDraft.category,
          purpose: bulkDraft.purpose,
          tags: [...bulkDraft.tags.split(",").map((x) => x.trim()).filter(Boolean), "Return"],
          costCenter: bulkDraft.costCenter,
          projectTag: bulkDraft.projectTag,
          module: "Rides & Logistics",
          status: needsApproval2 ? "Pending approval" : "Confirmed",
          eventId: evt.id,
          vipRequested: vip,
          policyNotes: flags2,
          proofs: [],
        });
      }

      // quiet compile-time usage
      void travelerName;
    }

    setBookings((p) => [...out, ...p]);

    // If any needs approval, create ONE event-level approval (best practice)
    const anyPending = out.some((b) => b.status === "Pending approval");
    if (anyPending) {
      const flags = Array.from(new Set(out.flatMap((b) => b.policyNotes))).filter(Boolean);
      createApprovalRequest({
        scope: "Event",
        scopeId: evt.id,
        createdBy: "Travel Coordinator",
        reason: `Bulk event booking requires policy approval (${out.filter((b) => b.status === "Pending approval").length} pending).`,
        flags: flags.length ? flags : ["Bulk booking"],
      });
    }

    toast({ title: "Bulk created", message: `Created ${out.length} booking(s).`, kind: "success" });
    setBulkOpen(false);
    setTab("bookings");
  };

  const approveNextStep = (approvalId: string) => {
    const ts = Date.now();
    setApprovals((prev) =>
      prev.map((a) => {
        if (a.id !== approvalId) return a;
        const idx = a.steps.findIndex((s) => s.status === "Pending");
        if (idx < 0) return a;
        const steps = a.steps.slice();
        steps[idx] = { ...steps[idx], status: "Approved", decidedAt: ts, note: "Approved" };
        const allApproved = steps.every((s) => s.status === "Approved");
        const status: ApprovalStatus = allApproved ? "Approved" : "Pending";
        return { ...a, steps, status };
      })
    );

    // Apply side-effects if fully approved
    const approved = approvals.find((x) => x.id === approvalId);
    const current = approvals.map((x) => (x.id === approvalId ? x : x));
    void approved;
    void current;

    // After approving, re-check updated approvals state and apply
    setTimeout(() => {
      setApprovals((prev) => {
        const a = prev.find((x) => x.id === approvalId);
        if (!a || a.status !== "Approved") return prev;

        if (a.scope === "Booking") {
          setBookings((bprev) => bprev.map((b) => (b.id === a.scopeId ? { ...b, status: "Confirmed" } : b)));
        }
        if (a.scope === "Event") {
          setBookings((bprev) => bprev.map((b) => (b.eventId === a.scopeId && b.status === "Pending approval" ? { ...b, status: "Confirmed" } : b)));
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

    // If booking scope, cancel booking
    const a = approvals.find((x) => x.id === approvalId);
    if (a?.scope === "Booking") {
      setBookings((prev) => prev.map((b) => (b.id === a.scopeId ? { ...b, status: "Cancelled", policyNotes: [...b.policyNotes, "Rejected"] } : b)));
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
      travelerType: vipReqDraft.travelerType,
      travelerId: vipReqDraft.travelerId,
      exceptionType: vipReqDraft.exceptionType,
      validFrom: createdAt,
      validTo: createdAt + clamp(vipReqDraft.validDays, 1, 365) * DAY,
      status: "Pending",
      requestedBy: "Org Admin",
      reason: vipReqDraft.reason.trim(),
    };

    const flags = ["VIP", vipReqDraft.exceptionType === "Premium rides" ? "Premium" : "After-hours"];
    const apr = createApprovalRequest({ scope: "VIP Exception", scopeId: ex.id, createdBy: "Org Admin", reason: ex.reason, flags });
    ex.approvalId = apr.id;

    setVipExceptions((p) => [ex, ...p]);

    toast({ title: "Requested", message: "VIP exception requested and sent for approval.", kind: "success" });
    setVipReqOpen(false);
    setTab("approvals");
  };

  const exportBookingsCSV = () => {
    const rows = filteredBookings.map((b) => {
      const name = travelerLabel(b.travelerType, b.travelerId);
      const host = b.travelerType === "Visitor" ? hostNameForVisitor(b.travelerId) : "-";
      return {
        ref: b.ref,
        status: b.status,
        traveler: name,
        travelerType: b.travelerType,
        host,
        when: fmtDateTime(b.scheduledAt),
        pickup: b.pickup,
        dropoff: b.dropoff,
        category: b.category,
        purpose: b.purpose === "Other" ? b.purposeOther || "Other" : b.purpose,
        tags: b.tags.join(";"),
        costCenter: b.costCenter,
        projectTag: b.projectTag,
        policyNotes: b.policyNotes.join(";"),
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
    a.download = "corporate-travel-bookings.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", message: "Bookings CSV downloaded.", kind: "success" });
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
                  <CalendarClock className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Corporate Travel and Scheduling</div>
                  <div className="mt-1 text-xs text-slate-500">Pre-book rides for visitors, events, and recurring commutes. Book on behalf, enforce purpose tags, and handle VIP exceptions with approvals.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Open: ${kpis.open}`} tone={kpis.open ? "warn" : "good"} />
                    <Pill label={`Today: ${kpis.dueToday}`} tone={kpis.dueToday ? "info" : "neutral"} />
                    <Pill label={`Approvals: ${pendingApprovalsCount}`} tone={pendingApprovalsCount ? "warn" : "good"} />
                    <Pill label={`VIP pending: ${kpis.vipPending}`} tone={kpis.vipPending ? "warn" : "good"} />
                    <Pill label={peakDetected ? `Peak hour: ${peakHour.hour}:00 (${peakHour.count})` : `Peak hour: ${peakHour.hour}:00`} tone={peakDetected ? "warn" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportBookingsCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={() => setBulkOpen(true)}>
                  <Users className="h-4 w-4" /> Bulk event booking
                </Button>
                <Button variant="primary" onClick={() => { setCreateOpen(true); setCreateStep(0); }}>
                  <Plus className="h-4 w-4" /> New booking
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "bookings", label: "Bookings" },
                { id: "events", label: "Events" },
                { id: "recurring", label: "Recurring commutes" },
                { id: "vip", label: "Visitors and VIP" },
                { id: "insights", label: "Scheduling insights" },
                { id: "approvals", label: "Approvals" },
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
                    title="Upcoming bookings"
                    subtitle="Pre-booked rides, event transfers, and visitor trips."
                    right={<Pill label={`${upcomingBookings.length} upcoming`} tone={upcomingBookings.length ? "info" : "neutral"} />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">When</th>
                            <th className="px-4 py-3 font-semibold">Traveler</th>
                            <th className="px-4 py-3 font-semibold">Route</th>
                            <th className="px-4 py-3 font-semibold">Purpose</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcomingBookings
                            .slice()
                            .sort((a, b) => a.scheduledAt - b.scheduledAt)
                            .slice(0, 6)
                            .map((b) => (
                              <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 text-slate-700">{fmtDateTime(b.scheduledAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="font-semibold text-slate-900">{travelerLabel(b.travelerType, b.travelerId)}</div>
                                    {travelerVip(b.travelerType, b.travelerId) ? <Pill label="VIP" tone="info" /> : null}
                                    <Pill label={b.travelerType} tone="neutral" />
                                  </div>
                                  {b.travelerType === "Visitor" ? <div className="mt-1 text-xs text-slate-500">Host: {hostNameForVisitor(b.travelerId)}</div> : null}
                                </td>
                                <td className="px-4 py-3 text-slate-700">{b.pickup} → {b.dropoff}</td>
                                <td className="px-4 py-3">
                                  <Pill label={b.purpose === "Other" ? b.purposeOther || "Other" : b.purpose} tone="neutral" />
                                  <div className="mt-1 text-xs text-slate-500">{b.tags.slice(0, 3).join(", ")}{b.tags.length > 3 ? "…" : ""}</div>
                                </td>
                                <td className="px-4 py-3"><Pill label={b.status} tone={statusTone(b.status)} /></td>
                                <td className="px-4 py-3">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openBooking(b.id)}>
                                    <ChevronRight className="h-4 w-4" /> Open
                                  </Button>
                                </td>
                              </tr>
                            ))}
                          {!upcomingBookings.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10">
                                <Empty title="No upcoming bookings" subtitle="Create a booking or bulk book for an event." />
                              </td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    {peakDetected ? (
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Smart scheduling: peak time detected around {peakHour.hour}:00. Consider preplanning 15-30 minutes earlier or switching to bulk event booking.
                      </div>
                    ) : (
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Smart scheduling: no peak congestion detected in upcoming bookings.
                      </div>
                    )}
                  </Section>

                  <Section title="Policy guardrails" subtitle="Trip purpose enforcement and tagging." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Toggle enabled={policy.requirePurpose} onChange={(v) => setPolicy((p) => ({ ...p, requirePurpose: v }))} label="Require trip purpose" description="Purpose must be selected and stored." />
                      <Toggle enabled={policy.requireProjectTag} onChange={(v) => setPolicy((p) => ({ ...p, requireProjectTag: v }))} label="Require project tag" description="Used for reporting and chargeback." />
                      <Toggle enabled={policy.requireCostCenter} onChange={(v) => setPolicy((p) => ({ ...p, requireCostCenter: v }))} label="Require cost center" description="Enforced on booking creation." />
                      <Toggle enabled={policy.premiumRequiresApproval} onChange={(v) => setPolicy((p) => ({ ...p, premiumRequiresApproval: v }))} label="Premium requires approval" description="Policy exceptions are approval-gated." />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Default working hours: {policy.workStart} to {policy.workEnd}. After-hours bookings require approval unless a VIP exception is active.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Events" subtitle="Upcoming corporate events with manifests." right={<Pill label={`${upcomingEvents.length}`} tone={upcomingEvents.length ? "info" : "neutral"} />}
                  >
                    <div className="space-y-2">
                      {upcomingEvents.slice(0, 4).map((e) => (
                        <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{fmtDateTime(e.startAt)} • {e.location}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Pill label={`${e.attendees.length} attendees`} tone="neutral" />
                                {e.attendees.some((a) => travelerVip(a.type, a.id)) ? <Pill label="VIP present" tone="info" /> : null}
                              </div>
                            </div>
                            <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setBulkDraft((p) => ({ ...p, eventId: e.id, projectTag: e.name })); setBulkOpen(true); }}>
                              <Users className="h-4 w-4" /> Bulk
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!upcomingEvents.length ? <Empty title="No upcoming events" subtitle="Create an event manifest first (future)." /> : null}
                    </div>
                  </Section>

                  <Section title="Approvals queue" subtitle="Policy exceptions and VIP handling." right={<Pill label={`${pendingApprovalsCount}`} tone={pendingApprovalsCount ? "warn" : "good"} />}
                  >
                    <div className="space-y-2">
                      {approvals
                        .filter((a) => a.status === "Pending")
                        .slice(0, 4)
                        .map((a) => (
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
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {a.policyFlags.slice(0, 3).map((f, idx) => <Pill key={`${a.id}-f-${idx}`} label={f} tone="neutral" />)}
                                  {a.policyFlags.length > 3 ? <Pill label="+more" tone="neutral" /> : null}
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveNextStep(a.id)}>
                                  <Check className="h-4 w-4" /> Approve
                                </Button>
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectApproval(a.id)}>
                                  <X className="h-4 w-4" /> Reject
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      {!approvals.filter((a) => a.status === "Pending").length ? (
                        <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No pending approvals.</div>
                      ) : null}
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

            {tab === "bookings" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Search and filters" subtitle="Coordinator view." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-600">Search</div>
                      <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-2">
                        <Search className="h-4 w-4 text-slate-500" />
                        <input
                          value={q}
                          onChange={(e) => setQ(e.target.value)}
                          placeholder="ref, traveler, route, tag..."
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
                            ...(["Draft", "Pending approval", "Confirmed", "Completed", "Cancelled"] as BookingStatus[]).map((x) => ({ value: x, label: x })),
                          ]}
                        />
                        <Select
                          label="Traveler type"
                          value={typeFilter}
                          onChange={(v) => setTypeFilter(v as any)}
                          options={[{ value: "All", label: "All" }, { value: "Employee", label: "Employee" }, { value: "Visitor", label: "Visitor" }]}
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setQ("");
                            setStatusFilter("All");
                            setTypeFilter("All");
                            toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                          }}
                        >
                          <Filter className="h-4 w-4" /> Reset
                        </Button>
                        <Button variant="outline" onClick={exportBookingsCSV}>
                          <Download className="h-4 w-4" /> CSV
                        </Button>
                        <Button variant="primary" onClick={() => setCreateOpen(true)}>
                          <Plus className="h-4 w-4" /> New
                        </Button>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Book on behalf: choose employee or visitor, then apply purpose tags, cost center, and project tag.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8">
                  <Section title="Bookings" subtitle="Pre-booked rides and scheduled transfers." right={<Pill label={`${filteredBookings.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Ref</th>
                            <th className="px-4 py-3 font-semibold">When</th>
                            <th className="px-4 py-3 font-semibold">Traveler</th>
                            <th className="px-4 py-3 font-semibold">Route</th>
                            <th className="px-4 py-3 font-semibold">Category</th>
                            <th className="px-4 py-3 font-semibold">Purpose</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBookings.map((b) => (
                            <tr key={b.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{b.ref}</div>
                                <div className="mt-1 text-xs text-slate-500">{b.id}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(b.scheduledAt)}</td>
                              <td className="px-4 py-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="font-semibold text-slate-900">{travelerLabel(b.travelerType, b.travelerId)}</div>
                                  {travelerVip(b.travelerType, b.travelerId) ? <Pill label="VIP" tone="info" /> : null}
                                  <Pill label={b.travelerType} tone="neutral" />
                                </div>
                                {b.travelerType === "Visitor" ? <div className="mt-1 text-xs text-slate-500">Host: {hostNameForVisitor(b.travelerId)}</div> : null}
                              </td>
                              <td className="px-4 py-3 text-slate-700">{b.pickup} → {b.dropoff}</td>
                              <td className="px-4 py-3"><Pill label={b.category} tone={b.category === "Premium" ? "info" : "neutral"} /></td>
                              <td className="px-4 py-3">
                                <Pill label={b.purpose === "Other" ? b.purposeOther || "Other" : b.purpose} tone="neutral" />
                                <div className="mt-1 text-xs text-slate-500">{b.costCenter} • {b.projectTag}</div>
                              </td>
                              <td className="px-4 py-3"><Pill label={b.status} tone={statusTone(b.status)} /></td>
                              <td className="px-4 py-3">
                                <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openBooking(b.id)}>
                                  <ChevronRight className="h-4 w-4" /> Open
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {!filteredBookings.length ? (
                            <tr>
                              <td colSpan={8} className="px-4 py-10">
                                <Empty title="No bookings" subtitle="Create a booking or adjust filters." />
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

            {tab === "events" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Event manifests" subtitle="Premium: many riders and bulk booking." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {events
                        .slice()
                        .sort((a, b) => a.startAt - b.startAt)
                        .map((e) => (
                          <div key={e.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{e.name}</div>
                                  <Pill label={fmtDate(e.startAt)} tone="neutral" />
                                  <Pill label={`${e.attendees.length} attendees`} tone="neutral" />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{fmtDateTime(e.startAt)} to {fmtDateTime(e.endAt)}</div>
                                <div className="mt-1 text-xs text-slate-500">Location: {e.location}</div>
                                {e.notes ? <div className="mt-2 text-xs text-slate-600">Notes: {e.notes}</div> : null}
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setBulkDraft((p) => ({ ...p, eventId: e.id, projectTag: e.name })); setBulkOpen(true); }}>
                                  <Users className="h-4 w-4" /> Bulk
                                </Button>
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    // open bookings filtered to this event
                                    setTab("bookings");
                                    setQ(e.name);
                                    toast({ title: "Filtered", message: "Showing related bookings.", kind: "info" });
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" /> Bookings
                                </Button>
                              </div>
                            </div>

                            <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                              <div className="font-semibold text-slate-900">Manifest</div>
                              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {e.attendees.slice(0, 6).map((a, idx) => (
                                  <div key={`${e.id}-a-${idx}`} className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2">
                                    <div className="text-xs font-semibold text-slate-800">{travelerLabel(a.type, a.id)}</div>
                                    <div className="flex items-center gap-2">
                                      {travelerVip(a.type, a.id) ? <Pill label="VIP" tone="info" /> : null}
                                      <Pill label={a.type} tone="neutral" />
                                    </div>
                                  </div>
                                ))}
                                {e.attendees.length > 6 ? <div className="text-xs text-slate-500">+{e.attendees.length - 6} more</div> : null}
                              </div>
                            </div>
                          </div>
                        ))}
                      {!events.length ? <Empty title="No events" subtitle="Add an event manifest first." /> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Peak-time preplanning" subtitle="Premium: detect peak times and suggest buffers." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Peak hour</div>
                          <div className="mt-1 text-xs text-slate-500">Computed from upcoming bookings by hour.</div>
                        </div>
                        <Pill label={`${peakHour.hour}:00 • ${peakHour.count} booking(s)`} tone={peakDetected ? "warn" : "neutral"} />
                      </div>

                      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                        {hourBuckets.map((c, h) => (
                          <div key={h} className="rounded-2xl border border-slate-200 bg-white p-2 text-center">
                            <div className="text-xs font-semibold text-slate-700">{h}</div>
                            <div className={cn("mt-2 h-2 rounded-full", c ? "bg-emerald-200" : "bg-slate-100")} style={{ width: "100%" }} />
                            <div className="mt-2 text-xs text-slate-500">{c}</div>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Smart suggestion: if booking at {peakHour.hour}:00, consider scheduling 15-30 minutes earlier and pre-assigning vehicles for event manifests.
                      </div>
                    </div>
                  </Section>

                  <Section title="VIP handling" subtitle="Policy exceptions with approvals." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">VIP exceptions</div>
                          <div className="mt-1 text-xs text-slate-500">Allow premium rides or after-hours for specific travelers.</div>
                        </div>
                        <Button variant="primary" onClick={() => setVipReqOpen(true)}>
                          <Crown className="h-4 w-4" /> Request
                        </Button>
                      </div>
                      <div className="mt-3 space-y-2">
                        {vipExceptions.slice(0, 5).map((x) => (
                          <div key={x.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={x.exceptionType} tone="neutral" />
                                  <Pill label={x.status} tone={approvalTone(x.status)} />
                                  <Pill label={`${fmtDate(x.validFrom)} → ${fmtDate(x.validTo)}`} tone="info" />
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{travelerLabel(x.travelerType, x.travelerId)}</div>
                                <div className="mt-1 text-xs text-slate-500">Requested by {x.requestedBy} • {x.reason}</div>
                              </div>
                              {x.approvalId ? <Pill label={x.approvalId} tone="neutral" /> : null}
                            </div>
                          </div>
                        ))}
                        {!vipExceptions.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No VIP exceptions.</div> : null}
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "recurring" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Recurring commutes" subtitle="Core: recurring schedules for office commute." right={<Pill label={`${recurring.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {recurring.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                                <Pill label={r.enabled ? "Enabled" : "Disabled"} tone={r.enabled ? "good" : "neutral"} />
                                <Pill label={`${r.timeLocal}`} tone="neutral" />
                                <Pill label={r.category} tone={r.category === "Premium" ? "info" : "neutral"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Days: {r.days.join(", ")}</div>
                              <div className="mt-1 text-xs text-slate-500">Route: {r.pickup} → {r.dropoff}</div>
                              <div className="mt-2 text-xs text-slate-600">Employees: {r.employees.map((id) => employeeById[id]?.name || id).join(", ")}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setRecurring((p) => p.map((x) => (x.id === r.id ? { ...x, enabled: !x.enabled } : x)));
                                  toast({ title: "Updated", message: "Recurring schedule updated.", kind: "success" });
                                }}
                              >
                                <Repeat className="h-4 w-4" /> Toggle
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  // simulate generating next instance booking(s)
                                  const nextAt = Date.now() + 2 * 24 * 60 * 60 * 1000;
                                  const [hh, mm] = r.timeLocal.split(":").map((x) => Number(x));
                                  const dt = new Date(nextAt);
                                  dt.setHours(hh || 0, mm || 0, 0, 0);
                                  const scheduledAt = dt.getTime();

                                  const gen: Booking[] = r.employees.map((eid) => {
                                    const emp = employeeById[eid];
                                    const flags: string[] = [];
                                    if (r.category === "Premium" && policy.premiumRequiresApproval) flags.push("Premium requested");
                                    if (isAfterHours(scheduledAt, policy.workStart, policy.workEnd)) flags.push("After-hours");
                                    if (emp?.vip) flags.push("VIP traveler");

                                    const needsApproval = flags.length > 0;

                                    return {
                                      id: uid("BK"),
                                      ref: makeRef("RC"),
                                      travelerType: "Employee",
                                      travelerId: eid,
                                      bookedBy: "Travel Coordinator",
                                      createdAt: Date.now(),
                                      scheduledAt,
                                      pickup: r.pickup,
                                      dropoff: r.dropoff,
                                      category: r.category,
                                      purpose: r.purpose,
                                      tags: r.tags,
                                      costCenter: emp?.costCenter || "OPS-001",
                                      projectTag: r.name,
                                      module: "Rides & Logistics",
                                      status: needsApproval ? "Pending approval" : "Confirmed",
                                      recurringId: r.id,
                                      vipRequested: !!emp?.vip,
                                      policyNotes: flags,
                                      proofs: [],
                                    };
                                  });

                                  setBookings((p) => [...gen, ...p]);
                                  const anyPending = gen.some((b) => b.status === "Pending approval");
                                  if (anyPending) {
                                    createApprovalRequest({
                                      scope: "Event",
                                      scopeId: r.id,
                                      createdBy: "Travel Coordinator",
                                      reason: "Recurring booking instance requires policy approval",
                                      flags: Array.from(new Set(gen.flatMap((b) => b.policyNotes))),
                                    });
                                  }

                                  toast({ title: "Generated", message: `Created ${gen.length} booking(s) from recurring schedule.`, kind: "success" });
                                  setTab("bookings");
                                }}
                              >
                                <Sparkles className="h-4 w-4" /> Generate
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!recurring.length ? <Empty title="No recurring schedules" subtitle="Create a recurring commute plan." /> : null}
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: smart scheduling can preplan around peak time and suggest alternate pickup windows.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Policy enforcement preview" subtitle="What would require approval." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">After-hours</div>
                            <div className="mt-1 text-xs text-slate-500">Outside {policy.workStart} to {policy.workEnd}</div>
                          </div>
                          <Pill label="Approval" tone="warn" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">
                          Best practice: require Manager and Finance approval; add CFO for VIP.
                        </div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Premium</div>
                            <div className="mt-1 text-xs text-slate-500">Premium category request</div>
                          </div>
                          <Pill label="Approval" tone="warn" />
                        </div>
                        <div className="mt-3 text-xs text-slate-600">
                          Best practice: allow premium for VIP only through approvals or VIP exception.
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Tip: Link enforcement to Approval Workflow Builder (J) for organization-wide consistency.
                    </div>
                  </Section>

                  <Section title="Recurring best practices" subtitle="Operational tips for commuting programs." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Start with a pilot group for commutes, then expand</li>
                        <li>2) Enforce purpose tagging and cost center</li>
                        <li>3) Prebook 15-30 minutes earlier during peak traffic</li>
                        <li>4) Maintain VIP exceptions for executives with audit trails</li>
                      </ul>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "vip" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-6 space-y-4">
                  <Section title="Visitors" subtitle="Core: visitor prebooking and host enforcement." right={<Pill label={`${visitors.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {visitors.map((v) => (
                        <div key={v.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{v.name}</div>
                                <Pill label={v.company} tone="neutral" />
                                {v.vip ? <Pill label="VIP" tone="info" /> : null}
                              </div>
                              <div className="mt-1 text-xs text-slate-500">Host: {employeeById[v.hostEmployeeId]?.name || v.hostEmployeeId}</div>
                              {v.phone ? <div className="mt-1 text-xs text-slate-500">Phone: {v.phone}</div> : null}
                            </div>
                            <Button
                              variant="primary"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setDraft((p) => ({
                                  ...p,
                                  travelerType: "Visitor",
                                  travelerId: v.id,
                                  pickup: "Entebbe Airport",
                                  dropoff: "Kampala HQ",
                                  category: v.vip ? "Premium" : "Standard",
                                  vipRequested: v.vip,
                                  purpose: "Visitor",
                                  projectTag: "Visitor transport",
                                  tags: v.vip ? "VIP,Airport" : "Visitor,Airport",
                                }));
                                setCreateStep(1);
                                setCreateOpen(true);
                              }}
                            >
                              <Car className="h-4 w-4" /> Book
                            </Button>
                          </div>
                        </div>
                      ))}
                      {!visitors.length ? <Empty title="No visitors" subtitle="Add visitors to enable pre-booking." /> : null}
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Tip: visitor bookings should always store host employee and trip purpose.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-6 space-y-4">
                  <Section title="VIP exceptions" subtitle="Premium: policy exceptions with approvals." right={<Pill label="Premium" tone="info" />}>
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
                                <Pill label={`${fmtDate(x.validFrom)} → ${fmtDate(x.validTo)}`} tone="info" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">{travelerLabel(x.travelerType, x.travelerId)}</div>
                              <div className="mt-1 text-xs text-slate-500">Requested by {x.requestedBy} • {x.reason}</div>
                              {x.approvalId ? <div className="mt-2 text-xs text-slate-500">Approval: {x.approvalId}</div> : null}
                            </div>
                            <Crown className={cn("h-5 w-5", x.status === "Approved" ? "text-amber-500" : "text-slate-300")} />
                          </div>
                        </div>
                      ))}
                      {!vipExceptions.length ? <Empty title="No VIP exceptions" subtitle="Request an exception to allow premium or after-hours travel." /> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "insights" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Peak time detection" subtitle="Premium: smart scheduling suggestions." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Peak hour</div>
                          <div className="mt-1 text-xs text-slate-500">Upcoming bookings by hour (0-23)</div>
                        </div>
                        <Pill label={`${peakHour.hour}:00 • ${peakHour.count}`} tone={peakDetected ? "warn" : "neutral"} />
                      </div>
                      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-12">
                        {hourBuckets.map((c, h) => (
                          <div key={h} className="rounded-2xl border border-slate-200 bg-white p-2 text-center">
                            <div className="text-xs font-semibold text-slate-700">{h}</div>
                            <div className={cn("mt-2 h-2 rounded-full", c ? "bg-emerald-200" : "bg-slate-100")} />
                            <div className="mt-2 text-xs text-slate-500">{c}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Suggestion: schedule event transfers 30 minutes earlier during peak hours and use bulk booking to reduce coordination load.
                      </div>
                    </div>
                  </Section>

                  <Section title="Recommendations" subtitle="Next best coordinator actions." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Reco
                        title="Bulk book your next event"
                        detail={upcomingEvents.length ? `Upcoming event: ${upcomingEvents[0].name} has ${upcomingEvents[0].attendees.length} attendee(s).` : "Create an event manifest to bulk book rides."}
                        cta="Bulk book"
                        onClick={() => setBulkOpen(true)}
                      />
                      <Reco
                        title="Resolve pending approvals"
                        detail={`There are ${pendingApprovalsCount} approval request(s) pending.`}
                        cta="Open approvals"
                        onClick={() => setTab("approvals")}
                      />
                      <Reco
                        title="Create a VIP exception"
                        detail="For recurring executive travel, create an approved VIP exception with audit trail."
                        cta="Request"
                        onClick={() => setVipReqOpen(true)}
                      />
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Program insights" subtitle="Policy compliance and quality indicators." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <Metric title="After-hours" value={`${bookings.filter((b) => isAfterHours(b.scheduledAt, policy.workStart, policy.workEnd)).length}`} sub="Bookings outside window" icon={<Timer className="h-5 w-5" />} tone="warn" />
                      <Metric title="Premium" value={`${bookings.filter((b) => b.category === "Premium").length}`} sub="Premium category" icon={<Crown className="h-5 w-5" />} tone="info" />
                      <Metric title="Purpose missing" value={`${bookings.filter((b) => b.purpose === "Other" && !b.purposeOther).length}`} sub="Should be 0" icon={<AlertTriangle className="h-5 w-5" />} tone="bad" />
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Premium: peak time detection can be expanded with traffic data and city events calendars.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "approvals" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Approvals" subtitle="VIP, premium, and after-hours exceptions." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Approvals are required before sending some bookings to dispatch.
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => setVipReqOpen(true)}>
                        <Crown className="h-4 w-4" /> VIP exception
                      </Button>
                      <Button variant="outline" onClick={() => toast({ title: "Tip", message: "Map these approvals to your global Approval Workflow Builder (J).", kind: "info" })}>
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
                                    {a.policyFlags.map((f, idx) => <Pill key={`${a.id}-pf-${idx}`} label={f} tone="neutral" />)}
                                  </div>
                                  {pending ? (
                                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                                      Next: <span className="font-semibold">{pending.role}</span> ({pending.assignee}) • SLA {pending.slaHours}h
                                    </div>
                                  ) : null}
                                </div>

                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => approveNextStep(a.id)} disabled={a.status !== "Pending"}>
                                    <Check className="h-4 w-4" /> Approve
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => rejectApproval(a.id)} disabled={a.status !== "Pending"}>
                                    <X className="h-4 w-4" /> Reject
                                  </Button>
                                  {a.scope === "Booking" ? (
                                    <Button
                                      variant="outline"
                                      className="px-3 py-2 text-xs"
                                      onClick={() => {
                                        openBooking(a.scopeId);
                                      }}
                                    >
                                      <ChevronRight className="h-4 w-4" /> Open booking
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
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              U Corporate Travel and Scheduling v2. Core: pre-book rides for visitors, events, recurring commutes; coordinator book-on-behalf tools; purpose tagging. Premium: event manifests and bulk booking, VIP exception approvals, and peak-time scheduling insights.
            </div>
          </footer>
        </div>
      </div>

      {/* Booking drawer */}
      <Drawer
        open={drawerOpen}
        title={activeBooking ? `${activeBooking.ref} • ${activeBooking.category}` : "Booking"}
        subtitle={activeBooking ? `${travelerLabel(activeBooking.travelerType, activeBooking.travelerId)} • ${fmtDateTime(activeBooking.scheduledAt)}` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          activeBooking ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">In production, this links to dispatch and driver assignment.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setBookings((p) => p.map((b) => (b.id === activeBooking.id ? { ...b, status: "Cancelled" } : b)));
                    toast({ title: "Cancelled", message: "Booking cancelled.", kind: "warn" });
                    setDrawerOpen(false);
                  }}
                  disabled={activeBooking.status === "Cancelled" || activeBooking.status === "Completed"}
                >
                  <X className="h-4 w-4" /> Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => {
                    // simulate completion
                    setBookings((p) => p.map((b) => (b.id === activeBooking.id ? { ...b, status: "Completed", proofs: [{ id: uid("AT"), name: "Trip receipt.pdf", note: "Receipt", addedAt: Date.now(), addedBy: "System" }, ...b.proofs] } : b)));
                    toast({ title: "Completed", message: "Booking marked completed.", kind: "success" });
                  }}
                  disabled={activeBooking.status !== "Confirmed"}
                  title={activeBooking.status !== "Confirmed" ? "Only confirmed bookings can complete" : ""}
                >
                  <Check className="h-4 w-4" /> Complete
                </Button>
              </div>
            </div>
          ) : null
        }
      >
        {activeBooking ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={activeBooking.status} tone={statusTone(activeBooking.status)} />
                    <Pill label={activeBooking.purpose === "Other" ? activeBooking.purposeOther || "Other" : activeBooking.purpose} tone="neutral" />
                    {travelerVip(activeBooking.travelerType, activeBooking.travelerId) ? <Pill label="VIP" tone="info" /> : null}
                    {activeBooking.category === "Premium" ? <Pill label="Premium" tone="info" /> : <Pill label="Standard" tone="neutral" />}
                  </div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">{travelerLabel(activeBooking.travelerType, activeBooking.travelerId)}</div>
                  {activeBooking.travelerType === "Visitor" ? <div className="mt-1 text-xs text-slate-500">Host: {hostNameForVisitor(activeBooking.travelerId)}</div> : null}
                  <div className="mt-2 text-xs text-slate-500">Booked by {activeBooking.bookedBy} • Created {timeAgo(activeBooking.createdAt)}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Scheduled</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{fmtDateTime(activeBooking.scheduledAt)}</div>
                  <div className="mt-2 text-xs text-slate-500">Cost center</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{activeBooking.costCenter}</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-600">Pickup</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{activeBooking.pickup}</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-3">
                  <div className="text-xs font-semibold text-slate-600">Drop-off</div>
                  <div className="mt-1 text-sm font-semibold text-slate-900">{activeBooking.dropoff}</div>
                </div>
              </div>

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                <div className="font-semibold text-slate-900">Tags</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {activeBooking.tags.length ? activeBooking.tags.map((t, idx) => <Pill key={`${activeBooking.id}-t-${idx}`} label={t} tone="neutral" />) : <Pill label="None" tone="neutral" />}
                </div>
                <div className="mt-3 text-xs text-slate-600">Project: {activeBooking.projectTag}</div>
              </div>

              {activeBooking.policyNotes.length ? (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  <div className="font-semibold">Policy notes</div>
                  <ul className="mt-2 space-y-1">
                    {activeBooking.policyNotes.map((n, idx) => (
                      <li key={`${activeBooking.id}-pn-${idx}`}>• {n}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <Section title="Proofs" subtitle="Receipts and completion logs." right={<Pill label={`${activeBooking.proofs.length}`} tone="neutral" />}>
              <div className="space-y-2">
                {activeBooking.proofs.map((p) => (
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
                {!activeBooking.proofs.length ? <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">No proofs yet.</div> : null}
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Create booking modal */}
      <Modal
        open={createOpen}
        title="New booking"
        subtitle="Coordinator booking on behalf. Purpose, tags, and policy enforcement are required."
        onClose={() => setCreateOpen(false)}
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
                {s === 0 ? "Traveler" : s === 1 ? "Trip details" : "Policy check"}
              </button>
            ))}
          </div>

          {createStep === 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Select
                label="Traveler type"
                value={draft.travelerType}
                onChange={(v) => setDraft((p) => ({ ...p, travelerType: v as TravelerType, travelerId: v === "Employee" ? employees[0]?.id || "" : visitors[0]?.id || "" }))}
                options={[{ value: "Employee", label: "Employee" }, { value: "Visitor", label: "Visitor" }]}
              />
              <Select
                label="Traveler"
                value={draft.travelerId}
                onChange={(v) => setDraft((p) => ({ ...p, travelerId: v }))}
                options={(draft.travelerType === "Employee" ? employees : visitors).map((t: any) => ({ value: t.id, label: t.name }))}
              />
              <Field label="Booked by" value={draft.bookedBy} onChange={(v) => setDraft((p) => ({ ...p, bookedBy: v }))} placeholder="Travel Coordinator" />
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">VIP</div>
                    <div className="mt-1 text-xs text-slate-600">Flag the booking as VIP handling.</div>
                  </div>
                  <button
                    type="button"
                    className={cn("relative h-7 w-12 rounded-full border transition", draft.vipRequested ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                    onClick={() => setDraft((p) => ({ ...p, vipRequested: !p.vipRequested }))}
                    aria-label="Toggle VIP"
                  >
                    <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", draft.vipRequested ? "left-[22px]" : "left-1")} />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {travelerVip(draft.travelerType, draft.travelerId) ? <Pill label="Traveler is VIP" tone="info" /> : <Pill label="Standard traveler" tone="neutral" />}
                  {draft.travelerType === "Visitor" ? <Pill label={`Host: ${hostNameForVisitor(draft.travelerId)}`} tone="neutral" /> : null}
                </div>
              </div>
            </div>
          ) : null}

          {createStep === 1 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Field label="Pickup" value={draft.pickup} onChange={(v) => setDraft((p) => ({ ...p, pickup: v }))} placeholder="Kampala HQ" />
              <Field label="Drop-off" value={draft.dropoff} onChange={(v) => setDraft((p) => ({ ...p, dropoff: v }))} placeholder="Entebbe Airport" />
              <Field
                label="Scheduled time"
                type="datetime-local"
                value={draft.scheduledAt}
                onChange={(v) => setDraft((p) => ({ ...p, scheduledAt: v }))}
                hint="Local time"
              />
              <Select
                label="Ride category"
                value={draft.category}
                onChange={(v) => setDraft((p) => ({ ...p, category: v as RideCategory }))}
                options={[{ value: "Standard", label: "Standard" }, { value: "Premium", label: "Premium" }]}
              />
              <Select
                label="Purpose"
                value={draft.purpose}
                onChange={(v) => setDraft((p) => ({ ...p, purpose: v as TripPurpose }))}
                options={PURPOSES.map((p) => ({ value: p, label: p }))}
              />
              <Field
                label="Tags"
                value={draft.tags}
                onChange={(v) => setDraft((p) => ({ ...p, tags: v }))}
                placeholder="Comma separated"
                hint="Example: Airport,VIP,Event"
              />
              <Field label="Cost center" value={draft.costCenter} onChange={(v) => setDraft((p) => ({ ...p, costCenter: v }))} placeholder="OPS-001" />
              <Field label="Project tag" value={draft.projectTag} onChange={(v) => setDraft((p) => ({ ...p, projectTag: v }))} placeholder="Roadshow" />
              <Select
                label="Module"
                value={draft.module}
                onChange={(v) => setDraft((p) => ({ ...p, module: v as ServiceModule }))}
                options={[
                  { value: "Rides & Logistics", label: "Rides & Logistics" },
                  { value: "Travel & Tourism", label: "Travel & Tourism" },
                  { value: "Other Service Module", label: "Other Service Module" },
                ]}
                hint="Typically Rides & Logistics"
              />
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
                  {policyCheckForDraft.needsApproval ? <Pill label="Approval required" tone="warn" /> : <Pill label="No approval" tone="good" />}
                </div>

                {policyCheckForDraft.errors.length ? (
                  <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                    <div className="font-semibold">Missing</div>
                    <ul className="mt-2 space-y-1">
                      {policyCheckForDraft.errors.map((e, idx) => (
                        <li key={`err-${idx}`}>• {e}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Scheduled</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{fmtDateTime(policyCheckForDraft.scheduledAt)}</div>
                    <div className="mt-1 text-xs text-slate-500">After-hours: {policyCheckForDraft.afterHours ? "Yes" : "No"}</div>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Category</div>
                    <div className="mt-1 text-sm font-semibold text-slate-900">{draft.category}</div>
                    <div className="mt-1 text-xs text-slate-500">VIP: {policyCheckForDraft.tVip || draft.vipRequested ? "Yes" : "No"}</div>
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  <div className="font-semibold text-slate-900">Flags</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {policyCheckForDraft.flags.length ? policyCheckForDraft.flags.map((f, idx) => <Pill key={`flag-${idx}`} label={f} tone={f.endsWith("required") ? "bad" : "neutral"} />) : <Pill label="None" tone="neutral" />}
                    {policyCheckForDraft.hasActiveVipException ? <Pill label="VIP exception active" tone="info" /> : null}
                  </div>
                </div>

                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  If approval is required, the booking will be created in Pending approval and routed to Manager then Finance, and optionally CFO for VIP or Premium.
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      {/* Bulk booking modal */}
      <Modal
        open={bulkOpen}
        title="Bulk event booking"
        subtitle="Premium: generate bookings for an event manifest (many riders)."
        onClose={() => setBulkOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={runBulkBooking}>
              <BadgeCheck className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Event"
            value={bulkDraft.eventId}
            onChange={(v) => setBulkDraft((p) => ({ ...p, eventId: v }))}
            options={events.map((e) => ({ value: e.id, label: `${e.name} (${fmtDate(e.startAt)})` }))}
          />
          <Select
            label="Category"
            value={bulkDraft.category}
            onChange={(v) => setBulkDraft((p) => ({ ...p, category: v as RideCategory }))}
            options={[{ value: "Standard", label: "Standard" }, { value: "Premium", label: "Premium" }]}
          />
          <Field label="Pickup" value={bulkDraft.pickup} onChange={(v) => setBulkDraft((p) => ({ ...p, pickup: v }))} />
          <Field label="Drop-off" value={bulkDraft.dropoff} onChange={(v) => setBulkDraft((p) => ({ ...p, dropoff: v }))} />
          <NumberField label="Minutes before event" value={bulkDraft.offsetMinsBeforeStart} onChange={(v) => setBulkDraft((p) => ({ ...p, offsetMinsBeforeStart: clamp(v, 0, 240) }))} hint="Departure buffer" />
          <Field label="Tags" value={bulkDraft.tags} onChange={(v) => setBulkDraft((p) => ({ ...p, tags: v }))} hint="Comma separated" />
          <Field label="Cost center" value={bulkDraft.costCenter} onChange={(v) => setBulkDraft((p) => ({ ...p, costCenter: v }))} />
          <Field label="Project tag" value={bulkDraft.projectTag} onChange={(v) => setBulkDraft((p) => ({ ...p, projectTag: v }))} />

          <div className="md:col-span-2">
            <Toggle
              enabled={bulkDraft.createReturn}
              onChange={(v) => setBulkDraft((p) => ({ ...p, createReturn: v }))}
              label="Create return trips"
              description="Generate return rides after the event ends."
            />
          </div>

          <Field label="Return pickup" value={bulkDraft.returnPickup} onChange={(v) => setBulkDraft((p) => ({ ...p, returnPickup: v }))} disabled={!bulkDraft.createReturn} />
          <Field label="Return drop-off" value={bulkDraft.returnDropoff} onChange={(v) => setBulkDraft((p) => ({ ...p, returnDropoff: v }))} disabled={!bulkDraft.createReturn} />
          <NumberField label="Minutes after event" value={bulkDraft.returnMinsAfterEnd} onChange={(v) => setBulkDraft((p) => ({ ...p, returnMinsAfterEnd: clamp(v, 0, 240) }))} disabled={!bulkDraft.createReturn} />

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Bulk booking uses the event manifest. If any generated booking violates policy (VIP, Premium, after-hours), an event-level approval request is created.
          </div>
        </div>
      </Modal>

      {/* VIP exception request modal */}
      <Modal
        open={vipReqOpen}
        title="Request VIP policy exception"
        subtitle="Premium: VIP handling with policy exceptions and approvals."
        onClose={() => setVipReqOpen(false)}
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
            label="Traveler type"
            value={vipReqDraft.travelerType}
            onChange={(v) => setVipReqDraft((p) => ({ ...p, travelerType: v as TravelerType, travelerId: v === "Employee" ? employees[0]?.id || "" : visitors[0]?.id || "" }))}
            options={[{ value: "Employee", label: "Employee" }, { value: "Visitor", label: "Visitor" }]}
          />
          <Select
            label="Traveler"
            value={vipReqDraft.travelerId}
            onChange={(v) => setVipReqDraft((p) => ({ ...p, travelerId: v }))}
            options={(vipReqDraft.travelerType === "Employee" ? employees : visitors).map((t: any) => ({ value: t.id, label: t.name }))}
          />
          <Select
            label="Exception type"
            value={vipReqDraft.exceptionType}
            onChange={(v) => setVipReqDraft((p) => ({ ...p, exceptionType: v as VipExceptionType }))}
            options={[
              { value: "Premium rides", label: "Premium rides" },
              { value: "After-hours", label: "After-hours" },
            ]}
          />
          <NumberField label="Valid days" value={vipReqDraft.validDays} onChange={(v) => setVipReqDraft((p) => ({ ...p, validDays: clamp(v, 1, 365) }))} hint="1 to 365" />
          <div className="md:col-span-2">
            <TextArea label="Reason" value={vipReqDraft.reason} onChange={(v) => setVipReqDraft((p) => ({ ...p, reason: v }))} placeholder="Explain the business justification" rows={4} />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Executive approval chain templates (CFO/CEO) can be applied for VIP exceptions in your workflow builder.
          </div>
        </div>
      </Modal>
    </div>
  );

  function Metric({ title, value, sub, icon, tone }: { title: string; value: string; sub: string; icon: React.ReactNode; tone: "neutral" | "good" | "warn" | "bad" | "info" }) {
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
