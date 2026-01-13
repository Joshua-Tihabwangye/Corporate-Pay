import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Filter,
  LineChart,
  Mail,
  Search,
  Settings2,
  Sparkles,
  Timer,
  Wand2,
  X,
  Info,
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

type GroupName = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type Risk = "Low" | "Medium" | "High";

type Currency = "UGX";

type TxType = "Ride" | "Charging" | "Purchase" | "Service";

type Transaction = {
  id: string;
  ts: number;
  type: TxType;
  module: ServiceModule;
  marketplace?: Marketplace;
  vendor: string;
  requesterId: string;
  requesterName: string;
  group: GroupName;
  costCenter: string;
  amountUGX: number;
  currency: Currency;
  risk: Risk;
  approved: boolean;
  approvalId?: string;
  tags: string[];
};

type ApprovalOutcome = "Approved" | "Rejected" | "Auto-approved";

type Approval = {
  id: string;
  requestedAt: number;
  decidedAt: number;
  module: ServiceModule;
  marketplace?: Marketplace;
  requesterId: string;
  requesterName: string;
  approver: string;
  outcome: ApprovalOutcome;
  amountUGX: number;
  reason: string;
  slaHours: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type Dimension =
  | "Group"
  | "Cost center"
  | "Module"
  | "Marketplace"
  | "Vendor"
  | "Requester"
  | "Risk";

type Metric = "Spend" | "Transactions" | "Avg transaction";

type TimeRange = "7d" | "30d" | "90d" | "YTD" | "Custom";

type ReportConfig = {
  id: string;
  name: string;
  timeRange: TimeRange;
  customFrom?: string;
  customTo?: string;
  dimensionA: Dimension;
  dimensionB?: Dimension;
  metric: Metric;
  filters: {
    module?: ServiceModule | "All";
    marketplace?: Marketplace | "All";
    group?: GroupName | "All";
    costCenter?: string | "All";
    vendor?: string | "All";
    requester?: string | "All";
    risk?: Risk | "All";
  };
  createdAt: number;
};

type Schedule = {
  id: string;
  reportId: string;
  enabled: boolean;
  frequency: "Daily" | "Weekly" | "Monthly";
  hourLocal: number; // 0-23
  dayOfWeek?: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  dayOfMonth?: number; // 1..28
  recipients: string;
  channels: { email: boolean; whatsapp: boolean; wechat: boolean; sms: boolean };
  formats: { csv: boolean; pdf: boolean; json: boolean };
  lastRunAt?: number;
  lastStatus?: "Success" | "Failed";
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

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
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

function lcg(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
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
          <div className="text-sm font-semibold text-slate-900">{right ?? formatUGX(value)}</div>
        </div>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: EVZ.green }} />
      </div>
    </div>
  );
}

