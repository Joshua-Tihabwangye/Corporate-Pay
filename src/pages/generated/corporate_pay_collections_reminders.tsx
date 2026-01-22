import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Globe,
  Info,
  LifeBuoy,
  Lock,
  Mail,
  MessageCircle,
  MessageSquare,
  MoreVertical,
  Plus,
  RefreshCcw,
  Save,
  Search,
  Shield,
  Smartphone,
  Sparkles,
  Timer,
  Unlock,
  Users,
  X,
  Pencil,
  Trash2,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type Channel = "Email" | "WhatsApp" | "WeChat" | "SMS";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type DunningTrigger = "Upcoming due" | "Overdue" | "Final notice";

type EnforcementAction = "None" | "Soft pause" | "Full stop";

type EscalationLevel = "Finance" | "CFO" | "EVzone Support";

type DeliveryStatus = "Queued" | "Delivered" | "Failed";

type DisputeStatus = "Open" | "In review" | "Resolved" | "Rejected";

type ContactRole = "AP" | "Finance" | "CFO" | "EVzone Support";

type Entity = {
  id: string;
  name: string;
  currency: "UGX" | "USD" | "EUR" | "CNY";
  vatEnabled: boolean;
  vatRatePct: number;
};

type InvoiceGroup = {
  id: string;
  name: string;
  entityId: string;
  apCode: string;
};

type Contact = {
  id: string;
  name: string;
  role: ContactRole;
  email: string;
  phone: string;
  channels: Record<Channel, boolean>;
};

type Invoice = {
  id: string;
  invoiceNo: string;
  entityId: string;
  invoiceGroupId: string;
  issueDate: number;
  dueDate: number;
  status: InvoiceStatus;
  total: number;
  paidAmount: number;
  balance: number;
  lastReminderAt?: number;
  openDisputes: number;
};

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  enabledChannels: Record<Channel, boolean>;
};

type DunningStage = {
  id: string;
  name: string;
  trigger: DunningTrigger;
  offsetDaysFromDue: number; // negative means before due
  templateId: string;
  channels: Record<Channel, boolean>;
  escalation: EscalationLevel;
  action: EnforcementAction;
  enabled: boolean;
};

type DeliveryLog = {
  id: string;
  createdAt: number;
  invoiceId: string;
  stageId: string;
  channel: Channel;
  to: string;
  status: DeliveryStatus;
  error?: string;
};

type EnforcementMode = "Active" | "Soft paused" | "Full stopped";

type EnforcementConfig = {
  enabled: boolean;
  softPauseAfterOverdueDays: number;
  fullStopAfterOverdueDays: number;
  finalNoticeAfterOverdueDays: number;
  autoReactivateAfterPayment: boolean;
  freezeAllServices: boolean; // risk control
  scope: "CorporatePay only" | "All services";
};

type Dispute = {
  id: string;
  invoiceId: string;
  status: DisputeStatus;
  createdAt: number;
  lastUpdatedAt: number;
  firstResponseAt?: number;
};

type DisputeSlaConfig = {
  firstResponseHours: number;
  resolutionHours: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type PivotDim = "Stage" | "Channel" | "Status" | "Escalation" | "Invoice";

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
  return Math.floor((a - b) / DAY);
}

