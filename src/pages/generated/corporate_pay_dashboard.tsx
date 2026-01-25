import React, { useMemo, useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  Calendar,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  Download,
  FileText,
  Filter,
  Globe,
  HandCoins,
  Layers,
  LineChart,
  MapPin,
  PieChart,
  PiggyBank,
  Plus,
  Search,
  Shield,
  Sparkles,
  Store,
  Ticket,
  Timer,
  TrendingDown,
  TrendingUp,
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

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function Pill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "good" | "warn" | "bad" | "info" | "neutral";
}) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:ring-emerald-800",
    warn: "bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:ring-amber-800",
    bad: "bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:ring-rose-800",
    info: "bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:ring-blue-800",
    neutral: "bg-slate-50 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1",
        map[tone]
      )}
    >
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
      "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200 dark:shadow-none",
    accent:
      "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200 dark:shadow-none",
    outline:
      "border border-slate-200 bg-white text-slate-900 shadow-sm hover:bg-slate-50 focus:ring-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200 dark:text-slate-300 dark:hover:bg-slate-800",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
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
      className={cn(
        base,
        variants[variant],
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
    >
      {children}
    </button>
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
  const menuRef = useRef<HTMLDivElement>(null);

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
  maxW = "900px",
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
            className="fixed inset-x-0 bottom-4 top-4 z-50 mx-auto flex w-[min(980px,calc(100vw-2rem))] flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            style={{ maxWidth: maxW, maxHeight: "92vh" }}
            role="dialog"
            aria-modal="true"
          >
            {/* Header - rigid */}
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">
                {actions && <ActionMenu actions={actions} />}
                <button
                  className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  onClick={onClose}
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Body - scrollable */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              {children}
            </div>

            {/* Footer - rigid */}
            {footer ? (
              <div className="shrink-0 border-t border-slate-200 px-5 py-4 dark:border-slate-800">{footer}</div>
            ) : null}
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
            className="pointer-events-auto rounded-3xl border border-slate-200 bg-white/90 p-3 shadow-[0_18px_45px_rgba(2,8,23,0.18)] backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 dark:shadow-none"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 grid h-9 w-9 place-items-center rounded-2xl",
                  t.kind === "success" && "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                  t.kind === "warn" && "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                  t.kind === "error" && "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
                  t.kind === "info" && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                )}
              >
                {t.kind === "error" || t.kind === "warn" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {t.title}
                </div>
                {t.message ? (
                  <div className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                    {t.message}
                  </div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
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

function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-slate-50"
    >
      <span className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>
        {label}
      </span>
      <ChevronRight className="h-4 w-4 text-slate-500" />
    </button>
  );
}

function MixBar({
  title,
  rows,
  total,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  total: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
        <span>{title}</span>
        <span>{formatUGX(total)}</span>
      </div>
      <div className="mt-2 flex h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        {rows.map((row, i) => {
          const colors = [
            "bg-emerald-500",
            "bg-blue-500",
            "bg-amber-500",
            "bg-indigo-500",
            "bg-rose-500",
            "bg-purple-500",
          ];
          const width = total > 0 ? (row.value / total) * 100 : 0;
          return (
            <div
              key={row.label}
              className={cn("h-full", colors[i % colors.length])}
              style={{ width: `${width}%` }}
              title={`${row.label}: ${formatUGX(row.value)}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
        {rows.map((r, i) => (
          <span key={r.label} className="inline-flex items-center gap-1">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-indigo-500", "bg-rose-500", "bg-purple-500"][
                i % 6
                ]
              )}
            />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  trend,
  variant,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: { label: string; tone: "good" | "warn" | "bad" | "info" | "neutral" };
  variant?: "green" | "orange" | "gray";
}) {
  const styles = {
    green: "border-slate-200 bg-white hover:border-emerald-200 hover:shadow-emerald-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/30",
    orange: "border-slate-200 bg-white hover:border-orange-200 hover:shadow-orange-500/10 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-orange-500/30",
    gray: "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900",
  };

  const iconStyles = {
    green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    orange: "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    gray: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400",
  };

  const v = variant || "gray";

  return (
    <div className={cn("rounded-3xl border p-6 shadow-sm transition-all hover-lift dark:shadow-none", styles[v])}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            {title}
          </div>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            {sub}
          </div>
          {trend ? (
            <div className="mt-3">
              <Pill label={trend.label} tone={trend.tone} />
            </div>
          ) : null}
        </div>

        <div className={cn("grid h-12 w-12 place-items-center rounded-2xl shrink-0", iconStyles[v])}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function ProgressBar({ value, labelLeft, labelRight }: { value: number; labelLeft: string; labelRight: string }) {
  const pct = clamp(value, 0, 100);
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-slate-600">
        <span className="font-semibold">{labelLeft}</span>
        <span className="font-semibold">{labelRight}</span>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: EVZ.green }} />
      </div>
    </div>
  );
}

function SimpleLineChart({
  data,
  height = 240,
  mode,
  onModeChange,
}: {
  data: { label: string; value: number }[];
  height?: number;
  mode: "rides" | "delivery" | "both";
  onModeChange: (m: "rides" | "delivery" | "both") => void;
}) {
  if (!data?.length) return null;

  const max = Math.max(...data.map((d) => d.value)) || 1;
  const chartH = height - 40;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return [x, y];
  });

  const getPath = (pts: number[][]) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const c1x = p0[0] + (p1[0] - p0[0]) * 0.5;
      const c1y = p0[1];
      const c2x = p0[0] + (p1[0] - p0[0]) * 0.5;
      const c2y = p1[1];
      d += ` C ${c1x},${c1y} ${c2x},${c2y} ${p1[0]},${p1[1]}`;
    }
    return d;
  };

  const linePath = getPath(points);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-[#0B1120] p-4 text-white shadow-sm">
      <div className="relative z-10 mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Trip Trends</h3>
        <div className="flex rounded-lg bg-slate-800 p-0.5">
          <button
            type="button"
            onClick={() => onModeChange("rides")}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-semibold transition",
              mode === "rides" ? "bg-[#03CD8C] text-slate-900 shadow" : "text-slate-400 hover:text-white"
            )}
          >
            RIDES
          </button>
          <button
            type="button"
            onClick={() => onModeChange("delivery")}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-semibold transition",
              mode === "delivery" ? "bg-[#03CD8C] text-slate-900 shadow" : "text-slate-400 hover:text-white"
            )}
          >
            DELIVERY
          </button>
          <button
            type="button"
            onClick={() => onModeChange("both")}
            className={cn(
              "rounded px-2 py-1 text-[10px] font-semibold transition",
              mode === "both" ? "bg-[#03CD8C] text-slate-900 shadow" : "text-slate-400 hover:text-white"
            )}
          >
            BOTH
          </button>
        </div>
      </div>

      <div className="relative" style={{ height: chartH }}>
        {[0, 25, 50, 75, 100].map(p => (
          <div key={p} className="absolute left-0 right-0 border-t border-dashed border-slate-700/50" style={{ top: `${p}%` }} />
        ))}
        <div className="absolute inset-0 flex justify-between pointer-events-none">
          {data.map((_, i) => (
            <div key={i} className="h-full border-r border-dashed border-slate-700/50 w-px first:border-l" />
          ))}
        </div>

        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#03CD8C" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#03CD8C" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${linePath} L 100,100 L 0,100 Z`} fill="url(#chartGradient)" />
          <path d={linePath} fill="none" stroke="#03CD8C" strokeWidth="1.5" className="drop-shadow-[0_0_6px_rgba(3,205,140,0.5)]" />
        </svg>
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-slate-400 font-medium">
        {data.map((d, i) => (
          (i % 2 === 0 || i === data.length - 1) ? <div key={i}>{d.label}</div> : null
        ))}
      </div>
    </div>
  );
}

function ListCard({
  title,
  subtitle,
  icon,
  items,
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  items: Array<{ title: string; meta: string; pill?: { label: string; tone: any } }>;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-600 dark:text-slate-400">{icon}</span>
          <div>
            <div className="text-xs font-semibold text-slate-900 dark:text-white">{title}</div>
            <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-500">{subtitle}</div>
          </div>
        </div>
        {actionLabel ? (
          <button
            type="button"
            className="text-xs font-semibold text-emerald-700 hover:underline"
            onClick={onAction}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <div key={it.title} className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-950">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-200">{it.title}</div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{it.meta}</div>
              </div>
              {it.pill ? <Pill label={it.pill.label} tone={it.pill.tone} /> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

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

type Group = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type ApprovalItem = {
  id: string;
  type: "Ride" | "Purchase" | "Service" | "RFQ";
  module: ServiceModule;
  marketplace?: Marketplace | "-";
  requester: string;
  group: Group;
  amount: number;
  slaHours: number;
  ageMinutes: number;
  status: "Pending" | "Escalated";
  needsAttachment: boolean;
};

type NextAction = {
  id: string;
  title: string;
  why: string;
  impact: string;
  cta: string;
  tone: "info" | "warn" | "good";
};

export default function CorporatePayDashboardV2() {
  const navigate = useNavigate();
  const [toasts, setToasts] = useState<
    Array<{ id: string; title: string; message?: string; kind: string }>
  >([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

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

  const GROUPS: Group[] = ["Operations", "Sales", "Finance", "Admin", "Procurement"];

  const [orgName] = useState("Acme Group Ltd");
  const [timeframe, setTimeframe] = useState<"Today" | "This week" | "This month" | "This year" | "Custom">("This month");

  // Custom date range for "Custom" timeframe
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const [walletBalance, setWalletBalance] = useState(6800000);

  const [filterGroup, setFilterGroup] = useState<Group | "All">("All");
  const [filterModule, setFilterModule] = useState<ServiceModule | "All">("All");
  const [filterMarketplace, setFilterMarketplace] = useState<Marketplace | "All">("All");

  const marketplaceEnabled = useMemo(() => {
    return filterModule === "All" || filterModule === "E-Commerce";
  }, [filterModule]);

  // Mock spend model - DYNAMIC based on timeframe
  const data = useMemo(() => {
    // Base data (monthly values)
    const baseSpendMonth = 32500000;
    const baseBudgetMonth = 40000000;

    // Calculate multipliers based on timeframe
    let multiplier = 1;
    let budgetMultiplier = 1;
    let periodLabel = "This month";

    switch (timeframe) {
      case "Today":
        multiplier = 0.038; // ~1/26 working days
        budgetMultiplier = 0.038;
        periodLabel = "Today";
        break;
      case "This week":
        multiplier = 0.21; // ~1/4.5 weeks
        budgetMultiplier = 0.21;
        periodLabel = "This week";
        break;
      case "This month":
        multiplier = 1;
        budgetMultiplier = 1;
        periodLabel = "This month";
        break;
      case "This year":
        multiplier = 8.5; // ~8.5 months of year elapsed (demo)
        budgetMultiplier = 12; // Full year budget
        periodLabel = "This year";
        break;
      case "Custom":
        // Calculate days between custom dates
        const start = new Date(customStartDate);
        const end = new Date(customEndDate);
        const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
        multiplier = days / 30; // Relative to monthly
        budgetMultiplier = days / 30;
        periodLabel = `${days} days`;
        break;
    }

    const spendToday = Math.round(baseSpendMonth * 0.038);
    const spendWeek = Math.round(baseSpendMonth * 0.21);
    const spendMonth = Math.round(baseSpendMonth * multiplier);
    const spendYear = Math.round(baseSpendMonth * 8.5);
    const budgetPeriod = Math.round(baseBudgetMonth * budgetMultiplier);

    const ridesMonth = Math.round(14200000 * multiplier);
    const purchasesMonth = Math.round(16800000 * multiplier);
    const servicesMonth = Math.round(1500000 * multiplier);

    // const walletBalance = 6800000; // Moved to state
    const creditLimit = walletBalance; // Linked to capital/wallet balance as requested
    const creditUsed = 8200000;
    const prepaidRunwayDays = 3;

    const failedPayments = timeframe === "Today" ? 0 : timeframe === "This week" ? 1 : 2;
    const overdueInvoices = timeframe === "Today" ? 0 : 1;
    const policyBreaches = Math.round(4 * multiplier);

    const monthDay = 7;
    const daysInMonth = 30;
    const forecastMonthEnd = Math.round((spendMonth / Math.max(1, monthDay * multiplier)) * daysInMonth * multiplier);

    // breakdowns - scale by multiplier
    const spendByModule: Record<ServiceModule, number> = {
      "E-Commerce": Math.round(16800000 * multiplier),
      "EVs & Charging": Math.round(4200000 * multiplier),
      "Rides & Logistics": Math.round(14200000 * multiplier),
      "School & E-Learning": Math.round(800000 * multiplier),
      "Medical & Health Care": Math.round(650000 * multiplier),
      "Travel & Tourism": Math.round(1200000 * multiplier),
      "Green Investments": Math.round(500000 * multiplier),
      "FaithHub": Math.round(120000 * multiplier),
      "Virtual Workspace": Math.round(900000 * multiplier),
      "Finance & Payments": Math.round(2000000 * multiplier),
      "Other Service Module": 0,
    };

    const spendByMarketplace: Record<Marketplace, number> = {
      MyLiveDealz: Math.round(5200000 * multiplier),
      ServiceMart: Math.round(1200000 * multiplier),
      EVmart: Math.round(3400000 * multiplier),
      GadgetMart: Math.round(2200000 * multiplier),
      LivingMart: Math.round(1300000 * multiplier),
      StyleMart: Math.round(900000 * multiplier),
      EduMart: Math.round(600000 * multiplier),
      HealthMart: Math.round(750000 * multiplier),
      PropertyMart: Math.round(400000 * multiplier),
      GeneratMart: Math.round(700000 * multiplier),
      ExpressMart: Math.round(600000 * multiplier),
      FaithMart: Math.round(150000 * multiplier),
      "Other Marketplace": 0,
    };

    const spendByGroup: Record<Group, number> = {
      Operations: Math.round(12000000 * multiplier),
      Sales: Math.round(9800000 * multiplier),
      Finance: Math.round(5200000 * multiplier),
      Admin: Math.round(4100000 * multiplier),
      Procurement: Math.round(3400000 * multiplier),
    };

    const budgetByGroup: Record<Group, number> = {
      Operations: Math.round(15000000 * budgetMultiplier),
      Sales: Math.round(12000000 * budgetMultiplier),
      Finance: Math.round(6000000 * budgetMultiplier),
      Admin: Math.round(5000000 * budgetMultiplier),
      Procurement: Math.round(5000000 * budgetMultiplier),
    };

    return {
      spendToday,
      spendWeek,
      spendMonth,
      spendYear,
      budgetMonth: budgetPeriod,
      budgetRemaining: Math.max(0, budgetPeriod - spendMonth),
      ridesMonth,
      purchasesMonth,
      servicesMonth,
      walletBalance,
      creditLimit,
      creditUsed,
      prepaidRunwayDays,
      failedPayments,
      overdueInvoices,
      policyBreaches,
      forecastMonthEnd,
      monthDay,
      daysInMonth,
      spendByModule,
      spendByMarketplace,
      spendByGroup,
      budgetByGroup,
      periodLabel,
      multiplier,
    };
  }, [timeframe, customStartDate, customEndDate, walletBalance]);

  // Track issued budgets
  const [issuedBudgets, setIssuedBudgets] = useState<Array<{ id: string; group: string; amount: number; period: string; timestamp: Date }>>([]);

  // Approvals
  const [approvals, setApprovals] = useState<ApprovalItem[]>(() => [
    {
      id: "AP-1821",
      type: "Purchase",
      module: "E-Commerce",
      marketplace: "MyLiveDealz",
      requester: "Mary N.",
      group: "Operations",
      amount: 6540000,
      slaHours: 6,
      ageMinutes: 120,
      status: "Pending",
      needsAttachment: true,
    },
    {
      id: "RFQ-390",
      type: "RFQ",
      module: "Rides & Logistics",
      marketplace: "-",
      requester: "Ronald I.",
      group: "Admin",
      amount: 285000000,
      slaHours: 2,
      ageMinutes: 1440,
      status: "Escalated",
      needsAttachment: true,
    },
    {
      id: "RD-0442",
      type: "Ride",
      module: "Rides & Logistics",
      marketplace: "-",
      requester: "John S.",
      group: "Sales",
      amount: 41500,
      slaHours: 7,
      ageMinutes: 15,
      status: "Pending",
      needsAttachment: false,
    },
    {
      id: "SV-2201",
      type: "Service",
      module: "EVs & Charging",
      marketplace: "-",
      requester: "Finance Desk",
      group: "Finance",
      amount: 1800000,
      slaHours: 12,
      ageMinutes: 180,
      status: "Pending",
      needsAttachment: false,
    },
  ]);

  const [openActionId, setOpenActionId] = useState<string | null>(null);
  const [peakMode, setPeakMode] = useState<"rides" | "delivery" | "both">("both");

  const approvalsPending = approvals.filter((a) => a.status !== "Escalated").length;
  const approvalsEscalated = approvals.filter((a) => a.status === "Escalated").length;

  // Service status (module enablement)
  const [serviceStatus, setServiceStatus] = useState<Record<ServiceModule, boolean>>(() => {
    const s: Record<ServiceModule, boolean> = {} as any;
    SERVICE_MODULES.forEach((m) => (s[m] = m !== "Other Service Module"));
    return s;
  });

  // Issues
  const issues = useMemo(
    () => [
      {
        title: "Failed payments",
        meta: `${data.failedPayments} failures • Risk of hold`,
        pill: { label: "Critical", tone: "bad" as const },
      },
      {
        title: "Overdue invoices",
        meta: `${data.overdueInvoices} invoice • Grace window active`,
        pill: { label: "Warning", tone: "warn" as const },
      },
      {
        title: "Policy breaches",
        meta: `${data.policyBreaches} events • Review policy rules`,
        pill: { label: "Review", tone: "info" as const },
      },
    ],
    [data.failedPayments, data.overdueInvoices, data.policyBreaches]
  );

  // Heatmap demo data (24h in 2h blocks)
  const heat = useMemo(() => {
    const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const cols = ["00-02", "02-04", "04-06", "06-08", "08-10", "10-12", "12-14", "14-16", "16-18", "18-20", "20-22", "22-24"];
    const matrix = [
      [2, 1, 3, 8, 14, 11, 9, 8, 12, 16, 10, 4],
      [1, 1, 2, 9, 15, 12, 8, 9, 11, 15, 9, 3],
      [2, 2, 4, 10, 16, 13, 9, 10, 13, 17, 11, 5],
      [3, 1, 3, 9, 15, 12, 9, 11, 14, 18, 12, 4],
      [4, 2, 4, 10, 14, 14, 10, 12, 16, 20, 15, 8],
      [8, 5, 2, 4, 8, 12, 14, 13, 15, 18, 16, 10],
      [7, 4, 1, 3, 6, 10, 12, 11, 13, 15, 12, 6],
    ];
    return { rows, cols, matrix };
  }, []);

  // Premium: anomaly detection
  const anomalies = useMemo(
    () => [
      {
        title: "Unusual vendor spend",
        body: "Shenzhen Store spend is 3.1× higher than typical (MyLiveDealz).",
        severity: "warn" as const,
        ctas: ["Investigate", "Create rule"],
      },
      {
        title: "User nearing cap",
        body: "3 users are above 80% of their monthly cap in Sales.",
        severity: "info" as const,
        ctas: ["Review users", "Tighten policy"],
      },
    ],
    []
  );

  // Premium: savings suggestions
  const savings = useMemo(
    () => [
      {
        title: "Prefer standard rides for commute",
        body: `Estimated savings: ${formatUGX(420000)} this month if premium is restricted for commute trips.`,
        tag: "Rides & Logistics",
      },
      {
        title: "Use preferred vendor catalog",
        body: `Estimated savings: ${formatUGX(900000)} by routing purchases to negotiated vendors.`,
        tag: "E-Commerce",
      },
      {
        title: "Bundle EV charging credits",
        body: `Estimated savings: ${formatUGX(260000)} by purchasing credits in bulk (EVs & Charging).`,
        tag: "EVs & Charging",
      },
    ],
    []
  );

  // Premium: next best admin actions
  const nextActions: NextAction[] = useMemo(
    () => [
      {
        id: "NA-1",
        title: "Approve RFQ escalation",
        why: "RFQ-390 is escalated and past SLA.",
        impact: "Unblocks high-value asset procurement.",
        cta: "Open RFQ",
        tone: "warn",
      },
      {
        id: "NA-2",
        title: "Increase Operations budget or enforce hard cap",
        why: "Operations is projected to exceed budget by month-end.",
        impact: "Prevents service interruption.",
        cta: "Adjust budget",
        tone: "info",
      },
      {
        id: "NA-3",
        title: "Add Shenzhen Store to vendor rule",
        why: "Anomaly detected for vendor spend.",
        impact: "Reduces fraud risk and overspend.",
        cta: "Create rule",
        tone: "good",
      },
    ],
    []
  );

  // KPI calculations
  const budgetUsedPct = (data.spendMonth / Math.max(1, data.budgetMonth)) * 100;
  const creditUsedPct = (data.creditUsed / Math.max(1, data.creditLimit)) * 100;

  // Forecast breakdown
  const forecastByGroup = useMemo(() => {
    const out = GROUPS.map((g) => {
      const mtd = data.spendByGroup[g];
      const forecast = Math.round((mtd / Math.max(1, data.monthDay)) * data.daysInMonth);
      const budget = data.budgetByGroup[g];
      const risk: "bad" | "warn" | "good" = forecast > budget ? "bad" : forecast > budget * 0.9 ? "warn" : "good";
      return { group: g, mtd, forecast, budget, risk };
    });
    return out;
  }, [data, GROUPS]);

  const forecastByModule = useMemo(() => {
    const out = SERVICE_MODULES.map((m) => {
      const mtd = data.spendByModule[m] || 0;
      const forecast = Math.round((mtd / Math.max(1, data.monthDay)) * data.daysInMonth);
      return { module: m, mtd, forecast };
    }).filter((x) => x.mtd > 0 || x.module === "Other Service Module");
    return out;
  }, [data, SERVICE_MODULES]);

  const forecastByMarketplace = useMemo(() => {
    const out = MARKETPLACES.map((m) => {
      const mtd = data.spendByMarketplace[m] || 0;
      const forecast = Math.round((mtd / Math.max(1, data.monthDay)) * data.daysInMonth);
      return { marketplace: m, mtd, forecast };
    }).filter((x) => x.mtd > 0 || x.marketplace === "Other Marketplace");
    return out;
  }, [data, MARKETPLACES]);

  // Quick action modals
  const [addFundsOpen, setAddFundsOpen] = useState(false);
  const [issueBudgetOpen, setIssueBudgetOpen] = useState(false);
  const [rfqOpen, setRfqOpen] = useState(false);
  const [approvalsOpen, setApprovalsOpen] = useState(false);

  const [fundDraft, setFundDraft] = useState({
    method: "Wallet top-up",
    amount: 2000000,
    reference: "",
  });

  const [budgetDraft, setBudgetDraft] = useState({
    group: "Operations" as Group,
    module: "All" as ServiceModule | "All",
    marketplace: "All" as Marketplace | "All",
    period: "Monthly",
    amount: 5000000,
    hardCap: true,
  });

  const [rfqDraft, setRfqDraft] = useState({
    title: "Company vehicle purchase",
    module: "Rides & Logistics" as ServiceModule,
    marketplace: "All" as Marketplace | "All",
    estValue: 285000000,
    neededBy: "2026-02-01",
    description: "Need a company vehicle. Include warranty, service plan, and delivery timeline.",
    attachments: false,
  });

  const moduleSpendTotal = Object.values(data.spendByModule).reduce((a, b) => a + b, 0);
  const marketplaceSpendTotal = Object.values(data.spendByMarketplace).reduce((a, b) => a + b, 0);

  // Filtered context labels
  const contextLabel = useMemo(() => {
    const parts: string[] = [];
    if (filterGroup !== "All") parts.push(`Group: ${filterGroup}`);
    if (filterModule !== "All") parts.push(`Module: ${filterModule}`);
    if (filterMarketplace !== "All") parts.push(`Marketplace: ${filterMarketplace}`);
    return parts.length ? parts.join(" • ") : "All spend";
  }, [
    filterGroup,
    filterModule,
    filterMarketplace,
    walletBalance,
  ]);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))",
      }}
    >
      <ToastStack
        toasts={toasts}
        onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))}
      />

      <div className="mx-auto max-w-[95%] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)] transition-colors dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 transition-colors md:px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="grid h-12 w-12 place-items-center rounded-2xl text-white"
                  style={{ background: EVZ.green }}
                >
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">CorporatePay Dashboard</div>
                  <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Organization: {orgName} • {contextLabel}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Approvals: ${approvalsPending} pending`} tone={approvalsPending ? "warn" : "good"} />
                    {approvalsEscalated ? <Pill label={`${approvalsEscalated} escalated`} tone="bad" /> : null}
                    <Pill label={`Budget used: ${Math.round(budgetUsedPct)}%`} tone={budgetUsedPct > 90 ? "bad" : budgetUsedPct > 75 ? "warn" : "good"} />
                    <Pill label={`Forecast: ${formatUGX(data.forecastMonthEnd)}`} tone={data.forecastMonthEnd > data.budgetMonth ? "warn" : "good"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Time</span>
                  <select
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value as any)}
                    className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                  >
                    <option>Today</option>
                    <option>This week</option>
                    <option>This month</option>
                    <option>This year</option>
                    <option>Custom</option>
                  </select>
                </div>

                {/* Custom Date Range Picker */}
                {timeframe === "Custom" && (
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <Calendar className="h-4 w-4 text-slate-500 dark:text-slate-400" />
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                      <span className="text-xs text-slate-500">to</span>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      />
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400">({data.periodLabel})</span>
                  </div>
                )}

                <Button variant="primary" onClick={() => setApprovalsOpen(true)}>
                  <BadgeCheck className="h-4 w-4" /> Approvals inbox
                </Button>
              </div>
            </div>

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Group</div>
                <select
                  value={filterGroup}
                  onChange={(e) => setFilterGroup(e.target.value as any)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="All">All</option>
                  {GROUPS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-700 dark:bg-slate-800">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Service Module</div>
                <select
                  value={filterModule}
                  onChange={(e) => {
                    const v = e.target.value as any;
                    setFilterModule(v);
                    if (v !== "All" && v !== "E-Commerce") setFilterMarketplace("All");
                  }}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-2 text-sm font-semibold text-slate-900 outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                >
                  <option value="All">All</option>
                  {SERVICE_MODULES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className={cn("rounded-2xl border px-3 py-2", marketplaceEnabled ? "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" : "border-slate-200 bg-slate-50 opacity-70 dark:border-slate-700 dark:bg-slate-800/50")}>
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Marketplace</div>
                <select
                  value={filterMarketplace}
                  disabled={!marketplaceEnabled}
                  onChange={(e) => setFilterMarketplace(e.target.value as any)}
                  className={cn(
                    "mt-1 w-full rounded-xl border px-2 py-2 text-sm font-semibold outline-none",
                    marketplaceEnabled ? "border-slate-200 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" : "border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                  )}
                >
                  <option value="All">All</option>
                  {MARKETPLACES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {!marketplaceEnabled ? <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Marketplace filters apply to E-Commerce only.</div> : null}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-8 transition-colors md:px-8 dark:bg-slate-950">
            {/* KPI row */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                title="Spend today"
                value={formatUGX(data.spendToday)}
                sub="All modules"
                icon={<CircleDollarSign className="h-5 w-5" />}
                trend={{ label: "+12% vs yesterday", tone: "good" }}
                variant="green"
              />
              <StatCard
                title="Spend this week"
                value={formatUGX(data.spendWeek)}
                sub="Week-to-date"
                icon={<TrendingUp className="h-5 w-5" />}
                trend={{ label: "Stable", tone: "neutral" }}
                variant="orange"
              />
              <StatCard
                title="Spend this month"
                value={formatUGX(data.spendMonth)}
                sub={`Budget: ${formatUGX(data.budgetMonth)}`}
                icon={<BarChart3 className="h-5 w-5" />}
                trend={{ label: `${Math.round(budgetUsedPct)}% used`, tone: budgetUsedPct > 90 ? "bad" : "warn" }}
                variant="gray"
              />
              <StatCard
                title="Budget remaining"
                value={formatUGX(data.budgetRemaining)}
                sub="Available this month"
                icon={<PiggyBank className="h-5 w-5" />}
                trend={{ label: data.budgetRemaining < 2000000 ? "Low" : "OK", tone: data.budgetRemaining < 2000000 ? "warn" : "good" }}
                variant="orange"
              />
              <StatCard
                title="Approvals pending"
                value={String(approvalsPending)}
                sub={approvalsEscalated ? `${approvalsEscalated} escalated` : "No escalations"}
                icon={<BadgeCheck className="h-5 w-5" />}
                trend={{ label: approvalsEscalated ? "Escalation" : "On track", tone: approvalsEscalated ? "bad" : "good" }}
                variant="green"
              />
              <StatCard
                title="Forecast month-end"
                value={formatUGX(data.forecastMonthEnd)}
                sub={data.forecastMonthEnd > data.budgetMonth ? "Over budget" : "Within budget"}
                icon={<LineChart className="h-5 w-5" />}
                trend={{ label: data.forecastMonthEnd > data.budgetMonth ? "Risk" : "OK", tone: data.forecastMonthEnd > data.budgetMonth ? "warn" : "good" }}
                variant="gray"
              />
            </div>





            {/* Account Health - Full Width */}
            <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Health</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Wallet, credit, and service status overview</p>
                </div>
                <div className="flex gap-2">
                  <Pill label={`Wallet: ${formatUGX(data.walletBalance)}`} tone={data.walletBalance < 1000000 ? "bad" : "good"} />
                  <Pill label={`Credit: ${Math.round(creditUsedPct)}% used`} tone={creditUsedPct > 80 ? "warn" : "neutral"} />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {/* Wallet */}
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                      <Wallet className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Wallet Balance</div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatUGX(data.walletBalance)}</div>
                  <div className="mt-2 text-xs text-slate-600 dark:text-slate-300">
                    Budget is allowance; wallet is prepaid funds; credit is postpaid limit.
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" className="w-full justify-center bg-white dark:bg-slate-800" onClick={() => setAddFundsOpen(true)}>Top up</Button>
                  </div>
                </div>

                {/* Credit */}
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Credit Usage</div>
                  </div>
                  <div className="text-3xl font-bold text-slate-900 dark:text-white">{formatUGX(data.creditUsed)} <span className="text-sm font-normal text-slate-500">/ {formatUGX(data.creditLimit)}</span></div>
                  <div className="mt-4">
                    <ProgressBar value={creditUsedPct} labelLeft="Used" labelRight={`${Math.round(creditUsedPct)}%`} />
                  </div>
                  {data.creditUsed > data.creditLimit ? (
                    <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs font-semibold text-rose-800 ring-1 ring-rose-200">
                      Credit over-limit: {formatUGX(data.creditUsed - data.creditLimit)} above limit. Approvals and service access may be restricted.
                    </div>
                  ) : null}
                </div>

                {/* Services */}
                <div className="rounded-3xl bg-slate-50 p-5 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Active Modules</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {SERVICE_MODULES.map(m => (
                      <button
                        key={m}
                        type="button"
                        className={cn(
                          "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer border",
                          serviceStatus[m]
                            ? "bg-[#064e3b] text-emerald-100 border-[#065f46] hover:bg-[#065f46] shadow-sm"
                            : "bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-500 dark:border-slate-700"
                        )}
                        onClick={() => {
                          setServiceStatus(p => ({ ...p, [m]: !p[m] }));
                          toast({ title: "Module toggle", message: `${m} ${!serviceStatus[m] ? "enabled" : "disabled"}`, kind: "info" });
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
              {/* Top issues + premium insights */}
              <div className="lg:col-span-4 space-y-8">
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Top Issues</h3>
                    <Pill label={`${issues.length}`} tone={issues.some(x => x.pill.tone === "bad") ? "bad" : "warn"} />
                  </div>
                  <div className="space-y-3">
                    {issues.map((x) => (
                      <button
                        key={x.title}
                        onClick={() => navigate("/console/notifications_activity")}
                        className="w-full rounded-2xl border border-slate-100 bg-slate-50 p-4 text-left transition-all hover:bg-white hover:shadow-md hover:ring-1 hover:ring-slate-200 dark:border-slate-800 dark:bg-slate-800/50 dark:hover:bg-slate-800 dark:hover:ring-slate-700"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white">{x.title}</div>
                            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{x.meta}</div>
                          </div>
                          <Pill label={x.pill.label} tone={x.pill.tone} />
                        </div>
                      </button>
                    ))}
                  </div>
                  <Button variant="ghost" className="mt-4 w-full text-xs" onClick={() => navigate("/console/notifications_activity")}>
                    View all notifications
                  </Button>
                </div>


              </div>

              {/* Heatmaps & Leaders - Center/Right */}
              <div className="lg:col-span-8 flex flex-col gap-8">
                {/* Heatmap */}
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Peak Ride Times</h3>
                      <p className="text-sm text-slate-500">Ride volume heat distribution</p>
                    </div>
                    <div className="flex items-center gap-2">
                       <Button variant="outline" className="h-8 text-xs" onClick={() => toast({ title: "Updated", message: "Data refreshed", kind: "success" })}>
                        <Download className="h-3 w-3 mr-2" />
                        Import Data
                      </Button>
                    </div>
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-slate-800">
                    <div className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                      <SimpleLineChart
                        mode={peakMode}
                        onModeChange={setPeakMode}
                        data={heat.cols.map((col, i) => {
                          // Aggregate rows for each column, with demo switcher scaling.
                          const rides = heat.matrix.reduce((sum, row) => sum + row[i], 0);
                          const delivery = Math.round(rides * 0.65);
                          const total = peakMode === "rides" ? rides : peakMode === "delivery" ? delivery : rides + delivery;
                          return { label: col, value: total };
                        })}
                      />
                    </div>
                  </div>
                </div>

                {/* Leaders Lists - Side by Side internal */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <ListCard
                    title="Top Vendors"
                    subtitle="By spend volume"
                    icon={<Store className="h-4 w-4" />}
                    actionLabel="View All"
                    onAction={() => navigate("/console/reporting")}
                    items={[
                      { title: "Shenzhen Store", meta: `UGX ${formatUGX(5200000)}`, pill: { label: "Anomaly", tone: "warn" } },
                      { title: "Kampala Office Mart", meta: `UGX ${formatUGX(3100000)}`, pill: { label: "Preferred", tone: "good" } },
                      { title: "City Courier", meta: `UGX ${formatUGX(820000)}`, pill: { label: "OK", tone: "neutral" } },
                    ]}
                  />
                  <ListCard
                    title="Top Routes"
                    subtitle="Most frequent trips"
                    icon={<MapPin className="h-4 w-4" />}
                    actionLabel="View All"
                    onAction={() => navigate("/console/travel")}
                    items={[
                      { title: "Office → Airport", meta: "36 trips • Avg UGX 82k", pill: { label: "Peak", tone: "warn" } },
                      { title: "Office → Client HQ", meta: "29 trips • Avg UGX 41k", pill: { label: "OK", tone: "neutral" } },
                      { title: "Office → Warehouse", meta: "18 trips • Avg UGX 35k", pill: { label: "OK", tone: "neutral" } },
                    ]}
                  />
                </div>
              </div>

              {/* Forecast table - Full Width */}
              <div className="lg:col-span-12 rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Budget Forecast</h3>
                    <p className="text-sm text-slate-500">Projected month-end spend vs budget</p>
                  </div>
                  <Pill label={`Day ${data.monthDay} of ${data.daysInMonth}`} tone="neutral" />
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 dark:border-slate-800">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-400">
                          <tr>
                            <th className="px-5 py-3">Group</th>
                            <th className="px-5 py-3 text-right">MTD Spend</th>
                            <th className="px-5 py-3 text-right">Forecast</th>
                            <th className="px-5 py-3 text-right">Budget</th>
                            <th className="px-5 py-3 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                          {forecastByGroup.map(r => (
                            <tr key={r.group} className="hover:bg-slate-50/50">
                              <td className="px-5 py-3 font-medium text-slate-900 dark:text-white">{r.group}</td>
                              <td className="px-5 py-3 text-right text-slate-600 dark:text-slate-300">{formatUGX(r.mtd)}</td>
                              <td className="px-5 py-3 text-right font-medium text-slate-900 dark:text-white">{formatUGX(r.forecast)}</td>
                              <td className="px-5 py-3 text-right text-slate-500">{formatUGX(r.budget)}</td>
                              <td className="px-5 py-3 text-center">
                                <Pill label={r.risk === "bad" ? "Over" : r.risk === "warn" ? "Risk" : "OK"} tone={r.risk} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <div className="space-y-4">
                      <MixBar
                        title="Service Modules"
                        total={moduleSpendTotal}
                        rows={forecastByModule.slice(0, 5).map(m => ({ label: m.module, value: m.mtd }))}
                      />
                      <MixBar
                        title="Marketplaces"
                        total={marketplaceSpendTotal}
                        rows={forecastByMarketplace.slice(0, 5).map(m => ({ label: m.marketplace, value: m.mtd }))}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center lg:col-span-12">
                <div className="inline-block rounded-full bg-slate-100 px-4 py-2 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  CorporatePay v2.5 • Everything is up to date
                </div>
              </div>

              {/* Quick Actions Bar - Moved to bottom */}
              <div className="mt-8 lg:col-span-12">
                <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-lg font-bold text-slate-900 dark:text-white">Quick Actions</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">Fast paths to high-impact workflows</div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="primary" onClick={() => setAddFundsOpen(true)} className="shadow-lg shadow-emerald-500/10">
                        <Wallet className="h-4 w-4" /> Add funds
                      </Button>
                      <Button variant="outline" onClick={() => setIssueBudgetOpen(true)}>
                        <PiggyBank className="h-4 w-4" /> Issue budget
                      </Button>
                      <Button variant="outline" onClick={() => setApprovalsOpen(true)}>
                        <BadgeCheck className="h-4 w-4" /> Approve queue
                      </Button>
                      <Button variant="outline" onClick={() => setRfqOpen(true)}>
                        <FileText className="h-4 w-4" /> Create RFQ
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

            </div> {/* Close grid-cols-12 */}
          </div>
        </div>
      </div>

      {/* Add funds modal */}
      <Modal
        open={addFundsOpen}
        title="Add funds"
        subtitle="Top up wallet or add prepaid deposit. (Demo)"
        onClose={() => setAddFundsOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setAddFundsOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setAddFundsOpen(false);
                setWalletBalance((prev) => prev + fundDraft.amount);
                toast({ title: "Funds added", message: `${fundDraft.method}: ${formatUGX(fundDraft.amount)}`, kind: "success" });
              }}
            >
              <Wallet className="h-4 w-4" /> Confirm
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Method</div>
            <select
              value={fundDraft.method}
              onChange={(e) => setFundDraft((p) => ({ ...p, method: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              <option>Wallet top-up</option>
              <option>Prepaid deposit</option>
              <option>Credit repayment</option>
            </select>
            <div className="mt-2 text-xs text-slate-500">Payment rails configured under Finance & Payments.</div>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Amount (UGX)</div>
            <input
              type="number"
              min={0}
              onKeyDown={(e) => (e.key === "-" || e.key === "e") && e.preventDefault()}
              value={fundDraft.amount}
              onChange={(e) => {
                const v = Number(e.target.value || 0);
                if (v >= 0) setFundDraft((p) => ({ ...p, amount: v }));
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
            <div className="mt-2 text-xs text-slate-500">Preview: {formatUGX(fundDraft.amount)}</div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Reference (optional)</div>
            <input
              value={fundDraft.reference}
              onChange={(e) => setFundDraft((p) => ({ ...p, reference: e.target.value }))}
              placeholder="Bank/txn reference"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
            Premium: large funding events can require approvals and are fully audit logged.
          </div>
        </div>
      </Modal>

      {/* Issue budget modal */}
      <Modal
        open={issueBudgetOpen}
        title="Issue budget"
        subtitle="Allocate budget to a group (and optionally module/marketplace)."
        onClose={() => setIssueBudgetOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIssueBudgetOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setIssueBudgetOpen(false);
                setIssuedBudgets(curr => [{
                  id: uid('budget'),
                  group: budgetDraft.group,
                  amount: Number(budgetDraft.amount),
                  period: budgetDraft.period,
                  timestamp: new Date()
                }, ...curr]);
                toast({ title: "Budget issued", message: `${budgetDraft.group}: ${formatUGX(budgetDraft.amount)} (${budgetDraft.period})`, kind: "success" });
              }}
            >
              <PiggyBank className="h-4 w-4" /> Issue
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Group</div>
            <select
              value={budgetDraft.group}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, group: e.target.value as any }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              {GROUPS.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Period</div>
            <select
              value={budgetDraft.period}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, period: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              {"Weekly,Monthly,Quarterly,Annual".split(",").map((x) => (
                <option key={x} value={x}>{x}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Service Module (optional)</div>
            <select
              value={budgetDraft.module}
              onChange={(e) => {
                const v = e.target.value as any;
                setBudgetDraft((p) => ({ ...p, module: v, marketplace: v === "E-Commerce" ? p.marketplace : "All" }));
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              <option value="All">All</option>
              {SERVICE_MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className={cn("", budgetDraft.module === "E-Commerce" ? "" : "opacity-60")}>
            <div className="text-xs font-semibold text-slate-600">Marketplace (optional)</div>
            <select
              value={budgetDraft.marketplace}
              disabled={budgetDraft.module !== "E-Commerce" && budgetDraft.module !== "All"}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, marketplace: e.target.value as any }))}
              className={cn(
                "mt-2 w-full rounded-2xl border px-3 py-2.5 text-sm font-semibold outline-none",
                budgetDraft.module === "E-Commerce" || budgetDraft.module === "All" ? "border-slate-200 bg-white text-slate-900" : "border-slate-200 bg-slate-50 text-slate-500"
              )}
            >
              <option value="All">All</option>
              {MARKETPLACES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Amount (UGX)</div>
            <input
              type="number"
              min={0}
              onKeyDown={(e) => (e.key === "-" || e.key === "e") && e.preventDefault()}
              value={budgetDraft.amount}
              onChange={(e) => {
                const v = Number(e.target.value || 0);
                if (v >= 0) setBudgetDraft((p) => ({ ...p, amount: v }));
              }}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Hard cap</div>
                <div className="mt-1 text-xs text-slate-600">Block spend when budget exceeded</div>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  budgetDraft.hardCap ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                )}
                onClick={() => setBudgetDraft((p) => ({ ...p, hardCap: !p.hardCap }))}
                aria-label="Toggle hard cap"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                    budgetDraft.hardCap ? "left-[22px]" : "left-1"
                  )}
                />
              </button>
            </div>
          </div>
          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
            Premium: high budget increases can require multi-level approvals.
          </div>
        </div>
      </Modal>

      {/* RFQ modal */}
      <Modal
        open={rfqOpen}
        title="Create RFQ / Quote request"
        subtitle="High-value assets and quotes with approval-aware workflow."
        onClose={() => setRfqOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setRfqOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                setRfqOpen(false);
                toast({ title: "RFQ created", message: `${rfqDraft.title} • ${formatUGX(rfqDraft.estValue)}`, kind: "success" });
                setApprovals((p) => [{
                  id: `RFQ-${Math.floor(100 + Math.random() * 900)}`,
                  type: "RFQ",
                  module: rfqDraft.module,
                  marketplace: "-",
                  requester: "You",
                  group: (budgetDraft.group as Group) || "Admin",
                  amount: rfqDraft.estValue,
                  slaHours: 4,
                  ageMinutes: 1,
                  status: "Pending",
                  needsAttachment: !rfqDraft.attachments,
                }, ...p]);
              }}
            >
              <FileText className="h-4 w-4" /> Create
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Title</div>
            <input
              value={rfqDraft.title}
              onChange={(e) => setRfqDraft((p) => ({ ...p, title: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Service Module</div>
            <select
              value={rfqDraft.module}
              onChange={(e) => setRfqDraft((p) => ({ ...p, module: e.target.value as any }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            >
              {SERVICE_MODULES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Needed by</div>
            <input
              type="date"
              value={rfqDraft.neededBy}
              onChange={(e) => setRfqDraft((p) => ({ ...p, neededBy: e.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-600">Estimated value (UGX)</div>
            <input
              type="number"
              value={rfqDraft.estValue}
              onChange={(e) => setRfqDraft((p) => ({ ...p, estValue: Number(e.target.value || 0) }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
            <div className="mt-2 text-xs text-slate-500">This can be paid via milestones after quote approval.</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <div className="flex flex-col gap-2">
              <div>
                <div className="text-sm font-semibold text-slate-900">Attachments</div>
                <div className="mt-1 text-xs text-slate-600">Specs, PDFs, drawings</div>
              </div>
              <input
                type="file"
                multiple
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-emerald-700 hover:file:bg-emerald-100"
                onChange={(e) => {
                  // In a real app, we would upload these
                  if (e.target.files?.length) {
                    setRfqDraft((p) => ({ ...p, attachments: true }));
                  }
                }}
              />
            </div>
          </div>
          <div className="md:col-span-2">
            <div className="text-xs font-semibold text-slate-600">Description</div>
            <textarea
              value={rfqDraft.description}
              onChange={(e) => setRfqDraft((p) => ({ ...p, description: e.target.value }))}
              rows={5}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
            />
          </div>
          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Premium: RFQs can be routed to CFO/CEO approvals and converted to PO with milestone payments.
          </div>
        </div>
      </Modal>

      <Modal
        open={approvalsOpen}
        title="Approvals inbox"
        subtitle="Unified approvals: rides, purchases, services, and RFQs."
        onClose={() => setApprovalsOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setApprovalsOpen(false)}>Close</Button>
          </div>
        }
        maxW="95vw"
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md p-4"> {/* Added shadow and padding */}
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">ID</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Module</th>
                <th className="px-4 py-3 font-semibold">Marketplace</th>
                <th className="px-4 py-3 font-semibold">Group</th>
                <th className="px-4 py-3 font-semibold">Amount</th>
                <th className="px-4 py-3 font-semibold">SLA</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Required</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => (
                <tr key={a.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900">{a.id}</td>
                  <td className="px-4 py-3 text-slate-700">{a.type}</td>
                  <td className="px-4 py-3 text-slate-700">{a.module}</td>
                  <td className="px-4 py-3 text-slate-700">{a.marketplace}</td>
                  <td className="px-4 py-3 text-slate-700">{a.group}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(a.amount)}</td>
                  <td className="px-4 py-3"><Pill label={`${a.slaHours}h`} tone={a.status === "Escalated" ? "bad" : "neutral"} /></td>
                  <td className="px-4 py-3"><Pill label={a.status} tone={a.status === "Escalated" ? "bad" : "warn"} /></td>
                  <td className="px-4 py-3">
                    {a.needsAttachment ? <Pill label="Attachment" tone="warn" /> : <Pill label="OK" tone="good" />}
                  </td>
                  <td className="px-4 py-3 relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenActionId(openActionId === a.id ? null : a.id);
                      }}
                      className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {openActionId === a.id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenActionId(null)} />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -5 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -5 }}
                            className="absolute right-8 top-1/2 -translate-y-1/2 z-20 w-32 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden"
                          >
                            <button
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                              onClick={() => {
                                toast({ title: "Open", message: `Opening ${a.id}...`, kind: "info" });
                                setOpenActionId(null);
                              }}
                            >
                              Open details
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-emerald-600 hover:bg-emerald-50"
                              onClick={() => {
                                setApprovals((p) => p.filter((x) => x.id !== a.id));
                                toast({ title: "Approved", message: `${a.id} approved.`, kind: "success" });
                                setOpenActionId(null);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                              onClick={() => {
                                setApprovals((p) => p.filter((x) => x.id !== a.id));
                                toast({ title: "Rejected", message: `${a.id} rejected.`, kind: "warn" });
                                setOpenActionId(null);
                              }}
                            >
                              Reject
                            </button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </td>
                </tr>
              ))}
              {!approvals.length ? (
                <tr>
                  <td colSpan={10} className="px-4 py-10 text-center text-sm text-slate-600">
                    No approvals in queue.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
          Premium: SLA timers, delegation routing, and load balancing are configured in Approval Workflow Builder (Round 4J).
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
          A Corporate Dashboard v2: KPIs, account health, issues, heatmaps, quick actions, and premium insights with forecasts by group/module/marketplace.
        </div>
      </footer>
    </div >
  );
}