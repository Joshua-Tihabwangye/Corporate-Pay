import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  BatteryCharging,
  Check,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  Leaf,
  LineChart,
  Mail,
  Settings2,
  Sparkles,
  Timer,
  Zap,
  X,
  Search,
  MoreVertical,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type ServiceModule = "EVs & Charging" | "Rides & Logistics" | "E-Commerce" | "Other Service Module";

type GroupName = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type VehicleType = "EV" | "ICE";

type MobilityType = "Ride" | "Delivery" | "Commute";

type TimeRange = "7d" | "30d" | "90d" | "YTD" | "Custom";

type Risk = "Low" | "Medium" | "High";

type ChargingSite = "Kampala HQ" | "Entebbe Fast Hub" | "Jinja Road Hub" | "Other";

type MobilityEvent = {
  id: string;
  ts: number;
  group: GroupName;
  costCenter: string;
  requester: string;
  mobilityType: MobilityType;
  vehicleType: VehicleType;
  km: number;
  module: ServiceModule;
  tags: string[];
  risk: Risk;
};

type ChargingSession = {
  id: string;
  ts: number;
  group: GroupName;
  costCenter: string;
  vehicleType: "EV";
  site: ChargingSite;
  kWh: number;
  costUGX: number;
  offPeak: boolean;
  hasReceipt: boolean;
  module: "EVs & Charging";
  tags: string[];
};

type EmissionFactors = {
  gridKgCO2ePerKWh: number; // Scope 2 proxy
  iceKgCO2ePerKm: number; // baseline proxy
  renewableSharePct: number; // 0..100
};

type ESGTemplateId = "Internal ESG Template v1" | "Scorecard Template v1" | "Mobility Emissions Template v1" | "Other";

type ExportFormat = "CSV" | "JSON" | "PDF";

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

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function formatNumber(n: number, digits = 0) {
  const v = Number(n || 0);
  return v.toLocaleString(undefined, { maximumFractionDigits: digits, minimumFractionDigits: digits });
}

function formatKg(n: number) {
  const v = Number(n || 0);
  if (v >= 1000) return `${formatNumber(v / 1000, 2)} tCO2e`;
  return `${formatNumber(v, 0)} kgCO2e`;
}

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
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

