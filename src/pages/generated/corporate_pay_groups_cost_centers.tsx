import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Layers,
  LineChart,
  Plus,
  Save,
  Settings,
  Sparkles,
  Tag,
  Trash2,
  Users,
  X,
} from "lucide-react";

const EVZ = {
  green: "#03CD8C",
  orange: "#F77F00",
  grey: "#A6A6A6",
  light: "#F2F2F2",
};

type GroupId = "Operations" | "Sales" | "Finance" | "Admin" | "Procurement";

type TagType = "Client" | "Event" | "Campaign" | "Project" | "Other";

type GroupRow = {
  id: GroupId;
  budgetMonth: number;
  spendMTD: number;
  hardCap: boolean;
  priority: number; // 1 highest
  manager: string;
  updatedAt: number;
  // premium trend
  weeklySeries: number[]; // last 6 weeks spend
  weeklyBreakdown: Record<"Rides" | "Purchases" | "Services" | "RFQs", number[]>; // last 6 weeks by category
};

type CostCenterRow = {
  id: string;
  code: string;
  name: string;
  group: GroupId;
  active: boolean;
  defaultTags: string[];
  invoiceGroup: string;
  updatedAt: number;
};

type ProjectTagRow = {
  id: string;
  type: TagType;
  key: string; // machine key
  label: string;
  active: boolean;
  updatedAt: number;
};

type ChargebackSplit = {
  costCenterId: string;
  percent: number;
};

type ChargebackRule = {
  id: string;
  name: string;
  enabled: boolean;
  priority: number; // lower = higher priority
  match: { type: TagType; key: string };
  splits: ChargebackSplit[]; // must sum to 100
  notes: string;
  updatedAt: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

type TabId = "Groups" | "Cost centers" | "Chargeback" | "Forecast";

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

function formatDateTime(ts: number) {
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
              "left-2 right-2 bottom-2 top-[14vh] rounded-[28px]",
              "lg:left-auto lg:right-4 lg:top-4 lg:bottom-4 lg:w-[560px]"
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
                {t.kind === "warn" || t.kind === "error" ? <AlertTriangle className="h-5 w-5" /> : <Check className="h-5 w-5" />}
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

function Sparkline({ values }: { values: number[] }) {
  const w = 140;
  const h = 44;
  const max = Math.max(1, ...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);

  const pts = values
    .map((v, i) => {
      const x = (i / Math.max(1, values.length - 1)) * (w - 8) + 4;
      const y = h - 6 - ((v - min) / span) * (h - 12);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={w} height={h} className="overflow-visible">
      <polyline points={pts} fill="none" stroke={EVZ.green} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={w - 4} cy={Number(pts.split(" ").pop()?.split(",")[1] || h / 2)} r={3.5} fill={EVZ.orange} />
    </svg>
  );
}

function MiniBar({ label, value, total, hint }: { label: string; value: number; total: number; hint?: string }) {
  const pct = clamp((value / Math.max(1, total)) * 100, 0, 100);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-slate-700">{label}</div>
        <div className="text-xs font-semibold text-slate-900">{hint ?? `${Math.round(pct)}%`}</div>
      </div>
      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: EVZ.green }} />
      </div>
    </div>
  );
}

function sumSplits(splits: ChargebackSplit[]) {
  return Math.round(splits.reduce((a, s) => a + Number(s.percent || 0), 0));
}

function calcForecast(spendMTD: number, dayOfMonth: number, daysInMonth: number) {
  return Math.round((spendMTD / Math.max(1, dayOfMonth)) * daysInMonth);
}

function forecastTone(forecast: number, budget: number) {
  if (forecast > budget) return { label: "Over", tone: "bad" as const };
  if (forecast > budget * 0.9) return { label: "At risk", tone: "warn" as const };
  return { label: "OK", tone: "good" as const };
}

function pctChange(a: number, b: number) {
  // compare b (previous) -> a (current)
  if (b <= 0) return a > 0 ? 100 : 0;
  return ((a - b) / b) * 100;
}

function topDriverExplanation(g: GroupRow) {
  const keys = Object.keys(g.weeklyBreakdown) as Array<keyof GroupRow["weeklyBreakdown"]>;
  const last = g.weeklySeries[g.weeklySeries.length - 1] || 0;
  const prev = g.weeklySeries[g.weeklySeries.length - 2] || 0;
  const change = pctChange(last, prev);

  // find largest increase driver
  let bestKey: keyof GroupRow["weeklyBreakdown"] = "Rides";
  let bestDelta = -Infinity;
  for (const k of keys) {
    const arr = g.weeklyBreakdown[k];
    const a = arr[arr.length - 1] || 0;
    const b = arr[arr.length - 2] || 0;
    const d = a - b;
    if (d > bestDelta) {
      bestDelta = d;
      bestKey = k;
    }
  }

  const driverText: Record<string, string> = {
    Rides: "Ride volume and airport routes",
    Purchases: "Marketplace purchases and vendor activity",
    Services: "Service bookings and add-ons",
    RFQs: "High-value RFQs and procurement cycles",
  };

  const direction = change >= 0 ? "up" : "down";
  const abs = Math.abs(change);
  const rounded = Math.round(abs);

  return {
    title: `Week over week is ${direction} ${rounded}%`,
    body: `Main driver: ${bestKey}. ${driverText[String(bestKey)]}.`,
    tone: change > 15 ? "warn" : change < -15 ? "good" : "neutral",
  } as const;
}