function formatMoney(n: number, currency: string) {
  const v = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency, maximumFractionDigits: 0 }).format(v);
  } catch {
    return `${currency} ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
  }
}

function stableRand(key: string) {
  // deterministic pseudo-random in [0,1)
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
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
              <div className="flex items-center gap-1">
                {actions ? <ActionMenu actions={actions} /> : null}
                <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
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
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 16 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "fixed z-50 overflow-hidden border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]",
              "left-2 right-2 bottom-2 top-[12vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[680px]"
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

function channelIcon(c: Channel) {
  if (c === "Email") return <Mail className="h-4 w-4" />;
  if (c === "WhatsApp") return <MessageCircle className="h-4 w-4" />;
  if (c === "WeChat") return <Globe className="h-4 w-4" />;
  return <Smartphone className="h-4 w-4" />;
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
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500">{title}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
          <div className="mt-1 text-sm text-slate-600">{sub}</div>
        </div>
        <div className={cn("grid h-12 w-12 place-items-center rounded-2xl", bg)}>{icon}</div>
      </div>
    </div>
  );
}

function statusTone(s: string) {
  if (s === "Paid" || s === "Resolved") return "good" as const;
  if (s === "Overdue" || s === "Rejected") return "bad" as const;
  if (s === "Draft" || s === "Open" || s === "In review" || s === "Pending") return "warn" as const;
  if (s === "Sent") return "info" as const;
  return "neutral" as const;
}

function enforcementTone(s: EnforcementMode) {
  if (s === "Full stopped") return "bad" as const;
  if (s === "Soft paused") return "warn" as const;
  return "good" as const;
}

function predictedRiskTone(r: "Low" | "Medium" | "High") {
  if (r === "High") return "bad" as const;
  if (r === "Medium") return "warn" as const;
  return "good" as const;
}

function scoreToRisk(score: number): "Low" | "Medium" | "High" {
  if (score < 45) return "High";
  if (score < 75) return "Medium";
  return "Low";
}

function computeHealthScore(args: {
  maxOverdueDays: number;
  overdueBalanceBase: number;
  openDisputes: number;
  failedDeliveries: number;
  pendingFinalNotices: number;
}) {
  const { maxOverdueDays, overdueBalanceBase, openDisputes, failedDeliveries, pendingFinalNotices } = args;
  let score = 100;
  score -= clamp(maxOverdueDays * 3.2, 0, 55);
  score -= clamp(Math.log10(1 + overdueBalanceBase) * 9.5, 0, 22);
  score -= clamp(openDisputes * 6, 0, 20);
  score -= clamp(failedDeliveries * 2, 0, 10);
  score -= clamp(pendingFinalNotices * 8, 0, 16);
  return Math.round(clamp(score, 0, 100));
}

function evaluateEnforcement(invoices: Invoice[], cfg: EnforcementConfig, now: number) {
  const DAY = 24 * 60 * 60 * 1000;
  const unpaid = invoices.filter((i) => i.balance > 0 && i.status !== "Draft");

  const overdue = unpaid
    .map((i) => ({ inv: i, days: Math.max(0, Math.floor((now - i.dueDate) / DAY)) }))
    .filter((x) => x.days > 0);

  const maxOverdue = overdue.length ? Math.max(...overdue.map((x) => x.days)) : 0;
  const overdueCount = overdue.length;

  if (!cfg.enabled) {
    return {
      mode: "Active" as EnforcementMode,
      reason: "Enforcement disabled",
      maxOverdueDays: maxOverdue,
      overdueCount,
    };
  }

  if (cfg.freezeAllServices) {
    return {
      mode: "Full stopped" as EnforcementMode,
      reason: "Risk freeze enabled",
      maxOverdueDays: maxOverdue,
      overdueCount,
    };
  }

  if (maxOverdue >= cfg.fullStopAfterOverdueDays && overdueCount > 0) {
    return {
      mode: "Full stopped" as EnforcementMode,
      reason: `Overdue exceeded full stop threshold (${cfg.fullStopAfterOverdueDays} days)` ,
      maxOverdueDays: maxOverdue,
      overdueCount,
    };
  }

  if (maxOverdue >= cfg.softPauseAfterOverdueDays && overdueCount > 0) {
    return {
      mode: "Soft paused" as EnforcementMode,
      reason: `Overdue exceeded soft pause threshold (${cfg.softPauseAfterOverdueDays} days)` ,
      maxOverdueDays: maxOverdue,
      overdueCount,
    };
  }

  return {
    mode: "Active" as EnforcementMode,
    reason: "No enforcement triggers",
    maxOverdueDays: maxOverdue,
    overdueCount,
  };
}

function pickEscalationRecipients(level: EscalationLevel, contacts: Contact[]) {
  if (level === "Finance") return contacts.filter((c) => c.role === "Finance" || c.role === "AP");
  if (level === "CFO") return contacts.filter((c) => c.role === "CFO");
  return contacts.filter((c) => c.role === "EVzone Support");
}

export default function CorporatePayCollectionsRemindersEnforcementV2() {
  const CHANNELS: Channel[] = ["Email", "WhatsApp", "WeChat", "SMS"];

  const [now, setNow] = useState(() => Date.now());

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<"overview" | "dunning" | "reminders" | "enforcement" | "escalation" | "health">("overview");

  const [entities] = useState<Entity[]>(() => [
    { id: "ENT-UG", name: "Uganda HQ", currency: "UGX", vatEnabled: true, vatRatePct: 18 },
    { id: "ENT-CN", name: "China Branch", currency: "CNY", vatEnabled: true, vatRatePct: 13 },
  ]);

  const [invoiceGroups] = useState<InvoiceGroup[]>(() => [
    { id: "IG-MAIN-UG", name: "Main corporate", entityId: "ENT-UG", apCode: "ACME-MAIN" },
    { id: "IG-SALES-TRAVEL", name: "Sales travel", entityId: "ENT-UG", apCode: "ACME-SALES" },
    { id: "IG-CN-PROC", name: "China procurement", entityId: "ENT-CN", apCode: "CN-PROC" },
  ]);

  const entityById = useMemo(() => Object.fromEntries(entities.map((e) => [e.id, e])) as Record<string, Entity>, [entities]);
  const groupById = useMemo(() => Object.fromEntries(invoiceGroups.map((g) => [g.id, g])) as Record<string, InvoiceGroup>, [invoiceGroups]);

  const [contacts, setContacts] = useState<Contact[]>(() => [
    {
      id: "C-AP",
      name: "Accounts Payable",
      role: "AP",
      email: "ap@acme.com",
      phone: "+256 701 000 000",
      channels: { Email: true, WhatsApp: false, WeChat: false, SMS: true },
    },
    {
      id: "C-FIN",
      name: "Finance Desk",
      role: "Finance",
      email: "finance@acme.com",
      phone: "+256 700 000 000",
      channels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
    },
    {
      id: "C-CFO",
      name: "CFO",
      role: "CFO",
      email: "cfo@acme.com",
      phone: "+256 702 000 000",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
    },
    {
      id: "C-EVZ",
      name: "EVzone Support",
      role: "EVzone Support",
      email: "support@evzone.com",
      phone: "+256 703 000 000",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
    },
  ]);

  const DAY = 24 * 60 * 60 * 1000;

  const [invoices, setInvoices] = useState<Invoice[]>(() => [
    {
      id: "INV-0001",
      invoiceNo: "ACME-202601-1042",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: now - 9 * DAY,
      dueDate: now + 1 * DAY,
      status: "Sent",
      total: 16520000,
      paidAmount: 0,
      balance: 16520000,
      openDisputes: 1,
      lastReminderAt: now - 16 * 60 * 60 * 1000,
    },
    {
      id: "INV-0002",
      invoiceNo: "ACME-SALES-202512-0088",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-SALES-TRAVEL",
      issueDate: now - 42 * DAY,
      dueDate: now - 24 * DAY,
      status: "Overdue",
      total: 6136000,
      paidAmount: 0,
      balance: 6136000,
      openDisputes: 0,
      lastReminderAt: now - 2 * DAY,
    },
    {
      id: "INV-0003",
      invoiceNo: "ACME-202512-1038",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: now - 23 * DAY,
      dueDate: now - 16 * DAY,
      status: "Paid",
      total: 14396000,
      paidAmount: 14396000,
      balance: 0,
      openDisputes: 0,
      lastReminderAt: undefined,
    },
    {
      id: "INV-0004",
      invoiceNo: "ACME-CN-202512-0221",
      entityId: "ENT-CN",
      invoiceGroupId: "IG-CN-PROC",
      issueDate: now - 15 * DAY,
      dueDate: now - 7 * DAY,
      status: "Paid",
      total: 76840,
      paidAmount: 76840,
      balance: 0,
      openDisputes: 0,
    },
    {
      id: "INV-0005",
      invoiceNo: "ACME-202601-1043",
      entityId: "ENT-UG",
      invoiceGroupId: "IG-MAIN-UG",
      issueDate: now - 2 * DAY,
      dueDate: now + 6 * DAY,
      status: "Draft",
      total: 10748000,
      paidAmount: 0,
      balance: 10748000,
      openDisputes: 0,
    },
  ]);

  const [templates, setTemplates] = useState<Template[]>(() => [
    {
      id: "TPL-UPCOMING",
      name: "Upcoming due reminder",
      subject: "Upcoming invoice due: {invoiceNo}",
      body: "Hello {contactName}. Your invoice {invoiceNo} is due on {dueDate}. Amount due: {balance}. Please arrange payment to avoid service interruption.",
      enabledChannels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
    },
    {
      id: "TPL-OVERDUE",
      name: "Overdue notice",
      subject: "Overdue invoice: {invoiceNo}",
      body: "Hello {contactName}. Invoice {invoiceNo} is overdue. Balance: {balance}. Please pay immediately. Continued delinquency may pause services.",
      enabledChannels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
    },
    {
      id: "TPL-FINAL",
      name: "Final notice",
      subject: "Final notice: {invoiceNo}",
      body: "Hello {contactName}. Final notice for invoice {invoiceNo}. Balance: {balance}. Services may stop if payment is not received.",
      enabledChannels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
    },
  ]);

  const [stages, setStages] = useState<DunningStage[]>(() => [
    {
      id: "STG-1",
      name: "Upcoming due",
      trigger: "Upcoming due",
      offsetDaysFromDue: -2,
      templateId: "TPL-UPCOMING",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: false },
      escalation: "Finance",
      action: "None",
      enabled: true,
    },
    {
      id: "STG-2",
      name: "Overdue reminder",
      trigger: "Overdue",
      offsetDaysFromDue: 1,
      templateId: "TPL-OVERDUE",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
      escalation: "Finance",
      action: "Soft pause",
      enabled: true,
    },
    {
      id: "STG-3",
      name: "Final notice",
      trigger: "Final notice",
      offsetDaysFromDue: 7,
      templateId: "TPL-FINAL",
      channels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
      escalation: "CFO",
      action: "Full stop",
      enabled: true,
    },
    {
      id: "STG-4",
      name: "Escalate to EVzone support",
      trigger: "Final notice",
      offsetDaysFromDue: 14,
      templateId: "TPL-FINAL",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
      escalation: "EVzone Support",
      action: "Full stop",
      enabled: true,
    },
  ]);

  const [deliveries, setDeliveries] = useState<DeliveryLog[]>(() => []);

  const [enforcementCfg, setEnforcementCfg] = useState<EnforcementConfig>(() => ({
    enabled: true,
    softPauseAfterOverdueDays: 3,
    fullStopAfterOverdueDays: 10,
    finalNoticeAfterOverdueDays: 7,
    autoReactivateAfterPayment: true,
    freezeAllServices: false,
    scope: "CorporatePay only",
  }));

  const [disputeSlaCfg, setDisputeSlaCfg] = useState<DisputeSlaConfig>(() => ({
    firstResponseHours: 4,
    resolutionHours: 72,
  }));

  const [disputes, setDisputes] = useState<Dispute[]>(() => [
    {
      id: "DSP-010",
      invoiceId: "INV-0001",
      status: "In review",
      createdAt: now - 20 * 60 * 60 * 1000,
      lastUpdatedAt: now - 2 * 60 * 60 * 1000,
      firstResponseAt: now - 18 * 60 * 60 * 1000,
    },
    {
      id: "DSP-011",
      invoiceId: "INV-0002",
      status: "Open",
      createdAt: now - 9 * 60 * 60 * 1000,
      lastUpdatedAt: now - 9 * 60 * 60 * 1000,
    },
  ]);

  // Modals
  const [stageModalOpen, setStageModalOpen] = useState(false);
  const [stageDraft, setStageDraft] = useState<DunningStage>(() => ({
    id: "",
    name: "",
    trigger: "Overdue",
    offsetDaysFromDue: 1,
    templateId: "TPL-OVERDUE",
    channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
    escalation: "Finance",
    action: "Soft pause",
    enabled: true,
  }));

  const [templateModalOpen, setTemplateModalOpen] = useState(false);
  const [templateDraft, setTemplateDraft] = useState<Template>(() => ({
    id: "",
    name: "",
    subject: "",
    body: "",
    enabledChannels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
  }));

  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null);

  const [sendNowOpen, setSendNowOpen] = useState(false);
  const [sendNowDraft, setSendNowDraft] = useState<{ invoiceId: string; stageId: string; note: string }>({
    invoiceId: "INV-0001",
    stageId: "STG-2",
    note: "Manual reminder",
  });

  const [disputeSlaOpen, setDisputeSlaOpen] = useState(false);

  // Reminders table filters
  const [delQ, setDelQ] = useState("");
  const [delChannel, setDelChannel] = useState<"All" | Channel>("All");
  const [delStatus, setDelStatus] = useState<"All" | DeliveryStatus>("All");

  // Escalation routing
  const [escalationLadder, setEscalationLadder] = useState<Array<{ level: EscalationLevel; notify: Channel[] }>>(() => [
    { level: "Finance", notify: ["Email", "WhatsApp", "SMS"] },
    { level: "CFO", notify: ["Email", "WhatsApp", "SMS"] },
    { level: "EVzone Support", notify: ["Email", "WhatsApp"] },
  ]);

  // Helpers
  const activeInvoice = useMemo(() => (activeInvoiceId ? invoices.find((i) => i.id === activeInvoiceId) || null : null), [activeInvoiceId, invoices]);

  const unpaidInvoices = useMemo(() => invoices.filter((i) => i.balance > 0 && i.status !== "Draft"), [invoices]);

  const overdueInvoices = useMemo(() => {
    return invoices
      .filter((i) => i.balance > 0 && i.status !== "Draft")
      .map((i) => ({ inv: i, overdueDays: Math.max(0, Math.floor((now - i.dueDate) / DAY)) }))
      .filter((x) => x.overdueDays > 0)
      .sort((a, b) => b.overdueDays - a.overdueDays);
  }, [invoices, now]);

  const dueSoonInvoices = useMemo(() => {
    const dueSoonWindowDays = 3;
    return invoices
      .filter((i) => i.balance > 0 && i.status !== "Draft")
      .map((i) => ({ inv: i, daysToDue: Math.ceil((i.dueDate - now) / DAY) }))
      .filter((x) => x.daysToDue >= 0 && x.daysToDue <= dueSoonWindowDays)
      .sort((a, b) => a.daysToDue - b.daysToDue);
  }, [invoices, now]);

  const totalsByCurrency = useMemo(() => {
    const m: Record<string, { currency: string; total: number; balance: number; overdueBalance: number }> = {};
    for (const inv of invoices) {
      const cur = entityById[inv.entityId]?.currency || "UGX";
      m[cur] = m[cur] || { currency: cur, total: 0, balance: 0, overdueBalance: 0 };
      m[cur].total += inv.total;
      m[cur].balance += inv.balance;
      const overdueDays = Math.max(0, Math.floor((now - inv.dueDate) / DAY));
      if (inv.balance > 0 && inv.status !== "Draft" && overdueDays > 0) m[cur].overdueBalance += inv.balance;
    }
    return Object.values(m).sort((a, b) => b.balance - a.balance);
  }, [invoices, entityById, now]);

  const enforcement = useMemo(() => evaluateEnforcement(invoices, enforcementCfg, now), [invoices, enforcementCfg, now]);

  const finalNoticeCandidates = useMemo(() => {
    return overdueInvoices.filter((x) => x.overdueDays >= enforcementCfg.finalNoticeAfterOverdueDays).map((x) => x.inv.id);
  }, [overdueInvoices, enforcementCfg.finalNoticeAfterOverdueDays]);

  const deliverySummary = useMemo(() => {
    const out: Record<Channel, { delivered: number; failed: number; queued: number }> = {
      Email: { delivered: 0, failed: 0, queued: 0 },
      WhatsApp: { delivered: 0, failed: 0, queued: 0 },
      WeChat: { delivered: 0, failed: 0, queued: 0 },
      SMS: { delivered: 0, failed: 0, queued: 0 },
    };
    for (const d of deliveries) {
      if (d.status === "Delivered") out[d.channel].delivered += 1;
      if (d.status === "Failed") out[d.channel].failed += 1;
      if (d.status === "Queued") out[d.channel].queued += 1;
    }
    return out;
  }, [deliveries]);

  const disputeSla = useMemo(() => {
    const open = disputes.filter((d) => d.status === "Open" || d.status === "In review");
    const resolved = disputes.filter((d) => d.status === "Resolved" || d.status === "Rejected");

    const firstRespBreaches = open.filter((d) => {
      const ageHours = (now - d.createdAt) / (60 * 60 * 1000);
      const responded = !!d.firstResponseAt;
      if (responded) return false;
      return ageHours > disputeSlaCfg.firstResponseHours;
    });

    const resolutionBreaches = open.filter((d) => {
      const ageHours = (now - d.createdAt) / (60 * 60 * 1000);
      return ageHours > disputeSlaCfg.resolutionHours;
    });

    const complianceFirst = open.length ? Math.round(((open.length - firstRespBreaches.length) / open.length) * 100) : 100;
    const complianceResolution = open.length ? Math.round(((open.length - resolutionBreaches.length) / open.length) * 100) : 100;

    return {
      openCount: open.length,
      resolvedCount: resolved.length,
      firstRespBreaches,
      resolutionBreaches,
      complianceFirst,
      complianceResolution,
    };
  }, [disputes, disputeSlaCfg, now]);

  const failedDeliveryCount = useMemo(() => deliveries.filter((d) => d.status === "Failed").length, [deliveries]);

  const overdueBalanceBase = useMemo(() => {
    // base currency score uses UGX balances only in this demo
    const ugx = totalsByCurrency.find((x) => x.currency === "UGX");
    return ugx?.overdueBalance || 0;
  }, [totalsByCurrency]);

  const healthScore = useMemo(() => {
    const maxOverdueDays = enforcement.maxOverdueDays;
    const openDisputes = disputes.filter((d) => d.status === "Open" || d.status === "In review").length;
    const pendingFinalNotices = finalNoticeCandidates.length;
    return computeHealthScore({
      maxOverdueDays,
      overdueBalanceBase,
      openDisputes,
      failedDeliveries: failedDeliveryCount,
      pendingFinalNotices,
    });
  }, [enforcement.maxOverdueDays, disputes, finalNoticeCandidates.length, overdueBalanceBase, failedDeliveryCount]);

  const predictedRisk = useMemo(() => scoreToRisk(healthScore), [healthScore]);

  // Filter deliveries
  const filteredDeliveries = useMemo(() => {
    const q = delQ.trim().toLowerCase();
    return deliveries
      .filter((d) => (delChannel === "All" ? true : d.channel === delChannel))
      .filter((d) => (delStatus === "All" ? true : d.status === delStatus))
      .filter((d) => {
        if (!q) return true;
        const inv = invoices.find((x) => x.id === d.invoiceId);
        const stg = stages.find((s) => s.id === d.stageId);
        const blob = `${d.id} ${d.status} ${d.channel} ${d.to} ${inv?.invoiceNo || d.invoiceId} ${stg?.name || d.stageId}`.toLowerCase();
        return blob.includes(q);
      })
      .slice()
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [deliveries, delQ, delChannel, delStatus, invoices, stages]);

  // Functions
  const openInvoice = (id: string) => {
    setActiveInvoiceId(id);
    setInvoiceDrawerOpen(true);
  };

  const markPaid = (invoiceId: string) => {
    setInvoices((prev) =>
      prev.map((inv) => {
        if (inv.id !== invoiceId) return inv;
        return {
          ...inv,
          status: "Paid",
          paidAmount: inv.total,
          balance: 0,
        };
      })
    );

    toast({ title: "Payment recorded", message: "Invoice marked paid. Reactivation rules will apply.", kind: "success" });

    if (enforcementCfg.autoReactivateAfterPayment && enforcementCfg.freezeAllServices) {
      // auto-reactivation does not override freeze; user must unfreeze
      toast({ title: "Still frozen", message: "Risk freeze is enabled. Turn it off to reactivate services.", kind: "warn" });
    }
  };

  const interpolate = (tpl: Template, inv: Invoice, contact: Contact) => {
    const e = entityById[inv.entityId];
    const cur = e?.currency || "UGX";
    const map: Record<string, string> = {
      "{invoiceNo}": inv.invoiceNo,
      "{dueDate}": fmtDate(inv.dueDate),
      "{balance}": formatMoney(inv.balance, cur),
      "{contactName}": contact.name,
    };

    const replace = (s: string) => Object.keys(map).reduce((acc, k) => acc.split(k).join(map[k]), s);
    return { subject: replace(tpl.subject), body: replace(tpl.body) };
  };

  const addDeliveryIfMissing = (draft: Omit<DeliveryLog, "id">) => {
    const exists = deliveries.some((d) => d.invoiceId === draft.invoiceId && d.stageId === draft.stageId && d.channel === draft.channel);
    if (exists) return false;
    setDeliveries((prev) => [{ id: uid("DLV"), ...draft }, ...prev]);
    return true;
  };

  const simulateSend = (invoiceId: string, stageId: string, manualNote?: string) => {
    const inv = invoices.find((x) => x.id === invoiceId);
    const stage = stages.find((x) => x.id === stageId);
    if (!inv || !stage) return;

    if (!stage.enabled) {
      toast({ title: "Stage disabled", message: "Enable the stage to send.", kind: "warn" });
      return;
    }

    const tpl = templates.find((t) => t.id === stage.templateId);
    if (!tpl) {
      toast({ title: "Template missing", message: "Select a template for this stage.", kind: "warn" });
      return;
    }

    const recipients = pickEscalationRecipients(stage.escalation, contacts);
    if (!recipients.length) {
      toast({ title: "No recipients", message: "No contact found for the escalation level.", kind: "warn" });
      return;
    }

    const created = Date.now();

    let createdCount = 0;

    for (const channel of CHANNELS) {
      if (!stage.channels[channel]) continue;
      if (!tpl.enabledChannels[channel]) continue;

      // pick first recipient that supports the channel
      const r = recipients.find((c) => c.channels[channel]) || recipients[0];
      const to = channel === "Email" ? r.email : r.phone;

      const seed = `${invoiceId}-${stageId}-${channel}-${created}`;
      const p = stableRand(seed);

      const status: DeliveryStatus = p < 0.86 ? "Delivered" : "Failed";
      const error = status === "Failed" ? "Temporary delivery failure. Will retry." : undefined;

      const ok = addDeliveryIfMissing({ createdAt: created, invoiceId, stageId, channel, to, status, error });
      if (ok) createdCount += 1;
    }

    setInvoices((prev) => prev.map((x) => (x.id === invoiceId ? { ...x, lastReminderAt: created } : x)));

    toast({
      title: "Reminder sent",
      message: `${createdCount} delivery record(s) created${manualNote ? ` (${manualNote})` : ""}.`,
      kind: createdCount ? "success" : "info",
    });
  };

  const runDunningScheduler = () => {
    const nowTs = now;
    const eligibleInvoices = invoices.filter((i) => i.balance > 0 && i.status !== "Draft");
    const enabledStages = stages.filter((s) => s.enabled).slice().sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue);

    let fired = 0;

    for (const inv of eligibleInvoices) {
      for (const s of enabledStages) {
        const triggerAt = inv.dueDate + s.offsetDaysFromDue * DAY;
        if (nowTs < triggerAt) continue;

        // upcoming due should not send once invoice is already overdue
        if (s.trigger === "Upcoming due") {
          const overdueDays = Math.max(0, Math.floor((nowTs - inv.dueDate) / DAY));
          if (overdueDays > 0) continue;
        }

        simulateSend(inv.id, s.id);
        fired += 1;
      }
    }

    toast({ title: "Dunning run completed", message: `Evaluated ${eligibleInvoices.length} invoice(s). Stages checked: ${enabledStages.length}.`, kind: fired ? "success" : "info" });
  };

  const openNewStage = () => {
    setStageDraft({
      id: "",
      name: "New stage",
      trigger: "Overdue",
      offsetDaysFromDue: 1,
      templateId: templates[0]?.id || "TPL-OVERDUE",
      channels: { Email: true, WhatsApp: true, WeChat: false, SMS: true },
      escalation: "Finance",
      action: "Soft pause",
      enabled: true,
    });
    setStageModalOpen(true);
  };

  const openEditStage = (s: DunningStage) => {
    setStageDraft(JSON.parse(JSON.stringify(s)));
    setStageModalOpen(true);
  };

  const saveStage = () => {
    if (!stageDraft.name.trim()) {
      toast({ title: "Missing name", message: "Stage name is required.", kind: "warn" });
      return;
    }
    const id = stageDraft.id || uid("STG");
    const row: DunningStage = { ...stageDraft, id };
    setStages((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...prev];
    });
    setStageModalOpen(false);
    toast({ title: "Saved", message: "Dunning stage saved.", kind: "success" });
  };

  const deleteStage = (id: string) => {
    setStages((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Stage removed.", kind: "info" });
  };

  const openNewTemplate = () => {
    setTemplateDraft({
      id: "",
      name: "New template",
      subject: "Reminder: {invoiceNo}",
      body: "Hello {contactName}. Invoice {invoiceNo} is due on {dueDate}. Balance: {balance}.",
      enabledChannels: { Email: true, WhatsApp: true, WeChat: true, SMS: true },
    });
    setTemplateModalOpen(true);
  };

  const openEditTemplate = (t: Template) => {
    setTemplateDraft(JSON.parse(JSON.stringify(t)));
    setTemplateModalOpen(true);
  };

  const saveTemplate = () => {
    if (!templateDraft.name.trim()) {
      toast({ title: "Missing name", message: "Template name is required.", kind: "warn" });
      return;
    }
    const id = templateDraft.id || uid("TPL");
    const row: Template = { ...templateDraft, id };
    setTemplates((prev) => {
      const idx = prev.findIndex((x) => x.id === id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = row;
        return next;
      }
      return [row, ...prev];
    });
    setTemplateModalOpen(false);
    toast({ title: "Saved", message: "Template saved.", kind: "success" });
  };

  const deleteTemplate = (id: string) => {
    const used = stages.some((s) => s.templateId === id);
    if (used) {
      toast({ title: "Blocked", message: "Template is used by a stage.", kind: "warn" });
      return;
    }
    setTemplates((prev) => prev.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Template removed.", kind: "info" });
  };

  const exportDeliveriesCSV = () => {
    const rows = filteredDeliveries.map((d) => {
      const inv = invoices.find((x) => x.id === d.invoiceId);
      const stg = stages.find((s) => s.id === d.stageId);
      return {
        id: d.id,
        createdAt: fmtDateTime(d.createdAt),
        invoiceNo: inv?.invoiceNo || d.invoiceId,
        stage: stg?.name || d.stageId,
        channel: d.channel,
        to: d.to,
        status: d.status,
        error: d.error || "",
      };
    });

    const head = ["id", "createdAt", "invoiceNo", "stage", "channel", "to", "status", "error"].join(",");
    const esc = (s: any) => {
      const v = String(s ?? "");
      if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
      return v;
    };
    const body = rows.map((r) => [r.id, r.createdAt, r.invoiceNo, r.stage, r.channel, r.to, r.status, r.error].map(esc).join(",")).join("\n");
    const csv = `${head}\n${body}`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "collections-delivery-logs.csv";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", message: "Delivery logs CSV downloaded.", kind: "success" });
  };

  const exportConfigJSON = async () => {
    const payload = {
      enforcementCfg,
      disputeSlaCfg,
      escalationLadder,
      stages,
      templates,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "corporatepay-collections-config.json";
    a.click();
    URL.revokeObjectURL(url);

    toast({ title: "Exported", message: "Collections config JSON downloaded.", kind: "success" });
  };

  // UI
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
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Collections, Reminders and Enforcement</div>
                  <div className="mt-1 text-xs text-slate-500">Automated dunning, multi-channel reminders, service suspension, reactivation, escalation routing, and billing dispute SLAs.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Enforcement: ${enforcement.mode}`} tone={enforcementTone(enforcement.mode)} />
                    <Pill label={`Predicted risk: ${predictedRisk}`} tone={predictedRiskTone(predictedRisk)} />
                    <Pill label={`Health: ${healthScore}/100`} tone={healthScore >= 75 ? "good" : healthScore >= 45 ? "warn" : "bad"} />
                    <Pill label={`Disputes SLA: ${disputeSla.complianceFirst}% first response`} tone={disputeSla.complianceFirst >= 90 ? "good" : "warn"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setNow(Date.now())}>
                  <RefreshCcw className="h-4 w-4" /> Refresh time
                </Button>
                <Button variant="outline" onClick={runDunningScheduler}>
                  <Timer className="h-4 w-4" /> Run scheduler
                </Button>
                <Button
                  variant={enforcementCfg.freezeAllServices ? "danger" : "outline"}
                  onClick={() => {
                    setEnforcementCfg((p) => ({ ...p, freezeAllServices: !p.freezeAllServices }));
                    toast({
                      title: enforcementCfg.freezeAllServices ? "Freeze disabled" : "Freeze enabled",
                      message: enforcementCfg.freezeAllServices ? "Services can resume if no overdue triggers." : "CorporatePay is frozen until disabled.",
                      kind: enforcementCfg.freezeAllServices ? "info" : "warn",
                    });
                  }}
                >
                  {enforcementCfg.freezeAllServices ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />} Freeze
                </Button>
                <Button variant="outline" onClick={() => setSendNowOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Send now
                </Button>
                <Button variant="outline" onClick={exportConfigJSON}>
                  <Download className="h-4 w-4" /> Export config
                </Button>
              </div>
            </div>

            {/* KPI grid */}
            <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Metric
                title="Outstanding"
                value={totalsByCurrency.map((x) => formatMoney(x.balance, x.currency)).join(" • ")}
                sub="All invoices"
                icon={<BarChart3 className="h-5 w-5" />}
                tone={totalsByCurrency.some((x) => x.balance > 0) ? "neutral" : "good"}
              />
              <Metric
                title="Overdue invoices"
                value={`${overdueInvoices.length}`}
                sub={overdueInvoices.length ? `Max ${enforcement.maxOverdueDays} day(s)` : "No overdue"}
                icon={<AlertTriangle className="h-5 w-5" />}
                tone={overdueInvoices.length ? "bad" : "good"}
              />
              <Metric
                title="Due soon"
                value={`${dueSoonInvoices.length}`}
                sub="Within 3 days"
                icon={<CalendarClock className="h-5 w-5" />}
                tone={dueSoonInvoices.length ? "warn" : "good"}
              />
              <Metric
                title="Pending final notices"
                value={`${finalNoticeCandidates.length}`}
                sub={`Threshold ${enforcementCfg.finalNoticeAfterOverdueDays} day(s)`}
                icon={<Shield className="h-5 w-5" />}
                tone={finalNoticeCandidates.length ? "warn" : "good"}
              />
              <Metric
                title="Delivery failures"
                value={`${failedDeliveryCount}`}
                sub="Across channels"
                icon={<MessageSquare className="h-5 w-5" />}
                tone={failedDeliveryCount ? "warn" : "good"}
              />
              <Metric
                title="Disputes"
                value={`${disputeSla.openCount} open`}
                sub={`${disputeSla.complianceResolution}% resolution SLA`}
                icon={<LifeBuoy className="h-5 w-5" />}
                tone={disputeSla.openCount ? "warn" : "good"}
              />
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "dunning", label: "Dunning schedules" },
                { id: "reminders", label: "Reminders and logs" },
                { id: "enforcement", label: "Enforcement" },
                { id: "escalation", label: "Escalation routing" },
                { id: "health", label: "Health and SLA" },
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
              <div className="flex flex-col gap-6">
                {/* 1. Collections Queue */}
                <Section
                  title="Collections queue"
                  subtitle="Prioritize overdue items and upcoming due reminders."
                  right={
                    <Pill
                      label={`${unpaidInvoices.length} unpaid`}
                      tone={unpaidInvoices.length ? "warn" : "good"}
                    />
                  }
                >
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                    <table className="min-w-full text-left text-sm">
                      <thead className="bg-slate-50 text-xs text-slate-600">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Invoice</th>
                          <th className="px-4 py-3 font-semibold">Entity</th>
                          <th className="px-4 py-3 font-semibold">Group</th>
                          <th className="px-4 py-3 font-semibold">Due</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold">Balance</th>
                          <th className="px-4 py-3 font-semibold">Reminders</th>
                          <th className="px-4 py-3 font-semibold">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoices
                          .filter((i) => i.balance > 0 && i.status !== "Draft")
                          .slice()
                          .sort((a, b) => {
                            const ao = Math.max(0, Math.floor((now - a.dueDate) / DAY));
                            const bo = Math.max(0, Math.floor((now - b.dueDate) / DAY));
                            return bo - ao;
                          })
                          .map((i) => {
                            const e = entityById[i.entityId];
                            const g = groupById[i.invoiceGroupId];
                            const overdueDays = Math.max(
                              0,
                              Math.floor((now - i.dueDate) / DAY)
                            );
                            const dueTone =
                              overdueDays >= enforcementCfg.fullStopAfterOverdueDays
                                ? "bad"
                                : overdueDays >=
                                  enforcementCfg.softPauseAfterOverdueDays
                                ? "warn"
                                : "neutral";
                            const cur = e?.currency || "UGX";

                            return (
                              <tr
                                key={i.id}
                                className="border-t border-slate-100 hover:bg-slate-50/60"
                              >
                                <td className="px-4 py-3">
                                  <div className="font-semibold text-slate-900">
                                    {i.invoiceNo}
                                  </div>
                                  <div className="mt-1 text-xs text-slate-500">
                                    {i.id}
                                  </div>
                                  {i.openDisputes ? (
                                    <div className="mt-2">
                                      <Pill
                                        label={`${i.openDisputes} dispute`}
                                        tone="warn"
                                      />
                                    </div>
                                  ) : null}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {e?.name || i.entityId}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {g?.name || i.invoiceGroupId}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-col gap-1">
                                    <Pill label={fmtDate(i.dueDate)} tone={dueTone} />
                                    <div className="text-xs text-slate-500">
                                      {overdueDays > 0
                                        ? `${overdueDays} day(s) overdue`
                                        : `${Math.max(
                                            0,
                                            Math.ceil((i.dueDate - now) / DAY)
                                          )} day(s) to due`}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3">
                                  <Pill
                                    label={i.status}
                                    tone={statusTone(i.status)}
                                  />
                                </td>
                                <td className="px-4 py-3 font-semibold text-slate-900">
                                  {formatMoney(i.balance, cur)}
                                </td>
                                <td className="px-4 py-3 text-slate-700">
                                  {i.lastReminderAt ? (
                                    <div>
                                      <div className="text-xs text-slate-500">
                                        Last
                                      </div>
                                      <div className="text-sm font-semibold text-slate-900">
                                        {timeAgo(i.lastReminderAt)}
                                      </div>
                                    </div>
                                  ) : (
                                    <Pill label="None" tone="neutral" />
                                  )}
                                </td>
                                <td className="px-4 py-3">
                                  <div className="flex justify-end">
                                    <ActionMenu
                                      actions={[
                                        {
                                          label: "Open invoice",
                                          icon: <ChevronRight className="h-4 w-4" />,
                                          onClick: () => openInvoice(i.id),
                                        },
                                        {
                                          label: "Send reminder",
                                          icon: <Sparkles className="h-4 w-4" />,
                                          onClick: () => {
                                            setSendNowDraft({
                                              invoiceId: i.id,
                                              stageId: stages[0]?.id || "STG-1",
                                              note: "Manual",
                                            });
                                            setSendNowOpen(true);
                                          },
                                        },
                                        {
                                          label: "Mark as paid",
                                          icon: <Check className="h-4 w-4" />,
                                          onClick: () => markPaid(i.id),
                                        },
                                      ]}
                                    />
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        {!unpaidInvoices.length ? (
                          <tr>
                            <td
                              colSpan={8}
                              className="px-4 py-12 text-center text-sm text-slate-600"
                            >
                              No unpaid invoices.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Core: upcoming due, overdue, and final notice reminders.
                    Premium: escalation routing and health score.
                  </div>
                </Section>

                {/* 2. Enforcement Summary */}
                <Section
                  title="Enforcement summary"
                  subtitle="Service suspension rules and reactivation after payment."
                  right={
                    <Pill
                      label={enforcement.mode}
                      tone={enforcementTone(enforcement.mode)}
                    />
                  }
                >
                  <div
                    className={cn(
                      "rounded-3xl border p-4",
                      enforcement.mode === "Full stopped"
                        ? "border-rose-200 bg-rose-50"
                        : enforcement.mode === "Soft paused"
                        ? "border-amber-200 bg-amber-50"
                        : "border-emerald-200 bg-emerald-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {enforcement.mode}
                        </div>
                        <div className="mt-1 text-xs text-slate-700">
                          {enforcement.reason}
                        </div>
                        <div className="mt-2 text-xs text-slate-700">
                          Scope:{" "}
                          <span className="font-semibold">
                            {enforcementCfg.scope}
                          </span>
                        </div>
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/60 text-slate-700 ring-1 ring-slate-200">
                        <Shield className="h-5 w-5" />
                      </div>
                    </div>

                    <div className="mt-3 text-xs text-slate-700">
                      Soft pause: CorporatePay is paused and users may be prompted
                      to pay first.
                      <br />
                      Full stop: corporate-funded services are stopped until
                      compliant.
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2">
                    <Toggle
                      enabled={enforcementCfg.enabled}
                      onChange={(v) =>
                        setEnforcementCfg((p) => ({ ...p, enabled: v }))
                      }
                      label="Enable enforcement"
                      description="Applies suspension rules based on overdue and risk controls."
                    />
                    <Toggle
                      enabled={enforcementCfg.autoReactivateAfterPayment}
                      onChange={(v) =>
                        setEnforcementCfg((p) => ({
                          ...p,
                          autoReactivateAfterPayment: v,
                        }))
                      }
                      label="Auto-reactivate after payment"
                      description="When balances are cleared, services can resume automatically."
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setTab("enforcement")}
                    >
                      <ChevronRight className="h-4 w-4" /> Configure
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (enforcementCfg.freezeAllServices) {
                          setEnforcementCfg((p) => ({
                            ...p,
                            freezeAllServices: false,
                          }));
                          toast({
                            title: "Freeze disabled",
                            message: "Enforcement can now resume normal evaluation.",
                            kind: "info",
                          });
                        } else {
                          toast({
                            title: "Not frozen",
                            message: "Risk freeze is not enabled.",
                            kind: "info",
                          });
                        }
                      }}
                    >
                      <Unlock className="h-4 w-4" /> Unfreeze
                    </Button>
                  </div>
                </Section>

                {/* 3. Channel Delivery Health */}
                <Section
                  title="Channel delivery health"
                  subtitle="Delivery status per channel with logs."
                  right={
                    <Button
                      variant="outline"
                      onClick={() => setTab("reminders")}
                    >
                      <ChevronRight className="h-4 w-4" /> Open logs
                    </Button>
                  }
                >
                  <div className="grid grid-cols-1 gap-4">
                    {CHANNELS.map((c) => (
                      <div
                        key={c}
                        className="rounded-3xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                              <span className="text-slate-600">
                                {channelIcon(c)}
                              </span>{" "}
                              {c}
                            </div>
                            <div className="mt-2 text-xs text-slate-500">
                              Delivered
                            </div>
                            <div className="mt-1 text-lg font-semibold text-slate-900">
                              {deliverySummary[c].delivered}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Pill
                              label={`Failed ${deliverySummary[c].failed}`}
                              tone={
                                deliverySummary[c].failed ? "warn" : "good"
                              }
                            />
                            <Pill
                              label={`Queued ${deliverySummary[c].queued}`}
                              tone="neutral"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>

                {/* 4. Escalation Ladder */}
                <Section
                  title="Escalation ladder"
                  subtitle="Premium: finance to CFO to EVzone support."
                  right={<Pill label="Premium" tone="info" />}
                >
                  <div className="space-y-4">
                    {escalationLadder.map((e, idx) => (
                      <div
                        key={e.level}
                        className="rounded-3xl border border-slate-200 bg-white p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              Step {idx + 1}: {e.level}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              Notify: {e.notify.join(", ")}
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {pickEscalationRecipients(
                                e.level,
                                contacts
                              )
                                .slice(0, 3)
                                .map((c) => (
                                  <Pill
                                    key={c.id}
                                    label={c.name}
                                    tone="neutral"
                                  />
                                ))}
                              {!pickEscalationRecipients(e.level, contacts)
                                .length ? (
                                <Pill label="No contacts" tone="warn" />
                              ) : null}
                            </div>
                          </div>
                          <Sparkles className="h-5 w-5 text-emerald-700" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Escalation routing can be customized per stage in the
                    Escalation tab.
                  </div>
                </Section>
              </div>
            ) : null}

            {tab === "dunning" ? (
              <div className="flex flex-col-reverse gap-4">
                <div className="space-y-4">
                  <Section
                    title="Dunning schedules"
                    subtitle="Upcoming due, overdue, and final notice. Configure channels and actions per stage."
                    right={
                      <div className="flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={openNewTemplate}>
                          <Plus className="h-4 w-4" /> Template
                        </Button>
                        <Button variant="primary" onClick={openNewStage}>
                          <Plus className="h-4 w-4" /> Stage
                        </Button>
                      </div>
                    }
                  >
                    <div className="space-y-2">
                      {stages
                        .slice()
                        .sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue)
                        .map((s) => {
                          const tpl = templates.find((t) => t.id === s.templateId);
                          return (
                            <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                    <Pill label={s.trigger} tone="neutral" />
                                    <Pill label={`Offset ${s.offsetDaysFromDue}d`} tone="info" />
                                    <Pill label={s.escalation} tone={s.escalation === "EVzone Support" ? "warn" : "neutral"} />
                                    <Pill label={s.action} tone={s.action === "Full stop" ? "bad" : s.action === "Soft pause" ? "warn" : "neutral"} />
                                    <Pill label={s.enabled ? "Enabled" : "Off"} tone={s.enabled ? "good" : "neutral"} />
                                  </div>
                                  <div className="mt-2 text-xs text-slate-600">Template: <span className="font-semibold">{tpl?.name || s.templateId}</span></div>
                                  <div className="mt-2 flex flex-wrap gap-2">
                                    {CHANNELS.map((c) => (
                                      <Pill key={c} label={c} tone={s.channels[c] ? "good" : "neutral"} />
                                    ))}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditStage(s)}>
                                    <Pencil className="h-4 w-4" /> Edit
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => setStages((p) => p.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)))}
                                  >
                                    {s.enabled ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} {s.enabled ? "Disable" : "Enable"}
                                  </Button>
                                  <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteStage(s.id)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {!stages.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No stages configured.</div>
                      ) : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Best practice: ensure final notice includes all channels and escalates to CFO. EVzone support escalation is optional.
                    </div>
                  </Section>

                  <Section title="Templates" subtitle="Premium: templates can be branded and channel-aware." right={<Pill label={`${templates.length}`} tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {templates.map((t) => (
                        <div key={t.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                              <div className="mt-1 text-xs text-slate-500">{t.id}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {CHANNELS.map((c) => (
                                  <Pill key={c} label={c} tone={t.enabledChannels[c] ? "good" : "neutral"} />
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditTemplate(t)}>
                                <Pencil className="h-4 w-4" /> Edit
                              </Button>
                              <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteTemplate(t.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                            <div className="font-semibold">Subject</div>
                            <div className="mt-1 text-slate-700">{t.subject}</div>
                            <div className="mt-3 font-semibold">Body</div>
                            <div className="mt-1 text-slate-700">{t.body}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                <div className="space-y-4">
                  <Section title="Runbook" subtitle="How dunning is executed." right={<Pill label="Core" tone="neutral" /> }>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Scheduler checks invoices and stage trigger times</li>
                        <li>2) Stage channels send to escalation recipients</li>
                        <li>3) Delivery logs are recorded per channel</li>
                        <li>4) Enforcement evaluates overdue thresholds and risk freeze</li>
                        <li>5) Payment triggers reactivation when configured</li>
                      </ul>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={runDunningScheduler}>
                        <Timer className="h-4 w-4" /> Run scheduler
                      </Button>
                      <Button variant="outline" onClick={() => setSendNowOpen(true)}>
                        <Sparkles className="h-4 w-4" /> Send now
                      </Button>
                    </div>
                  </Section>

                  <Section title="Enforcement mapping" subtitle="Soft pause vs full stop per stage." right={<Pill label="Premium" tone="info" /> }>
                    <div className="space-y-2">
                      {stages
                        .slice()
                        .sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue)
                        .map((s) => (
                          <div key={s.id} className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900">{s.name}</div>
                                <div className="mt-0.5 text-xs text-slate-500">Action: {s.action}</div>
                              </div>
                              <Pill label={s.action} tone={s.action === "Full stop" ? "bad" : s.action === "Soft pause" ? "warn" : "neutral"} />
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: enforcement is also driven by global thresholds in the Enforcement tab.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "reminders" ? (
              <div className="flex flex-col gap-4">
                <div className="space-y-4">
                  <Section title="Filters" subtitle="Search delivery logs." right={<Pill label="Core" tone="neutral" /> }>
                    <Field label="Search" value={delQ} onChange={setDelQ} placeholder="invoice, stage, to..." />
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <Select
                        label="Channel"
                        value={delChannel}
                        onChange={(v) => setDelChannel(v as any)}
                        options={[{ value: "All", label: "All" }, ...CHANNELS.map((c) => ({ value: c, label: c }))]}
                      />
                      <Select
                        label="Status"
                        value={delStatus}
                        onChange={(v) => setDelStatus(v as any)}
                        options={[{ value: "All", label: "All" }, { value: "Delivered", label: "Delivered" }, { value: "Failed", label: "Failed" }, { value: "Queued", label: "Queued" }]}
                      />
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={exportDeliveriesCSV}>
                        <Download className="h-4 w-4" /> Export CSV
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDelQ("");
                          setDelChannel("All");
                          setDelStatus("All");
                          toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                        }}
                      >
                        <Filter className="h-4 w-4" /> Reset
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Delivery logs show per-channel status for Email, WhatsApp, WeChat, and SMS.
                    </div>
                  </Section>

                  <Section title="Channel health" subtitle="Delivery status summary." right={<Pill label="Premium" tone="info" /> }>
                    <div className="space-y-2">
                      {CHANNELS.map((c) => (
                        <div key={c} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                                <span className="text-slate-600">{channelIcon(c)}</span> {c}
                              </div>
                              <div className="mt-2 text-xs text-slate-500">Delivered</div>
                              <div className="mt-1 text-lg font-semibold text-slate-900">{deliverySummary[c].delivered}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Pill label={`Failed ${deliverySummary[c].failed}`} tone={deliverySummary[c].failed ? "warn" : "good"} />
                              <Pill label={`Queued ${deliverySummary[c].queued}`} tone="neutral" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </div>

                <div className="space-y-4">
                  <Section
                    title="Delivery logs"
                    subtitle="Audit-ready logs per channel."
                    right={<Pill label={`${filteredDeliveries.length}`} tone="neutral" />}
                  >
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Invoice</th>
                            <th className="px-4 py-3 font-semibold">Stage</th>
                            <th className="px-4 py-3 font-semibold">Channel</th>
                            <th className="px-4 py-3 font-semibold">To</th>
                            <th className="px-4 py-3 font-semibold">Status</th>
                            <th className="px-4 py-3 font-semibold">Details</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredDeliveries.map((d) => {
                            const inv = invoices.find((x) => x.id === d.invoiceId);
                            const stg = stages.find((s) => s.id === d.stageId);
                            return (
                              <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 text-slate-700">{fmtDateTime(d.createdAt)}</td>
                                <td className="px-4 py-3">
                                  <button className="text-left" onClick={() => inv && openInvoice(inv.id)}>
                                    <div className="font-semibold text-slate-900">{inv?.invoiceNo || d.invoiceId}</div>
                                    <div className="mt-1 text-xs text-slate-500">{inv?.status || "-"}</div>
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{stg?.name || d.stageId}</td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center gap-2 text-slate-700">
                                    <span className="text-slate-600">{channelIcon(d.channel)}</span>
                                    {d.channel}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-700">{d.to}</td>
                                <td className="px-4 py-3"><Pill label={d.status} tone={d.status === "Delivered" ? "good" : d.status === "Failed" ? "warn" : "neutral"} /></td>
                                <td className="px-4 py-3 text-slate-700">{d.error || "-"}</td>
                              </tr>
                            );
                          })}
                          {!filteredDeliveries.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-600">No delivery logs.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: failed deliveries can trigger escalation routing and alternate channels.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "enforcement" ? (
              <div className="flex flex-col-reverse gap-4">
                <div className="space-y-4">
                   <Section 
                    title="Simulation" 
                    subtitle="Preview enforcement actions."
                    right={
                      <Button variant="outline" onClick={() => toast({ title: "Simulation", message: "Preview updated.", kind: "info" })}>
                        <RefreshCcw className="h-4 w-4" /> Run
                      </Button>
                    }
                  >
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      {(() => {
                        const sim = evaluateEnforcement(invoices, enforcementCfg, now);
                        return (
                          <div className="flex items-start gap-4">
                            <div className={cn("grid h-10 w-10 place-items-center rounded-2xl bg-slate-50", enforcementTone(sim.mode) === "bad" ? "bg-rose-100 text-rose-700" : enforcementTone(sim.mode) === "warn" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-700")}>
                                {sim.mode === "Active" ? <Check className="h-5 w-5" /> : sim.mode === "Soft paused" ? <AlertTriangle className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-slate-900">{sim.mode}</div>
                                <div className="mt-1 text-xs text-slate-600">{sim.reason}</div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </Section>

                  <Section title="Enforcement audit log" subtitle="Recent automated actions." right={<Pill label="5 events" tone="neutral" /> }>
                     <div className="space-y-2">
                       <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                         <span className="font-semibold text-slate-900">{fmtDate(now - 2 * 24 * 3600 * 1000)}</span>: System changed status from Active to Soft paused (Risk alert).
                       </div>
                       <div className="rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                         <span className="font-semibold text-slate-900">{fmtDate(now - 5 * 24 * 3600 * 1000)}</span>: Payment received (INV-001). Enforcement restored to Active.
                       </div>
                     </div>
                  </Section>
                </div>

                <div className="space-y-4">
                  <Section
                    title="Service suspension rules"
                    subtitle="Soft pause vs full stop. Reactivation after payment."
                    right={<Pill label={enforcement.mode} tone={enforcementTone(enforcement.mode)} />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Toggle
                        enabled={enforcementCfg.enabled}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, enabled: v }))}
                        label="Enable enforcement"
                        description="Evaluates overdue and risk freeze rules."
                      />
                      <Toggle
                        enabled={enforcementCfg.autoReactivateAfterPayment}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, autoReactivateAfterPayment: v }))}
                        label="Auto-reactivate after payment"
                        description="When balances clear, services can resume."
                      />
                      <NumberField
                        label="Soft pause after overdue days"
                        value={enforcementCfg.softPauseAfterOverdueDays}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, softPauseAfterOverdueDays: Math.max(0, v) }))}
                        hint="Example: 3"
                        disabled={!enforcementCfg.enabled}
                      />
                      <NumberField
                        label="Full stop after overdue days"
                        value={enforcementCfg.fullStopAfterOverdueDays}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, fullStopAfterOverdueDays: Math.max(0, v) }))}
                        hint="Example: 10"
                        disabled={!enforcementCfg.enabled}
                      />
                      <NumberField
                        label="Final notice after overdue days"
                        value={enforcementCfg.finalNoticeAfterOverdueDays}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, finalNoticeAfterOverdueDays: Math.max(0, v) }))}
                        hint="Triggers stage and escalation"
                        disabled={!enforcementCfg.enabled}
                      />
                      <Select
                        label="Enforcement scope"
                        value={enforcementCfg.scope}
                        onChange={(v) => setEnforcementCfg((p) => ({ ...p, scope: v as any }))}
                        options={[{ value: "CorporatePay only", label: "CorporatePay only" }, { value: "All services", label: "All services" }]}
                        hint="Soft pause affects checkout"
                        disabled={!enforcementCfg.enabled}
                      />
                    </div>

                    <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Current evaluation</div>
                          <div className="mt-1 text-xs text-slate-500">Computed from invoices and rules.</div>
                        </div>
                        <Pill label={enforcement.mode} tone={enforcementTone(enforcement.mode)} />
                      </div>
                      <div className="mt-2 text-sm text-slate-700">{enforcement.reason}</div>
                      <div className="mt-2 text-xs text-slate-600">Max overdue: {enforcement.maxOverdueDays} day(s) • Overdue invoices: {enforcement.overdueCount}</div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant={enforcementCfg.freezeAllServices ? "danger" : "outline"} onClick={() => setEnforcementCfg((p) => ({ ...p, freezeAllServices: !p.freezeAllServices }))}>
                          {enforcementCfg.freezeAllServices ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />} Risk freeze
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            // simulate compliance
                            setInvoices((prev) => prev.map((i) => (i.balance > 0 && i.status !== "Draft" ? { ...i, status: "Sent" } : i)));
                            toast({ title: "Simulated", message: "Simulated compliance for unpaid invoices (demo).", kind: "info" });
                          }}
                        >
                          <Sparkles className="h-4 w-4" /> Simulate compliance
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Reactivation occurs after payment when auto-reactivate is enabled and risk freeze is off.
                    </div>
                  </Section>

                  <Section
                    title="Reactivation after payment"
                    subtitle="Mark overdue invoices paid and observe the enforcement state." 
                    right={<Pill label="Core" tone="neutral" />}
                  >
                    <div className="space-y-2">
                      {overdueInvoices.slice(0, 5).map((x) => {
                        const inv = x.inv;
                        const e = entityById[inv.entityId];
                        const cur = e?.currency || "UGX";
                        return (
                          <div key={inv.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{inv.invoiceNo}</div>
                                <div className="mt-1 text-xs text-slate-500">{x.overdueDays} day(s) overdue • Balance {formatMoney(inv.balance, cur)}</div>
                              </div>
                              <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => markPaid(inv.id)}>
                                <Check className="h-4 w-4" /> Mark paid
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                      {!overdueInvoices.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No overdue invoices.</div>
                      ) : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section title="Soft pause vs full stop" subtitle="What each mode does." right={<Pill label="Core" tone="neutral" /> }>
                    <div className="space-y-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Soft pause</div>
                            <div className="mt-1 text-xs text-slate-600">CorporatePay is paused. Reminders continue. Users are prompted to resolve payment.</div>
                          </div>
                          <Pill label="Soft paused" tone="warn" />
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                          Typical triggers: overdue beyond {enforcementCfg.softPauseAfterOverdueDays} day(s), dispute in review, repeated reminder failures.
                        </div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Full stop</div>
                            <div className="mt-1 text-xs text-slate-600">Corporate-funded services are stopped until compliant. Escalations fire.</div>
                          </div>
                          <Pill label="Full stopped" tone="bad" />
                        </div>
                        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                          Typical triggers: overdue beyond {enforcementCfg.fullStopAfterOverdueDays} day(s), risk freeze, repeated failed collections.
                        </div>
                      </div>
                    </div>
                  </Section>

                  <Section title="Escalation integration" subtitle="When enforcement changes, routing escalates." right={<Pill label="Premium" tone="info" /> }>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) Upcoming due reminders go to Finance</li>
                        <li>2) Overdue reminders escalate to Finance and optionally CFO</li>
                        <li>3) Final notice escalates to CFO</li>
                        <li>4) Extended delinquency can involve EVzone support</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <Button variant="outline" onClick={() => setTab("escalation")}>
                        <ChevronRight className="h-4 w-4" /> Open routing
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "escalation" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-7 space-y-4">
                  <Section title="Escalation routing" subtitle="Premium: finance to CFO to EVzone support." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {stages
                        .slice()
                        .sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue)
                        .map((s) => (
                          <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                                  <Pill label={s.trigger} tone="neutral" />
                                  <Pill label={`Offset ${s.offsetDaysFromDue}d`} tone="info" />
                                  <Pill label={`Escalation ${s.escalation}`} tone={s.escalation === "EVzone Support" ? "warn" : "neutral"} />
                                </div>
                                <div className="mt-2 text-xs text-slate-600">Recipients: {pickEscalationRecipients(s.escalation, contacts).map((c) => c.name).join(", ") || "None"}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {CHANNELS.map((c) => (
                                    <Pill key={c} label={c} tone={s.channels[c] ? "good" : "neutral"} />
                                  ))}
                                </div>
                              </div>
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openEditStage(s)}>
                                <Pencil className="h-4 w-4" /> Edit stage
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Escalation routing can include EVzone support as a role-gated support desk.
                    </div>
                  </Section>

                  <Section title="Contacts" subtitle="Configure who receives reminders and escalations." right={<Pill label={`${contacts.length}`} tone="neutral" />}>
                    <div className="space-y-2">
                      {contacts.map((c) => (
                        <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{c.name}</div>
                                <Pill label={c.role} tone={c.role === "EVzone Support" ? "warn" : "neutral"} />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{c.email} • {c.phone}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {CHANNELS.map((ch) => (
                                  <Pill key={ch} label={ch} tone={c.channels[ch] ? "good" : "neutral"} />
                                ))}
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                // toggle WhatsApp as a quick edit demo
                                setContacts((p) => p.map((x) => (x.id === c.id ? { ...x, channels: { ...x.channels, WhatsApp: !x.channels.WhatsApp } } : x)));
                                toast({ title: "Updated", message: "Updated contact channels (demo).", kind: "info" });
                              }}
                            >
                              <Users className="h-4 w-4" /> Toggle WhatsApp
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      In production, contacts come from Billing Contacts (D) and Invoice Groups (N).
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <Section title="Routing ladder" subtitle="Premium: who gets notified by escalation level." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {escalationLadder.map((r, idx) => (
                        <div key={r.level} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">Step {idx + 1}: {r.level}</div>
                              <div className="mt-1 text-xs text-slate-500">Notify channels: {r.notify.join(", ")}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {pickEscalationRecipients(r.level, contacts).map((c) => (
                                  <Pill key={c.id} label={c.name} tone="neutral" />
                                ))}
                              </div>
                            </div>
                            <Sparkles className="h-5 w-5 text-emerald-700" />
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            {CHANNELS.map((ch) => {
                              const on = r.notify.includes(ch);
                              return (
                                <button
                                  key={ch}
                                  type="button"
                                  className={cn(
                                    "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs font-semibold",
                                    on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                                  )}
                                  onClick={() => {
                                    setEscalationLadder((p) =>
                                      p.map((x) => {
                                        if (x.level !== r.level) return x;
                                        const set = new Set(x.notify);
                                        if (set.has(ch)) set.delete(ch);
                                        else set.add(ch);
                                        return { ...x, notify: Array.from(set) as Channel[] };
                                      })
                                    );
                                  }}
                                >
                                  <span className="text-slate-600">{channelIcon(ch)}</span>
                                  {ch}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: routing can escalate based on repeated failures and dispute SLA breaches.
                    </div>
                  </Section>

                  <Section title="Test routing" subtitle="Pick an invoice and stage to simulate send." right={<Pill label="Demo" tone="neutral" /> }>
                    <div className="grid grid-cols-1 gap-3">
                      <Select
                        label="Invoice"
                        value={sendNowDraft.invoiceId}
                        onChange={(v) => setSendNowDraft((p) => ({ ...p, invoiceId: v }))}
                        options={invoices.map((i) => ({ value: i.id, label: i.invoiceNo }))}
                      />
                      <Select
                        label="Stage"
                        value={sendNowDraft.stageId}
                        onChange={(v) => setSendNowDraft((p) => ({ ...p, stageId: v }))}
                        options={stages.map((s) => ({ value: s.id, label: `${s.name} (${s.offsetDaysFromDue}d)` }))}
                      />
                      <Button
                        variant="primary"
                        onClick={() => {
                          simulateSend(sendNowDraft.invoiceId, sendNowDraft.stageId, "Routing test");
                          setTab("reminders");
                        }}
                      >
                        <Sparkles className="h-4 w-4" /> Send test
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "health" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section
                    title="Customer health score"
                    subtitle="Premium: risk score and predicted delinquency."
                    right={<Pill label={`${healthScore}/100`} tone={healthScore >= 75 ? "good" : healthScore >= 45 ? "warn" : "bad"} />}
                  >
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-500">Predicted risk</div>
                          <div className="mt-1 text-2xl font-semibold text-slate-900">{predictedRisk}</div>
                          <div className="mt-1 text-xs text-slate-600">Based on overdue, disputes, and delivery failures</div>
                        </div>
                        <div className={cn(
                          "grid h-12 w-12 place-items-center rounded-2xl ring-1",
                          predictedRisk === "High" ? "bg-rose-50 text-rose-700 ring-rose-200" : predictedRisk === "Medium" ? "bg-amber-50 text-amber-800 ring-amber-200" : "bg-emerald-50 text-emerald-700 ring-emerald-200"
                        )}>
                          <Sparkles className="h-6 w-6" />
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 gap-3">
                        <Factor label="Max overdue days" value={`${enforcement.maxOverdueDays}`} tone={enforcement.maxOverdueDays >= enforcementCfg.fullStopAfterOverdueDays ? "bad" : enforcement.maxOverdueDays >= enforcementCfg.softPauseAfterOverdueDays ? "warn" : "good"} />
                        <Factor label="Overdue invoices" value={`${overdueInvoices.length}`} tone={overdueInvoices.length ? "warn" : "good"} />
                        <Factor label="Open disputes" value={`${disputes.filter((d) => d.status === "Open" || d.status === "In review").length}`} tone={disputeSla.openCount ? "warn" : "good"} />
                        <Factor label="Delivery failures" value={`${failedDeliveryCount}`} tone={failedDeliveryCount ? "warn" : "good"} />
                        <Factor label="Final notice candidates" value={`${finalNoticeCandidates.length}`} tone={finalNoticeCandidates.length ? "warn" : "good"} />
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: predicted delinquency can be improved with real historical payment patterns and external signals.
                    </div>
                  </Section>

                  <Section title="Dispute SLA controls" subtitle="Premium: SLA compliance tracking for billing disputes." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <NumberField
                        label="First response SLA (hours)"
                        value={disputeSlaCfg.firstResponseHours}
                        onChange={(v) => setDisputeSlaCfg((p) => ({ ...p, firstResponseHours: Math.max(1, v) }))}
                      />
                      <NumberField
                        label="Resolution SLA (hours)"
                        value={disputeSlaCfg.resolutionHours}
                        onChange={(v) => setDisputeSlaCfg((p) => ({ ...p, resolutionHours: Math.max(1, v) }))}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">First response compliance</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">{disputeSla.complianceFirst}%</div>
                        <div className="mt-1 text-xs text-slate-600">Breaches: {disputeSla.firstRespBreaches.length}</div>
                      </div>
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Resolution compliance</div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">{disputeSla.complianceResolution}%</div>
                        <div className="mt-1 text-xs text-slate-600">Breaches: {disputeSla.resolutionBreaches.length}</div>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => setDisputeSlaOpen(true)}>
                        <LifeBuoy className="h-4 w-4" /> View disputes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          // simulate a first response for DSP-011
                          const id = "DSP-011";
                          setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, firstResponseAt: Date.now(), lastUpdatedAt: Date.now(), status: "In review" } : d)));
                          toast({ title: "Updated", message: "Simulated first response on a dispute.", kind: "success" });
                        }}
                      >
                        <Sparkles className="h-4 w-4" /> Simulate response
                      </Button>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Recommendations" subtitle="Premium next-best actions." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Recommendation
                        title="Run scheduler"
                        detail="Send upcoming and overdue reminders across channels."
                        cta="Run now"
                        onClick={runDunningScheduler}
                      />
                      <Recommendation
                        title="Escalate final notices"
                        detail={`There are ${finalNoticeCandidates.length} invoice(s) past the final notice threshold.`}
                        cta="Open dunning"
                        onClick={() => setTab("dunning")}
                      />
                      <Recommendation
                        title="Fix delivery failures"
                        detail={`There are ${failedDeliveryCount} failed delivery attempts. Enable alternate channels or correct contact info.`}
                        cta="Open logs"
                        onClick={() => setTab("reminders")}
                      />
                      <Recommendation
                        title="Dispute SLA"
                        detail={`Open disputes: ${disputeSla.openCount}. First response compliance: ${disputeSla.complianceFirst}%.`}
                        cta="Open SLA"
                        onClick={() => setDisputeSlaOpen(true)}
                      />
                      <Recommendation
                        title="Enforcement rules"
                        detail={`Current mode: ${enforcement.mode}. Review thresholds and scope.`}
                        cta="Configure"
                        onClick={() => setTab("enforcement")}
                      />
                    </div>
                  </Section>

                  <Section title="Multi-channel coverage" subtitle="Automated reminders via Email, WhatsApp, WeChat, and SMS." right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Stage</th>
                            {CHANNELS.map((c) => (
                              <th key={c} className="px-4 py-3 font-semibold">{c}</th>
                            ))}
                            <th className="px-4 py-3 font-semibold">Escalation</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stages
                            .slice()
                            .sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue)
                            .map((s) => (
                              <tr key={s.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{s.name}</td>
                                {CHANNELS.map((c) => (
                                  <td key={c} className="px-4 py-3">
                                    <Pill label={s.channels[c] ? "On" : "Off"} tone={s.channels[c] ? "good" : "neutral"} />
                                  </td>
                                ))}
                                <td className="px-4 py-3"><Pill label={s.escalation} tone={s.escalation === "EVzone Support" ? "warn" : "neutral"} /></td>
                                <td className="px-4 py-3"><Pill label={s.action} tone={s.action === "Full stop" ? "bad" : s.action === "Soft pause" ? "warn" : "neutral"} /></td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      For best results, enable at least two channels per stage and validate contact preferences.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              P Collections, Reminders and Enforcement v2. Core: automated reminders on Email, WhatsApp, WeChat, SMS; dunning schedules; service suspension; reactivation after payment. Premium: escalation routing; customer health and predicted risk; dispute SLA compliance.
            </div>
          </footer>
        </div>
      </div>

      {/* Stage modal */}
      <Modal
        open={stageModalOpen}
        title={stageDraft.id ? "Edit dunning stage" : "New dunning stage"}
        subtitle="Configure trigger timing, channels, escalation routing, and enforcement action."
        onClose={() => setStageModalOpen(false)}
        actions={[
          { label: "Save", onClick: saveStage }
        ]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setStageModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveStage}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" value={stageDraft.name} onChange={(v) => setStageDraft((p) => ({ ...p, name: v }))} placeholder="Overdue reminder" />
          <Toggle enabled={stageDraft.enabled} onChange={(v) => setStageDraft((p) => ({ ...p, enabled: v }))} label="Enabled" description="If off, scheduler will skip it." />
          <Select
            label="Trigger"
            value={stageDraft.trigger}
            onChange={(v) => setStageDraft((p) => ({ ...p, trigger: v as any }))}
            options={[{ value: "Upcoming due", label: "Upcoming due" }, { value: "Overdue", label: "Overdue" }, { value: "Final notice", label: "Final notice" }]}
          />
          <NumberField
            label="Offset days from due"
            value={stageDraft.offsetDaysFromDue}
            onChange={(v) => setStageDraft((p) => ({ ...p, offsetDaysFromDue: v }))}
            hint="Negative means before due"
          />
          <Select
            label="Template"
            value={stageDraft.templateId}
            onChange={(v) => setStageDraft((p) => ({ ...p, templateId: v }))}
            options={templates.map((t) => ({ value: t.id, label: t.name }))}
          />
          <Select
            label="Escalation"
            value={stageDraft.escalation}
            onChange={(v) => setStageDraft((p) => ({ ...p, escalation: v as any }))}
            options={[{ value: "Finance", label: "Finance" }, { value: "CFO", label: "CFO" }, { value: "EVzone Support", label: "EVzone Support" }]}
          />
          <Select
            label="Enforcement action"
            value={stageDraft.action}
            onChange={(v) => setStageDraft((p) => ({ ...p, action: v as any }))}
            options={[{ value: "None", label: "None" }, { value: "Soft pause", label: "Soft pause" }, { value: "Full stop", label: "Full stop" }]}
          />
          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-sm font-semibold text-slate-900">Channels</div>
            <div className="mt-1 text-xs text-slate-600">Select the channels to send this stage.</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHANNELS.map((c) => {
                const on = stageDraft.channels[c];
                return (
                  <button
                    key={c}
                    type="button"
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold",
                      on ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                    )}
                    onClick={() => setStageDraft((p) => ({ ...p, channels: { ...p.channels, [c]: !p.channels[c] } }))}
                  >
                    <span className="flex items-center gap-2">
                      <span className={cn("text-slate-600", on && "text-emerald-700")}>{channelIcon(c)}</span>
                      {c}
                    </span>
                    <Pill label={on ? "On" : "Off"} tone={on ? "good" : "neutral"} />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="md:col-span-2">
            <Button variant="outline" className="w-full" onClick={() => { setStageModalOpen(false); toast({ title: "Tip", message: "Use Send now to test a stage.", kind: "info" }); }}>
              <Sparkles className="h-4 w-4" /> Save and test later
            </Button>
          </div>

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Note: stage actions are guidance. Global enforcement rules still apply.
          </div>
        </div>
      </Modal>

      {/* Template modal */}
      <Modal
        open={templateModalOpen}
        title={templateDraft.id ? "Edit template" : "New template"}
        subtitle="Templates support placeholders: {invoiceNo}, {dueDate}, {balance}, {contactName}"
        onClose={() => setTemplateModalOpen(false)}
        actions={[
          { label: "Save", onClick: saveTemplate }
        ]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTemplateModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveTemplate}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Name" value={templateDraft.name} onChange={(v) => setTemplateDraft((p) => ({ ...p, name: v }))} placeholder="Upcoming due reminder" />
          <div className="rounded-3xl border border-slate-200 bg-white p-4">
            <div className="text-xs font-semibold text-slate-600">Enabled channels</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={cn(
                    "flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold",
                    templateDraft.enabledChannels[c] ? "border-emerald-300 bg-emerald-50" : "border-slate-200 bg-white hover:bg-slate-50"
                  )}
                  onClick={() => setTemplateDraft((p) => ({ ...p, enabledChannels: { ...p.enabledChannels, [c]: !p.enabledChannels[c] } }))}
                >
                  <span className="flex items-center gap-2">
                    <span className={cn("text-slate-600", templateDraft.enabledChannels[c] && "text-emerald-700")}>{channelIcon(c)}</span>
                    {c}
                  </span>
                  <Pill label={templateDraft.enabledChannels[c] ? "On" : "Off"} tone={templateDraft.enabledChannels[c] ? "good" : "neutral"} />
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <TextArea
              label="Subject"
              value={templateDraft.subject}
              onChange={(v) => setTemplateDraft((p) => ({ ...p, subject: v }))}
              placeholder="Upcoming invoice due: {invoiceNo}"
              hint="Used for Email"
              rows={2}
            />
          </div>
          <div className="md:col-span-2">
            <TextArea
              label="Body"
              value={templateDraft.body}
              onChange={(v) => setTemplateDraft((p) => ({ ...p, body: v }))}
              placeholder="Hello {contactName}..."
              rows={6}
            />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
            Tip: keep SMS short and actionable. Use WhatsApp for richer content.
          </div>
        </div>
      </Modal>

      {/* Send now modal */}
      <Modal
        open={sendNowOpen}
        title="Send reminder now"
        subtitle="Manual send for a specific invoice and stage."
        onClose={() => setSendNowOpen(false)}
        actions={[
          {
            label: "Send",
            onClick: () => {
              simulateSend(sendNowDraft.invoiceId, sendNowDraft.stageId, sendNowDraft.note || "Manual");
              setSendNowOpen(false);
            }
          }
        ]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setSendNowOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                simulateSend(sendNowDraft.invoiceId, sendNowDraft.stageId, sendNowDraft.note || "Manual");
                setSendNowOpen(false);
              }}
            >
              <Sparkles className="h-4 w-4" /> Send
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Invoice"
            value={sendNowDraft.invoiceId}
            onChange={(v) => setSendNowDraft((p) => ({ ...p, invoiceId: v }))}
            options={invoices.map((i) => ({ value: i.id, label: i.invoiceNo }))}
          />
          <Select
            label="Stage"
            value={sendNowDraft.stageId}
            onChange={(v) => setSendNowDraft((p) => ({ ...p, stageId: v }))}
            options={stages.map((s) => ({ value: s.id, label: `${s.name} (${s.offsetDaysFromDue}d)` }))}
          />
          <div className="md:col-span-2">
            <TextArea
              label="Note"
              value={sendNowDraft.note}
              onChange={(v) => setSendNowDraft((p) => ({ ...p, note: v }))}
              placeholder="Why are you sending this now"
              rows={3}
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Manual sends are logged per channel. Duplicate sends for the same stage and channel are prevented.
          </div>
        </div>
      </Modal>

      {/* Invoice drawer */}
      <Drawer
        open={invoiceDrawerOpen}
        title={activeInvoice ? activeInvoice.invoiceNo : "Invoice"}
        subtitle={activeInvoice ? `${entityById[activeInvoice.entityId]?.name || activeInvoice.entityId} • ${groupById[activeInvoice.invoiceGroupId]?.name || activeInvoice.invoiceGroupId}` : ""}
        onClose={() => setInvoiceDrawerOpen(false)}
        footer={
          activeInvoice ? (
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
              <div className="text-xs text-slate-600">Collections actions are audit logged in production.</div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => { setSendNowDraft({ invoiceId: activeInvoice.id, stageId: stages[0]?.id || "STG-1", note: "Manual" }); setSendNowOpen(true); }}>
                  <Sparkles className="h-4 w-4" /> Remind
                </Button>
                <Button variant="primary" onClick={() => markPaid(activeInvoice.id)}>
                  <Check className="h-4 w-4" /> Mark paid
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
                    <Pill label={`Due ${fmtDate(activeInvoice.dueDate)}`} tone={activeInvoice.status === "Overdue" ? "bad" : "neutral"} />
                    {activeInvoice.openDisputes ? <Pill label={`${activeInvoice.openDisputes} dispute`} tone="warn" /> : null}
                  </div>
                  <div className="mt-2 text-xs text-slate-600">Last reminder: {activeInvoice.lastReminderAt ? timeAgo(activeInvoice.lastReminderAt) : "None"}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-500">Balance</div>
                  <div className="mt-1 text-lg font-semibold text-slate-900">{formatMoney(activeInvoice.balance, entityById[activeInvoice.entityId]?.currency || "UGX")}</div>
                  <div className="mt-1 text-xs text-slate-600">Total: {formatMoney(activeInvoice.total, entityById[activeInvoice.entityId]?.currency || "UGX")}</div>
                </div>
              </div>
            </div>

            <Section title="Dunning timeline" subtitle="Stages evaluated based on due date and offsets." right={<Pill label="Core" tone="neutral" />}>
              <div className="space-y-2">
                {stages
                  .slice()
                  .sort((a, b) => a.offsetDaysFromDue - b.offsetDaysFromDue)
                  .map((s) => {
                    const triggerAt = activeInvoice.dueDate + s.offsetDaysFromDue * DAY;
                    const fired = deliveries.some((d) => d.invoiceId === activeInvoice.id && d.stageId === s.id);
                    const due = now >= triggerAt;
                    return (
                      <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{s.name}</div>
                              <Pill label={`Offset ${s.offsetDaysFromDue}d`} tone="info" />
                              <Pill label={due ? "Eligible" : "Not yet"} tone={due ? "warn" : "neutral"} />
                              <Pill label={fired ? "Sent" : "Not sent"} tone={fired ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-xs text-slate-500">Trigger time: {fmtDate(triggerAt)}</div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {CHANNELS.map((c) => (
                                <Pill key={c} label={c} tone={s.channels[c] ? "good" : "neutral"} />
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            className="px-3 py-2 text-xs"
                            onClick={() => simulateSend(activeInvoice.id, s.id, "From invoice")}
                            disabled={!s.enabled}
                          >
                            <Sparkles className="h-4 w-4" /> Send
                          </Button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </Section>

            <Section title="Delivery records" subtitle="Logs for this invoice." right={<Pill label="Core" tone="neutral" />}>
              <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs text-slate-600">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Time</th>
                      <th className="px-4 py-3 font-semibold">Stage</th>
                      <th className="px-4 py-3 font-semibold">Channel</th>
                      <th className="px-4 py-3 font-semibold">To</th>
                      <th className="px-4 py-3 font-semibold">Status</th>
                      <th className="px-4 py-3 font-semibold">Error</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries
                      .filter((d) => d.invoiceId === activeInvoice.id)
                      .slice()
                      .sort((a, b) => b.createdAt - a.createdAt)
                      .map((d) => (
                        <tr key={d.id} className="border-t border-slate-100">
                          <td className="px-4 py-3 text-slate-700">{fmtDateTime(d.createdAt)}</td>
                          <td className="px-4 py-3 text-slate-700">{stages.find((s) => s.id === d.stageId)?.name || d.stageId}</td>
                          <td className="px-4 py-3 text-slate-700">{d.channel}</td>
                          <td className="px-4 py-3 text-slate-700">{d.to}</td>
                          <td className="px-4 py-3"><Pill label={d.status} tone={d.status === "Delivered" ? "good" : d.status === "Failed" ? "warn" : "neutral"} /></td>
                          <td className="px-4 py-3 text-slate-700">{d.error || "-"}</td>
                        </tr>
                      ))}
                    {!deliveries.some((d) => d.invoiceId === activeInvoice.id) ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No delivery logs for this invoice.</td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </Section>
          </div>
        ) : null}
      </Drawer>

      {/* Dispute SLA modal */}
      <Modal
        open={disputeSlaOpen}
        title="Billing disputes SLA"
        subtitle="Premium: SLA compliance tracking for billing disputes."
        onClose={() => setDisputeSlaOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setDisputeSlaOpen(false)}>Close</Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Open disputes</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{disputeSla.openCount}</div>
              <div className="mt-1 text-xs text-slate-600">Including In review</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">First response breaches</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{disputeSla.firstRespBreaches.length}</div>
              <div className="mt-1 text-xs text-slate-600">SLA {disputeSlaCfg.firstResponseHours}h</div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-xs font-semibold text-slate-500">Resolution breaches</div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">{disputeSla.resolutionBreaches.length}</div>
              <div className="mt-1 text-xs text-slate-600">SLA {disputeSlaCfg.resolutionHours}h</div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs text-slate-600">
                <tr>
                  <th className="px-4 py-3 font-semibold">Dispute</th>
                  <th className="px-4 py-3 font-semibold">Invoice</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Age</th>
                  <th className="px-4 py-3 font-semibold">First response</th>
                  <th className="px-4 py-3 font-semibold">Resolution SLA</th>
                  <th className="px-4 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {disputes
                  .slice()
                  .sort((a, b) => {
                    const ao = a.status === "Open" || a.status === "In review";
                    const bo = b.status === "Open" || b.status === "In review";
                    if (ao !== bo) return ao ? -1 : 1;
                    return b.createdAt - a.createdAt;
                  })
                  .map((d) => {
                    const inv = invoices.find((i) => i.id === d.invoiceId);
                    const ageHrs = Math.round(((now - d.createdAt) / (60 * 60 * 1000)) * 10) / 10;
                    const frBreached = !d.firstResponseAt && ageHrs > disputeSlaCfg.firstResponseHours && (d.status === "Open" || d.status === "In review");
                    const resBreached = ageHrs > disputeSlaCfg.resolutionHours && (d.status === "Open" || d.status === "In review");
                    return (
                      <tr key={d.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                        <td className="px-4 py-3 font-semibold text-slate-900">{d.id}</td>
                        <td className="px-4 py-3 text-slate-700">{inv?.invoiceNo || d.invoiceId}</td>
                        <td className="px-4 py-3"><Pill label={d.status} tone={statusTone(d.status)} /></td>
                        <td className="px-4 py-3 text-slate-700">{ageHrs}h</td>
                        <td className="px-4 py-3">
                          <Pill label={d.firstResponseAt ? "Done" : frBreached ? "Breached" : "Pending"} tone={d.firstResponseAt ? "good" : frBreached ? "bad" : "warn"} />
                        </td>
                        <td className="px-4 py-3">
                          <Pill label={resBreached ? "Breached" : "OK"} tone={resBreached ? "bad" : "good"} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setDisputes((p) => p.map((x) => (x.id === d.id ? { ...x, firstResponseAt: x.firstResponseAt || Date.now(), lastUpdatedAt: Date.now(), status: "In review" } : x)));
                                toast({ title: "Updated", message: "First response recorded.", kind: "success" });
                              }}
                              disabled={!!d.firstResponseAt}
                            >
                              <Sparkles className="h-4 w-4" /> First response
                            </Button>
                            <Button
                              variant="primary"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setDisputes((p) => p.map((x) => (x.id === d.id ? { ...x, status: "Resolved", lastUpdatedAt: Date.now() } : x)));
                                toast({ title: "Resolved", message: "Dispute resolved.", kind: "success" });
                              }}
                              disabled={d.status === "Resolved"}
                            >
                              <Check className="h-4 w-4" /> Resolve
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {!disputes.length ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm text-slate-600">No disputes.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: SLA breaches can trigger escalation routing and pause enforcement until reviewed.
          </div>
        </div>
      </Modal>
    </div>
  );

  function Factor({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "bad" }) {
    const cls = tone === "good" ? "bg-emerald-50 text-emerald-900 ring-emerald-200" : tone === "warn" ? "bg-amber-50 text-amber-900 ring-amber-200" : "bg-rose-50 text-rose-900 ring-rose-200";
    return (
      <div className={cn("flex items-center justify-between gap-3 rounded-2xl p-3 text-xs ring-1", cls)}>
        <div className="font-semibold">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    );
  }

  function Recommendation({ title, detail, cta, onClick }: { title: string; detail: string; cta: string; onClick: () => void }) {
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