function getRange(range: TimeRange, customFrom?: string, customTo?: string) {
  const now = new Date();
  const end = now.getTime();
  const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
  const day = 24 * 60 * 60 * 1000;

  if (range === "7d") return { start: end - 7 * day, end };
  if (range === "30d") return { start: end - 30 * day, end };
  if (range === "90d") return { start: end - 90 * day, end };
  if (range === "YTD") return { start: startOfYear, end };

  const s = customFrom ? new Date(customFrom).getTime() : end - 30 * day;
  const e = customTo ? new Date(customTo).getTime() + (24 * 60 * 60 * 1000 - 1) : end;
  return { start: Number.isFinite(s) ? s : end - 30 * day, end: Number.isFinite(e) ? e : end };
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
  min = 0,
  max = 999999,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className={cn(disabled && "opacity-70")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-slate-600">{label}</div>
        {hint ? <div className="text-xs text-slate-500">{hint}</div> : null}
      </div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Number.isFinite(value) ? value : 0}
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
        <Leaf className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function StatCard({
  title,
  value,
  sub,
  icon,
  tone = "neutral",
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad" | "info";
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

function ProgressRing({ value, label }: { value: number; label: string }) {
  const pct = clamp(value, 0, 100);
  const size = 82;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500">{label}</div>
          <div className="mt-1 text-sm font-semibold text-slate-900">{Math.round(pct)}%</div>
        </div>
        <div className="relative grid place-items-center">
          <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={r} stroke="#E2E8F0" strokeWidth={stroke} fill="none" />
            <circle
              cx={size / 2}
              cy={size / 2}
              r={r}
              stroke={EVZ.green}
              strokeWidth={stroke}
              fill="none"
              strokeDasharray={`${dash} ${c}`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute text-sm font-semibold text-slate-900">{Math.round(pct)}%</div>
        </div>
      </div>
    </div>
  );
}

function BarRow({ label, value, total, right }: { label: string; value: number; total: number; right?: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-500">{pct}% share</div>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-slate-900">{right ?? formatNumber(value, 0)}</div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: EVZ.green }} />
      </div>
    </div>
  );
}

function gradeFromScore(score: number) {
  const s = clamp(score, 0, 100);
  if (s >= 85) return { label: "A", tone: "good" as const };
  if (s >= 70) return { label: "B", tone: "info" as const };
  if (s >= 55) return { label: "C", tone: "warn" as const };
  return { label: "D", tone: "bad" as const };
}

export default function CorporatePaySustainabilityESGReportingV2() {
  const GROUPS: GroupName[] = ["Operations", "Sales", "Finance", "Admin", "Procurement"];
  const COST_CENTERS = ["OPS-001", "SALES-TRAVEL", "FIN-OPS", "ADMIN-001", "PROC-001"];

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  // Data tracking toggle
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  // Filters
  const [tab, setTab] = useState<"overview" | "ev-usage" | "charging" | "emissions" | "scorecards" | "templates">("overview");
  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customFrom, setCustomFrom] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState<string>(new Date().toISOString().slice(0, 10));

  const [groupFilter, setGroupFilter] = useState<GroupName | "All">("All");
  const [costCenterFilter, setCostCenterFilter] = useState<string | "All">("All");

  const [q, setQ] = useState("");

  // Emissions assumptions (editable). Defaults are placeholders for demo. Set values to match your internal standards.
  const [factors, setFactors] = useState<EmissionFactors>({
    gridKgCO2ePerKWh: 0.45,
    iceKgCO2ePerKm: 0.2,
    renewableSharePct: 0,
  });

  const [factorsOpen, setFactorsOpen] = useState(false);

  // Export templates
  const TEMPLATE_IDS: ESGTemplateId[] = [
    "Internal ESG Template v1",
    "Scorecard Template v1",
    "Mobility Emissions Template v1",
    "Other",
  ];

  const [exportOpen, setExportOpen] = useState(false);
  const [templateId, setTemplateId] = useState<ESGTemplateId>("Internal ESG Template v1");
  const [exportFormat, setExportFormat] = useState<ExportFormat>("CSV");
  const [exportName, setExportName] = useState("ESG Report");

  const range = useMemo(() => getRange(timeRange, customFrom, customTo), [timeRange, customFrom, customTo]);

  // Seed dataset
  const dataset = useMemo(() => {
    const rand = lcg(2026);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const requesterPool = ["Mary N.", "John S.", "Irene K.", "Daisy O.", "Procurement Desk", "Admin Desk"];

    const mobility: MobilityEvent[] = [];
    const charging: ChargingSession[] = [];

    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
    const pickWeighted = <T,>(items: Array<{ item: T; w: number }>) => {
      const sum = items.reduce((a, b) => a + b.w, 0);
      let r = rand() * sum;
      for (const x of items) {
        r -= x.w;
        if (r <= 0) return x.item;
      }
      return items[items.length - 1].item;
    };

    const groupCostMap: Record<GroupName, string[]> = {
      Operations: ["OPS-001"],
      Sales: ["SALES-TRAVEL"],
      Finance: ["FIN-OPS"],
      Admin: ["ADMIN-001"],
      Procurement: ["PROC-001"],
    };

    const evShareByGroup: Record<GroupName, number> = {
      Operations: 0.62,
      Sales: 0.44,
      Finance: 0.35,
      Admin: 0.25,
      Procurement: 0.28,
    };

    const sites: ChargingSite[] = ["Kampala HQ", "Entebbe Fast Hub", "Jinja Road Hub", "Other"];

    // Generate 90 days of events
    for (let d = 0; d < 90; d++) {
      const dayTs = now - d * day;

      for (const g of GROUPS) {
        const costCenter = pick(groupCostMap[g]);

        // Mobility events
        const count = 1 + Math.floor(rand() * 4); // 1..4 per group per day
        for (let i = 0; i < count; i++) {
          const h = Math.floor(rand() * 24);
          const ts = dayTs + h * 60 * 60 * 1000 + Math.floor(rand() * 50) * 60000;

          const mobilityType = pickWeighted<MobilityType>([
            { item: "Ride", w: 1.0 },
            { item: "Delivery", w: 0.35 },
            { item: "Commute", w: 0.55 },
          ]);

          const isEV = rand() < evShareByGroup[g];
          const km = Math.round((4 + rand() * 26) * 10) / 10; // 4..30 km
          const risk: Risk = isEV ? (rand() < 0.07 ? "Medium" : "Low") : rand() < 0.08 ? "Medium" : "Low";

          const tags =
            mobilityType === "Ride"
              ? pickWeighted([{ item: ["Client"], w: 1 }, { item: ["Airport"], w: 0.4 }, { item: ["Commute"], w: 0.6 }])
              : mobilityType === "Delivery"
              ? ["Delivery"]
              : ["Commute"];

          mobility.push({
            id: uid("MOB"),
            ts,
            group: g,
            costCenter,
            requester: pick(requesterPool),
            mobilityType,
            vehicleType: isEV ? "EV" : "ICE",
            km,
            module: "Rides & Logistics",
            tags,
            risk,
          });

          // Create charging sessions for some EV mobility
          if (isEV && rand() < 0.26) {
            const site = pickWeighted<ChargingSite>([
              { item: "Kampala HQ", w: 1.2 },
              { item: "Jinja Road Hub", w: 0.6 },
              { item: "Entebbe Fast Hub", w: 0.45 },
              { item: "Other", w: 0.2 },
            ]);
            const hour = pickWeighted<number>([
              { item: 8, w: 0.9 },
              { item: 18, w: 1.0 },
              { item: Math.floor(rand() * 24), w: 0.8 },
            ]);
            const cts = dayTs + hour * 60 * 60 * 1000 + Math.floor(rand() * 45) * 60000;
            const offPeak = !(hour >= 7 && hour <= 9) && !(hour >= 17 && hour <= 20);
            const kWh = Math.round((8 + rand() * 42) * 10) / 10;
            const price = offPeak ? 1050 : 1350;
            const costUGX = Math.round(kWh * price);
            const hasReceipt = rand() < 0.9;

            charging.push({
              id: uid("CHG"),
              ts: cts,
              group: g,
              costCenter,
              vehicleType: "EV",
              site,
              kWh,
              costUGX,
              offPeak,
              hasReceipt,
              module: "EVs & Charging",
              tags: ["Charging", offPeak ? "Off-peak" : "Peak"],
            });
          }
        }

        // Some direct charging outside mobility generation
        if (rand() < 0.14) {
          const site = pick(sites);
          const hour = pickWeighted<number>([
            { item: 19, w: 1.0 },
            { item: 13, w: 0.6 },
            { item: Math.floor(rand() * 24), w: 0.6 },
          ]);
          const cts = dayTs + hour * 60 * 60 * 1000 + Math.floor(rand() * 45) * 60000;
          const offPeak = !(hour >= 7 && hour <= 9) && !(hour >= 17 && hour <= 20);
          const kWh = Math.round((10 + rand() * 50) * 10) / 10;
          const price = offPeak ? 1050 : 1350;
          const costUGX = Math.round(kWh * price);
          const hasReceipt = rand() < 0.88;

          charging.push({
            id: uid("CHG"),
            ts: cts,
            group: g,
            costCenter,
            vehicleType: "EV",
            site,
            kWh,
            costUGX,
            offPeak,
            hasReceipt,
            module: "EVs & Charging",
            tags: ["Charging", offPeak ? "Off-peak" : "Peak"],
          });
        }
      }
    }

    return {
      mobility,
      charging,
    };
  }, []);

  const filteredMobility = useMemo(() => {
    if (!trackingEnabled) return [] as MobilityEvent[];
    const query = q.trim().toLowerCase();
    return dataset.mobility
      .filter((m) => m.ts >= range.start && m.ts <= range.end)
      .filter((m) => (groupFilter === "All" ? true : m.group === groupFilter))
      .filter((m) => (costCenterFilter === "All" ? true : m.costCenter === costCenterFilter))
      .filter((m) => {
        if (!query) return true;
        const blob = `${m.requester} ${m.group} ${m.costCenter} ${m.mobilityType} ${m.vehicleType} ${m.tags.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [dataset.mobility, range.start, range.end, groupFilter, costCenterFilter, q, trackingEnabled]);

  const filteredCharging = useMemo(() => {
    if (!trackingEnabled) return [] as ChargingSession[];
    const query = q.trim().toLowerCase();
    return dataset.charging
      .filter((c) => c.ts >= range.start && c.ts <= range.end)
      .filter((c) => (groupFilter === "All" ? true : c.group === groupFilter))
      .filter((c) => (costCenterFilter === "All" ? true : c.costCenter === costCenterFilter))
      .filter((c) => {
        if (!query) return true;
        const blob = `${c.site} ${c.group} ${c.costCenter} ${c.tags.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [dataset.charging, range.start, range.end, groupFilter, costCenterFilter, q, trackingEnabled]);

  // Core totals
  const totals = useMemo(() => {
    const kmEV = filteredMobility.filter((m) => m.vehicleType === "EV").reduce((a, b) => a + b.km, 0);
    const kmICE = filteredMobility.filter((m) => m.vehicleType === "ICE").reduce((a, b) => a + b.km, 0);
    const kmAll = kmEV + kmICE;

    const kWh = filteredCharging.reduce((a, b) => a + b.kWh, 0);
    const chargingSpend = filteredCharging.reduce((a, b) => a + b.costUGX, 0);
    const sessions = filteredCharging.length;
    const offPeakPct = sessions ? Math.round((filteredCharging.filter((c) => c.offPeak).length / sessions) * 100) : 0;
    const receiptPct = sessions ? Math.round((filteredCharging.filter((c) => c.hasReceipt).length / sessions) * 100) : 0;

    const evSharePct = kmAll ? Math.round((kmEV / kmAll) * 100) : 0;

    return {
      kmEV,
      kmICE,
      kmAll,
      evSharePct,
      kWh,
      chargingSpend,
      sessions,
      offPeakPct,
      receiptPct,
    };
  }, [filteredMobility, filteredCharging]);

  // Emissions estimates
  const emissions = useMemo(() => {
    const renewable = clamp(factors.renewableSharePct, 0, 100) / 100;
    const effectiveGridFactor = Math.max(0, factors.gridKgCO2ePerKWh) * (1 - renewable);

    const evScope2Kg = totals.kWh * effectiveGridFactor;
    const iceKg = totals.kmICE * Math.max(0, factors.iceKgCO2ePerKm);

    // Avoided emissions if EV km would otherwise have been ICE
    const baselineIceForEVkm = totals.kmEV * Math.max(0, factors.iceKgCO2ePerKm);
    const avoidedKg = Math.max(0, baselineIceForEVkm - evScope2Kg);

    const intensityKgPerKm = totals.kmAll > 0 ? (iceKg + evScope2Kg) / totals.kmAll : 0;
    const evIntensityKgPerKm = totals.kmEV > 0 ? evScope2Kg / totals.kmEV : 0;

    return {
      effectiveGridFactor,
      evScope2Kg,
      iceKg,
      avoidedKg,
      intensityKgPerKm,
      evIntensityKgPerKm,
      baselineIceForEVkm,
    };
  }, [totals, factors]);

  // Scorecards (premium)
  const scorecards = useMemo(() => {
    // Simple scorecards, all explainable and deterministic
    const adoptionScore = totals.evSharePct; // 0..100
    const offPeakScore = totals.offPeakPct; // 0..100
    const dataQualityScore = totals.receiptPct; // receipts present
    const renewableScore = clamp(factors.renewableSharePct, 0, 100);

    // Normalize emissions intensity: lower is better.
    // 0.25 kg/km -> 50, 0.15 -> 80, 0.10 -> 95
    const intensity = emissions.intensityKgPerKm;
    const intensityScore = clamp(100 - intensity * 300, 0, 100);

    // Weighted sustainability score
    const overall = Math.round(
      adoptionScore * 0.28 +
        offPeakScore * 0.18 +
        renewableScore * 0.18 +
        dataQualityScore * 0.18 +
        intensityScore * 0.18
    );

    return {
      adoptionScore,
      offPeakScore,
      renewableScore,
      dataQualityScore,
      intensityScore,
      overall,
    };
  }, [totals.evSharePct, totals.offPeakPct, totals.receiptPct, factors.renewableSharePct, emissions.intensityKgPerKm]);

  // Breakdowns
  const breakdownByGroup = useMemo(() => {
    const map = new Map<GroupName, { kmEV: number; kmICE: number; kWh: number; spend: number }>();
    for (const g of GROUPS) map.set(g, { kmEV: 0, kmICE: 0, kWh: 0, spend: 0 });

    filteredMobility.forEach((m) => {
      const row = map.get(m.group) || { kmEV: 0, kmICE: 0, kWh: 0, spend: 0 };
      if (m.vehicleType === "EV") row.kmEV += m.km;
      else row.kmICE += m.km;
      map.set(m.group, row);
    });

    filteredCharging.forEach((c) => {
      const row = map.get(c.group) || { kmEV: 0, kmICE: 0, kWh: 0, spend: 0 };
      row.kWh += c.kWh;
      row.spend += c.costUGX;
      map.set(c.group, row);
    });

    const rows = Array.from(map.entries()).map(([group, v]) => ({ group, ...v, kmAll: v.kmEV + v.kmICE }));
    rows.sort((a, b) => b.kmAll - a.kmAll);
    return rows;
  }, [filteredMobility, filteredCharging]);

  const chargingBySite = useMemo(() => {
    const map = new Map<ChargingSite, { sessions: number; kWh: number; spend: number; offPeak: number }>();
    const sites: ChargingSite[] = ["Kampala HQ", "Entebbe Fast Hub", "Jinja Road Hub", "Other"];
    sites.forEach((s) => map.set(s, { sessions: 0, kWh: 0, spend: 0, offPeak: 0 }));

    filteredCharging.forEach((c) => {
      const row = map.get(c.site) || { sessions: 0, kWh: 0, spend: 0, offPeak: 0 };
      row.sessions += 1;
      row.kWh += c.kWh;
      row.spend += c.costUGX;
      row.offPeak += c.offPeak ? 1 : 0;
      map.set(c.site, row);
    });

    return Array.from(map.entries())
      .map(([site, v]) => ({ site, ...v, offPeakPct: v.sessions ? Math.round((v.offPeak / v.sessions) * 100) : 0 }))
      .sort((a, b) => b.kWh - a.kWh);
  }, [filteredCharging]);

  const exportESG = () => {
    const meta = {
      name: exportName.trim() || "ESG Report",
      generatedAt: new Date().toISOString(),
      timeRange,
      customFrom: timeRange === "Custom" ? customFrom : undefined,
      customTo: timeRange === "Custom" ? customTo : undefined,
      filters: {
        group: groupFilter,
        costCenter: costCenterFilter,
        query: q || undefined,
      },
      factors,
    };

    // Template payloads (aligned to internal template shapes)
    const base = {
      meta,
      core: {
        evKm: totals.kmEV,
        iceKm: totals.kmICE,
        totalKm: totals.kmAll,
        evSharePct: totals.evSharePct,
        chargingKWh: totals.kWh,
        chargingSpendUGX: totals.chargingSpend,
        chargingSessions: totals.sessions,
        chargingOffPeakPct: totals.offPeakPct,
        receiptCoveragePct: totals.receiptPct,
      },
      emissions: {
        effectiveGridKgCO2ePerKWh: emissions.effectiveGridFactor,
        evScope2KgCO2e: emissions.evScope2Kg,
        iceKgCO2e: emissions.iceKg,
        avoidedKgCO2e: emissions.avoidedKg,
        intensityKgCO2ePerKm: emissions.intensityKgPerKm,
      },
      scorecards: {
        overall: scorecards.overall,
        adoption: scorecards.adoptionScore,
        offPeak: scorecards.offPeakScore,
        renewable: scorecards.renewableScore,
        dataQuality: scorecards.dataQualityScore,
        intensity: scorecards.intensityScore,
      },
    };

    if (exportFormat === "JSON") {
      const payload = {
        templateId,
        ...base,
        breakdowns: {
          byGroup: breakdownByGroup,
          chargingBySite,
        },
      };
      downloadText(`${exportName || "esg"}.json`, JSON.stringify(payload, null, 2), "application/json");
      toast({ title: "Exported", message: "JSON downloaded.", kind: "success" });
      setExportOpen(false);
      return;
    }

    if (exportFormat === "CSV") {
      if (templateId === "Scorecard Template v1") {
        const rows = [
          {
            reportName: meta.name,
            generatedAt: meta.generatedAt,
            timeRange: meta.timeRange,
            group: meta.filters.group,
            costCenter: meta.filters.costCenter,
            overallScore: scorecards.overall,
            adoptionScore: scorecards.adoptionScore,
            offPeakScore: scorecards.offPeakScore,
            renewableScore: scorecards.renewableScore,
            dataQualityScore: scorecards.dataQualityScore,
            intensityScore: scorecards.intensityScore,
          },
        ];
        const csv = toCSV(rows, [
          { key: "reportName", label: "report_name" },
          { key: "generatedAt", label: "generated_at" },
          { key: "timeRange", label: "time_range" },
          { key: "group", label: "group" },
          { key: "costCenter", label: "cost_center" },
          { key: "overallScore", label: "overall_score" },
          { key: "adoptionScore", label: "adoption_score" },
          { key: "offPeakScore", label: "offpeak_score" },
          { key: "renewableScore", label: "renewable_score" },
          { key: "dataQualityScore", label: "data_quality_score" },
          { key: "intensityScore", label: "intensity_score" },
        ]);
        downloadText(`${exportName || "esg"}-scorecard.csv`, csv, "text/csv");
        toast({ title: "Exported", message: "CSV downloaded.", kind: "success" });
        setExportOpen(false);
        return;
      }

      if (templateId === "Mobility Emissions Template v1") {
        const rows = breakdownByGroup.map((r) => {
          const kmAll = r.kmAll;
          const evPct = kmAll ? Math.round((r.kmEV / kmAll) * 100) : 0;
          return {
            reportName: meta.name,
            group: r.group,
            evKm: Math.round(r.kmEV * 10) / 10,
            iceKm: Math.round(r.kmICE * 10) / 10,
            totalKm: Math.round(kmAll * 10) / 10,
            evSharePct: evPct,
            chargingKWh: Math.round(r.kWh * 10) / 10,
            chargingSpendUGX: Math.round(r.spend),
            gridKgCO2ePerKWh: emissions.effectiveGridFactor,
            iceKgCO2ePerKm: factors.iceKgCO2ePerKm,
          };
        });
        const csv = toCSV(rows, [
          { key: "reportName", label: "report_name" },
          { key: "group", label: "group" },
          { key: "evKm", label: "ev_km" },
          { key: "iceKm", label: "ice_km" },
          { key: "totalKm", label: "total_km" },
          { key: "evSharePct", label: "ev_share_pct" },
          { key: "chargingKWh", label: "charging_kwh" },
          { key: "chargingSpendUGX", label: "charging_spend_ugx" },
          { key: "gridKgCO2ePerKWh", label: "grid_kgco2e_per_kwh" },
          { key: "iceKgCO2ePerKm", label: "ice_kgco2e_per_km" },
        ]);
        downloadText(`${exportName || "esg"}-mobility.csv`, csv, "text/csv");
        toast({ title: "Exported", message: "CSV downloaded.", kind: "success" });
        setExportOpen(false);
        return;
      }

      // default: internal template
      const rows = [
        {
          reportName: meta.name,
          generatedAt: meta.generatedAt,
          timeRange: meta.timeRange,
          group: meta.filters.group,
          costCenter: meta.filters.costCenter,
          evKm: Math.round(totals.kmEV * 10) / 10,
          iceKm: Math.round(totals.kmICE * 10) / 10,
          totalKm: Math.round(totals.kmAll * 10) / 10,
          evSharePct: totals.evSharePct,
          chargingKWh: Math.round(totals.kWh * 10) / 10,
          chargingSpendUGX: Math.round(totals.chargingSpend),
          chargingSessions: totals.sessions,
          offPeakPct: totals.offPeakPct,
          receiptCoveragePct: totals.receiptPct,
          evScope2KgCO2e: Math.round(emissions.evScope2Kg),
          iceKgCO2e: Math.round(emissions.iceKg),
          avoidedKgCO2e: Math.round(emissions.avoidedKg),
          overallScore: scorecards.overall,
        },
      ];
      const csv = toCSV(rows, [
        { key: "reportName", label: "report_name" },
        { key: "generatedAt", label: "generated_at" },
        { key: "timeRange", label: "time_range" },
        { key: "group", label: "group" },
        { key: "costCenter", label: "cost_center" },
        { key: "evKm", label: "ev_km" },
        { key: "iceKm", label: "ice_km" },
        { key: "totalKm", label: "total_km" },
        { key: "evSharePct", label: "ev_share_pct" },
        { key: "chargingKWh", label: "charging_kwh" },
        { key: "chargingSpendUGX", label: "charging_spend_ugx" },
        { key: "chargingSessions", label: "charging_sessions" },
        { key: "offPeakPct", label: "charging_offpeak_pct" },
        { key: "receiptCoveragePct", label: "receipt_coverage_pct" },
        { key: "evScope2KgCO2e", label: "ev_scope2_kgco2e" },
        { key: "iceKgCO2e", label: "ice_kgco2e" },
        { key: "avoidedKgCO2e", label: "avoided_kgco2e" },
        { key: "overallScore", label: "sustainability_score" },
      ]);
      downloadText(`${exportName || "esg"}-internal.csv`, csv, "text/csv");
      toast({ title: "Exported", message: "CSV downloaded.", kind: "success" });
      setExportOpen(false);
      return;
    }

    // PDF uses Print to PDF
    const html = `
      <html>
        <head>
          <title>${meta.name}</title>
          <style>
            body{font-family: ui-sans-serif, system-ui; padding:24px;}
            .muted{color:#64748b;font-size:12px}
            h2{margin:0}
            .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:16px}
            .card{border:1px solid #e2e8f0;border-radius:16px;padding:12px}
            table{width:100%; border-collapse:collapse; margin-top:16px}
            th,td{border:1px solid #e2e8f0; padding:10px; font-size:12px}
            th{background:#f8fafc; text-align:left}
          </style>
        </head>
        <body>
          <h2>${meta.name}</h2>
          <div class="muted">Generated: ${new Date().toLocaleString()} • Time range: ${timeRange}${timeRange === "Custom" ? ` (${customFrom} to ${customTo})` : ""}</div>
          <div class="muted">Filters: Group ${groupFilter} • Cost center ${costCenterFilter}</div>

          <div class="grid">
            <div class="card"><div class="muted">EV share</div><div style="font-size:20px;font-weight:700">${totals.evSharePct}%</div></div>
            <div class="card"><div class="muted">Charging kWh</div><div style="font-size:20px;font-weight:700">${Math.round(totals.kWh)}</div></div>
            <div class="card"><div class="muted">Avoided emissions</div><div style="font-size:20px;font-weight:700">${formatKg(emissions.avoidedKg)}</div></div>
          </div>

          <h3 style="margin-top:18px">Core metrics</h3>
          <table>
            <thead><tr><th>Metric</th><th>Value</th></tr></thead>
            <tbody>
              <tr><td>Total km</td><td>${Math.round(totals.kmAll)}</td></tr>
              <tr><td>EV km</td><td>${Math.round(totals.kmEV)}</td></tr>
              <tr><td>ICE km</td><td>${Math.round(totals.kmICE)}</td></tr>
              <tr><td>Charging spend</td><td>${formatUGX(totals.chargingSpend)}</td></tr>
              <tr><td>EV Scope 2 emissions</td><td>${formatKg(emissions.evScope2Kg)}</td></tr>
              <tr><td>ICE emissions</td><td>${formatKg(emissions.iceKg)}</td></tr>
              <tr><td>Sustainability score</td><td>${scorecards.overall}</td></tr>
            </tbody>
          </table>

          <div class="muted" style="margin-top:16px">Note: emission factors are organization-configurable. This export uses your current factor settings.</div>
          <div class="muted" style="margin-top:8px">Use browser Print and select Save as PDF.</div>
        </body>
      </html>
    `;

    const w = window.open("", "_blank");
    if (!w) {
      toast({ title: "Popup blocked", message: "Allow popups to export PDF via Print.", kind: "warn" });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
    toast({ title: "Print ready", message: "Use Print to PDF to save.", kind: "info" });
    setExportOpen(false);
  };

  const copyTemplateExample = async () => {
    const example = {
      templateId,
      fields: {
        ev_km: "number",
        ice_km: "number",
        charging_kwh: "number",
        charging_spend_ugx: "number",
        ev_scope2_kgco2e: "number",
        avoided_kgco2e: "number",
        sustainability_score: "0-100",
      },
      notes: "Align these keys to your internal ESG format templates.",
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(example, null, 2));
      toast({ title: "Copied", message: "Template example copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  const overallGrade = gradeFromScore(scorecards.overall);

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
                  <Leaf className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Sustainability and ESG Reporting</div>
                  <div className="mt-1 text-xs text-slate-500">EV usage, charging utilization and spend, emissions estimates, and ESG scorecards with export templates.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`EV share ${totals.evSharePct}%`} tone={totals.evSharePct >= 50 ? "good" : totals.evSharePct >= 30 ? "info" : "warn"} />
                    <Pill label={`Charging ${Math.round(totals.kWh)} kWh`} tone="neutral" />
                    <Pill label={`Charging spend ${formatUGX(totals.chargingSpend)}`} tone="neutral" />
                    <Pill label={`Avoided ${formatKg(emissions.avoidedKg)}`} tone={emissions.avoidedKg > 0 ? "good" : "neutral"} />
                    <Pill label={`Score ${scorecards.overall} (${overallGrade.label})`} tone={overallGrade.tone} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setFactorsOpen(true)}>
                  <Settings2 className="h-4 w-4" /> Factors
                </Button>
                <Button variant="outline" onClick={() => setExportOpen(true)}>
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Button variant="primary" onClick={() => setTrackingEnabled((v) => !v)}>
                  <BadgeCheck className="h-4 w-4" /> {trackingEnabled ? "Tracking on" : "Tracking off"}
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "ev-usage", label: "EV usage" },
                { id: "charging", label: "Charging" },
                { id: "emissions", label: "Emissions" },
                { id: "scorecards", label: "Scorecards" },
                { id: "templates", label: "Templates" },
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

            {/* Filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-3xl border border-slate-200 bg-white p-4 md:grid-cols-12">
              <div className="md:col-span-3">
                <Select
                  label="Time range"
                  value={timeRange}
                  onChange={(v) => setTimeRange(v as TimeRange)}
                  options={[
                    { value: "7d", label: "Last 7 days" },
                    { value: "30d", label: "Last 30 days" },
                    { value: "90d", label: "Last 90 days" },
                    { value: "YTD", label: "Year to date" },
                    { value: "Custom", label: "Custom" },
                  ]}
                />
              </div>
              <div className={cn("md:col-span-2", timeRange !== "Custom" && "opacity-60")}>
                <Field label="From" type="date" value={customFrom} onChange={setCustomFrom} disabled={timeRange !== "Custom"} />
              </div>
              <div className={cn("md:col-span-2", timeRange !== "Custom" && "opacity-60")}>
                <Field label="To" type="date" value={customTo} onChange={setCustomTo} disabled={timeRange !== "Custom"} />
              </div>
              <div className="md:col-span-2">
                <Select
                  label="Group"
                  value={groupFilter}
                  onChange={(v) => setGroupFilter(v as any)}
                  options={[{ value: "All", label: "All" }, ...GROUPS.map((g) => ({ value: g, label: g }))]}
                />
              </div>
              <div className="md:col-span-3">
                <div className="text-xs font-semibold text-slate-600">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="site, requester, tag..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100" onClick={() => setQ("")} aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-12 grid grid-cols-1 gap-3 md:grid-cols-3">
                <Select
                  label="Cost center"
                  value={costCenterFilter}
                  onChange={setCostCenterFilter}
                  options={[{ value: "All", label: "All" }, ...COST_CENTERS.map((c) => ({ value: c, label: c }))]}
                />
                <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                  Note: emission factors are defaults for demo. Update Factors to match your internal ESG standards.
                </div>
              </div>

              <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{filteredMobility.length}</span> mobility event(s) and <span className="font-semibold text-slate-900">{filteredCharging.length}</span> charging session(s).
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setGroupFilter("All");
                      setCostCenterFilter("All");
                      setQ("");
                      toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                    }}
                  >
                    <Filter className="h-4 w-4" /> Reset
                  </Button>
                  <Button variant="outline" onClick={() => setExportOpen(true)}>
                    <Download className="h-4 w-4" /> Export
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {!trackingEnabled ? (
              <Empty title="Tracking disabled" subtitle="Enable tracking to compute EV usage and ESG metrics." />
            ) : tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section title="Core ESG metrics" subtitle="Core: EV usage metrics plus charging spend and utilization." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <StatCard title="EV share" value={`${totals.evSharePct}%`} sub={`${formatNumber(totals.kmEV, 0)} km EV`} icon={<Leaf className="h-5 w-5" />} tone={totals.evSharePct >= 50 ? "good" : totals.evSharePct >= 30 ? "info" : "warn"} />
                      <StatCard title="Charging kWh" value={`${formatNumber(totals.kWh, 0)}`} sub={`${totals.sessions} sessions`} icon={<BatteryCharging className="h-5 w-5" />} tone="neutral" />
                      <StatCard title="Charging spend" value={formatUGX(totals.chargingSpend)} sub={`Off-peak ${totals.offPeakPct}%`} icon={<Zap className="h-5 w-5" />} tone={totals.offPeakPct >= 60 ? "good" : "warn"} />
                      <StatCard title="Avoided emissions" value={formatKg(emissions.avoidedKg)} sub={`Intensity ${formatNumber(emissions.intensityKgPerKm, 3)} kg/km`} icon={<Sparkles className="h-5 w-5" />} tone={emissions.avoidedKg > 0 ? "good" : "neutral"} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Section title="Mobility breakdown by group" subtitle="EV km and ICE km" right={<Pill label="Core" tone="neutral" />}>
                        <div className="space-y-2">
                          {breakdownByGroup.map((r) => {
                            const totalKm = r.kmAll;
                            const evPct = totalKm ? Math.round((r.kmEV / totalKm) * 100) : 0;
                            return (
                              <div key={r.group} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{r.group}</div>
                                    <div className="mt-1 text-xs text-slate-500">EV share {evPct}%</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-sm font-semibold text-slate-900">{formatNumber(totalKm, 0)} km</div>
                                    <div className="mt-1 text-xs text-slate-500">EV {formatNumber(r.kmEV, 0)} • ICE {formatNumber(r.kmICE, 0)}</div>
                                  </div>
                                </div>
                                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                  <div className="h-full rounded-full" style={{ width: `${Math.min(100, evPct)}%`, background: EVZ.green }} />
                                </div>
                              </div>
                            );
                          })}
                          {!breakdownByGroup.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No group data.</div> : null}
                        </div>
                      </Section>

                      <Section title="Charging utilization by site" subtitle="kWh, spend, off-peak" right={<Pill label="Core" tone="neutral" />}>
                        <div className="space-y-2">
                          {chargingBySite.map((s) => (
                            <div key={s.site} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{s.site}</div>
                                  <div className="mt-1 text-xs text-slate-500">Sessions {s.sessions} • Off-peak {s.offPeakPct}%</div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-slate-900">{formatNumber(s.kWh, 0)} kWh</div>
                                  <div className="mt-1 text-xs text-slate-500">Spend {formatUGX(s.spend)}</div>
                                </div>
                              </div>
                              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div className="h-full rounded-full" style={{ width: `${Math.min(100, s.offPeakPct)}%`, background: EVZ.green }} />
                              </div>
                            </div>
                          ))}
                          {!chargingBySite.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No charging data.</div> : null}
                        </div>
                      </Section>
                    </div>
                  </Section>

                  <Section title="Data quality" subtitle="Premium: receipt coverage and audit readiness." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <ProgressRing value={totals.receiptPct} label="Receipt coverage" />
                      <ProgressRing value={totals.offPeakPct} label="Off-peak share" />
                      <ProgressRing value={scorecards.overall} label="Sustainability score" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: integrate receipt coverage into your audit controls and dispute workflows.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Quick actions" subtitle="Exports and configuration." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={() => setExportOpen(true)}>
                        <Download className="h-4 w-4" /> Export ESG
                      </Button>
                      <Button variant="outline" onClick={() => setFactorsOpen(true)}>
                        <Settings2 className="h-4 w-4" /> Edit factors
                      </Button>
                      <Button variant="outline" onClick={copyTemplateExample}>
                        <Copy className="h-4 w-4" /> Copy template keys
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Tip: schedule delivery using the Scheduling section in Reporting & Analytics (V).
                    </div>
                  </Section>

                  <Section title="Core notes" subtitle="What is included." right={<Pill label="Core" tone="neutral" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      <ul className="space-y-1">
                        <li>1) EV usage metrics computed from mobility events</li>
                        <li>2) Charging spend and utilization from EVs & Charging sessions</li>
                        <li>3) Emissions estimates depend on configured factors</li>
                      </ul>
                    </div>
                  </Section>

                  <Section title="Premium notes" subtitle="Scorecards and templates." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium includes scorecards, anomaly signals, and exports aligned to internal ESG templates.
                    </div>
                  </Section>
                </div>
              </div>
            ) : tab === "ev-usage" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="EV usage summary" subtitle="Core: EV usage metrics." right={<Pill label="Core" tone="neutral" />}>
                    <StatCard title="Total km" value={formatNumber(totals.kmAll, 0)} sub={`EV ${formatNumber(totals.kmEV, 0)} • ICE ${formatNumber(totals.kmICE, 0)}`} icon={<LineChart className="h-5 w-5" />} tone="neutral" />
                    <StatCard title="EV share" value={`${totals.evSharePct}%`} sub="EV km over total km" icon={<Leaf className="h-5 w-5" />} tone={totals.evSharePct >= 50 ? "good" : totals.evSharePct >= 30 ? "info" : "warn"} />
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Best practice: enforce purpose tags and cost centers on mobility transactions so ESG reporting is auditable.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Mobility events" subtitle="Drilldown list" right={<Pill label={`${filteredMobility.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">Cost center</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Vehicle</th>
                            <th className="px-4 py-3 font-semibold">km</th>
                            <th className="px-4 py-3 font-semibold">Requester</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredMobility.slice(0, 18).map((m) => (
                            <tr key={m.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(m.ts)}</td>
                              <td className="px-4 py-3 text-slate-700">{m.group}</td>
                              <td className="px-4 py-3 text-slate-700">{m.costCenter}</td>
                              <td className="px-4 py-3 text-slate-700">{m.mobilityType}</td>
                              <td className="px-4 py-3"><Pill label={m.vehicleType} tone={m.vehicleType === "EV" ? "good" : "neutral"} /></td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatNumber(m.km, 1)}</td>
                              <td className="px-4 py-3 text-slate-700">{m.requester}</td>
                            </tr>
                          ))}
                          {!filteredMobility.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No mobility events.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : tab === "charging" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Charging metrics" subtitle="Core: spend and utilization." right={<Pill label="Core" tone="neutral" />}>
                    <StatCard title="Sessions" value={`${totals.sessions}`} sub={`Off-peak ${totals.offPeakPct}%`} icon={<BatteryCharging className="h-5 w-5" />} tone="neutral" />
                    <StatCard title="kWh" value={formatNumber(totals.kWh, 0)} sub={`Avg ${totals.sessions ? formatNumber(totals.kWh / totals.sessions, 1) : "0"} kWh/session`} icon={<Zap className="h-5 w-5" />} tone="neutral" />
                    <StatCard title="Spend" value={formatUGX(totals.chargingSpend)} sub={`Receipt coverage ${totals.receiptPct}%`} icon={<FileText className="h-5 w-5" />} tone={totals.receiptPct >= 85 ? "good" : "warn"} />
                    <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Tip: Shift non-urgent charging to off-peak windows to reduce costs.
                    </div>
                  </Section>

                  <Section title="Site utilization" subtitle="kWh by site" right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {chargingBySite.map((s) => (
                        <BarRow key={s.site} label={s.site} value={s.kWh} total={Math.max(1, totals.kWh)} right={`${formatNumber(s.kWh, 0)} kWh`} />
                      ))}
                      {!chargingBySite.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No charging data.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Charging sessions" subtitle="Drilldown list" right={<Pill label={`${filteredCharging.length}`} tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Site</th>
                            <th className="px-4 py-3 font-semibold">Group</th>
                            <th className="px-4 py-3 font-semibold">kWh</th>
                            <th className="px-4 py-3 font-semibold">Spend</th>
                            <th className="px-4 py-3 font-semibold">Off-peak</th>
                            <th className="px-4 py-3 font-semibold">Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCharging.slice(0, 18).map((c) => (
                            <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(c.ts)}</td>
                              <td className="px-4 py-3 text-slate-700">{c.site}</td>
                              <td className="px-4 py-3 text-slate-700">{c.group}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatNumber(c.kWh, 1)}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(c.costUGX)}</td>
                              <td className="px-4 py-3"><Pill label={c.offPeak ? "Yes" : "No"} tone={c.offPeak ? "good" : "warn"} /></td>
                              <td className="px-4 py-3"><Pill label={c.hasReceipt ? "Yes" : "No"} tone={c.hasReceipt ? "good" : "warn"} /></td>
                            </tr>
                          ))}
                          {!filteredCharging.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No sessions.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : tab === "emissions" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Emissions" subtitle="Premium: estimates and scorecards." right={<Pill label="Premium" tone="info" />}>
                    <StatCard title="EV Scope 2" value={formatKg(emissions.evScope2Kg)} sub={`Grid factor ${formatNumber(emissions.effectiveGridFactor, 3)} kg/kWh`} icon={<BatteryCharging className="h-5 w-5" />} tone="info" />
                    <StatCard title="ICE emissions" value={formatKg(emissions.iceKg)} sub={`ICE factor ${formatNumber(factors.iceKgCO2ePerKm, 3)} kg/km`} icon={<LineChart className="h-5 w-5" />} tone="neutral" />
                    <StatCard title="Avoided" value={formatKg(emissions.avoidedKg)} sub="If EV km would otherwise be ICE" icon={<Sparkles className="h-5 w-5" />} tone={emissions.avoidedKg > 0 ? "good" : "neutral"} />
                    <Button variant="outline" onClick={() => setFactorsOpen(true)}>
                      <Settings2 className="h-4 w-4" /> Edit factors
                    </Button>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Factors are organization-configurable. Align to your internal ESG standards.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Emissions table" subtitle="Key values used in exports" right={<Pill label="Premium" tone="info" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Metric</th>
                            <th className="px-4 py-3 font-semibold">Value</th>
                            <th className="px-4 py-3 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">EV kWh</td>
                            <td className="px-4 py-3 text-slate-700">{formatNumber(totals.kWh, 1)} kWh</td>
                            <td className="px-4 py-3 text-slate-600">From EVs & Charging sessions</td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">Effective grid factor</td>
                            <td className="px-4 py-3 text-slate-700">{formatNumber(emissions.effectiveGridFactor, 3)} kgCO2e/kWh</td>
                            <td className="px-4 py-3 text-slate-600">Grid factor adjusted for renewable share</td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">EV Scope 2 emissions</td>
                            <td className="px-4 py-3 text-slate-700">{formatKg(emissions.evScope2Kg)}</td>
                            <td className="px-4 py-3 text-slate-600">kWh multiplied by effective grid factor</td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">ICE emissions</td>
                            <td className="px-4 py-3 text-slate-700">{formatKg(emissions.iceKg)}</td>
                            <td className="px-4 py-3 text-slate-600">ICE km multiplied by ICE factor</td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">Avoided emissions</td>
                            <td className="px-4 py-3 text-slate-700">{formatKg(emissions.avoidedKg)}</td>
                            <td className="px-4 py-3 text-slate-600">Baseline ICE for EV km minus EV Scope 2</td>
                          </tr>
                          <tr className="border-t border-slate-100">
                            <td className="px-4 py-3 font-semibold text-slate-900">Overall intensity</td>
                            <td className="px-4 py-3 text-slate-700">{formatNumber(emissions.intensityKgPerKm, 3)} kgCO2e/km</td>
                            <td className="px-4 py-3 text-slate-600">(ICE + EV Scope 2) divided by total km</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: export these values in templates aligned to your internal ESG formats.
                    </div>
                  </Section>
                </div>
              </div>
            ) : tab === "scorecards" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Sustainability scorecards" subtitle="Premium: scorecards and grades." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <ProgressRing value={scorecards.overall} label="Overall" />
                      <ProgressRing value={scorecards.adoptionScore} label="EV adoption" />
                      <ProgressRing value={scorecards.offPeakScore} label="Off-peak charging" />
                      <ProgressRing value={scorecards.renewableScore} label="Renewable share" />
                      <ProgressRing value={scorecards.dataQualityScore} label="Data quality" />
                      <ProgressRing value={scorecards.intensityScore} label="Emissions intensity" />
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                      Overall grade: <span className="font-semibold">{overallGrade.label}</span>. Weights are explainable and can be customized to your ESG framework.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Scorecard detail" subtitle="How the score is computed" right={<Pill label="Premium" tone="info" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Dimension</th>
                            <th className="px-4 py-3 font-semibold">Score</th>
                            <th className="px-4 py-3 font-semibold">Meaning</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { k: "EV adoption", v: scorecards.adoptionScore, d: "EV km share of total mobility" },
                            { k: "Off-peak charging", v: scorecards.offPeakScore, d: "Off-peak sessions share" },
                            { k: "Renewable share", v: scorecards.renewableScore, d: "Renewable electricity share used to adjust Scope 2" },
                            { k: "Data quality", v: scorecards.dataQualityScore, d: "Receipt coverage in charging logs" },
                            { k: "Emissions intensity", v: scorecards.intensityScore, d: "Lower kgCO2e per km is better" },
                          ].map((x) => (
                            <tr key={x.k} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{x.k}</td>
                              <td className="px-4 py-3"><Pill label={`${Math.round(x.v)}`} tone={gradeFromScore(x.v).tone} /></td>
                              <td className="px-4 py-3 text-slate-700">{x.d}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => setExportOpen(true)}>
                        <Download className="h-4 w-4" /> Export scorecard
                      </Button>
                      <Button variant="outline" onClick={copyTemplateExample}>
                        <Copy className="h-4 w-4" /> Copy template keys
                      </Button>
                    </div>
                  </Section>
                </div>
              </div>
            ) : tab === "templates" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="ESG template library" subtitle="Premium: exports aligned to internal format templates." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {TEMPLATE_IDS.map((t) => (
                        <button
                          key={t}
                          type="button"
                          className={cn(
                            "w-full rounded-3xl border bg-white p-4 text-left hover:bg-slate-50",
                            templateId === t ? "border-emerald-300 ring-4 ring-emerald-100" : "border-slate-200"
                          )}
                          onClick={() => setTemplateId(t)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{t}</div>
                              <div className="mt-1 text-xs text-slate-500">
                                {t === "Internal ESG Template v1"
                                  ? "Summary for internal ESG packs"
                                  : t === "Scorecard Template v1"
                                  ? "Scorecards and ratings"
                                  : t === "Mobility Emissions Template v1"
                                  ? "Mobility and emissions by group"
                                  : "Custom mapping slot"}
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-slate-400" />
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Button variant="primary" onClick={() => setExportOpen(true)}>
                        <Download className="h-4 w-4" /> Export now
                      </Button>
                      <Button variant="outline" onClick={copyTemplateExample}>
                        <Copy className="h-4 w-4" /> Copy keys
                      </Button>
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: schedule reports using Reporting & Analytics schedules, and deliver via Email, WhatsApp, WeChat, or SMS.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Template preview" subtitle="Fields included" right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{templateId}</div>
                          <div className="mt-1 text-xs text-slate-500">Preview is based on current filters and factor settings.</div>
                        </div>
                        <Pill label={exportFormat} tone="neutral" />
                      </div>

                      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">Field</th>
                              <th className="px-4 py-3 font-semibold">Value</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { k: "ev_km", v: formatNumber(totals.kmEV, 1) },
                              { k: "ice_km", v: formatNumber(totals.kmICE, 1) },
                              { k: "charging_kwh", v: formatNumber(totals.kWh, 1) },
                              { k: "charging_spend_ugx", v: formatUGX(totals.chargingSpend) },
                              { k: "ev_scope2_kgco2e", v: formatKg(emissions.evScope2Kg) },
                              { k: "avoided_kgco2e", v: formatKg(emissions.avoidedKg) },
                              { k: "sustainability_score", v: `${scorecards.overall} (${overallGrade.label})` },
                            ].map((row) => (
                              <tr key={row.k} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{row.k}</td>
                                <td className="px-4 py-3 text-slate-700">{row.v}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="outline" onClick={() => setExportOpen(true)}>
                          <Download className="h-4 w-4" /> Export
                        </Button>
                        <Button variant="outline" onClick={copyTemplateExample}>
                          <Copy className="h-4 w-4" /> Copy keys
                        </Button>
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : (
              <Empty title="Select a tab" subtitle="Use the tabs to view ESG dashboards." />
            )}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[95%] px-4 text-xs text-slate-500 md:px-6">
              W Sustainability and ESG Reporting v2. Core: EV usage metrics and EV charging spend/utilization. Premium: emissions estimates, scorecards, and template-aligned ESG exports.
            </div>
          </footer>
        </div>
      </div>

      {/* Factors modal */}
      <Modal
        open={factorsOpen}
        title="Emission factors"
        subtitle="Set values to match your internal ESG standards. Defaults are placeholders for demo."
        onClose={() => setFactorsOpen(false)}
        actions={[{ label: "Save", onClick: () => {
          setFactors((p) => ({
            gridKgCO2ePerKWh: clamp(p.gridKgCO2ePerKWh, 0, 5),
            iceKgCO2ePerKm: clamp(p.iceKgCO2ePerKm, 0, 2),
            renewableSharePct: clamp(p.renewableSharePct, 0, 100),
          }));
          toast({ title: "Saved", message: "Factors updated.", kind: "success" });
          setFactorsOpen(false);
        } }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setFactorsOpen(false)}>Close</Button>
            <Button
              variant="primary"
              onClick={() => {
                // clamp values safely
                setFactors((p) => ({
                  gridKgCO2ePerKWh: clamp(p.gridKgCO2ePerKWh, 0, 5),
                  iceKgCO2ePerKm: clamp(p.iceKgCO2ePerKm, 0, 2),
                  renewableSharePct: clamp(p.renewableSharePct, 0, 100),
                }));
                toast({ title: "Saved", message: "Factors updated.", kind: "success" });
                setFactorsOpen(false);
              }}
            >
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <NumberField
            label="Grid factor"
            value={factors.gridKgCO2ePerKWh}
            onChange={(v) => setFactors((p) => ({ ...p, gridKgCO2ePerKWh: v }))}
            hint="kgCO2e per kWh"
            min={0}
            max={5}
            step={0.001}
          />
          <NumberField
            label="ICE baseline factor"
            value={factors.iceKgCO2ePerKm}
            onChange={(v) => setFactors((p) => ({ ...p, iceKgCO2ePerKm: v }))}
            hint="kgCO2e per km"
            min={0}
            max={2}
            step={0.001}
          />
          <NumberField
            label="Renewable share"
            value={factors.renewableSharePct}
            onChange={(v) => setFactors((p) => ({ ...p, renewableSharePct: v }))}
            hint="Percent"
            min={0}
            max={100}
            step={1}
          />
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">How it works</div>
            <div className="mt-2 text-xs text-slate-700">
              Effective grid factor = grid factor multiplied by (1 - renewable share). EV Scope 2 = charging kWh multiplied by effective grid factor.
            </div>
            <div className="mt-3 text-xs text-slate-600">Avoided emissions = baseline ICE for EV km minus EV Scope 2.</div>
          </div>

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            Use the same factors across your organization for consistent reporting.
          </div>
        </div>
      </Modal>

      {/* Export modal */}
      <Modal
        open={exportOpen}
        title="Export ESG report"
        subtitle="Choose a template and format. Exports use current filters and factor settings."
        onClose={() => setExportOpen(false)}
        actions={[{ label: "Export", onClick: exportESG }]}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setExportOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={exportESG}>
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Export name" value={exportName} onChange={setExportName} placeholder="ESG Report" hint="Used in file name" />
          <Select
            label="Format"
            value={exportFormat}
            onChange={(v) => setExportFormat(v as ExportFormat)}
            options={[{ value: "CSV", label: "CSV" }, { value: "JSON", label: "JSON" }, { value: "PDF", label: "PDF (Print)" }]}
          />
          <div className="md:col-span-2">
            <Select
              label="Template"
              value={templateId}
              onChange={(v) => setTemplateId(v as ESGTemplateId)}
              options={TEMPLATE_IDS.map((t) => ({ value: t, label: t }))}
              hint="Aligned to internal templates"
            />
          </div>

          <div className="md:col-span-2 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
            Current totals: EV {formatNumber(totals.kmEV, 0)} km, ICE {formatNumber(totals.kmICE, 0)} km, Charging {formatNumber(totals.kWh, 0)} kWh, Spend {formatUGX(totals.chargingSpend)}.
          </div>

          <div className="md:col-span-2 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
            PDF export uses Print to PDF. Allow popups if prompted.
          </div>
        </div>
      </Modal>
    </div>
  );
}