export default function CorporatePayGroupsCostCentersV2() {
  // Use Jan 7 as a stable reference (demo)
  const DAY_OF_MONTH = 7;
  const DAYS_IN_MONTH = 30;

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const [tab, setTab] = useState<TabId>("Groups");

  const [groups, setGroups] = useState<GroupRow[]>(() => {
    const now = Date.now();

    const mk = (
      id: GroupId,
      budgetMonth: number,
      spendMTD: number,
      hardCap: boolean,
      priority: number,
      manager: string,
      weeklySeries: number[],
      rides: number[],
      purchases: number[],
      services: number[],
      rfqs: number[]
    ): GroupRow => ({
      id,
      budgetMonth,
      spendMTD,
      hardCap,
      priority,
      manager,
      updatedAt: now - Math.floor(Math.random() * 6) * 24 * 60 * 60 * 1000,
      weeklySeries,
      weeklyBreakdown: {
        Rides: rides,
        Purchases: purchases,
        Services: services,
        RFQs: rfqs,
      },
    });

    return [
      mk(
        "Operations",
        15000000,
        12000000,
        true,
        1,
        "Mary N.",
        [3600000, 3900000, 4100000, 4400000, 5200000, 5600000],
        [1800000, 1900000, 2000000, 2200000, 2400000, 2600000],
        [1200000, 1300000, 1400000, 1500000, 1700000, 1900000],
        [250000, 260000, 300000, 310000, 350000, 420000],
        [350000, 440000, 400000, 390000, 450000, 510000]
      ),
      mk(
        "Sales",
        12000000,
        9800000,
        true,
        2,
        "Samuel A.",
        [2200000, 2500000, 2700000, 3000000, 3600000, 4100000],
        [1200000, 1300000, 1400000, 1500000, 1700000, 1900000],
        [800000, 900000, 950000, 1100000, 1400000, 1600000],
        [140000, 150000, 160000, 180000, 260000, 280000],
        [60000, 70000, 90000, 110000, 240000, 320000]
      ),
      mk(
        "Finance",
        6000000,
        5200000,
        true,
        3,
        "Finance Desk",
        [1100000, 1200000, 1250000, 1300000, 1500000, 1650000],
        [240000, 260000, 280000, 300000, 360000, 380000],
        [520000, 540000, 560000, 590000, 620000, 740000],
        [120000, 140000, 150000, 160000, 180000, 200000],
        [220000, 260000, 260000, 250000, 340000, 370000]
      ),
      mk(
        "Admin",
        5000000,
        4100000,
        false,
        4,
        "Admin Team",
        [900000, 950000, 980000, 1020000, 1100000, 1180000],
        [190000, 200000, 210000, 220000, 240000, 280000],
        [420000, 450000, 460000, 470000, 520000, 560000],
        [120000, 140000, 140000, 150000, 160000, 170000],
        [170000, 160000, 170000, 180000, 180000, 170000]
      ),
      mk(
        "Procurement",
        5000000,
        3400000,
        false,
        5,
        "Procurement Desk",
        [720000, 760000, 790000, 820000, 880000, 920000],
        [100000, 120000, 130000, 140000, 150000, 160000],
        [320000, 340000, 350000, 360000, 380000, 400000],
        [80000, 90000, 110000, 120000, 140000, 150000],
        [220000, 210000, 200000, 200000, 210000, 210000]
      ),
    ];
  });

  const [costCenters, setCostCenters] = useState<CostCenterRow[]>(() => {
    const now = Date.now();
    return [
      { id: "CC-OPS-CORE", code: "OPS-CORE", name: "Operations core", group: "Operations", active: true, defaultTags: ["Event: FieldOps"], invoiceGroup: "ACME-MAIN", updatedAt: now - 12 * 24 * 60 * 60 * 1000 },
      { id: "CC-OPS-DEL", code: "OPS-DELIVERY", name: "Courier and delivery", group: "Operations", active: true, defaultTags: ["Campaign: QuickShip"], invoiceGroup: "ACME-MAIN", updatedAt: now - 7 * 24 * 60 * 60 * 1000 },
      { id: "CC-SALES-TR", code: "SALES-TRAVEL", name: "Sales travel", group: "Sales", active: true, defaultTags: ["Client: ABC"], invoiceGroup: "ACME-SALES", updatedAt: now - 20 * 24 * 60 * 60 * 1000 },
      { id: "CC-FIN-OPS", code: "FIN-OPS", name: "Finance ops", group: "Finance", active: true, defaultTags: ["Project: Audit-2026"], invoiceGroup: "ACME-MAIN", updatedAt: now - 16 * 24 * 60 * 60 * 1000 },
      { id: "CC-ADMIN-CORE", code: "ADMIN-CORE", name: "Admin core", group: "Admin", active: true, defaultTags: ["Event: Conference"], invoiceGroup: "ACME-MAIN", updatedAt: now - 35 * 24 * 60 * 60 * 1000 },
      { id: "CC-PROC-001", code: "PROC-001", name: "Procurement", group: "Procurement", active: true, defaultTags: ["Campaign: VendorOnboarding"], invoiceGroup: "ACME-MAIN", updatedAt: now - 10 * 24 * 60 * 60 * 1000 },
    ];
  });

  const [tags, setTags] = useState<ProjectTagRow[]>(() => {
    const now = Date.now();
    return [
      { id: "T-CL-ABC", type: "Client", key: "ABC", label: "Client ABC Ltd", active: true, updatedAt: now - 30 * 24 * 60 * 60 * 1000 },
      { id: "T-EV-EXPO", type: "Event", key: "Expo2026", label: "Expo 2026", active: true, updatedAt: now - 4 * 24 * 60 * 60 * 1000 },
      { id: "T-CM-Q1", type: "Campaign", key: "Q1Launch", label: "Q1 Launch", active: true, updatedAt: now - 8 * 24 * 60 * 60 * 1000 },
      { id: "T-PJ-AUD", type: "Project", key: "Audit-2026", label: "Audit 2026", active: true, updatedAt: now - 18 * 24 * 60 * 60 * 1000 },
      { id: "T-OT-OPS", type: "Other", key: "FieldOps", label: "Field operations", active: true, updatedAt: now - 12 * 24 * 60 * 60 * 1000 },
    ];
  });

  const [rules, setRules] = useState<ChargebackRule[]>(() => {
    const now = Date.now();
    return [
      {
        id: "CB-001",
        name: "Client ABC meetings",
        enabled: true,
        priority: 1,
        match: { type: "Client", key: "ABC" },
        splits: [
          { costCenterId: "CC-SALES-TR", percent: 70 },
          { costCenterId: "CC-OPS-CORE", percent: 30 },
        ],
        notes: "Split customer-facing travel between Sales and Operations.",
        updatedAt: now - 9 * 24 * 60 * 60 * 1000,
      },
      {
        id: "CB-002",
        name: "Expo 2026 event",
        enabled: true,
        priority: 2,
        match: { type: "Event", key: "Expo2026" },
        splits: [{ costCenterId: "CC-ADMIN-CORE", percent: 100 }],
        notes: "All event spend billed to Admin core.",
        updatedAt: now - 3 * 24 * 60 * 60 * 1000,
      },
      {
        id: "CB-003",
        name: "Q1 launch campaign",
        enabled: true,
        priority: 3,
        match: { type: "Campaign", key: "Q1Launch" },
        splits: [
          { costCenterId: "CC-SALES-TR", percent: 50 },
          { costCenterId: "CC-ADMIN-CORE", percent: 50 },
        ],
        notes: "Marketing-style campaign split between Sales and Admin.",
        updatedAt: now - 6 * 24 * 60 * 60 * 1000,
      },
    ];
  });

  // Search and filters
  const [qGroup, setQGroup] = useState("");
  const [qCC, setQCC] = useState("");
  const [qTag, setQTag] = useState("");
  const [qRule, setQRule] = useState("");

  // Modals and drafts
  const [groupOpen, setGroupOpen] = useState(false);
  const [groupDraft, setGroupDraft] = useState<GroupRow | null>(null);

  const [ccOpen, setCcOpen] = useState(false);
  const [ccDraft, setCcDraft] = useState<CostCenterRow | null>(null);

  const [tagOpen, setTagOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState<ProjectTagRow | null>(null);

  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleDraft, setRuleDraft] = useState<ChargebackRule | null>(null);

  const [simulateOpen, setSimulateOpen] = useState(false);
  const [simAmount, setSimAmount] = useState(2500000);
  const [simType, setSimType] = useState<TagType>("Client");
  const [simKey, setSimKey] = useState("ABC");

  const [scenarioGroup, setScenarioGroup] = useState<GroupId>("Operations");
  const [scenarioPct, setScenarioPct] = useState(10); // lower by %

  const groupMap = useMemo(() => {
    const out: Record<GroupId, GroupRow> = {} as any;
    groups.forEach((g) => (out[g.id] = g));
    return out;
  }, [groups]);

  const totalBudget = useMemo(() => groups.reduce((a, g) => a + g.budgetMonth, 0), [groups]);
  const totalSpend = useMemo(() => groups.reduce((a, g) => a + g.spendMTD, 0), [groups]);
  const totalForecast = useMemo(() => groups.reduce((a, g) => a + calcForecast(g.spendMTD, DAY_OF_MONTH, DAYS_IN_MONTH), 0), [groups]);

  const orgForecastTone = useMemo(() => forecastTone(totalForecast, totalBudget), [totalForecast, totalBudget]);

  // Filters
  const filteredGroups = useMemo(() => {
    const query = qGroup.trim().toLowerCase();
    const list = [...groups].sort((a, b) => a.priority - b.priority);
    if (!query) return list;
    return list.filter((g) => `${g.id} ${g.manager}`.toLowerCase().includes(query));
  }, [groups, qGroup]);

  const filteredCC = useMemo(() => {
    const query = qCC.trim().toLowerCase();
    if (!query) return costCenters;
    return costCenters.filter((c) => `${c.code} ${c.name} ${c.group} ${c.invoiceGroup}`.toLowerCase().includes(query));
  }, [costCenters, qCC]);

  const filteredTags = useMemo(() => {
    const query = qTag.trim().toLowerCase();
    if (!query) return tags;
    return tags.filter((t) => `${t.type} ${t.key} ${t.label}`.toLowerCase().includes(query));
  }, [tags, qTag]);

  const filteredRules = useMemo(() => {
    const query = qRule.trim().toLowerCase();
    const list = [...rules].sort((a, b) => a.priority - b.priority);
    if (!query) return list;
    return list.filter((r) => `${r.name} ${r.match.type} ${r.match.key} ${r.id}`.toLowerCase().includes(query));
  }, [rules, qRule]);

  // Priority reorder
  const moveGroup = (id: GroupId, dir: -1 | 1) => {
    const ordered = [...groups].sort((a, b) => a.priority - b.priority);
    const idx = ordered.findIndex((g) => g.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= ordered.length) return;

    const a = ordered[idx];
    const b = ordered[j];

    const now = Date.now();
    const next = ordered.map((g) => {
      if (g.id === a.id) return { ...g, priority: b.priority, updatedAt: now };
      if (g.id === b.id) return { ...g, priority: a.priority, updatedAt: now };
      return g;
    });

    setGroups(next);
    toast({ title: "Priority updated", message: "Enforcement priority updated.", kind: "success" });
  };

  // Open create/edit
  const openGroup = (g?: GroupRow) => {
    if (g) {
      setGroupDraft(JSON.parse(JSON.stringify(g)));
    } else {
      // new group (other)
      const maxP = Math.max(...groups.map((x) => x.priority));
      const now = Date.now();
      setGroupDraft({
        id: "Operations",
        budgetMonth: 0,
        spendMTD: 0,
        hardCap: true,
        priority: maxP + 1,
        manager: "",
        updatedAt: now,
        weeklySeries: [0, 0, 0, 0, 0, 0],
        weeklyBreakdown: {
          Rides: [0, 0, 0, 0, 0, 0],
          Purchases: [0, 0, 0, 0, 0, 0],
          Services: [0, 0, 0, 0, 0, 0],
          RFQs: [0, 0, 0, 0, 0, 0],
        },
      });
    }
    setGroupOpen(true);
  };

  const saveGroup = () => {
    if (!groupDraft) return;
    if (!groupDraft.manager.trim()) {
      toast({ title: "Missing manager", message: "Add a manager name.", kind: "warn" });
      return;
    }

    const now = Date.now();
    const exists = groups.some((g) => g.id === groupDraft.id);

    if (!exists) {
      toast({ title: "Demo limitation", message: "This demo edits existing groups. New groups can be added in production.", kind: "info" });
      setGroupOpen(false);
      return;
    }

    setGroups((prev) => prev.map((g) => (g.id === groupDraft.id ? { ...groupDraft, updatedAt: now } : g)));
    setGroupOpen(false);
    toast({ title: "Saved", message: "Group updated.", kind: "success" });
  };

  const openCC = (c?: CostCenterRow) => {
    if (c) {
      setCcDraft(JSON.parse(JSON.stringify(c)));
    } else {
      const now = Date.now();
      setCcDraft({
        id: "",
        code: "",
        name: "",
        group: "Operations",
        active: true,
        defaultTags: [],
        invoiceGroup: "ACME-MAIN",
        updatedAt: now,
      });
    }
    setCcOpen(true);
  };

  const saveCC = () => {
    if (!ccDraft) return;
    if (!ccDraft.code.trim() || !ccDraft.name.trim()) {
      toast({ title: "Missing fields", message: "Cost center code and name are required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    if (ccDraft.id) {
      setCostCenters((prev) => prev.map((c) => (c.id === ccDraft.id ? { ...ccDraft, updatedAt: now } : c)));
    } else {
      setCostCenters((prev) => [{ ...ccDraft, id: uid("CC"), updatedAt: now }, ...prev]);
    }
    setCcOpen(false);
    toast({ title: "Saved", message: "Cost center saved.", kind: "success" });
  };

  const deleteCC = (id: string) => {
    setCostCenters((prev) => prev.filter((c) => c.id !== id));
    toast({ title: "Deleted", message: "Cost center removed.", kind: "info" });
  };

  const openTag = (t?: ProjectTagRow) => {
    if (t) setTagDraft(JSON.parse(JSON.stringify(t)));
    else {
      const now = Date.now();
      setTagDraft({ id: "", type: "Client", key: "", label: "", active: true, updatedAt: now });
    }
    setTagOpen(true);
  };

  const saveTag = () => {
    if (!tagDraft) return;
    if (!tagDraft.key.trim() || !tagDraft.label.trim()) {
      toast({ title: "Missing fields", message: "Tag key and label are required.", kind: "warn" });
      return;
    }
    const now = Date.now();
    if (tagDraft.id) {
      setTags((prev) => prev.map((t) => (t.id === tagDraft.id ? { ...tagDraft, updatedAt: now } : t)));
    } else {
      setTags((prev) => [{ ...tagDraft, id: uid("T"), updatedAt: now }, ...prev]);
    }
    setTagOpen(false);
    toast({ title: "Saved", message: "Tag saved.", kind: "success" });
  };

  const deleteTag = (id: string) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Deleted", message: "Tag removed.", kind: "info" });
  };

  const openRule = (r?: ChargebackRule) => {
    if (r) setRuleDraft(JSON.parse(JSON.stringify(r)));
    else {
      const now = Date.now();
      setRuleDraft({
        id: "",
        name: "",
        enabled: true,
        priority: Math.max(1, ...rules.map((x) => x.priority)) + 1,
        match: { type: "Client", key: "" },
        splits: [{ costCenterId: "CC-OPS-CORE", percent: 100 }],
        notes: "",
        updatedAt: now,
      });
    }
    setRuleOpen(true);
  };

  const saveRule = () => {
    if (!ruleDraft) return;
    if (!ruleDraft.name.trim() || !ruleDraft.match.key.trim()) {
      toast({ title: "Missing fields", message: "Rule name and match tag key are required.", kind: "warn" });
      return;
    }
    const sum = sumSplits(ruleDraft.splits);
    if (sum !== 100) {
      toast({ title: "Split must equal 100%", message: `Current sum is ${sum}%.`, kind: "warn" });
      return;
    }

    const now = Date.now();
    if (ruleDraft.id) {
      setRules((prev) => prev.map((r) => (r.id === ruleDraft.id ? { ...ruleDraft, updatedAt: now } : r)));
    } else {
      setRules((prev) => [{ ...ruleDraft, id: uid("CB"), updatedAt: now }, ...prev]);
    }

    setRuleOpen(false);
    toast({ title: "Saved", message: "Chargeback rule saved.", kind: "success" });
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    toast({ title: "Deleted", message: "Chargeback rule removed.", kind: "info" });
  };

  // Simulation
  const matchingRules = useMemo(() => {
    const active = rules.filter((r) => r.enabled);
    const matches = active
      .filter((r) => r.match.type === simType && r.match.key.toLowerCase() === simKey.toLowerCase())
      .sort((a, b) => a.priority - b.priority);
    return matches;
  }, [rules, simType, simKey]);

  const simRule = matchingRules[0] || null;

  const simSplits = useMemo(() => {
    if (!simRule) return [] as Array<{ costCenter: CostCenterRow | null; percent: number; amount: number }>;
    return simRule.splits.map((s) => {
      const cc = costCenters.find((c) => c.id === s.costCenterId) || null;
      return { costCenter: cc, percent: s.percent, amount: Math.round((simAmount * s.percent) / 100) };
    });
  }, [simRule, costCenters, simAmount]);

  // Scenario planner
  const scenario = useMemo(() => {
    const g = groupMap[scenarioGroup];
    const forecast = calcForecast(g.spendMTD, DAY_OF_MONTH, DAYS_IN_MONTH);
    const newBudget = Math.round(g.budgetMonth * (1 - scenarioPct / 100));
    const potentialSavings = Math.max(0, forecast - newBudget);
    const tone = forecastTone(forecast, g.budgetMonth);
    const newTone = forecastTone(forecast, newBudget);
    return { g, forecast, newBudget, potentialSavings, tone, newTone };
  }, [groupMap, scenarioGroup, scenarioPct]);

  const exportJSON = async () => {
    const payload = {
      groups,
      costCenters,
      tags,
      chargebackRules: rules,
      exportedAt: new Date().toISOString(),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied", message: "Config JSON copied to clipboard.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
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
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Groups and Cost Centers</div>
                  <div className="mt-1 text-xs text-slate-500">Budgets, cost centers, project tags, enforcement priority, and chargeback rules.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Groups: ${groups.length}`} tone="neutral" />
                    <Pill label={`Cost centers: ${costCenters.length}`} tone="neutral" />
                    <Pill label={`Tags: ${tags.length}`} tone="neutral" />
                    <Pill label={`Budget: ${formatUGX(totalBudget)}`} tone="neutral" />
                    <Pill label={`Spend MTD: ${formatUGX(totalSpend)}`} tone="info" />
                    <Pill label={`Forecast: ${formatUGX(totalForecast)}`} tone={orgForecastTone.tone} />
                    <Pill label={`Org status: ${orgForecastTone.label}`} tone={orgForecastTone.tone} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => setSimulateOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Simulate chargeback
                </Button>
                <Button variant="outline" onClick={exportJSON}>
                  <Download className="h-4 w-4" /> Export JSON
                </Button>
                {tab === "Groups" ? (
                  <Button variant="primary" onClick={() => openGroup(groups[0])}>
                    <Settings className="h-4 w-4" /> Edit group
                  </Button>
                ) : tab === "Cost centers" ? (
                  <Button variant="primary" onClick={() => openCC()}>
                    <Plus className="h-4 w-4" /> Add cost center
                  </Button>
                ) : tab === "Chargeback" ? (
                  <Button variant="primary" onClick={() => openRule()}>
                    <Plus className="h-4 w-4" /> Add rule
                  </Button>
                ) : (
                  <Button variant="primary" onClick={() => toast({ title: "Saved", message: "Forecast settings saved (demo).", kind: "success" })}>
                    <Save className="h-4 w-4" /> Save
                  </Button>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div className="mt-4 flex flex-wrap gap-2">
              {(["Groups", "Cost centers", "Chargeback", "Forecast"] as TabId[]).map((t) => (
                <button
                  key={t}
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-semibold ring-1 transition",
                    tab === t ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                  )}
                  style={tab === t ? { background: EVZ.green } : undefined}
                  onClick={() => setTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <AnimatePresence mode="wait">
              {tab === "Groups" ? (
                <motion.div key="groups" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  {/* Main Groups and budgets card - Full width */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Groups and budgets</div>
                        <div className="mt-1 text-xs text-slate-500">Groups are departments. Each group has a budget and enforcement priority.</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-[260px]">
                          <div className="text-xs font-semibold text-slate-600">Search</div>
                          <input
                            value={qGroup}
                            onChange={(e) => setQGroup(e.target.value)}
                            placeholder="Operations, Sales..."
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Priority</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Group</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Manager</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Budget</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Spend MTD</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Forecast</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Cap</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredGroups.map((g) => {
                              const forecast = calcForecast(g.spendMTD, DAY_OF_MONTH, DAYS_IN_MONTH);
                              const ft = forecastTone(forecast, g.budgetMonth);
                              return (
                                <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <Pill label={`#${g.priority}`} tone="neutral" />
                                      <div className="flex flex-col">
                                        <button className="rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => moveGroup(g.id, -1)}>
                                          ▲
                                        </button>
                                        <button className="mt-1 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50" onClick={() => moveGroup(g.id, 1)}>
                                          ▼
                                        </button>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{g.id}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{g.manager}</td>
                                  <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatUGX(g.budgetMonth)}</td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatUGX(g.spendMTD)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="font-semibold text-slate-900 whitespace-nowrap">{formatUGX(forecast)}</span>
                                      <Pill label={ft.label} tone={ft.tone} />
                                    </div>
                                  </td>
                                  <td className="px-4 py-3">
                                    <Pill label={g.hardCap ? "Hard" : "Soft"} tone={g.hardCap ? "warn" : "neutral"} />
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{timeAgo(g.updatedAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openGroup(g)}>
                                        <Settings className="h-4 w-4" /> Edit
                                      </Button>
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => { setScenarioGroup(g.id); setTab("Forecast"); toast({ title: "Scenario", message: "Opened scenario planner.", kind: "info" }); }}>
                                        <LineChart className="h-4 w-4" /> Scenario
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Enforcement priority decides which group budget applies first when rules overlap (chargeback or multi-tag mapping).
                    </div>
                  </div>

                  {/* Budget forecasting and What changed cards - Side by side grid */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Budget forecasting</div>
                          <div className="mt-1 text-xs text-slate-500">Premium: month-end forecast per group</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>
                      <div className="mt-3 space-y-2">
                        {filteredGroups.slice(0, 5).map((g) => {
                          const forecast = calcForecast(g.spendMTD, DAY_OF_MONTH, DAYS_IN_MONTH);
                          const ft = forecastTone(forecast, g.budgetMonth);
                          return (
                            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{g.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">Forecast: {formatUGX(forecast)} / Budget: {formatUGX(g.budgetMonth)}</div>
                                </div>
                                <Pill label={ft.label} tone={ft.tone} />
                              </div>
                              <div className="mt-2">
                                <MiniBar label="Forecast vs budget" value={forecast} total={Math.max(1, g.budgetMonth)} hint={`${Math.round((forecast / Math.max(1, g.budgetMonth)) * 100)}%`} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">What changed?</div>
                          <div className="mt-1 text-xs text-slate-500">Premium: trend explanations</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>
                      <div className="mt-3 space-y-2">
                        {filteredGroups.slice(0, 4).map((g) => {
                          const ex = topDriverExplanation(g);
                          return (
                            <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <div className="text-sm font-semibold text-slate-900">{g.id}</div>
                                  <div className="mt-1 text-xs text-slate-500">{ex.title}</div>
                                </div>
                                <Pill label="Trend" tone={ex.tone as any} />
                              </div>
                              <div className="mt-2 text-xs text-slate-700">{ex.body}</div>
                              <div className="mt-2">
                                <Sparkline values={g.weeklySeries} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "Cost centers" ? (
                <motion.div key="cc" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  {/* Main Cost centers card - Full width */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Cost centers</div>
                        <div className="mt-1 text-xs text-slate-500">Cost centers connect spending to invoices, AP codes, and chargeback rules.</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-[260px]">
                          <div className="text-xs font-semibold text-slate-600">Search</div>
                          <input
                            value={qCC}
                            onChange={(e) => setQCC(e.target.value)}
                            placeholder="OPS-CORE, SALES-TRAVEL..."
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                        <Button variant="primary" onClick={() => openCC()}>
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Code</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Name</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Group</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Invoice group</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Default tags</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredCC.map((c) => (
                              <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{c.code}</td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{c.name}</td>
                                <td className="px-4 py-3"><Pill label={c.group} tone="neutral" /></td>
                                <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{c.invoiceGroup}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap gap-2">
                                    {(c.defaultTags || []).slice(0, 3).map((t) => (
                                      <Pill key={t} label={t} tone="neutral" />
                                    ))}
                                    {(c.defaultTags || []).length > 3 ? <Pill label={`+${(c.defaultTags || []).length - 3}`} tone="neutral" /> : null}
                                  </div>
                                </td>
                                <td className="px-4 py-3"><Pill label={c.active ? "Active" : "Inactive"} tone={c.active ? "good" : "neutral"} /></td>
                                <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{timeAgo(c.updatedAt)}</td>
                                <td className="px-4 py-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openCC(c)}>
                                      <Settings className="h-4 w-4" /> Edit
                                    </Button>
                                    <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteCC(c.id)}>
                                      <Trash2 className="h-4 w-4" /> Delete
                                    </Button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Chargeback rules can split billing across cost centers using tag mapping.
                    </div>
                  </div>

                  {/* Project tags and Premium note - Side by side grid */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Project tags</div>
                          <div className="mt-1 text-xs text-slate-500">Client, event, campaign, project</div>
                        </div>
                        <Button variant="primary" className="px-3 py-2 text-xs" onClick={() => openTag()}>
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                      </div>

                      <div className="mt-3">
                        <div className="text-xs font-semibold text-slate-600">Search</div>
                        <input
                          value={qTag}
                          onChange={(e) => setQTag(e.target.value)}
                          placeholder="Client ABC, Expo2026..."
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                        {filteredTags.slice(0, 8).map((t) => (
                          <div key={t.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="text-sm font-semibold text-slate-900">{t.label}</div>
                                <div className="mt-1 text-xs text-slate-500">{t.type}: {t.key}</div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  <Pill label={t.active ? "Active" : "Inactive"} tone={t.active ? "good" : "neutral"} />
                                  <Pill label={timeAgo(t.updatedAt)} tone="neutral" />
                                </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openTag(t)}>
                                  <Settings className="h-4 w-4" />
                                </Button>
                                <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteTag(t.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                        {!filteredTags.length ? <div className="text-sm text-slate-600">No tags found.</div> : null}
                      </div>

                      <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                        Tags are used in chargeback rules and for reporting.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4 shadow-sm h-fit">
                      <div className="flex items-start gap-3">
                        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                          <Sparkles className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Premium note</div>
                          <div className="mt-1 text-sm text-slate-700">Chargeback rules can split billing by tag and route to invoice groups automatically.</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "Chargeback" ? (
                <motion.div key="chargeback" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  {/* Main Chargeback rules card - Full width */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Chargeback rules</div>
                        <div className="mt-1 text-xs text-slate-500">Split billing by tag mapping. Rules are evaluated by priority.</div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="w-[260px]">
                          <div className="text-xs font-semibold text-slate-600">Search</div>
                          <input
                            value={qRule}
                            onChange={(e) => setQRule(e.target.value)}
                            placeholder="Client ABC, Expo..."
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          />
                        </div>
                        <Button variant="primary" onClick={() => openRule()}>
                          <Plus className="h-4 w-4" /> Add
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Priority</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Rule</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Match</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Split</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Updated</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredRules.map((r) => {
                              const sum = sumSplits(r.splits);
                              return (
                                <tr key={r.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                  <td className="px-4 py-3"><Pill label={`#${r.priority}`} tone="neutral" /></td>
                                  <td className="px-4 py-3">
                                    <div className="font-semibold text-slate-900 whitespace-nowrap">{r.name}</div>
                                    <div className="mt-1 text-xs text-slate-500">{r.id}</div>
                                  </td>
                                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{r.match.type}: {r.match.key}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-2">
                                      <Pill label={`${sum}%`} tone={sum === 100 ? "good" : "warn"} />
                                      {r.splits.slice(0, 2).map((s, idx) => {
                                        const cc = costCenters.find((c) => c.id === s.costCenterId);
                                        return (
                                          <Pill key={idx} label={`${cc?.code || "CC"}: ${s.percent}%`} tone="neutral" />
                                        );
                                      })}
                                      {r.splits.length > 2 ? <Pill label={`+${r.splits.length - 2}`} tone="neutral" /> : null}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3"><Pill label={r.enabled ? "Enabled" : "Off"} tone={r.enabled ? "good" : "neutral"} /></td>
                                  <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{timeAgo(r.updatedAt)}</td>
                                  <td className="px-4 py-3">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => openRule(r)}>
                                        <Settings className="h-4 w-4" /> Edit
                                      </Button>
                                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => {
                                        setRules((prev) => prev.map((x) => x.id === r.id ? { ...x, enabled: !x.enabled, updatedAt: Date.now() } : x));
                                        toast({ title: "Updated", message: `Rule ${r.enabled ? "disabled" : "enabled"}.`, kind: "success" });
                                      }}>
                                        {r.enabled ? "Disable" : "Enable"}
                                      </Button>
                                      <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteRule(r.id)}>
                                        <Trash2 className="h-4 w-4" /> Delete
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Chargeback enforcement is applied at invoicing time. Splits can also be shown live during checkout (Premium).
                    </div>
                  </div>

                  {/* Simulation and Best practices cards - Side by side grid */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Simulation</div>
                          <div className="mt-1 text-xs text-slate-500">Test a transaction against chargeback rules.</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>
                      <Button variant="primary" className="mt-3 w-full" onClick={() => setSimulateOpen(true)}>
                        <Sparkles className="h-4 w-4" /> Open simulator
                      </Button>
                      <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                        Tip: if multiple rules match, the lowest priority number wins.
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="text-sm font-semibold text-slate-900">Chargeback best practices</div>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Keep rules simple and tag-driven.</li>
                        <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} /> Use priority to avoid ambiguity.</li>
                        <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Ensure splits always sum to 100%.</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {tab === "Forecast" ? (
                <motion.div key="forecast" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.18 }} className="space-y-4">
                  {/* Main Budget forecasting card - Full width */}
                  <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Budget forecasting per group</div>
                        <div className="mt-1 text-xs text-slate-500">Premium: forecast to month-end using MTD spend.</div>
                      </div>
                      <Pill label={`Day ${DAY_OF_MONTH}/${DAYS_IN_MONTH}`} tone="neutral" />
                    </div>

                    <div className="mt-4 rounded-2xl border border-slate-200 bg-white">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 text-xs text-slate-600">
                            <tr>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Group</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Budget</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Spend MTD</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Forecast</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Status</th>
                              <th className="px-4 py-3 font-semibold whitespace-nowrap">Trend</th>
                            </tr>
                          </thead>
                          <tbody>
                            {groups
                              .slice()
                              .sort((a, b) => a.priority - b.priority)
                              .map((g) => {
                                const forecast = calcForecast(g.spendMTD, DAY_OF_MONTH, DAYS_IN_MONTH);
                                const ft = forecastTone(forecast, g.budgetMonth);
                                const ex = topDriverExplanation(g);
                                return (
                                  <tr key={g.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{g.id}</td>
                                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatUGX(g.budgetMonth)}</td>
                                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatUGX(g.spendMTD)}</td>
                                    <td className="px-4 py-3 font-semibold text-slate-900 whitespace-nowrap">{formatUGX(forecast)}</td>
                                    <td className="px-4 py-3"><Pill label={ft.label} tone={ft.tone} /></td>
                                    <td className="px-4 py-3">
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="text-xs text-slate-600">{ex.title}</div>
                                        <Sparkline values={g.weeklySeries} />
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                      Forecasting is a simple extrapolation in this demo. In production, it uses historical patterns per group and seasonality.
                    </div>
                  </div>

                  {/* Scenario planner and What changed cards - Side by side grid */}
                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">Scenario planner</div>
                          <div className="mt-1 text-xs text-slate-500">If we lower cap by X%, savings estimate</div>
                        </div>
                        <Pill label="Premium" tone="info" />
                      </div>

                      <div className="mt-3 space-y-3">
                        <div>
                          <div className="text-xs font-semibold text-slate-600">Group</div>
                          <select
                            value={scenarioGroup}
                            onChange={(e) => setScenarioGroup(e.target.value as GroupId)}
                            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
                          >
                            {groups
                              .slice()
                              .sort((a, b) => a.priority - b.priority)
                              .map((g) => (
                                <option key={g.id} value={g.id}>
                                  {g.id}
                                </option>
                              ))}
                          </select>
                        </div>

                        <div>
                          <div className="flex items-center justify-between">
                            <div className="text-xs font-semibold text-slate-600">Lower cap by</div>
                            <Pill label={`${scenarioPct}%`} tone="neutral" />
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={40}
                            step={5}
                            value={scenarioPct}
                            onChange={(e) => setScenarioPct(Number(e.target.value))}
                            className="mt-2 w-full"
                          />
                          <div className="mt-1 text-xs text-slate-500">This estimates savings as forecast minus new cap (if forecast exceeds cap).</div>
                        </div>

                        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                          <div className="text-xs font-semibold text-slate-600">Current</div>
                          <div className="mt-2 grid grid-cols-1 gap-2">
                            <MiniBar label="Budget" value={scenario.g.budgetMonth} total={scenario.g.budgetMonth} hint={formatUGX(scenario.g.budgetMonth)} />
                            <MiniBar label="Forecast" value={scenario.forecast} total={Math.max(1, scenario.g.budgetMonth)} hint={formatUGX(scenario.forecast)} />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <Pill label={`Status: ${scenario.tone.label}`} tone={scenario.tone.tone} />
                            <Pill label={`Hard cap: ${scenario.g.hardCap ? "Yes" : "No"}`} tone={scenario.g.hardCap ? "warn" : "neutral"} />
                          </div>
                        </div>

                        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
                          <div className="text-xs font-semibold text-emerald-900">Scenario</div>
                          <div className="mt-2 text-sm font-semibold text-slate-900">New cap: {formatUGX(scenario.newBudget)}</div>
                          <div className="mt-1 text-sm text-slate-700">Potential savings: <span className="font-semibold text-slate-900">{formatUGX(scenario.potentialSavings)}</span></div>
                          <div className="mt-2 flex items-center justify-between">
                            <Pill label={`New status: ${scenario.newTone.label}`} tone={scenario.newTone.tone} />
                            <Button
                              variant="outline"
                              className="px-3 py-2 text-xs"
                              onClick={() => {
                                setGroups((prev) => prev.map((g) => (g.id === scenarioGroup ? { ...g, budgetMonth: scenario.newBudget, updatedAt: Date.now() } : g)));
                                toast({ title: "Applied", message: "Scenario cap applied to group budget (demo).", kind: "success" });
                              }}
                            >
                              <Sparkles className="h-4 w-4" /> Apply
                            </Button>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                          Note: lowering caps can reduce spend but may also block legitimate operations. Consider approvals instead of hard blocks.
                        </div>
                      </div>
                    </div>

                    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm h-fit">
                      <div className="text-sm font-semibold text-slate-900">What changed</div>
                      <div className="mt-1 text-xs text-slate-500">Premium: driver explanations per group</div>
                      <div className="mt-3 space-y-2">
                        {groups
                          .slice()
                          .sort((a, b) => a.priority - b.priority)
                          .slice(0, 3)
                          .map((g) => {
                            const ex = topDriverExplanation(g);
                            return (
                              <div key={g.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <div className="text-sm font-semibold text-slate-900">{g.id}</div>
                                    <div className="mt-1 text-xs text-slate-600">{ex.body}</div>
                                  </div>
                                  <Pill label="Driver" tone={ex.tone as any} />
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            <div className="mt-4 text-xs text-slate-500">
              G Groups & Cost Centers v2: groups and budgets, enforcement priority, cost centers, project tags, chargeback rules, forecasting, trend explanations, and scenario planner.
            </div>
          </div>
        </div>
      </div>

      {/* Group modal */}
      <Modal
        open={groupOpen}
        title="Edit group"
        subtitle="Update group budget, enforcement priority, and manager details."
        onClose={() => setGroupOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setGroupOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveGroup}>
              <Save className="h-4 w-4" /> Save
            </Button>
          </div>
        }
      >
        {groupDraft ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Group</div>
              <select
                value={groupDraft.id}
                onChange={(e) => setGroupDraft((p) => (p ? { ...p, id: e.target.value as GroupId } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                {["Operations", "Sales", "Finance", "Admin", "Procurement"].map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
              <div className="mt-2 text-xs text-slate-500">Demo: editing existing groups only.</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">Manager</div>
              <input
                value={groupDraft.manager}
                onChange={(e) => setGroupDraft((p) => (p ? { ...p, manager: e.target.value } : p))}
                placeholder="Manager name"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">Monthly budget (UGX)</div>
              <input
                type="number"
                value={groupDraft.budgetMonth}
                onChange={(e) => setGroupDraft((p) => (p ? { ...p, budgetMonth: Number(e.target.value || 0) } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <div className="mt-2 text-xs text-slate-500">Preview: {formatUGX(groupDraft.budgetMonth)}</div>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600">Enforcement priority</div>
              <input
                type="number"
                value={groupDraft.priority}
                onChange={(e) => setGroupDraft((p) => (p ? { ...p, priority: Number(e.target.value || 1) } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <div className="mt-2 text-xs text-slate-500">Lower number means higher priority.</div>
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Hard cap</div>
                  <div className="mt-1 text-xs text-slate-600">Block spend when the group budget is exceeded.</div>
                </div>
                <button
                  type="button"
                  className={cn(
                    "relative h-7 w-12 rounded-full border transition",
                    groupDraft.hardCap ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                  )}
                  onClick={() => setGroupDraft((p) => (p ? { ...p, hardCap: !p.hardCap } : p))}
                  aria-label="Toggle hard cap"
                >
                  <span
                    className={cn(
                      "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                      groupDraft.hardCap ? "left-[22px]" : "left-1"
                    )}
                  />
                </button>
              </div>
              <div className="mt-3 rounded-2xl bg-white p-3 text-xs text-slate-600">
                Premium: use scenario planner to estimate savings before applying hard caps.
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Cost center modal */}
      <Modal
        open={ccOpen}
        title={ccDraft?.id ? "Edit cost center" : "Add cost center"}
        subtitle="Cost centers map spend to invoices, tags, and chargeback rules."
        onClose={() => setCcOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setCcOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {ccDraft?.id ? (
                <Button variant="danger" onClick={() => { deleteCC(ccDraft.id); setCcOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveCC}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        {ccDraft ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Code</div>
              <input
                value={ccDraft.code}
                onChange={(e) => setCcDraft((p) => (p ? { ...p, code: e.target.value } : p))}
                placeholder="OPS-CORE"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Name</div>
              <input
                value={ccDraft.name}
                onChange={(e) => setCcDraft((p) => (p ? { ...p, name: e.target.value } : p))}
                placeholder="Operations core"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Group</div>
              <select
                value={ccDraft.group}
                onChange={(e) => setCcDraft((p) => (p ? { ...p, group: e.target.value as GroupId } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                {["Operations", "Sales", "Finance", "Admin", "Procurement"].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Invoice group</div>
              <select
                value={ccDraft.invoiceGroup}
                onChange={(e) => setCcDraft((p) => (p ? { ...p, invoiceGroup: e.target.value } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                {["ACME-MAIN", "ACME-SALES", "ACME-FIN"].map((x) => (
                  <option key={x} value={x}>{x}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Active</div>
                  <div className="mt-1 text-xs text-slate-600">Inactive cost centers are not used for new chargeback splits.</div>
                </div>
                <button
                  type="button"
                  className={cn("relative h-7 w-12 rounded-full border transition", ccDraft.active ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                  onClick={() => setCcDraft((p) => (p ? { ...p, active: !p.active } : p))}
                  aria-label="Toggle active"
                >
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", ccDraft.active ? "left-[22px]" : "left-1")} />
                </button>
              </div>
            </div>

            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-slate-600">Default tags</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {(ccDraft.defaultTags || []).map((t) => (
                  <span key={t} className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                    {t}
                    <button type="button" className="rounded-full p-1 hover:bg-slate-200" onClick={() => setCcDraft((p) => (p ? { ...p, defaultTags: (p.defaultTags || []).filter((x) => x !== t) } : p))}>
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}
                {!ccDraft.defaultTags?.length ? <Pill label="No default tags" tone="neutral" /> : null}
              </div>
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
                <div className="text-xs font-semibold text-slate-600">Add from tag library</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {tags.filter((t) => t.active).slice(0, 8).map((t) => {
                    const label = `${t.type}: ${t.key}`;
                    const on = (ccDraft.defaultTags || []).includes(label);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        className={cn(
                          "rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                          on ? "text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                        )}
                        style={on ? { background: EVZ.green } : undefined}
                        onClick={() => {
                          setCcDraft((p) => {
                            if (!p) return p;
                            const cur = new Set(p.defaultTags || []);
                            if (cur.has(label)) cur.delete(label);
                            else cur.add(label);
                            return { ...p, defaultTags: Array.from(cur) };
                          });
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-500">Default tags are applied when users forget to tag a transaction.</div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Tag modal */}
      <Modal
        open={tagOpen}
        title={tagDraft?.id ? "Edit tag" : "Add tag"}
        subtitle="Tags power reporting, budgets, and chargeback rules."
        onClose={() => setTagOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setTagOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {tagDraft?.id ? (
                <Button variant="danger" onClick={() => { deleteTag(tagDraft.id); setTagOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveTag}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
        maxW="860px"
      >
        {tagDraft ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold text-slate-600">Type</div>
              <select
                value={tagDraft.type}
                onChange={(e) => setTagDraft((p) => (p ? { ...p, type: e.target.value as TagType } : p))}
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              >
                {(["Client", "Event", "Campaign", "Project", "Other"] as TagType[]).map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <div className="text-xs font-semibold text-slate-600">Key</div>
              <input
                value={tagDraft.key}
                onChange={(e) => setTagDraft((p) => (p ? { ...p, key: e.target.value } : p))}
                placeholder="ABC"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
              <div className="mt-2 text-xs text-slate-500">Used in chargeback match rules.</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-xs font-semibold text-slate-600">Label</div>
              <input
                value={tagDraft.label}
                onChange={(e) => setTagDraft((p) => (p ? { ...p, label: e.target.value } : p))}
                placeholder="Client ABC Ltd"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
              />
            </div>

            <div className="md:col-span-2 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Active</div>
                  <div className="mt-1 text-xs text-slate-600">Inactive tags do not appear in dropdowns.</div>
                </div>
                <button
                  type="button"
                  className={cn("relative h-7 w-12 rounded-full border transition", tagDraft.active ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                  onClick={() => setTagDraft((p) => (p ? { ...p, active: !p.active } : p))}
                  aria-label="Toggle active"
                >
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", tagDraft.active ? "left-[22px]" : "left-1")} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Chargeback rule modal */}
      <Modal
        open={ruleOpen}
        title={ruleDraft?.id ? "Edit chargeback rule" : "Add chargeback rule"}
        subtitle="Split billing by tag mapping. Splits must sum to 100%."
        onClose={() => setRuleOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setRuleOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              {ruleDraft?.id ? (
                <Button variant="danger" onClick={() => { deleteRule(ruleDraft.id); setRuleOpen(false); }}>
                  <Trash2 className="h-4 w-4" /> Delete
                </Button>
              ) : null}
              <Button variant="primary" onClick={saveRule}>
                <Save className="h-4 w-4" /> Save
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        {ruleDraft ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold text-slate-600">Name</div>
                <input
                  value={ruleDraft.name}
                  onChange={(e) => setRuleDraft((p) => (p ? { ...p, name: e.target.value } : p))}
                  placeholder="Client ABC meetings"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Priority</div>
                <input
                  type="number"
                  value={ruleDraft.priority}
                  onChange={(e) => setRuleDraft((p) => (p ? { ...p, priority: Number(e.target.value || 1) } : p))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
                <div className="mt-2 text-xs text-slate-500">Lower number means higher priority.</div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600">Match type</div>
                <select
                  value={ruleDraft.match.type}
                  onChange={(e) => setRuleDraft((p) => (p ? { ...p, match: { ...p.match, type: e.target.value as TagType } } : p))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                >
                  {(["Client", "Event", "Campaign", "Project", "Other"] as TagType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-600">Match key</div>
                <input
                  value={ruleDraft.match.key}
                  onChange={(e) => setRuleDraft((p) => (p ? { ...p, match: { ...p.match, key: e.target.value } } : p))}
                  placeholder="ABC"
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Split billing</div>
                  <div className="mt-1 text-xs text-slate-500">Percent must sum to 100%.</div>
                </div>
                <Pill label={`Sum: ${sumSplits(ruleDraft.splits)}%`} tone={sumSplits(ruleDraft.splits) === 100 ? "good" : "warn"} />
              </div>

              <div className="mt-3 space-y-2">
                {ruleDraft.splits.map((s, idx) => {
                  const cc = costCenters.find((c) => c.id === s.costCenterId);
                  return (
                    <div key={idx} className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-white p-3 md:grid-cols-12">
                      <div className="md:col-span-7">
                        <div className="text-xs font-semibold text-slate-600">Cost center</div>
                        <select
                          value={s.costCenterId}
                          onChange={(e) => {
                            const v = e.target.value;
                            setRuleDraft((p) => {
                              if (!p) return p;
                              const next = { ...p };
                              next.splits = next.splits.map((x, i) => (i === idx ? { ...x, costCenterId: v } : x));
                              return next;
                            });
                          }}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                        >
                          {costCenters.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.code} - {c.name}
                            </option>
                          ))}
                        </select>
                        <div className="mt-1 text-xs text-slate-500">Group: {cc?.group} • Invoice group: {cc?.invoiceGroup}</div>
                      </div>
                      <div className="md:col-span-3">
                        <div className="text-xs font-semibold text-slate-600">Percent</div>
                        <input
                          type="number"
                          value={s.percent}
                          onChange={(e) => {
                            const v = Number(e.target.value || 0);
                            setRuleDraft((p) => {
                              if (!p) return p;
                              const next = { ...p };
                              next.splits = next.splits.map((x, i) => (i === idx ? { ...x, percent: v } : x));
                              return next;
                            });
                          }}
                          className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2 flex items-end justify-end">
                        <Button
                          variant="danger"
                          className="px-3 py-2 text-xs"
                          onClick={() => {
                            setRuleDraft((p) => {
                              if (!p) return p;
                              const next = { ...p };
                              next.splits = next.splits.filter((_, i) => i !== idx);
                              if (!next.splits.length) next.splits = [{ costCenterId: costCenters[0]?.id || "", percent: 100 }];
                              return next;
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setRuleDraft((p) => {
                      if (!p) return p;
                      return { ...p, splits: [...p.splits, { costCenterId: costCenters[0]?.id || "", percent: 0 }] };
                    });
                  }}
                >
                  <Plus className="h-4 w-4" /> Add split
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // auto-normalize to 100 (simple)
                    setRuleDraft((p) => {
                      if (!p) return p;
                      const total = p.splits.reduce((a, s) => a + Number(s.percent || 0), 0);
                      if (!total) return p;
                      const next = { ...p };
                      next.splits = next.splits.map((s) => ({ ...s, percent: Math.round((s.percent / total) * 100) }));
                      // fix rounding by adjusting first
                      const fix = 100 - sumSplits(next.splits);
                      next.splits[0] = { ...next.splits[0], percent: next.splits[0].percent + fix };
                      return next;
                    });
                    toast({ title: "Normalized", message: "Split normalized to 100%.", kind: "success" });
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Normalize to 100%
                </Button>
                <Button variant="outline" onClick={() => setSimulateOpen(true)}>
                  <Sparkles className="h-4 w-4" /> Test
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Notes</div>
              <textarea
                value={ruleDraft.notes}
                onChange={(e) => setRuleDraft((p) => (p ? { ...p, notes: e.target.value } : p))}
                rows={4}
                placeholder="Explain how this rule is used"
                className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
              />
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Best practice: keep a short business reason for every chargeback rule.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Enabled</div>
                  <div className="mt-1 text-xs text-slate-600">Disable without deleting to preserve history.</div>
                </div>
                <button
                  type="button"
                  className={cn("relative h-7 w-12 rounded-full border transition", ruleDraft.enabled ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white")}
                  onClick={() => setRuleDraft((p) => (p ? { ...p, enabled: !p.enabled } : p))}
                  aria-label="Toggle enabled"
                >
                  <span className={cn("absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition", ruleDraft.enabled ? "left-[22px]" : "left-1")} />
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>

      {/* Chargeback simulation modal */}
      <Modal
        open={simulateOpen}
        title="Chargeback simulator"
        subtitle="Test a tagged transaction and see how it splits across cost centers."
        onClose={() => setSimulateOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setSimulateOpen(false)}>Close</Button>
          </div>
        }
        maxW="980px"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Transaction</div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-600">Amount (UGX)</div>
                <input
                  type="number"
                  value={simAmount}
                  onChange={(e) => setSimAmount(Number(e.target.value || 0))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                />
                <div className="mt-2 text-xs text-slate-500">Preview: {formatUGX(simAmount)}</div>
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-600">Tag type</div>
                <select
                  value={simType}
                  onChange={(e) => setSimType(e.target.value as TagType)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                >
                  {(["Client", "Event", "Campaign", "Project", "Other"] as TagType[]).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="mt-3">
                <div className="text-xs font-semibold text-slate-600">Tag key</div>
                <select
                  value={simKey}
                  onChange={(e) => setSimKey(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
                >
                  {tags.filter((t) => t.type === simType && t.active).map((t) => (
                    <option key={t.id} value={t.key}>{t.key} - {t.label}</option>
                  ))}
                  {tags.filter((t) => t.type === simType && t.active).length === 0 ? (
                    <option value={simKey}>{simKey}</option>
                  ) : null}
                </select>
                <div className="mt-2 text-xs text-slate-500">Rules match on type and key.</div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-amber-800 ring-1 ring-amber-200">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">How this works</div>
                  <div className="mt-1 text-sm text-slate-700">The simulator selects the highest priority matching rule and applies the split.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Matched rule</div>
                  <div className="mt-1 text-xs text-slate-500">If none match, the transaction uses the user’s default cost center (not shown in this demo).</div>
                </div>
                {simRule ? <Pill label={`#${simRule.priority}`} tone="neutral" /> : <Pill label="No match" tone="warn" />}
              </div>

              {simRule ? (
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-700">
                  <div className="font-semibold">{simRule.name}</div>
                  <div className="mt-1 text-slate-600">Match: {simRule.match.type}: {simRule.match.key}</div>
                  <div className="mt-1 text-slate-600">Rule ID: {simRule.id}</div>
                </div>
              ) : (
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  No enabled chargeback rule matches this tag. Create a rule or change the tag.
                </div>
              )}

              {matchingRules.length > 1 ? (
                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-3 text-xs text-slate-600">
                  Multiple matches found. Using highest priority rule.
                  <div className="mt-2 flex flex-wrap gap-2">
                    {matchingRules.slice(0, 6).map((r) => (
                      <Pill key={r.id} label={`#${r.priority} ${r.name}`} tone="neutral" />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Split result</div>
                  <div className="mt-1 text-xs text-slate-500">Amounts per cost center (and their invoice group).</div>
                </div>
                <Pill label={simRule ? `${sumSplits(simRule.splits)}%` : "-"} tone={simRule ? "good" : "neutral"} />
              </div>

              {simRule ? (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Cost center</th>
                        <th className="px-4 py-3 font-semibold">Group</th>
                        <th className="px-4 py-3 font-semibold">Invoice group</th>
                        <th className="px-4 py-3 font-semibold">Percent</th>
                        <th className="px-4 py-3 font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simSplits.map((s, idx) => (
                        <tr key={idx} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-semibold text-slate-900">{s.costCenter?.code || "Unknown"}</td>
                          <td className="px-4 py-3"><Pill label={s.costCenter?.group || "-"} tone="neutral" /></td>
                          <td className="px-4 py-3 text-slate-700">{s.costCenter?.invoiceGroup || "-"}</td>
                          <td className="px-4 py-3 text-slate-700">{s.percent}%</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(s.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="mt-3 text-sm text-slate-600">No split to show.</div>
              )}

              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Premium: split preview can be displayed at checkout before purchase confirmation.
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          G Groups & Cost Centers v2 includes groups, budgets, enforcement priority, cost centers, tags, chargeback rules, forecasting, trend explanations, and scenario planning.
        </div>
      </footer>
    </div>
  );
}