function median(values: number[]) {
  if (!values.length) return 0;
  const a = values.slice().sort((x, y) => x - y);
  const mid = Math.floor(a.length / 2);
  if (a.length % 2) return a[mid];
  return (a[mid - 1] + a[mid]) / 2;
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

function dimValue(tx: Transaction, dim: Dimension): string {
  switch (dim) {
    case "Group":
      return tx.group;
    case "Cost center":
      return tx.costCenter;
    case "Module":
      return tx.module;
    case "Marketplace":
      return tx.marketplace || "-";
    case "Vendor":
      return tx.vendor;
    case "Requester":
      return tx.requesterName;
    case "Risk":
      return tx.risk;
    default:
      return "-";
  }
}

function isPeakHour(h: number) {
  // simple: 7-9 and 17-20
  return (h >= 7 && h <= 9) || (h >= 17 && h <= 20);
}

export default function CorporatePayReportingAnalyticsV2() {
  const USERS = useMemo(
    () => [
      { id: "U-1001", name: "Mary N.", group: "Operations" as GroupName, costCenter: "OPS-001" },
      { id: "U-1002", name: "John S.", group: "Sales" as GroupName, costCenter: "SALES-TRAVEL" },
      { id: "U-1003", name: "Irene K.", group: "Operations" as GroupName, costCenter: "OPS-001" },
      { id: "U-1004", name: "Daisy O.", group: "Finance" as GroupName, costCenter: "FIN-OPS" },
      { id: "U-1005", name: "Procurement Desk", group: "Procurement" as GroupName, costCenter: "PROC-001" },
    ],
    []
  );

  const VENDORS = useMemo(
    () => [
      "EVzone Rides",
      "EVzone Charging",
      "Kampala Office Mart",
      "Shenzhen Store",
      "Shenzhen Tech",
      "ServicePro",
      "Express CN",
      "Hotel Partner",
      "Airline Partner",
    ],
    []
  );

  const MODULES: ServiceModule[] = [
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

  const seedData = useMemo(() => {
    const rand = lcg(1337);
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    const txs: Transaction[] = [];
    const approvals: Approval[] = [];

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

    const moduleForType = (t: TxType) => {
      if (t === "Ride") return "Rides & Logistics" as ServiceModule;
      if (t === "Charging") return "EVs & Charging" as ServiceModule;
      // Purchases/Services are under E-Commerce
      return "E-Commerce" as ServiceModule;
    };

    const marketplaceForPurchase = () => {
      return pickWeighted<Marketplace>([
        { item: "EVmart", w: 1.1 },
        { item: "GadgetMart", w: 0.9 },
        { item: "LivingMart", w: 0.6 },
        { item: "ServiceMart", w: 0.8 },
        { item: "MyLiveDealz", w: 0.9 },
        { item: "ExpressMart", w: 0.5 },
      ]);
    };

    const vendorFor = (t: TxType, mkt?: Marketplace) => {
      if (t === "Ride") return "EVzone Rides";
      if (t === "Charging") return "EVzone Charging";
      if (mkt === "MyLiveDealz") return "Shenzhen Store";
      if (mkt === "GadgetMart") return "Shenzhen Tech";
      if (mkt === "ExpressMart") return "Express CN";
      if (mkt === "ServiceMart") return "ServicePro";
      return "Kampala Office Mart";
    };

    const riskFor = (t: TxType, mkt?: Marketplace, amt = 0): Risk => {
      if (mkt === "MyLiveDealz") return "High";
      if (mkt === "ExpressMart") return "Medium";
      if (t === "Charging" && amt > 180000) return "Medium";
      return "Low";
    };

    const tagsFor = (t: TxType, mkt?: Marketplace): string[] => {
      if (t === "Ride") return pickWeighted([{ item: ["Client"], w: 1 }, { item: ["Airport"], w: 0.6 }, { item: ["Commute"], w: 0.8 }]);
      if (t === "Charging") return pickWeighted([{ item: ["Depot"], w: 1 }, { item: ["Commute"], w: 0.7 }, { item: ["Emergency"], w: 0.2 }]);
      if (mkt === "MyLiveDealz") return ["Deal", "Promo"];
      if (mkt === "ServiceMart") return ["Service", "Booking"];
      return ["Procurement"];
    };

    const makeApproval = (tx: Transaction): Approval => {
      const requestedAt = tx.ts - Math.floor((rand() * 90 + 10) * 60000);
      const cycleMins = Math.floor(rand() * 240 + 10);
      const decidedAt = requestedAt + cycleMins * 60000;
      const outcome: ApprovalOutcome = tx.amountUGX <= 200000 ? "Auto-approved" : rand() < 0.88 ? "Approved" : "Rejected";
      const slaHours = tx.amountUGX > 1000000 ? 24 : 12;
      const approver = tx.amountUGX > 1000000 ? "CFO" : tx.risk === "High" ? "Finance Desk" : "Manager";

      return {
        id: uid("APR"),
        requestedAt,
        decidedAt,
        module: tx.module,
        marketplace: tx.marketplace,
        requesterId: tx.requesterId,
        requesterName: tx.requesterName,
        approver,
        outcome,
        amountUGX: tx.amountUGX,
        reason: tx.risk === "High" ? "High risk marketplace" : "Above threshold",
        slaHours,
      };
    };

    // generate ~180 transactions over last 90 days
    for (let d = 0; d < 90; d++) {
      const dayTs = now - d * day;
      const baseCount = 1 + Math.floor(rand() * 3); // 1..3

      // rides
      const rides = baseCount + Math.floor(rand() * 3);
      for (let i = 0; i < rides; i++) {
        const u = pickWeighted([{ item: USERS[0], w: 1 }, { item: USERS[1], w: 1 }, { item: USERS[2], w: 0.8 }, { item: USERS[4], w: 0.4 }]);
        const hour = Math.floor(rand() * 24);
        const ts = dayTs - Math.floor(rand() * 4 * 60 * 60 * 1000) + hour * 60 * 60 * 1000;
        const amt = Math.round(45000 + rand() * 180000);
        const tx: Transaction = {
          id: uid("TX"),
          ts,
          type: "Ride",
          module: moduleForType("Ride"),
          vendor: vendorFor("Ride"),
          requesterId: u.id,
          requesterName: u.name,
          group: u.group,
          costCenter: u.costCenter,
          amountUGX: amt,
          currency: "UGX",
          risk: riskFor("Ride", undefined, amt),
          approved: true,
          tags: tagsFor("Ride"),
        };

        // approvals for some rides above threshold
        const needsApproval = amt > 200000 || rand() < 0.08;
        if (needsApproval) {
          const ap = makeApproval(tx);
          approvals.push(ap);
          tx.approvalId = ap.id;
          tx.approved = ap.outcome !== "Rejected";
        }

        txs.push(tx);
      }

      // charging
      const chg = Math.floor(rand() * 2);
      for (let i = 0; i < chg; i++) {
        const u = pickWeighted([{ item: USERS[0], w: 0.8 }, { item: USERS[2], w: 1 }, { item: USERS[1], w: 0.6 }]);
        const hour = pickWeighted([{ item: 8, w: 1.1 }, { item: 18, w: 1 }, { item: Math.floor(rand() * 24), w: 0.7 }]);
        const ts = dayTs + hour * 60 * 60 * 1000 + Math.floor(rand() * 40) * 60000;
        const kWh = 12 + rand() * 55;
        const price = isPeakHour(hour) ? 1350 : 1050;
        const amt = Math.round(kWh * price);
        const tx: Transaction = {
          id: uid("TX"),
          ts,
          type: "Charging",
          module: moduleForType("Charging"),
          vendor: vendorFor("Charging"),
          requesterId: u.id,
          requesterName: u.name,
          group: u.group,
          costCenter: u.costCenter,
          amountUGX: amt,
          currency: "UGX",
          risk: riskFor("Charging", undefined, amt),
          approved: true,
          tags: tagsFor("Charging"),
        };

        const needsApproval = amt > 200000 || isPeakHour(hour) || rand() < 0.05;
        if (needsApproval) {
          const ap = makeApproval(tx);
          approvals.push(ap);
          tx.approvalId = ap.id;
          tx.approved = ap.outcome !== "Rejected";
        }

        txs.push(tx);
      }

      // e-commerce purchases/services
      const purchases = Math.floor(rand() * 3);
      for (let i = 0; i < purchases; i++) {
        const u = pickWeighted([{ item: USERS[4], w: 1.2 }, { item: USERS[0], w: 0.7 }, { item: USERS[1], w: 0.7 }]);
        const mkt = marketplaceForPurchase();
        const hour = Math.floor(rand() * 24);
        const ts = dayTs + hour * 60 * 60 * 1000 + Math.floor(rand() * 50) * 60000;
        const amtBase = mkt === "MyLiveDealz" ? 180000 + rand() * 3200000 : 70000 + rand() * 1200000;
        const amt = Math.round(amtBase);
        const txType: TxType = mkt === "ServiceMart" ? "Service" : "Purchase";
        const tx: Transaction = {
          id: uid("TX"),
          ts,
          type: txType,
          module: "E-Commerce",
          marketplace: mkt,
          vendor: vendorFor(txType, mkt),
          requesterId: u.id,
          requesterName: u.name,
          group: u.group,
          costCenter: u.costCenter,
          amountUGX: amt,
          currency: "UGX",
          risk: riskFor(txType, mkt, amt),
          approved: true,
          tags: tagsFor(txType, mkt),
        };

        const needsApproval = amt > 250000 || tx.risk === "High" || rand() < 0.08;
        if (needsApproval) {
          const ap = makeApproval(tx);
          approvals.push(ap);
          tx.approvalId = ap.id;
          tx.approved = ap.outcome !== "Rejected";
        }

        txs.push(tx);
      }
    }

    // only keep last 1200 records to keep UI snappy
    const trimmedTx = txs
      .slice()
      .sort((a, b) => b.ts - a.ts)
      .slice(0, 900);

    const trimmedAp = approvals.slice().sort((a, b) => b.requestedAt - a.requestedAt).slice(0, 500);

    return { txs: trimmedTx, approvals: trimmedAp };
  }, [USERS]);

  const [tab, setTab] = useState<"overview" | "spend" | "approvals" | "anomalies" | "savings" | "builder" | "schedules">("overview");

  const [timeRange, setTimeRange] = useState<TimeRange>("30d");
  const [customFrom, setCustomFrom] = useState<string>(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10));
  const [customTo, setCustomTo] = useState<string>(new Date().toISOString().slice(0, 10));

  const [moduleFilter, setModuleFilter] = useState<ServiceModule | "All">("All");
  const [marketplaceFilter, setMarketplaceFilter] = useState<Marketplace | "All">("All");
  const [groupFilter, setGroupFilter] = useState<GroupName | "All">("All");
  const [costCenterFilter, setCostCenterFilter] = useState<string | "All">("All");
  const [vendorFilter, setVendorFilter] = useState<string | "All">("All");
  const [requesterFilter, setRequesterFilter] = useState<string | "All">("All");
  const [riskFilter, setRiskFilter] = useState<Risk | "All">("All");

  const [q, setQ] = useState("");

  // Spend explorer settings
  const DIMENSIONS: Dimension[] = ["Group", "Cost center", "Module", "Marketplace", "Vendor", "Requester", "Risk"];
  const [dimA, setDimA] = useState<Dimension>("Module");
  const [dimB, setDimB] = useState<Dimension | "None">("None");
  const [metric, setMetric] = useState<Metric>("Spend");

  // Report builder
  const [savedReports, setSavedReports] = useState<ReportConfig[]>(() => [
    {
      id: "RPT-001",
      name: "Spend by module (30d)",
      timeRange: "30d",
      dimensionA: "Module",
      metric: "Spend",
      filters: { module: "All", marketplace: "All", group: "All", costCenter: "All", vendor: "All", requester: "All", risk: "All" },
      createdAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
    },
    {
      id: "RPT-002",
      name: "Spend by vendor (90d)",
      timeRange: "90d",
      dimensionA: "Vendor",
      metric: "Spend",
      filters: { module: "All", marketplace: "All", group: "All", costCenter: "All", vendor: "All", requester: "All", risk: "All" },
      createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000,
    },
  ]);

  const [schedules, setSchedules] = useState<Schedule[]>(() => [
    {
      id: "SCH-001",
      reportId: "RPT-001",
      enabled: true,
      frequency: "Weekly",
      hourLocal: 9,
      dayOfWeek: "Mon",
      recipients: "finance@acme.com, ap@acme.com",
      channels: { email: true, whatsapp: false, wechat: false, sms: false },
      formats: { csv: true, pdf: true, json: false },
      lastRunAt: Date.now() - 2 * 24 * 60 * 60 * 1000,
      lastStatus: "Success",
    },
  ]);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportDraft, setReportDraft] = useState<ReportConfig>(() => ({
    id: "",
    name: "",
    timeRange: "30d",
    customFrom: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    customTo: new Date().toISOString().slice(0, 10),
    dimensionA: "Module",
    dimensionB: undefined,
    metric: "Spend",
    filters: { module: "All", marketplace: "All", group: "All", costCenter: "All", vendor: "All", requester: "All", risk: "All" },
    createdAt: Date.now(),
  }));

  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleDraft, setScheduleDraft] = useState<Schedule>(() => ({
    id: "",
    reportId: "RPT-001",
    enabled: true,
    frequency: "Weekly",
    hourLocal: 9,
    dayOfWeek: "Mon",
    dayOfMonth: 1,
    recipients: "finance@acme.com",
    channels: { email: true, whatsapp: true, wechat: false, sms: false },
    formats: { csv: true, pdf: true, json: false },
  }));

  const range = useMemo(() => getRange(timeRange, customFrom, customTo), [timeRange, customFrom, customTo]);

  const txs = seedData.txs;
  const approvals = seedData.approvals;

  const filteredTx = useMemo(() => {
    const query = q.trim().toLowerCase();

    return txs
      .filter((t) => t.ts >= range.start && t.ts <= range.end)
      .filter((t) => (moduleFilter === "All" ? true : t.module === moduleFilter))
      .filter((t) => (marketplaceFilter === "All" ? true : (t.marketplace || "-") === marketplaceFilter))
      .filter((t) => (groupFilter === "All" ? true : t.group === groupFilter))
      .filter((t) => (costCenterFilter === "All" ? true : t.costCenter === costCenterFilter))
      .filter((t) => (vendorFilter === "All" ? true : t.vendor === vendorFilter))
      .filter((t) => (requesterFilter === "All" ? true : t.requesterName === requesterFilter))
      .filter((t) => (riskFilter === "All" ? true : t.risk === riskFilter))
      .filter((t) => {
        if (!query) return true;
        const blob = `${t.id} ${t.type} ${t.module} ${t.marketplace || ""} ${t.vendor} ${t.requesterName} ${t.group} ${t.costCenter} ${t.risk} ${t.tags.join(" ")}`.toLowerCase();
        return blob.includes(query);
      })
      .slice()
      .sort((a, b) => b.ts - a.ts);
  }, [txs, range.start, range.end, moduleFilter, marketplaceFilter, groupFilter, costCenterFilter, vendorFilter, requesterFilter, riskFilter, q]);

  const filteredApprovals = useMemo(() => {
    return approvals
      .filter((a) => a.requestedAt >= range.start && a.requestedAt <= range.end)
      .filter((a) => (moduleFilter === "All" ? true : a.module === moduleFilter))
      .filter((a) => (marketplaceFilter === "All" ? true : (a.marketplace || "-") === marketplaceFilter))
      .filter((a) => (requesterFilter === "All" ? true : a.requesterName === requesterFilter))
      .slice()
      .sort((a, b) => b.requestedAt - a.requestedAt);
  }, [approvals, range.start, range.end, moduleFilter, marketplaceFilter, requesterFilter]);

  const totalSpend = useMemo(() => filteredTx.reduce((a, b) => a + (b.approved ? b.amountUGX : 0), 0), [filteredTx]);
  const totalCount = filteredTx.length;

  const approvedSpend = useMemo(() => filteredTx.filter((t) => t.approved).reduce((a, b) => a + b.amountUGX, 0), [filteredTx]);
  const rejectedSpend = useMemo(() => filteredTx.filter((t) => !t.approved).reduce((a, b) => a + b.amountUGX, 0), [filteredTx]);

  const approvalsPending = useMemo(() => filteredApprovals.filter((a) => a.outcome !== "Auto-approved" && a.outcome !== "Approved" && a.outcome !== "Rejected").length, [filteredApprovals]);

  // Spend breakdown for overview
  const spendByModule = useMemo(() => {
    const map = new Map<string, { spend: number; count: number }>();
    filteredTx.forEach((t) => {
      const k = t.module;
      const prev = map.get(k) || { spend: 0, count: 0 };
      map.set(k, { spend: prev.spend + (t.approved ? t.amountUGX : 0), count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .map(([k, v]) => ({ key: k, ...v }))
      .sort((a, b) => b.spend - a.spend);
  }, [filteredTx]);

  const topVendors = useMemo(() => {
    const map = new Map<string, number>();
    filteredTx.forEach((t) => {
      if (!t.approved) return;
      map.set(t.vendor, (map.get(t.vendor) || 0) + t.amountUGX);
    });
    return Array.from(map.entries())
      .map(([vendor, spend]) => ({ vendor, spend }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 6);
  }, [filteredTx]);

  const approvalMetrics = useMemo(() => {
    const cycleMins = filteredApprovals.map((a) => Math.max(1, Math.round((a.decidedAt - a.requestedAt) / 60000)));
    const avg = cycleMins.length ? Math.round(cycleMins.reduce((x, y) => x + y, 0) / cycleMins.length) : 0;
    const med = Math.round(median(cycleMins));
    const breach = filteredApprovals.filter((a) => (a.decidedAt - a.requestedAt) / 3600000 > a.slaHours).length;
    const auto = filteredApprovals.filter((a) => a.outcome === "Auto-approved").length;
    const approved = filteredApprovals.filter((a) => a.outcome === "Approved").length;
    const rejected = filteredApprovals.filter((a) => a.outcome === "Rejected").length;
    return { avgMins: avg, medMins: med, breaches: breach, auto, approved, rejected, total: filteredApprovals.length };
  }, [filteredApprovals]);

  const approvalByModule = useMemo(() => {
    const map = new Map<string, { total: number; avgMins: number; ok: number; rejected: number; breach: number }>();
    filteredApprovals.forEach((a) => {
      const k = a.module;
      const prev = map.get(k) || { total: 0, avgMins: 0, ok: 0, rejected: 0, breach: 0 };
      const mins = Math.max(1, Math.round((a.decidedAt - a.requestedAt) / 60000));
      const nextTotal = prev.total + 1;
      const nextAvg = Math.round((prev.avgMins * prev.total + mins) / nextTotal);
      const breach = (a.decidedAt - a.requestedAt) / 3600000 > a.slaHours ? 1 : 0;
      map.set(k, {
        total: nextTotal,
        avgMins: nextAvg,
        ok: prev.ok + (a.outcome === "Approved" || a.outcome === "Auto-approved" ? 1 : 0),
        rejected: prev.rejected + (a.outcome === "Rejected" ? 1 : 0),
        breach: prev.breach + breach,
      });
    });
    return Array.from(map.entries())
      .map(([module, v]) => ({ module, ...v, approvalRate: v.total ? Math.round((v.ok / v.total) * 100) : 100 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredApprovals]);

  // Spend explorer aggregation
  const aggregation = useMemo(() => {
    const keyA = dimA;
    const keyB = dimB === "None" ? null : (dimB as Dimension);

    // primary
    const mapA = new Map<string, { spend: number; count: number }>();
    filteredTx.forEach((t) => {
      const aKey = dimValue(t, keyA);
      const prev = mapA.get(aKey) || { spend: 0, count: 0 };
      mapA.set(aKey, { spend: prev.spend + (t.approved ? t.amountUGX : 0), count: prev.count + 1 });
    });

    const rowsA = Array.from(mapA.entries())
      .map(([k, v]) => ({ key: k, ...v, avg: v.count ? Math.round(v.spend / v.count) : 0 }))
      .sort((a, b) => (metric === "Transactions" ? b.count - a.count : metric === "Avg transaction" ? b.avg - a.avg : b.spend - a.spend));

    // pivot
    let pivot: { columns: string[]; rows: Array<{ rowKey: string; cells: Record<string, number>; total: number }> } | null = null;

    if (keyB) {
      const colSpend = new Map<string, number>();
      filteredTx.forEach((t) => {
        if (!t.approved) return;
        const bKey = dimValue(t, keyB);
        colSpend.set(bKey, (colSpend.get(bKey) || 0) + t.amountUGX);
      });

      const topCols = Array.from(colSpend.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([k]) => k);

      const rowsMap = new Map<string, Record<string, number>>();
      const rowTotal = new Map<string, number>();

      filteredTx.forEach((t) => {
        if (!t.approved) return;
        const rKey = dimValue(t, keyA);
        const cKeyRaw = dimValue(t, keyB);
        const cKey = topCols.includes(cKeyRaw) ? cKeyRaw : "Other";

        const row = rowsMap.get(rKey) || {};
        row[cKey] = (row[cKey] || 0) + t.amountUGX;
        rowsMap.set(rKey, row);
        rowTotal.set(rKey, (rowTotal.get(rKey) || 0) + t.amountUGX);
      });

      const columns = [...topCols, "Other"].filter((c, i, arr) => {
        if (c !== "Other") return true;
        // keep Other only if used
        const used = Array.from(rowsMap.values()).some((r) => (r["Other"] || 0) > 0);
        return used;
      });

      const rows = Array.from(rowsMap.entries())
        .map(([rowKey, cells]) => ({ rowKey, cells, total: rowTotal.get(rowKey) || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 12);

      pivot = { columns, rows };
    }

    return { rowsA, pivot };
  }, [filteredTx, dimA, dimB, metric]);

  // Anomalies
  const anomalies = useMemo(() => {
    const day = 24 * 60 * 60 * 1000;
    const end = range.end;
    const last7 = { start: end - 7 * day, end };
    const prev7 = { start: end - 14 * day, end: end - 7 * day };

    const inRange = (t: Transaction, r: { start: number; end: number }) => t.ts >= r.start && t.ts < r.end && t.approved;

    const vendorSpend = (r: { start: number; end: number }) => {
      const map = new Map<string, number>();
      txs.forEach((t) => {
        if (!inRange(t, r)) return;
        map.set(t.vendor, (map.get(t.vendor) || 0) + t.amountUGX);
      });
      return map;
    };

    const vLast = vendorSpend(last7);
    const vPrev = vendorSpend(prev7);

    const vendorSpikes = Array.from(vLast.entries())
      .map(([vendor, amt]) => ({
        kind: "Unusual vendor spend",
        vendor,
        last7: amt,
        prev7: vPrev.get(vendor) || 0,
      }))
      .filter((x) => x.last7 >= 700000 && x.prev7 > 0 && x.last7 > x.prev7 * 2)
      .sort((a, b) => b.last7 - a.last7)
      .slice(0, 6);

    const afterHours = txs
      .filter((t) => t.approved)
      .filter((t) => {
        const h = new Date(t.ts).getHours();
        return h < 6 || h > 22;
      })
      .filter((t) => t.ts >= range.start && t.ts <= range.end)
      .slice(0, 10);

    const highRiskShare = (() => {
      const spend = filteredTx.filter((t) => t.approved).reduce((a, b) => a + b.amountUGX, 0);
      const high = filteredTx.filter((t) => t.approved && t.risk === "High").reduce((a, b) => a + b.amountUGX, 0);
      const pct = spend ? Math.round((high / spend) * 100) : 0;
      return { spend, high, pct };
    })();

    const chargingPeak = (() => {
      const chg = filteredTx.filter((t) => t.approved && t.type === "Charging");
      const peak = chg.filter((t) => {
        const h = new Date(t.ts).getHours();
        return isPeakHour(h);
      });
      return {
        total: chg.length,
        peak: peak.length,
        pct: chg.length ? Math.round((peak.length / chg.length) * 100) : 0,
      };
    })();

    const lowAmountApprovals = filteredApprovals.filter((a) => a.amountUGX <= 200000 && a.outcome === "Approved").length;

    return {
      vendorSpikes,
      afterHours,
      highRiskShare,
      chargingPeak,
      lowAmountApprovals,
    };
  }, [txs, filteredTx, filteredApprovals, range.start, range.end]);

  // Savings insights
  const savings = useMemo(() => {
    // Vendor consolidation per module
    const byModule = new Map<string, { spend: number; vendors: Map<string, number> }>();
    filteredTx
      .filter((t) => t.approved)
      .forEach((t) => {
        const k = t.module;
        const row = byModule.get(k) || { spend: 0, vendors: new Map<string, number>() };
        row.spend += t.amountUGX;
        row.vendors.set(t.vendor, (row.vendors.get(t.vendor) || 0) + t.amountUGX);
        byModule.set(k, row);
      });

    const vendorConsolidation = Array.from(byModule.entries())
      .map(([module, v]) => {
        const vendors = Array.from(v.vendors.entries()).sort((a, b) => b[1] - a[1]);
        const top = vendors[0]?.[1] || 0;
        const share = v.spend ? Math.round((top / v.spend) * 100) : 0;
        return { module, totalSpend: v.spend, vendorCount: vendors.length, topVendor: vendors[0]?.[0] || "-", topShare: share };
      })
      .filter((x) => x.totalSpend >= 1500000 && x.vendorCount >= 3 && x.topShare <= 70)
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 6);

    // Policy improvement: many approvals under threshold
    const smallApprovals = filteredApprovals.filter((a) => a.outcome === "Approved" && a.amountUGX <= 200000).length;
    const totalApprovals = filteredApprovals.length;
    const smallPct = totalApprovals ? Math.round((smallApprovals / totalApprovals) * 100) : 0;

    // Charging off-peak savings potential
    const chg = filteredTx.filter((t) => t.approved && t.type === "Charging");
    const peak = chg.filter((t) => isPeakHour(new Date(t.ts).getHours()));
    const peakPct = chg.length ? Math.round((peak.length / chg.length) * 100) : 0;

    return {
      vendorConsolidation,
      policy: { smallApprovals, totalApprovals, smallPct },
      charging: { total: chg.length, peak: peak.length, peakPct },
    };
  }, [filteredTx, filteredApprovals]);

  // Options for filters
  const costCenters = useMemo(() => Array.from(new Set(txs.map((t) => t.costCenter))).sort(), [txs]);
  const vendors = useMemo(() => Array.from(new Set(txs.map((t) => t.vendor))).sort(), [txs]);
  const requesters = useMemo(() => Array.from(new Set(txs.map((t) => t.requesterName))).sort(), [txs]);

  // Export helpers
  const exportTransactionsCSV = () => {
    const rows = filteredTx.map((t) => ({
      ts: fmtDateTime(t.ts),
      id: t.id,
      type: t.type,
      module: t.module,
      marketplace: t.marketplace || "-",
      vendor: t.vendor,
      requester: t.requesterName,
      group: t.group,
      costCenter: t.costCenter,
      amountUGX: t.amountUGX,
      risk: t.risk,
      approved: t.approved ? "Yes" : "No",
      approvalId: t.approvalId || "-",
      tags: t.tags.join(";"),
    }));

    const csv = toCSV(rows, [
      { key: "ts", label: "Time" },
      { key: "id", label: "Transaction ID" },
      { key: "type", label: "Type" },
      { key: "module", label: "Module" },
      { key: "marketplace", label: "Marketplace" },
      { key: "vendor", label: "Vendor" },
      { key: "requester", label: "Requester" },
      { key: "group", label: "Group" },
      { key: "costCenter", label: "Cost center" },
      { key: "amountUGX", label: "Amount (UGX)" },
      { key: "risk", label: "Risk" },
      { key: "approved", label: "Approved" },
      { key: "approvalId", label: "Approval ID" },
      { key: "tags", label: "Tags" },
    ]);

    downloadText("transactions.csv", csv, "text/csv");
    toast({ title: "Exported", message: "Transactions CSV downloaded.", kind: "success" });
  };

  const exportAggregatesCSV = () => {
    const rows = aggregation.rowsA.map((r) => ({
      dimension: r.key,
      spendUGX: r.spend,
      transactions: r.count,
      avgUGX: r.avg,
    }));

    const csv = toCSV(rows, [
      { key: "dimension", label: dimA },
      { key: "spendUGX", label: "Spend (UGX)" },
      { key: "transactions", label: "Transactions" },
      { key: "avgUGX", label: "Avg (UGX)" },
    ]);

    downloadText("report-aggregate.csv", csv, "text/csv");
    toast({ title: "Exported", message: "Aggregate CSV downloaded.", kind: "success" });
  };

  const exportJSON = () => {
    const payload = {
      filters: { timeRange, customFrom, customTo, moduleFilter, marketplaceFilter, groupFilter, costCenterFilter, vendorFilter, requesterFilter, riskFilter, q },
      totals: { approvedSpend, rejectedSpend, txCount: totalCount, approvalCount: filteredApprovals.length },
      transactions: filteredTx,
      approvals: filteredApprovals,
      generatedAt: new Date().toISOString(),
    };
    downloadText("report.json", JSON.stringify(payload, null, 2), "application/json");
    toast({ title: "Exported", message: "JSON downloaded.", kind: "success" });
  };

  const exportPDF = () => {
    const html = `
      <html>
        <head>
          <title>CorporatePay Report</title>
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
          <h2>CorporatePay Reporting & Analytics</h2>
          <div class="muted">Time range: ${timeRange}${timeRange === "Custom" ? ` (${customFrom} to ${customTo})` : ""} • Generated: ${new Date().toLocaleString()}</div>
          <div class="grid">
            <div class="card"><div class="muted">Approved spend</div><div style="font-size:20px;font-weight:700">${formatUGX(approvedSpend)}</div></div>
            <div class="card"><div class="muted">Transactions</div><div style="font-size:20px;font-weight:700">${totalCount}</div></div>
            <div class="card"><div class="muted">Approvals</div><div style="font-size:20px;font-weight:700">${filteredApprovals.length}</div></div>
          </div>

          <h3 style="margin-top:18px">Top vendors</h3>
          <table>
            <thead><tr><th>Vendor</th><th>Spend</th></tr></thead>
            <tbody>
              ${topVendors.map((v) => `<tr><td>${v.vendor}</td><td>${formatUGX(v.spend)}</td></tr>`).join("")}
            </tbody>
          </table>

          <div class="muted" style="margin-top:18px">Tip: Use browser Print → Save as PDF.</div>
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
  };

  // Report builder preview (from reportDraft)
  const reportPreview = useMemo(() => {
    const r = getRange(reportDraft.timeRange, reportDraft.customFrom, reportDraft.customTo);
    const filt = reportDraft.filters;

    const tx = txs
      .filter((t) => t.ts >= r.start && t.ts <= r.end)
      .filter((t) => (filt.module && filt.module !== "All" ? t.module === filt.module : true))
      .filter((t) => (filt.marketplace && filt.marketplace !== "All" ? (t.marketplace || "-") === filt.marketplace : true))
      .filter((t) => (filt.group && filt.group !== "All" ? t.group === filt.group : true))
      .filter((t) => (filt.costCenter && filt.costCenter !== "All" ? t.costCenter === filt.costCenter : true))
      .filter((t) => (filt.vendor && filt.vendor !== "All" ? t.vendor === filt.vendor : true))
      .filter((t) => (filt.requester && filt.requester !== "All" ? t.requesterName === filt.requester : true))
      .filter((t) => (filt.risk && filt.risk !== "All" ? t.risk === filt.risk : true))
      .filter((t) => t.approved);

    const aDim = reportDraft.dimensionA;
    const bDim = reportDraft.dimensionB;

    const byA = new Map<string, { spend: number; count: number }>();
    tx.forEach((t) => {
      const k = dimValue(t, aDim);
      const prev = byA.get(k) || { spend: 0, count: 0 };
      byA.set(k, { spend: prev.spend + t.amountUGX, count: prev.count + 1 });
    });

    const rows = Array.from(byA.entries())
      .map(([k, v]) => ({
        key: k,
        spend: v.spend,
        count: v.count,
        avg: v.count ? Math.round(v.spend / v.count) : 0,
      }))
      .sort((x, y) => y.spend - x.spend)
      .slice(0, 12);

    // optional pivot
    let pivot: { columns: string[]; rows: Array<{ rowKey: string; cells: Record<string, number>; total: number }> } | null = null;

    if (bDim) {
      const colSpend = new Map<string, number>();
      tx.forEach((t) => {
        const c = dimValue(t, bDim);
        colSpend.set(c, (colSpend.get(c) || 0) + t.amountUGX);
      });
      const topCols = Array.from(colSpend.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([k]) => k);

      const rowsMap = new Map<string, Record<string, number>>();
      const totals = new Map<string, number>();

      tx.forEach((t) => {
        const rk = dimValue(t, aDim);
        const ckRaw = dimValue(t, bDim);
        const ck = topCols.includes(ckRaw) ? ckRaw : "Other";
        const row = rowsMap.get(rk) || {};
        row[ck] = (row[ck] || 0) + t.amountUGX;
        rowsMap.set(rk, row);
        totals.set(rk, (totals.get(rk) || 0) + t.amountUGX);
      });

      const columns = [...topCols, "Other"].filter((c) => (c !== "Other" ? true : Array.from(rowsMap.values()).some((r) => (r["Other"] || 0) > 0)));
      const pivotRows = Array.from(rowsMap.entries())
        .map(([rowKey, cells]) => ({ rowKey, cells, total: totals.get(rowKey) || 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      pivot = { columns, rows: pivotRows };
    }

    const totalsAll = {
      spend: tx.reduce((a, b) => a + b.amountUGX, 0),
      count: tx.length,
    };

    return { rows, pivot, totalsAll };
  }, [reportDraft, txs]);

  const saveReport = () => {
    if (reportDraft.name.trim().length < 3) {
      toast({ title: "Name required", message: "Enter a report name.", kind: "warn" });
      return;
    }

    const isNew = !reportDraft.id;
    const id = reportDraft.id || uid("RPT");

    const clean: ReportConfig = {
      ...reportDraft,
      id,
      createdAt: isNew ? Date.now() : reportDraft.createdAt,
    };

    setSavedReports((prev) => {
      const idx = prev.findIndex((r) => r.id === id);
      const next = prev.slice();
      if (idx >= 0) next[idx] = clean;
      else next.unshift(clean);
      return next;
    });

    toast({ title: "Saved", message: "Report saved.", kind: "success" });
    setReportModalOpen(false);
    setTab("schedules");
  };

  const createSchedule = () => {
    const rpt = savedReports.find((r) => r.id === scheduleDraft.reportId);
    if (!rpt) {
      toast({ title: "Select report", message: "Choose a report to schedule.", kind: "warn" });
      return;
    }
    if (scheduleDraft.recipients.trim().length < 3) {
      toast({ title: "Recipients required", message: "Enter recipients emails or numbers.", kind: "warn" });
      return;
    }

    const id = scheduleDraft.id || uid("SCH");
    const row: Schedule = { ...scheduleDraft, id, enabled: true };

    setSchedules((prev) => {
      const idx = prev.findIndex((s) => s.id === id);
      const next = prev.slice();
      if (idx >= 0) next[idx] = row;
      else next.unshift(row);
      return next;
    });

    toast({ title: "Scheduled", message: "Report schedule saved.", kind: "success" });
    setScheduleModalOpen(false);
  };

  const runScheduleNow = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, lastRunAt: Date.now(), lastStatus: Math.random() < 0.92 ? "Success" : "Failed" }
          : s
      )
    );
    toast({ title: "Triggered", message: "Schedule run triggered (demo).", kind: "info" });
  };

  const printHint = "PDF export uses Print to PDF.";

  return (
    <div className="min-h-screen bg-slate-50 transition-colors dark:bg-slate-950">
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      <div className="px-4 py-6 md:px-6 lg:px-8">
        <div className="bg-white transition-colors dark:bg-slate-900">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 transition-colors md:px-6 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">Reporting & Analytics</div>
                  <div className="mt-1 text-sm text-slate-500 dark:text-slate-400">Spend breakdowns, approvals, anomalies, and scheduled reports</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Approved spend: ${formatUGX(approvedSpend)}`} tone="good" />
                    <Pill label={`Rejected: ${formatUGX(rejectedSpend)}`} tone={rejectedSpend ? "warn" : "good"} />
                    <Pill label={`Tx: ${totalCount}`} tone="neutral" />
                    <Pill label={`Approvals: ${filteredApprovals.length}`} tone={filteredApprovals.length ? "info" : "neutral"} />
                    <Pill label={printHint} tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={exportTransactionsCSV}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                <Button variant="outline" onClick={exportPDF} title={printHint}>
                  <FileText className="h-4 w-4" /> Export PDF
                </Button>
                <Button
                  variant="accent"
                  onClick={() => {
                    setReportDraft({
                      id: "",
                      name: "",
                      timeRange: timeRange,
                      customFrom,
                      customTo,
                      dimensionA: "Module",
                      dimensionB: undefined,
                      metric: "Spend",
                      filters: { module: "All", marketplace: "All", group: "All", costCenter: "All", vendor: "All", requester: "All", risk: "All" },
                      createdAt: Date.now(),
                    });
                    setReportModalOpen(true);
                  }}
                >
                  <Wand2 className="h-4 w-4" /> Build report
                </Button>
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { id: "overview", label: "Overview" },
                { id: "spend", label: "Spend explorer" },
                { id: "approvals", label: "Approvals" },
                { id: "anomalies", label: "Anomalies" },
                { id: "savings", label: "Savings" },
                { id: "builder", label: "Custom builder" },
                { id: "schedules", label: "Schedules" },
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

            {/* Global filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 transition-colors md:grid-cols-12 dark:border-slate-700 dark:bg-slate-800">
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
              <div className="md:col-span-3">
                <Select
                  label="Module"
                  value={moduleFilter}
                  onChange={(v) => setModuleFilter(v as any)}
                  options={[{ value: "All", label: "All" }, ...MODULES.map((m) => ({ value: m, label: m }))]}
                />
              </div>
              <div className="md:col-span-2">
                <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Search</div>
                <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="vendor, tag..."
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 dark:text-white"
                  />
                  {q ? (
                    <button className="rounded-xl p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700" onClick={() => setQ("")}
                      aria-label="Clear">
                      <X className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div className="md:col-span-12 grid grid-cols-1 gap-3 md:grid-cols-6">
                <Select
                  label="Marketplace"
                  value={marketplaceFilter}
                  onChange={(v) => setMarketplaceFilter(v as any)}
                  options={[{ value: "All", label: "All" }, ...MARKETPLACES.map((m) => ({ value: m, label: m }))]}
                  hint="E-Commerce"
                  disabled={moduleFilter !== "All" && moduleFilter !== "E-Commerce"}
                />
                <Select
                  label="Group"
                  value={groupFilter}
                  onChange={(v) => setGroupFilter(v as any)}
                  options={[{ value: "All", label: "All" }, ...(["Operations", "Sales", "Finance", "Admin", "Procurement"] as GroupName[]).map((g) => ({ value: g, label: g }))]}
                />
                <Select
                  label="Cost center"
                  value={costCenterFilter}
                  onChange={setCostCenterFilter}
                  options={[{ value: "All", label: "All" }, ...costCenters.map((c) => ({ value: c, label: c }))]}
                />
                <Select
                  label="Vendor"
                  value={vendorFilter}
                  onChange={setVendorFilter}
                  options={[{ value: "All", label: "All" }, ...vendors.map((v) => ({ value: v, label: v }))]}
                />
                <Select
                  label="Requester"
                  value={requesterFilter}
                  onChange={setRequesterFilter}
                  options={[{ value: "All", label: "All" }, ...requesters.map((r) => ({ value: r, label: r }))]}
                />
                <Select
                  label="Risk"
                  value={riskFilter}
                  onChange={(v) => setRiskFilter(v as any)}
                  options={[{ value: "All", label: "All" }, { value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]}
                />
              </div>

              <div className="md:col-span-12 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500">
                  Showing <span className="font-semibold text-slate-900">{filteredTx.length}</span> transactions and <span className="font-semibold text-slate-900">{filteredApprovals.length}</span> approvals in this time range.
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMarketplaceFilter("All");
                      setGroupFilter("All");
                      setCostCenterFilter("All");
                      setVendorFilter("All");
                      setRequesterFilter("All");
                      setRiskFilter("All");
                      setQ("");
                      toast({ title: "Reset", message: "Filters reset.", kind: "info" });
                    }}
                  >
                    <Filter className="h-4 w-4" /> Reset
                  </Button>
                  <Button variant="outline" onClick={exportAggregatesCSV}>
                    <Download className="h-4 w-4" /> Export aggregate
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            {tab === "overview" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-8 space-y-4">
                  <Section title="KPIs" subtitle="High-level performance and spend signals." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <StatCard title="Approved spend" value={formatUGX(approvedSpend)} sub="Within selected range" icon={<BarChart3 className="h-5 w-5" />} tone="good" />
                      <StatCard title="Transactions" value={`${totalCount}`} sub="All events" icon={<LineChart className="h-5 w-5" />} tone="neutral" />
                      <StatCard title="Approvals" value={`${approvalMetrics.total}`} sub={`Avg ${approvalMetrics.avgMins}m • Median ${approvalMetrics.medMins}m`} icon={<Timer className="h-5 w-5" />} tone={approvalMetrics.breaches ? "warn" : "good"} />
                      <StatCard title="SLA breaches" value={`${approvalMetrics.breaches}`} sub="Approval SLA" icon={<AlertTriangle className="h-5 w-5" />} tone={approvalMetrics.breaches ? "bad" : "good"} />
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <Section
                        title="Spend by module"
                        subtitle="Top modules by approved spend."
                        right={<Pill label="Core" tone="neutral" />}
                      >
                        <div className="space-y-2">
                          {spendByModule.slice(0, 8).map((m) => (
                            <BarRow key={m.key} label={m.key} value={m.spend} total={approvedSpend} right={formatUGX(m.spend)} />
                          ))}
                          {!spendByModule.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No data.</div> : null}
                        </div>
                      </Section>

                      <Section
                        title="Top vendors"
                        subtitle="Where most money goes."
                        right={<Pill label="Premium" tone="info" />}
                      >
                        <div className="space-y-2">
                          {topVendors.map((v) => (
                            <BarRow key={v.vendor} label={v.vendor} value={v.spend} total={approvedSpend} right={formatUGX(v.spend)} />
                          ))}
                          {!topVendors.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No vendor spend.</div> : null}
                        </div>
                        <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Premium: vendor consolidation suggestions appear in Savings.
                        </div>
                      </Section>
                    </div>
                  </Section>

                  <Section title="Recent activity" subtitle="Sample of the most recent transactions." right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Requester</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Risk</th>
                            <th className="px-4 py-3 font-semibold">Approved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTx.slice(0, 10).map((t) => (
                            <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(t.ts)}</td>
                              <td className="px-4 py-3">
                                <div className="font-semibold text-slate-900">{t.module}</div>
                                <div className="mt-1 text-xs text-slate-500">{t.marketplace ? t.marketplace : t.type}</div>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{t.vendor}</td>
                              <td className="px-4 py-3 text-slate-700">{t.requesterName}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(t.amountUGX)}</td>
                              <td className="px-4 py-3">
                                <Pill label={t.risk} tone={t.risk === "High" ? "bad" : t.risk === "Medium" ? "warn" : "good"} />
                              </td>
                              <td className="px-4 py-3">
                                <Pill label={t.approved ? "Yes" : "No"} tone={t.approved ? "good" : "warn"} />
                              </td>
                            </tr>
                          ))}
                          {!filteredTx.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No transactions match the filters.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <Section title="Quick exports" subtitle="CSV, JSON, and Print to PDF." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" onClick={exportTransactionsCSV}>
                        <Download className="h-4 w-4" /> Export transactions CSV
                      </Button>
                      <Button variant="outline" onClick={exportAggregatesCSV}>
                        <Download className="h-4 w-4" /> Export aggregate CSV
                      </Button>
                      <Button variant="outline" onClick={exportJSON}>
                        <Download className="h-4 w-4" /> Export JSON
                      </Button>
                      <Button variant="outline" onClick={exportPDF} title={printHint}>
                        <FileText className="h-4 w-4" /> Export PDF
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Core exports: CSV/PDF/JSON. Premium: scheduled reports in Schedules.
                    </div>
                  </Section>

                  <Section title="Premium signals" subtitle="Anomaly and savings snapshots." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">High-risk spend</div>
                            <div className="mt-1 text-xs text-slate-500">Share of spend marked High risk.</div>
                          </div>
                          <Pill label={`${anomalies.highRiskShare.pct}%`} tone={anomalies.highRiskShare.pct >= 20 ? "warn" : "good"} />
                        </div>
                        <div className="mt-2 text-xs text-slate-600">{formatUGX(anomalies.highRiskShare.high)} / {formatUGX(anomalies.highRiskShare.spend)}</div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Charging peak usage</div>
                            <div className="mt-1 text-xs text-slate-500">Peak hour charging share.</div>
                          </div>
                          <Pill label={`${anomalies.chargingPeak.pct}%`} tone={anomalies.chargingPeak.pct >= 40 ? "warn" : "good"} />
                        </div>
                        <div className="mt-2 text-xs text-slate-600">Peak {anomalies.chargingPeak.peak} / Total {anomalies.chargingPeak.total}</div>
                      </div>

                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Vendor consolidation</div>
                            <div className="mt-1 text-xs text-slate-500">Modules with fragmented vendors.</div>
                          </div>
                          <Pill label={`${savings.vendorConsolidation.length}`} tone={savings.vendorConsolidation.length ? "info" : "good"} />
                        </div>
                        <div className="mt-2 text-xs text-slate-600">Open Savings tab for recommendations.</div>
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "spend" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Explorer settings" subtitle="Choose dimensions and metric." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3">
                      <Select
                        label="Primary dimension"
                        value={dimA}
                        onChange={(v) => setDimA(v as Dimension)}
                        options={DIMENSIONS.map((d) => ({ value: d, label: d }))}
                      />
                      <Select
                        label="Secondary dimension"
                        value={dimB}
                        onChange={(v) => setDimB(v as any)}
                        options={[{ value: "None", label: "None" }, ...DIMENSIONS.filter((d) => d !== dimA).map((d) => ({ value: d, label: d }))]}
                        hint="Premium pivot"
                      />
                      <Select
                        label="Metric"
                        value={metric}
                        onChange={(v) => setMetric(v as Metric)}
                        options={[
                          { value: "Spend", label: "Spend" },
                          { value: "Transactions", label: "Transactions" },
                          { value: "Avg transaction", label: "Avg transaction" },
                        ]}
                      />
                      <Button variant="outline" onClick={exportAggregatesCSV}>
                        <Download className="h-4 w-4" /> Export aggregate
                      </Button>
                    </div>
                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: add a secondary dimension to create a pivot-style table.
                    </div>
                  </Section>

                  <Section title="Top results" subtitle="Sorted by selected metric." right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {aggregation.rowsA.slice(0, 10).map((r) => {
                        const val = metric === "Transactions" ? r.count : metric === "Avg transaction" ? r.avg : r.spend;
                        const total = metric === "Transactions" ? aggregation.rowsA.reduce((a, b) => a + b.count, 0) : metric === "Avg transaction" ? Math.max(...aggregation.rowsA.map((x) => x.avg), 1) : approvedSpend;
                        return <BarRow key={r.key} label={r.key} value={val} total={total} right={metric === "Transactions" ? `${val}` : formatUGX(val)} />;
                      })}
                      {!aggregation.rowsA.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No data.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section
                    title="Pivot table"
                    subtitle={aggregation.pivot ? `${dimA} by ${dimB}` : "Enable a secondary dimension to show pivot."}
                    right={<Pill label={aggregation.pivot ? "Premium" : "Off"} tone={aggregation.pivot ? "info" : "neutral"} />}
                  >
                    {!aggregation.pivot ? (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">
                        Select a secondary dimension to build a pivot. Example: Module by Vendor.
                      </div>
                    ) : (
                      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                        <table className="min-w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold">{dimA}</th>
                              {aggregation.pivot.columns.map((c) => (
                                <th key={c} className="px-4 py-3 font-semibold">{c}</th>
                              ))}
                              <th className="px-4 py-3 font-semibold">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aggregation.pivot.rows.map((r) => (
                              <tr key={r.rowKey} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900">{r.rowKey}</td>
                                {aggregation.pivot!.columns.map((c) => (
                                  <td key={`${r.rowKey}-${c}`} className="px-4 py-3 text-slate-700">{formatUGX(r.cells[c] || 0)}</td>
                                ))}
                                <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(r.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Section>

                  <Section title="Raw transactions" subtitle="Drilldown view." right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Type</th>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Requester</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Approved</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredTx.slice(0, 16).map((t) => (
                            <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(t.ts)}</td>
                              <td className="px-4 py-3 text-slate-700">{t.type}</td>
                              <td className="px-4 py-3 text-slate-700">{t.module}{t.marketplace ? ` • ${t.marketplace}` : ""}</td>
                              <td className="px-4 py-3 text-slate-700">{t.vendor}</td>
                              <td className="px-4 py-3 text-slate-700">{t.requesterName}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(t.amountUGX)}</td>
                              <td className="px-4 py-3"><Pill label={t.approved ? "Yes" : "No"} tone={t.approved ? "good" : "warn"} /></td>
                            </tr>
                          ))}
                          {!filteredTx.length ? (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-600">No transactions.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "approvals" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Approval KPIs" subtitle="Performance reports." right={<Pill label="Core" tone="neutral" />}>
                    <div className="grid grid-cols-1 gap-3">
                      <StatCard title="Avg cycle time" value={`${approvalMetrics.avgMins}m`} sub="Mean" icon={<Timer className="h-5 w-5" />} tone={approvalMetrics.avgMins > 180 ? "warn" : "good"} />
                      <StatCard title="Median" value={`${approvalMetrics.medMins}m`} sub="Median" icon={<Timer className="h-5 w-5" />} tone={approvalMetrics.medMins > 180 ? "warn" : "good"} />
                      <StatCard title="SLA breaches" value={`${approvalMetrics.breaches}`} sub="Over SLA" icon={<AlertTriangle className="h-5 w-5" />} tone={approvalMetrics.breaches ? "bad" : "good"} />
                      <div className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="text-xs font-semibold text-slate-500">Outcomes</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Pill label={`Auto: ${approvalMetrics.auto}`} tone="info" />
                          <Pill label={`Approved: ${approvalMetrics.approved}`} tone="good" />
                          <Pill label={`Rejected: ${approvalMetrics.rejected}`} tone={approvalMetrics.rejected ? "warn" : "good"} />
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Core: approval performance reports. Premium: scheduled approvals performance reports via Schedules.
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Approvals by module" subtitle="Cycle time, approval rate, SLA breaches." right={<Pill label="Core" tone="neutral" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Total</th>
                            <th className="px-4 py-3 font-semibold">Approval rate</th>
                            <th className="px-4 py-3 font-semibold">Avg mins</th>
                            <th className="px-4 py-3 font-semibold">Rejected</th>
                            <th className="px-4 py-3 font-semibold">Breaches</th>
                          </tr>
                        </thead>
                        <tbody>
                          {approvalByModule.map((m) => (
                            <tr key={m.module} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{m.module}</td>
                              <td className="px-4 py-3 text-slate-700">{m.total}</td>
                              <td className="px-4 py-3"><Pill label={`${m.approvalRate}%`} tone={m.approvalRate >= 90 ? "good" : m.approvalRate >= 75 ? "warn" : "bad"} /></td>
                              <td className="px-4 py-3 text-slate-700">{m.avgMins}m</td>
                              <td className="px-4 py-3 text-slate-700">{m.rejected}</td>
                              <td className="px-4 py-3"><Pill label={`${m.breach}`} tone={m.breach ? "warn" : "good"} /></td>
                            </tr>
                          ))}
                          {!approvalByModule.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No approvals.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>

                  <Section title="Recent approvals" subtitle="Audit-friendly list." right={<Pill label="Core" tone="neutral" />}>
                    <div className="space-y-2">
                      {filteredApprovals.slice(0, 10).map((a) => {
                        const mins = Math.max(1, Math.round((a.decidedAt - a.requestedAt) / 60000));
                        const breach = (a.decidedAt - a.requestedAt) / 3600000 > a.slaHours;
                        return (
                          <div key={a.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Pill label={a.outcome} tone={a.outcome === "Rejected" ? "bad" : a.outcome === "Auto-approved" ? "info" : "good"} />
                                  <Pill label={a.module} tone="neutral" />
                                  {a.marketplace ? <Pill label={a.marketplace} tone="neutral" /> : null}
                                  <Pill label={a.id} tone="neutral" />
                                  {breach ? <Pill label="SLA breach" tone="warn" /> : <Pill label="SLA ok" tone="good" />}
                                </div>
                                <div className="mt-2 text-sm font-semibold text-slate-900">{formatUGX(a.amountUGX)} • {a.requesterName}</div>
                                <div className="mt-1 text-xs text-slate-500">Approver: {a.approver} • Cycle: {mins}m • SLA: {a.slaHours}h</div>
                                <div className="mt-2 text-xs text-slate-600">Reason: {a.reason}</div>
                              </div>
                              <div className="text-right text-xs text-slate-500">Requested {timeAgo(a.requestedAt)}</div>
                            </div>
                          </div>
                        );
                      })}
                      {!filteredApprovals.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No approvals in this range.</div> : null}
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "anomalies" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Anomaly dashboards" subtitle="Logic-based detection (initial)." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Anomalies are detected using safe, explainable rules. Later you can add ML/AI.
                      <ul className="mt-2 space-y-1">
                        <li>1) Vendor spike: last 7 days &gt; 2x previous 7 days</li>
                        <li>2) After-hours usage outside policy window</li>
                        <li>3) High-risk share trends</li>
                        <li>4) Charging peak-hour usage</li>
                      </ul>
                    </div>
                    <Button variant="outline" onClick={() => toast({ title: "Tip", message: "Use Notifications Center for real-time alert routing.", kind: "info" })}>
                      <Info className="h-4 w-4" /> Alert routing tip
                    </Button>
                  </Section>

                  <Section title="Quick counters" subtitle="What needs attention." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-3">
                      <StatCard title="Vendor spikes" value={`${anomalies.vendorSpikes.length}`} sub="Last 7d vs previous 7d" icon={<Sparkles className="h-5 w-5" />} tone={anomalies.vendorSpikes.length ? "warn" : "good"} />
                      <StatCard title="After-hours tx" value={`${anomalies.afterHours.length}`} sub="In selected range" icon={<CalendarClock className="h-5 w-5" />} tone={anomalies.afterHours.length ? "warn" : "good"} />
                      <StatCard title="High-risk share" value={`${anomalies.highRiskShare.pct}%`} sub="Of approved spend" icon={<AlertTriangle className="h-5 w-5" />} tone={anomalies.highRiskShare.pct >= 20 ? "warn" : "good"} />
                      <StatCard title="Charging peak" value={`${anomalies.chargingPeak.pct}%`} sub="Peak-hour sessions" icon={<Timer className="h-5 w-5" />} tone={anomalies.chargingPeak.pct >= 40 ? "warn" : "good"} />
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Unusual vendor spend" subtitle="Spike detection." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {anomalies.vendorSpikes.map((x) => (
                        <div key={x.vendor} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label="Vendor spike" tone="warn" />
                                <Pill label={x.vendor} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">Last 7d: {formatUGX(x.last7)}</div>
                              <div className="mt-1 text-xs text-slate-500">Previous 7d: {formatUGX(x.prev7)}</div>
                              <div className="mt-2 text-xs text-slate-600">Why: spend more than 2x week-over-week</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => { setVendorFilter(x.vendor); setTab("spend"); toast({ title: "Filtered", message: `Showing spend for ${x.vendor}.`, kind: "info" }); }}>
                                <ChevronRight className="h-4 w-4" /> Drill down
                              </Button>
                              <Button variant="outline" onClick={() => toast({ title: "Rule", message: "Create rule from this event (demo).", kind: "info" })}>
                                <Settings2 className="h-4 w-4" /> Create rule
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!anomalies.vendorSpikes.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No vendor spikes detected.</div>
                      ) : null}
                    </div>
                  </Section>

                  <Section title="After-hours transactions" subtitle="Outside policy window (6-22)." right={<Pill label="Premium" tone="info" />}>
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">Time</th>
                            <th className="px-4 py-3 font-semibold">Module</th>
                            <th className="px-4 py-3 font-semibold">Vendor</th>
                            <th className="px-4 py-3 font-semibold">Requester</th>
                            <th className="px-4 py-3 font-semibold">Amount</th>
                            <th className="px-4 py-3 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {anomalies.afterHours.map((t) => (
                            <tr key={t.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 text-slate-700">{fmtDateTime(t.ts)}</td>
                              <td className="px-4 py-3 text-slate-700">{t.module}</td>
                              <td className="px-4 py-3 text-slate-700">{t.vendor}</td>
                              <td className="px-4 py-3 text-slate-700">{t.requesterName}</td>
                              <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(t.amountUGX)}</td>
                              <td className="px-4 py-3">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setRequesterFilter(t.requesterName); setTab("spend"); toast({ title: "Filtered", message: `Showing spend for ${t.requesterName}.`, kind: "info" }); }}>
                                  <ChevronRight className="h-4 w-4" /> Drill down
                                </Button>
                              </td>
                            </tr>
                          ))}
                          {!anomalies.afterHours.length ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-600">No after-hours activity detected.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "savings" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-4 space-y-4">
                  <Section title="Savings dashboard" subtitle="Premium recommendations." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                      Savings opportunities are generated from transaction and approvals patterns.
                    </div>
                    <div className="mt-3 grid grid-cols-1 gap-3">
                      <StatCard title="Consolidation opportunities" value={`${savings.vendorConsolidation.length}`} sub="Modules with fragmented vendors" icon={<Sparkles className="h-5 w-5" />} tone={savings.vendorConsolidation.length ? "info" : "good"} />
                      <StatCard title="Low-value approvals" value={`${savings.policy.smallApprovals}`} sub={`${savings.policy.smallPct}% of approvals`} icon={<Timer className="h-5 w-5" />} tone={savings.policy.smallPct >= 30 ? "warn" : "good"} />
                      <StatCard title="Charging peak share" value={`${savings.charging.peakPct}%`} sub={`${savings.charging.peak}/${savings.charging.total} charging tx`} icon={<CalendarClock className="h-5 w-5" />} tone={savings.charging.peakPct >= 40 ? "warn" : "good"} />
                    </div>
                  </Section>

                  <Section title="Suggested actions" subtitle="Do the next best thing." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      <Reco
                        title="Consolidate vendors"
                        detail="Reduce vendor fragmentation to improve pricing and SLA."
                        cta="Open"
                        onClick={() => toast({ title: "Next", message: "Start a vendor consolidation project (demo).", kind: "info" })}
                      />
                      <Reco
                        title="Improve policies"
                        detail="Reduce approvals for low amounts by updating thresholds."
                        cta="Open"
                        onClick={() => toast({ title: "Next", message: "Open policy simulator (demo).", kind: "info" })}
                      />
                      <Reco
                        title="Shift charging off-peak"
                        detail="Move charging sessions away from peak tariffs to reduce cost."
                        cta="Open"
                        onClick={() => { setModuleFilter("EVs & Charging"); setTab("spend"); toast({ title: "Filtered", message: "Showing EV charging spend.", kind: "info" }); }}
                      />
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-8 space-y-4">
                  <Section title="Vendor consolidation" subtitle="Vendor consolidation, policy improvements." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {savings.vendorConsolidation.map((x) => (
                        <div key={x.module} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <Pill label="Consolidation" tone="info" />
                                <Pill label={x.module} tone="neutral" />
                                <Pill label={`${x.vendorCount} vendors`} tone="neutral" />
                              </div>
                              <div className="mt-2 text-sm font-semibold text-slate-900">Total spend: {formatUGX(x.totalSpend)}</div>
                              <div className="mt-1 text-xs text-slate-500">Top vendor: {x.topVendor} ({x.topShare}% share)</div>
                              <div className="mt-2 text-xs text-slate-600">Suggestion: negotiate a preferred vendor set for this module and route non-preferred purchases for approval.</div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Button variant="outline" onClick={() => { setDimA("Vendor"); setModuleFilter(x.module as any); setTab("spend"); toast({ title: "Explorer", message: "Exploring vendor mix.", kind: "info" }); }}>
                                <ChevronRight className="h-4 w-4" /> Explore
                              </Button>
                              <Button variant="outline" onClick={() => toast({ title: "Created", message: "Vendor consolidation task created (demo).", kind: "success" })}>
                                <Sparkles className="h-4 w-4" /> Create plan
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!savings.vendorConsolidation.length ? (
                        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-8 text-center text-sm text-slate-600">No consolidation opportunities found.</div>
                      ) : null}
                    </div>
                  </Section>

                  <Section title="Policy improvements" subtitle="Reduce approval friction." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Low-value approvals</div>
                          <div className="mt-1 text-xs text-slate-500">Approvals under UGX 200,000.</div>
                        </div>
                        <Pill label={`${savings.policy.smallPct}%`} tone={savings.policy.smallPct >= 30 ? "warn" : "good"} />
                      </div>
                      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                        <StatCard title="Small approvals" value={`${savings.policy.smallApprovals}`} sub="Approved" icon={<Check className="h-5 w-5" />} tone="info" />
                        <StatCard title="Total approvals" value={`${savings.policy.totalApprovals}`} sub="All" icon={<Timer className="h-5 w-5" />} tone="neutral" />
                        <StatCard title="Suggestion" value={savings.policy.smallPct >= 30 ? "Raise threshold" : "OK"} sub="Policy" icon={<Sparkles className="h-5 w-5" />} tone={savings.policy.smallPct >= 30 ? "warn" : "good"} />
                      </div>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Recommendation: If this is consistently high, raise auto-approval threshold and add guardrails (risk, vendor allowlist) to keep safety.
                      </div>
                    </div>
                  </Section>

                  <Section title="Charging cost optimization" subtitle="Off-peak scheduling." right={<Pill label="Premium" tone="info" />}>
                    <div className="rounded-3xl border border-slate-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Peak-hour charging</div>
                          <div className="mt-1 text-xs text-slate-500">Share of charging transactions during peak tariff hours.</div>
                        </div>
                        <Pill label={`${savings.charging.peakPct}%`} tone={savings.charging.peakPct >= 40 ? "warn" : "good"} />
                      </div>
                      <div className="mt-2 text-xs text-slate-600">Peak {savings.charging.peak} / Total {savings.charging.total}</div>
                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700 ring-1 ring-slate-200">
                        Suggestion: Move non-urgent charging to off-peak windows and batch depot top-ups.
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "builder" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section title="Custom report builder" subtitle="Premium: build and save report configurations." right={<Pill label="Premium" tone="info" />}>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Button
                        variant="primary"
                        onClick={() => {
                          setReportDraft({
                            id: "",
                            name: "",
                            timeRange: timeRange,
                            customFrom,
                            customTo,
                            dimensionA: dimA,
                            dimensionB: dimB === "None" ? undefined : (dimB as Dimension),
                            metric: metric,
                            filters: {
                              module: moduleFilter,
                              marketplace: marketplaceFilter,
                              group: groupFilter,
                              costCenter: costCenterFilter,
                              vendor: vendorFilter,
                              requester: requesterFilter,
                              risk: riskFilter,
                            },
                            createdAt: Date.now(),
                          });
                          setReportModalOpen(true);
                        }}
                      >
                        <Wand2 className="h-4 w-4" /> New report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          toast({ title: "Tip", message: "Saved reports can be scheduled for email delivery in Schedules.", kind: "info" });
                        }}
                      >
                        <Info className="h-4 w-4" /> Tip
                      </Button>
                    </div>

                    <div className="mt-3 space-y-2">
                      {savedReports.map((r) => (
                        <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                                <Pill label={r.timeRange} tone="neutral" />
                                <Pill label={r.metric} tone="info" />
                              </div>
                              <div className="mt-1 text-xs text-slate-500">{r.id} • Created {timeAgo(r.createdAt)}</div>
                              <div className="mt-2 text-xs text-slate-600">Dim: {r.dimensionA}{r.dimensionB ? ` by ${r.dimensionB}` : ""}</div>
                            </div>
                            <div className="flex flex-col gap-2">
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setReportDraft(JSON.parse(JSON.stringify(r)));
                                  setReportModalOpen(true);
                                }}
                              >
                                <Settings2 className="h-4 w-4" /> Edit
                              </Button>
                              <Button
                                variant="outline"
                                className="px-3 py-2 text-xs"
                                onClick={() => {
                                  setScheduleDraft((p) => ({ ...p, reportId: r.id }));
                                  setScheduleModalOpen(true);
                                }}
                              >
                                <Mail className="h-4 w-4" /> Schedule
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!savedReports.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No saved reports.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section
                    title="Preview"
                    subtitle="Preview uses the draft report configuration."
                    right={<Pill label="Premium" tone="info" />}
                  >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <StatCard title="Spend" value={formatUGX(reportPreview.totalsAll.spend)} sub="Approved" icon={<BarChart3 className="h-5 w-5" />} tone="good" />
                      <StatCard title="Transactions" value={`${reportPreview.totalsAll.count}`} sub="Approved" icon={<LineChart className="h-5 w-5" />} tone="neutral" />
                      <StatCard title="Preview rows" value={`${reportPreview.rows.length}`} sub="Top rows" icon={<FileText className="h-5 w-5" />} tone="info" />
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-600">
                          <tr>
                            <th className="px-4 py-3 font-semibold">{reportDraft.dimensionA}</th>
                            <th className="px-4 py-3 font-semibold">Spend</th>
                            <th className="px-4 py-3 font-semibold">Tx</th>
                            <th className="px-4 py-3 font-semibold">Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reportPreview.rows.map((r) => (
                            <tr key={r.key} className="border-t border-slate-100 hover:bg-slate-50/60">
                              <td className="px-4 py-3 font-semibold text-slate-900">{r.key}</td>
                              <td className="px-4 py-3 text-slate-700">{formatUGX(r.spend)}</td>
                              <td className="px-4 py-3 text-slate-700">{r.count}</td>
                              <td className="px-4 py-3 text-slate-700">{formatUGX(r.avg)}</td>
                            </tr>
                          ))}
                          {!reportPreview.rows.length ? (
                            <tr>
                              <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-600">No data.</td>
                            </tr>
                          ) : null}
                        </tbody>
                      </table>
                    </div>

                    {reportPreview.pivot ? (
                      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">Pivot preview</div>
                            <div className="mt-1 text-xs text-slate-500">{reportDraft.dimensionA} by {reportDraft.dimensionB}</div>
                          </div>
                          <Pill label="Premium" tone="info" />
                        </div>
                        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                          <table className="min-w-full text-left text-sm">
                            <thead className="bg-slate-50 text-xs text-slate-600">
                              <tr>
                                <th className="px-4 py-3 font-semibold">{reportDraft.dimensionA}</th>
                                {reportPreview.pivot.columns.map((c) => (
                                  <th key={c} className="px-4 py-3 font-semibold">{c}</th>
                                ))}
                                <th className="px-4 py-3 font-semibold">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {reportPreview.pivot.rows.map((r) => (
                                <tr key={r.rowKey} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3 font-semibold text-slate-900">{r.rowKey}</td>
                                  {reportPreview.pivot!.columns.map((c) => (
                                    <td key={`${r.rowKey}-${c}`} className="px-4 py-3 text-slate-700">{formatUGX(r.cells[c] || 0)}</td>
                                  ))}
                                  <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(r.total)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}
                  </Section>
                </div>
              </div>
            ) : null}

            {tab === "schedules" ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="lg:col-span-5 space-y-4">
                  <Section
                    title="Saved reports"
                    subtitle="Pick a report and schedule it."
                    right={
                      <Button
                        variant="primary"
                        onClick={() => {
                          setScheduleDraft({
                            id: "",
                            reportId: savedReports[0]?.id || "RPT-001",
                            enabled: true,
                            frequency: "Weekly",
                            hourLocal: 9,
                            dayOfWeek: "Mon",
                            dayOfMonth: 1,
                            recipients: "finance@acme.com",
                            channels: { email: true, whatsapp: true, wechat: false, sms: false },
                            formats: { csv: true, pdf: true, json: false },
                          });
                          setScheduleModalOpen(true);
                        }}
                        disabled={!savedReports.length}
                      >
                        <Mail className="h-4 w-4" /> New schedule
                      </Button>
                    }
                  >
                    <div className="space-y-2">
                      {savedReports.map((r) => {
                        const usedBy = schedules.filter((s) => s.reportId === r.id).length;
                        return (
                          <div key={r.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                                  <Pill label={r.metric} tone="info" />
                                  <Pill label={r.timeRange} tone="neutral" />
                                  <Pill label={`Schedules: ${usedBy}`} tone={usedBy ? "info" : "neutral"} />
                                </div>
                                <div className="mt-1 text-xs text-slate-500">{r.id} • {r.dimensionA}{r.dimensionB ? ` by ${r.dimensionB}` : ""}</div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    setScheduleDraft((p) => ({
                                      ...p,
                                      reportId: r.id,
                                      recipients: "finance@acme.com",
                                    }));
                                    setScheduleModalOpen(true);
                                  }}
                                >
                                  <Mail className="h-4 w-4" /> Schedule
                                </Button>
                                <Button
                                  variant="outline"
                                  className="px-3 py-2 text-xs"
                                  onClick={() => {
                                    const payload = { report: r, exportedAt: new Date().toISOString() };
                                    downloadText(`report-${r.id}.json`, JSON.stringify(payload, null, 2), "application/json");
                                    toast({ title: "Exported", message: "Report definition JSON downloaded.", kind: "success" });
                                  }}
                                >
                                  <Download className="h-4 w-4" /> Definition
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {!savedReports.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No saved reports.</div> : null}
                    </div>
                  </Section>
                </div>

                <div className="lg:col-span-7 space-y-4">
                  <Section title="Scheduled reports" subtitle="Email delivery and scheduling." right={<Pill label="Premium" tone="info" />}>
                    <div className="space-y-2">
                      {schedules
                        .slice()
                        .sort((a, b) => (b.lastRunAt || 0) - (a.lastRunAt || 0))
                        .map((s) => {
                          const rpt = savedReports.find((r) => r.id === s.reportId);
                          const formats = Object.entries(s.formats)
                            .filter(([, on]) => on)
                            .map(([k]) => k.toUpperCase())
                            .join(", ");
                          const channels = Object.entries(s.channels)
                            .filter(([, on]) => on)
                            .map(([k]) => k)
                            .join(", ");

                          return (
                            <div key={s.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                <div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Pill label={s.enabled ? "Enabled" : "Disabled"} tone={s.enabled ? "good" : "neutral"} />
                                    <Pill label={s.frequency} tone="neutral" />
                                    <Pill label={`${String(s.hourLocal).padStart(2, "0")}:00`} tone="neutral" />
                                    {s.frequency === "Weekly" ? <Pill label={s.dayOfWeek || "Mon"} tone="neutral" /> : null}
                                    {s.frequency === "Monthly" ? <Pill label={`Day ${s.dayOfMonth || 1}`} tone="neutral" /> : null}
                                    <Pill label={s.id} tone="neutral" />
                                  </div>
                                  <div className="mt-2 text-sm font-semibold text-slate-900">{rpt?.name || s.reportId}</div>
                                  <div className="mt-1 text-xs text-slate-500">Recipients: {s.recipients}</div>
                                  <div className="mt-1 text-xs text-slate-500">Channels: {channels || "-"} • Formats: {formats || "-"}</div>
                                  <div className="mt-2 text-xs text-slate-600">
                                    Last run: {s.lastRunAt ? `${fmtDateTime(s.lastRunAt)} (${s.lastStatus})` : "Never"}
                                  </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setSchedules((p) => p.map((x) => (x.id === s.id ? { ...x, enabled: !x.enabled } : x)));
                                      toast({ title: "Updated", message: "Schedule updated.", kind: "success" });
                                    }}
                                  >
                                    <Settings2 className="h-4 w-4" /> Toggle
                                  </Button>
                                  <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => runScheduleNow(s.id)}>
                                    <Sparkles className="h-4 w-4" /> Run now
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="px-3 py-2 text-xs"
                                    onClick={() => {
                                      setScheduleDraft(JSON.parse(JSON.stringify(s)));
                                      setScheduleModalOpen(true);
                                    }}
                                  >
                                    <ChevronRight className="h-4 w-4" /> Edit
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                      {!schedules.length ? <div className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">No schedules yet.</div> : null}
                    </div>

                    <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                      Premium: scheduled report emails. In production, delivery logs appear in Notifications & Activity Center.
                    </div>
                  </Section>
                </div>
              </div>
            ) : null}
          </div>

          <footer className="border-t border-slate-200 bg-white/60 py-6">
            <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
              V Reporting & Analytics v2. Core: spend breakdowns + approvals performance + CSV/PDF/JSON export. Premium: anomalies, savings dashboard, custom report builder, scheduled report emails.
            </div>
          </footer>
        </div>
      </div>

      {/* Report builder modal */}
      <Modal
        open={reportModalOpen}
        title={reportDraft.id ? "Edit report" : "New report"}
        subtitle="Choose dimensions, metric, time range, and filters."
        onClose={() => setReportModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveReport}>
              <BadgeCheck className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label="Report name" value={reportDraft.name} onChange={(v) => setReportDraft((p) => ({ ...p, name: v }))} placeholder="Example: Spend by vendor" />
          <Select
            label="Metric"
            value={reportDraft.metric}
            onChange={(v) => setReportDraft((p) => ({ ...p, metric: v as Metric }))}
            options={[
              { value: "Spend", label: "Spend" },
              { value: "Transactions", label: "Transactions" },
              { value: "Avg transaction", label: "Avg transaction" },
            ]}
          />
          <Select
            label="Time range"
            value={reportDraft.timeRange}
            onChange={(v) => setReportDraft((p) => ({ ...p, timeRange: v as TimeRange }))}
            options={[
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
              { value: "90d", label: "Last 90 days" },
              { value: "YTD", label: "Year to date" },
              { value: "Custom", label: "Custom" },
            ]}
          />
          <div className={cn(reportDraft.timeRange !== "Custom" && "opacity-60")}>
            <Field
              label="From"
              type="date"
              value={reportDraft.customFrom || ""}
              onChange={(v) => setReportDraft((p) => ({ ...p, customFrom: v }))}
              disabled={reportDraft.timeRange !== "Custom"}
            />
          </div>
          <div className={cn(reportDraft.timeRange !== "Custom" && "opacity-60")}>
            <Field
              label="To"
              type="date"
              value={reportDraft.customTo || ""}
              onChange={(v) => setReportDraft((p) => ({ ...p, customTo: v }))}
              disabled={reportDraft.timeRange !== "Custom"}
            />
          </div>

          <Select
            label="Primary dimension"
            value={reportDraft.dimensionA}
            onChange={(v) => setReportDraft((p) => ({ ...p, dimensionA: v as Dimension }))}
            options={DIMENSIONS.map((d) => ({ value: d, label: d }))}
          />
          <Select
            label="Secondary dimension"
            value={reportDraft.dimensionB || "None"}
            onChange={(v) => setReportDraft((p) => ({ ...p, dimensionB: v === "None" ? undefined : (v as Dimension) }))}
            options={[{ value: "None", label: "None" }, ...DIMENSIONS.filter((d) => d !== reportDraft.dimensionA).map((d) => ({ value: d, label: d }))]}
            hint="Premium pivot"
          />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Filters</div>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <Select
                label="Module"
                value={reportDraft.filters.module || "All"}
                onChange={(v) => setReportDraft((p) => ({ ...p, filters: { ...p.filters, module: v as any } }))}
                options={[{ value: "All", label: "All" }, ...MODULES.map((m) => ({ value: m, label: m }))]}
              />
              <Select
                label="Marketplace"
                value={reportDraft.filters.marketplace || "All"}
                onChange={(v) => setReportDraft((p) => ({ ...p, filters: { ...p.filters, marketplace: v as any } }))}
                options={[{ value: "All", label: "All" }, ...MARKETPLACES.map((m) => ({ value: m, label: m }))]}
                disabled={reportDraft.filters.module !== "All" && reportDraft.filters.module !== "E-Commerce"}
              />
              <Select
                label="Group"
                value={reportDraft.filters.group || "All"}
                onChange={(v) => setReportDraft((p) => ({ ...p, filters: { ...p.filters, group: v as any } }))}
                options={[{ value: "All", label: "All" }, ...(["Operations", "Sales", "Finance", "Admin", "Procurement"] as GroupName[]).map((g) => ({ value: g, label: g }))]}
              />
              <Select
                label="Risk"
                value={reportDraft.filters.risk || "All"}
                onChange={(v) => setReportDraft((p) => ({ ...p, filters: { ...p.filters, risk: v as any } }))}
                options={[{ value: "All", label: "All" }, { value: "Low", label: "Low" }, { value: "Medium", label: "Medium" }, { value: "High", label: "High" }]}
              />
            </div>
            <div className="mt-3 text-xs text-slate-600">More filters (vendor, requester, cost center) can be added as needed.</div>
          </div>
        </div>
      </Modal>

      {/* Schedule modal */}
      <Modal
        open={scheduleModalOpen}
        title={scheduleDraft.id ? "Edit schedule" : "New schedule"}
        subtitle="Send scheduled report emails (and other channels) with attachments."
        onClose={() => setScheduleModalOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setScheduleModalOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={createSchedule}>
              <Mail className="h-4 w-4" /> Save schedule
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Select
            label="Report"
            value={scheduleDraft.reportId}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, reportId: v }))}
            options={savedReports.map((r) => ({ value: r.id, label: r.name }))}
          />
          <Select
            label="Frequency"
            value={scheduleDraft.frequency}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, frequency: v as any }))}
            options={[{ value: "Daily", label: "Daily" }, { value: "Weekly", label: "Weekly" }, { value: "Monthly", label: "Monthly" }]}
          />
          <Select
            label="Hour"
            value={`${scheduleDraft.hourLocal}`}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, hourLocal: clamp(Number(v), 0, 23) }))}
            options={Array.from({ length: 24 }, (_, h) => ({ value: `${h}`, label: `${String(h).padStart(2, "0")}:00` }))}
          />

          <Select
            label="Day of week"
            value={scheduleDraft.dayOfWeek || "Mon"}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, dayOfWeek: v as any }))}
            options={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => ({ value: d, label: d }))}
            disabled={scheduleDraft.frequency !== "Weekly"}
          />

          <Select
            label="Day of month"
            value={`${scheduleDraft.dayOfMonth || 1}`}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, dayOfMonth: clamp(Number(v), 1, 28) }))}
            options={Array.from({ length: 28 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}` }))}
            disabled={scheduleDraft.frequency !== "Monthly"}
          />

          <Field
            label="Recipients"
            value={scheduleDraft.recipients}
            onChange={(v) => setScheduleDraft((p) => ({ ...p, recipients: v }))}
            placeholder="emails and/or phone numbers"
            hint="Comma separated"
          />

          <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-sm font-semibold text-slate-900">Channels</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(
                [
                  { k: "email", label: "Email" },
                  { k: "whatsapp", label: "WhatsApp" },
                  { k: "wechat", label: "WeChat" },
                  { k: "sms", label: "SMS" },
                ] as const
              ).map((x) => (
                <label key={x.k} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(scheduleDraft.channels as any)[x.k]}
                    onChange={(e) => setScheduleDraft((p) => ({ ...p, channels: { ...p.channels, [x.k]: e.target.checked } }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {x.label}
                </label>
              ))}
            </div>
            <div className="mt-3 text-sm font-semibold text-slate-900">Attachments</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {(
                [
                  { k: "csv", label: "CSV" },
                  { k: "pdf", label: "PDF" },
                  { k: "json", label: "JSON" },
                ] as const
              ).map((x) => (
                <label key={x.k} className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={(scheduleDraft.formats as any)[x.k]}
                    onChange={(e) => setScheduleDraft((p) => ({ ...p, formats: { ...p.formats, [x.k]: e.target.checked } }))}
                    className="h-4 w-4 rounded border-slate-300"
                  />
                  {x.label}
                </label>
              ))}
            </div>
            <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
              Premium: scheduled report emails. Delivery logs show per channel (Email/WhatsApp/WeChat/SMS).
            </div>
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
