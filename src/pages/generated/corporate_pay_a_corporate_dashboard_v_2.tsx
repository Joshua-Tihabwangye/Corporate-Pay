import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  AlertTriangle,
  BadgeCheck,
  BarChart3,
  Bell,
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
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

function Modal({
  open,
  title,
  subtitle,
  children,
  onClose,
  footer,
  maxW = "900px",
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  maxW?: string;
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
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div>
                <div className="text-lg font-semibold text-slate-900 dark:text-white">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">
              {children}
            </div>
            {footer ? (
              <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">{footer}</div>
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

function StatCard({
  title,
  value,
  sub,
  icon,
  trend,
}: {
  title: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  trend?: { label: string; tone: "good" | "warn" | "bad" | "info" | "neutral" };
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">{title}</div>
          <div className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
            {value}
          </div>
          <div className="mt-1 text-xs text-slate-600 dark:text-slate-400">{sub}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
          {icon}
        </div>
      </div>
      {trend ? (
        <div className="mt-3">
          <Pill label={trend.label} tone={trend.tone} />
        </div>
      ) : null}
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

function Heatmap({ matrix, rows, cols }: { matrix: number[][]; rows: string[]; cols: string[] }) {
  const max = Math.max(1, ...matrix.flat());
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">Peak ride times</div>
        <div className="text-xs text-slate-500 dark:text-slate-500">Heatmap</div>
      </div>
      <div className="mt-3 overflow-auto">
        <div className="min-w-[520px]">
          <div className="grid" style={{ gridTemplateColumns: `120px repeat(${cols.length}, minmax(0, 1fr))` }}>
            <div className="px-2 py-2 text-xs font-semibold text-slate-500">Day</div>
            {cols.map((c) => (
              <div key={c} className="px-2 py-2 text-xs font-semibold text-slate-500">{c}</div>
            ))}
            {rows.map((r, i) => (
              <React.Fragment key={r}>
                <div className="px-2 py-2 text-xs font-semibold text-slate-700">{r}</div>
                {matrix[i].map((v, j) => {
                  const a = 0.10 + (v / max) * 0.70;
                  return (
                    <div key={`${i}-${j}`} className="px-2 py-2">
                      <div
                        className="h-7 rounded-xl border border-slate-200 dark:border-slate-700"
                        style={{ background: `rgba(3,205,140,${a.toFixed(2)})` }}
                        title={`${r} • ${cols[j]}: ${v} rides`}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-slate-600">Use this to plan commute programs and staffing.</div>
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
  const [timeframe, setTimeframe] = useState<"Today" | "This week" | "This month">("This month");

  const [filterGroup, setFilterGroup] = useState<Group | "All">("All");
  const [filterModule, setFilterModule] = useState<ServiceModule | "All">("All");
  const [filterMarketplace, setFilterMarketplace] = useState<Marketplace | "All">("All");

  const marketplaceEnabled = useMemo(() => {
    return filterModule === "All" || filterModule === "E-Commerce";
  }, [filterModule]);

  // Mock spend model
  const data = useMemo(() => {
    const spendToday = 1240000;
    const spendWeek = 6840000;
    const spendMonth = 32500000;
    const budgetMonth = 40000000;

    const ridesMonth = 14200000;
    const purchasesMonth = 16800000;
    const servicesMonth = 1500000;

    const walletBalance = 6800000;
    const creditLimit = 25000000;
    const creditUsed = 8200000;
    const prepaidRunwayDays = 3;

    const failedPayments = 2;
    const overdueInvoices = 1;
    const policyBreaches = 4;

    const monthDay = 7; // Jan 7 (demo)
    const daysInMonth = 30;
    const forecastMonthEnd = Math.round((spendMonth / Math.max(1, monthDay)) * daysInMonth);

    // breakdowns
    const spendByModule: Record<ServiceModule, number> = {
      "E-Commerce": 16800000,
      "EVs & Charging": 4200000,
      "Rides & Logistics": 14200000,
      "School & E-Learning": 800000,
      "Medical & Health Care": 650000,
      "Travel & Tourism": 1200000,
      "Green Investments": 500000,
      "FaithHub": 120000,
      "Virtual Workspace": 900000,
      "Finance & Payments": 2000000,
      "Other Service Module": 0,
    };

    const spendByMarketplace: Record<Marketplace, number> = {
      MyLiveDealz: 5200000,
      ServiceMart: 1200000,
      EVmart: 3400000,
      GadgetMart: 2200000,
      LivingMart: 1300000,
      StyleMart: 900000,
      EduMart: 600000,
      HealthMart: 750000,
      PropertyMart: 400000,
      GeneratMart: 700000,
      ExpressMart: 600000,
      FaithMart: 150000,
      "Other Marketplace": 0,
    };

    const spendByGroup: Record<Group, number> = {
      Operations: 12000000,
      Sales: 9800000,
      Finance: 5200000,
      Admin: 4100000,
      Procurement: 3400000,
    };

    const budgetByGroup: Record<Group, number> = {
      Operations: 15000000,
      Sales: 12000000,
      Finance: 6000000,
      Admin: 5000000,
      Procurement: 5000000,
    };

    return {
      spendToday,
      spendWeek,
      spendMonth,
      budgetMonth,
      budgetRemaining: Math.max(0, budgetMonth - spendMonth),
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
    };
  }, []);

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

  // Heatmap demo data
  const heat = useMemo(() => {
    const rows = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const cols = ["06-09", "09-12", "12-15", "15-18", "18-21", "21-24"];
    const matrix = [
      [6, 10, 8, 9, 14, 3],
      [5, 9, 7, 10, 12, 2],
      [7, 11, 9, 12, 16, 4],
      [6, 10, 8, 11, 15, 3],
      [8, 13, 10, 14, 18, 5],
      [3, 6, 7, 9, 12, 6],
      [2, 4, 5, 7, 9, 4],
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
  }, [filterGroup, filterModule, filterMarketplace]);

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

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
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
                  </select>
                </div>

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
          <div className="bg-slate-50 px-4 py-5 transition-colors md:px-6 dark:bg-slate-950">
            {/* KPI row */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <StatCard
                title="Spend today"
                value={formatUGX(data.spendToday)}
                sub="All modules"
                icon={<CircleDollarSign className="h-5 w-5" />}
                trend={{ label: "+12% vs yesterday", tone: "good" }}
              />
              <StatCard
                title="Spend this week"
                value={formatUGX(data.spendWeek)}
                sub="Week-to-date"
                icon={<TrendingUp className="h-5 w-5" />}
                trend={{ label: "Stable", tone: "neutral" }}
              />
              <StatCard
                title="Spend this month"
                value={formatUGX(data.spendMonth)}
                sub={`Budget: ${formatUGX(data.budgetMonth)}`}
                icon={<BarChart3 className="h-5 w-5" />}
                trend={{ label: `${Math.round(budgetUsedPct)}% used`, tone: budgetUsedPct > 90 ? "bad" : "warn" }}
              />
              <StatCard
                title="Budget remaining"
                value={formatUGX(data.budgetRemaining)}
                sub="Available this month"
                icon={<PiggyBank className="h-5 w-5" />}
                trend={{ label: data.budgetRemaining < 2000000 ? "Low" : "OK", tone: data.budgetRemaining < 2000000 ? "warn" : "good" }}
              />
              <StatCard
                title="Approvals pending"
                value={String(approvalsPending)}
                sub={approvalsEscalated ? `${approvalsEscalated} escalated` : "No escalations"}
                icon={<BadgeCheck className="h-5 w-5" />}
                trend={{ label: approvalsEscalated ? "Escalation" : "On track", tone: approvalsEscalated ? "bad" : "good" }}
              />
              <StatCard
                title="Forecast month-end"
                value={formatUGX(data.forecastMonthEnd)}
                sub={data.forecastMonthEnd > data.budgetMonth ? "Over budget" : "Within budget"}
                icon={<LineChart className="h-5 w-5" />}
                trend={{ label: data.forecastMonthEnd > data.budgetMonth ? "Risk" : "OK", tone: data.forecastMonthEnd > data.budgetMonth ? "warn" : "good" }}
              />
            </div>

            {/* Quick actions */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">Quick actions</div>
                    <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">Fast paths to high-impact workflows</div>
                  </div>
                  <Pill label="Admin" tone="neutral" />
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <ActionButton icon={<Wallet className="h-4 w-4" />} label="Add funds" onClick={() => setAddFundsOpen(true)} />
                  <ActionButton icon={<PiggyBank className="h-4 w-4" />} label="Issue budget" onClick={() => setIssueBudgetOpen(true)} />
                  <ActionButton icon={<BadgeCheck className="h-4 w-4" />} label="Approve queue" onClick={() => setApprovalsOpen(true)} />
                  <ActionButton icon={<FileText className="h-4 w-4" />} label="Create RFQ/Quote" onClick={() => setRfqOpen(true)} />
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                  RFQs support high-value assets that do not fit monthly budgets.
                </div>
              </div>

              {/* Account health */}
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Account health</div>
                    <div className="mt-1 text-xs text-slate-500">Wallet, credit, prepaid runway, and service status</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Pill label={`Wallet: ${formatUGX(data.walletBalance)}`} tone={data.walletBalance < 1000000 ? "bad" : "good"} />
                    <Pill label={`Credit: ${Math.round(creditUsedPct)}% used`} tone={creditUsedPct > 80 ? "warn" : "neutral"} />
                    <Pill label={`Prepaid runway: ${data.prepaidRunwayDays} days`} tone={data.prepaidRunwayDays <= 3 ? "warn" : "good"} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Wallet balance</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatUGX(data.walletBalance)}</div>
                    <div className="mt-2">
                      <Button variant="outline" className="w-full text-xs" onClick={() => setAddFundsOpen(true)}>
                        <HandCoins className="h-4 w-4" /> Add funds
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Credit usage</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{formatUGX(data.creditUsed)} / {formatUGX(data.creditLimit)}</div>
                    <div className="mt-2">
                      <ProgressBar value={creditUsedPct} labelLeft="Used" labelRight={`${Math.round(creditUsedPct)}%`} />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-600">Service status</div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {SERVICE_MODULES.slice(0, 6).map((m) => (
                        <button
                          key={m}
                          type="button"
                          className={cn(
                            "rounded-full px-3 py-2 text-xs font-semibold ring-1",
                            serviceStatus[m] ? "bg-emerald-50 text-emerald-800 ring-emerald-200" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                          )}
                          onClick={() => {
                            setServiceStatus((p) => ({ ...p, [m]: !p[m] }));
                            toast({ title: "Service status", message: `${m}: ${serviceStatus[m] ? "Paused" : "Active"} (demo).`, kind: "info" });
                          }}
                          title="Demo toggle"
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 text-xs text-slate-500">More modules configured in Setup. Demo toggles only.</div>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  Auto-enforcement: if agreements are not complied with, CorporatePay is disabled at checkout across apps.
                </div>
              </div>
            </div>

            {/* Top issues + premium insights */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Top issues</div>
                    <div className="mt-1 text-xs text-slate-500">What needs attention now</div>
                  </div>
                  <Pill label={`${issues.length}`} tone={issues.some((x) => x.pill.tone === "bad") ? "bad" : "warn"} />
                </div>
                <div className="mt-3 space-y-2">
                  {issues.map((x) => (
                    <div key={x.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-slate-900">{x.title}</div>
                          <div className="mt-1 text-xs text-slate-500">{x.meta}</div>
                        </div>
                        <Pill label={x.pill.label} tone={x.pill.tone} />
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="mt-3 w-full text-xs" onClick={() => toast({ title: "Issues", message: "Opening Notifications & Activity Center (Round 1B).", kind: "info" })}>
                  <Bell className="h-4 w-4" /> View all
                </Button>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Premium insights</div>
                    <div className="mt-1 text-xs text-slate-500">Anomalies, savings, forecasts, and next-best actions</div>
                  </div>
                  <Pill label="Premium" tone="info" />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Anomalies</div>
                        <div className="mt-1 text-xs text-slate-500">Unusual patterns detected</div>
                      </div>
                      <Pill label={`${anomalies.length}`} tone="warn" />
                    </div>
                    <div className="mt-3 space-y-2">
                      {anomalies.map((a) => (
                        <div key={a.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{a.body}</div>
                            </div>
                            <Pill label={a.severity === "warn" ? "Anomaly" : "Info"} tone={a.severity} />
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {a.ctas.map((c) => (
                              <Button key={c} variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: c, message: "Action opened (demo).", kind: "info" })}>
                                <Sparkles className="h-4 w-4" /> {c}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-slate-900">Savings suggestions</div>
                        <div className="mt-1 text-xs text-slate-500">Negotiated pricing and policy tuning</div>
                      </div>
                      <Pill label={`${savings.length}`} tone="good" />
                    </div>
                    <div className="mt-3 space-y-2">
                      {savings.map((s) => (
                        <div key={s.title} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-sm font-semibold text-slate-900">{s.title}</div>
                              <div className="mt-1 text-xs text-slate-500">{s.body}</div>
                            </div>
                            <Pill label={s.tag} tone="neutral" />
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="mt-3 w-full text-xs" onClick={() => toast({ title: "Savings", message: "Opening savings dashboard (Round 8V).", kind: "info" })}>
                      <TrendingDown className="h-4 w-4" /> View all
                    </Button>
                  </div>
                </div>

                <div className="mt-3 rounded-3xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Next best actions</div>
                      <div className="mt-1 text-xs text-slate-500">Smart admin guidance based on signals</div>
                    </div>
                    <Pill label={`${nextActions.length}`} tone="info" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
                    {nextActions.map((a) => (
                      <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">{a.title}</div>
                            <div className="mt-1 text-xs text-slate-500">{a.why}</div>
                          </div>
                          <Pill label={a.tone === "warn" ? "Now" : a.tone === "info" ? "Soon" : "Tip"} tone={a.tone} />
                        </div>
                        <div className="mt-2 text-xs text-slate-700">Impact: <span className="font-semibold text-slate-900">{a.impact}</span></div>
                        <Button variant="primary" className="mt-3 w-full text-xs" onClick={() => {
                          if (a.cta.includes("RFQ")) setRfqOpen(true);
                          else if (a.cta.includes("budget")) setIssueBudgetOpen(true);
                          else toast({ title: a.cta, message: "Opening action (demo).", kind: "info" });
                        }}>
                          <ChevronRight className="h-4 w-4" /> {a.cta}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Heatmaps + leaders */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Heatmap matrix={heat.matrix} rows={heat.rows} cols={heat.cols} />
              </div>
              <div className="space-y-3">
                <ListCard
                  title="Top vendors"
                  subtitle="Across modules/marketplaces"
                  icon={<Store className="h-4 w-4" />}
                  actionLabel="View"
                  onAction={() => toast({ title: "Vendors", message: "Opening vendor analytics (Round 7R).", kind: "info" })}
                  items={[
                    { title: "Shenzhen Store", meta: `Spend: ${formatUGX(5200000)} • Marketplace: MyLiveDealz`, pill: { label: "Anomaly", tone: "warn" } },
                    { title: "Kampala Office Mart", meta: `Spend: ${formatUGX(3100000)} • Preferred vendor`, pill: { label: "Preferred", tone: "good" } },
                    { title: "City Courier", meta: `Spend: ${formatUGX(820000)} • SLA OK`, pill: { label: "OK", tone: "neutral" } },
                  ]}
                />
                <ListCard
                  title="Top routes"
                  subtitle="Most frequent rides"
                  icon={<MapPin className="h-4 w-4" />}
                  actionLabel="View"
                  onAction={() => toast({ title: "Routes", message: "Opening route analytics (Round 8U).", kind: "info" })}
                  items={[
                    { title: "Office → Airport", meta: "36 trips • Avg fare UGX 82k", pill: { label: "Peak", tone: "warn" } },
                    { title: "Office → Client HQ", meta: "29 trips • Avg fare UGX 41k", pill: { label: "OK", tone: "neutral" } },
                    { title: "Office → Warehouse", meta: "18 trips • Avg fare UGX 35k", pill: { label: "OK", tone: "neutral" } },
                  ]}
                />
              </div>
            </div>

            {/* Forecast table */}
            <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm lg:col-span-2">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Forecast to month-end</div>
                    <div className="mt-1 text-xs text-slate-500">By group and module (Marketplaces shown separately)</div>
                  </div>
                  <Pill label={`Day ${data.monthDay}/${data.daysInMonth}`} tone="neutral" />
                </div>

                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-600">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Group</th>
                        <th className="px-4 py-3 font-semibold">MTD</th>
                        <th className="px-4 py-3 font-semibold">Forecast</th>
                        <th className="px-4 py-3 font-semibold">Budget</th>
                        <th className="px-4 py-3 font-semibold">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {forecastByGroup.map((r) => (
                        <tr key={r.group} className="border-t border-slate-100 hover:bg-slate-50/60">
                          <td className="px-4 py-3 font-semibold text-slate-900">{r.group}</td>
                          <td className="px-4 py-3 text-slate-700">{formatUGX(r.mtd)}</td>
                          <td className="px-4 py-3 font-semibold text-slate-900">{formatUGX(r.forecast)}</td>
                          <td className="px-4 py-3 text-slate-700">{formatUGX(r.budget)}</td>
                          <td className="px-4 py-3"><Pill label={r.risk === "bad" ? "Over" : r.risk === "warn" ? "At risk" : "OK"} tone={r.risk} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  Premium: forecast uses real historical patterns per group/module/marketplace in production.
                </div>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Module and marketplace mix</div>
                    <div className="mt-1 text-xs text-slate-500">Month-to-date distribution</div>
                  </div>
                  <Pill label="MTD" tone="neutral" />
                </div>

                <div className="mt-3 space-y-3">
                  <MixBar
                    title="Service modules"
                    total={moduleSpendTotal}
                    rows={forecastByModule.slice(0, 6).map((m) => ({ label: m.module, value: m.mtd }))}
                  />
                  <MixBar
                    title="Marketplaces"
                    total={marketplaceSpendTotal}
                    rows={forecastByMarketplace.slice(0, 6).map((m) => ({ label: m.marketplace, value: m.mtd }))}
                  />
                </div>

                <Button variant="outline" className="mt-3 w-full text-xs" onClick={() => toast({ title: "Analytics", message: "Opening Reporting & Analytics (Round 8V).", kind: "info" })}>
                  <BarChart3 className="h-4 w-4" /> Open analytics
                </Button>
              </div>
            </div>

            <div className="mt-4 text-xs text-slate-500">
              A) Corporate Dashboard v2: incorporates EVzone Service Modules and Marketplaces (including Other slots), premium forecasting by group/module/marketplace, anomaly detection, savings suggestions, and next-best actions.
            </div>
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
              value={fundDraft.amount}
              onChange={(e) => setFundDraft((p) => ({ ...p, amount: Number(e.target.value || 0) }))}
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
              value={budgetDraft.amount}
              onChange={(e) => setBudgetDraft((p) => ({ ...p, amount: Number(e.target.value || 0) }))}
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
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">Attachments</div>
                <div className="mt-1 text-xs text-slate-600">Specs, PDFs, drawings</div>
              </div>
              <button
                type="button"
                className={cn(
                  "relative h-7 w-12 rounded-full border transition",
                  rfqDraft.attachments ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
                )}
                onClick={() => setRfqDraft((p) => ({ ...p, attachments: !p.attachments }))}
                aria-label="Toggle attachments"
              >
                <span
                  className={cn(
                    "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
                    rfqDraft.attachments ? "left-[22px]" : "left-1"
                  )}
                />
              </button>
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

      {/* Approvals modal */}
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
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
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
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => toast({ title: "Open", message: `Opening ${a.id} (demo).`, kind: "info" })}>
                        Open
                      </Button>
                      <Button
                        variant="primary"
                        className="px-3 py-2 text-xs"
                        onClick={() => {
                          setApprovals((p) => p.filter((x) => x.id !== a.id));
                          toast({ title: "Approved", message: `${a.id} approved.`, kind: "success" });
                        }}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        className="px-3 py-2 text-xs"
                        onClick={() => {
                          setApprovals((p) => p.filter((x) => x.id !== a.id));
                          toast({ title: "Rejected", message: `${a.id} rejected.`, kind: "warn" });
                        }}
                      >
                        Reject
                      </Button>
                    </div>
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
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          A Corporate Dashboard v2: KPIs, account health, issues, heatmaps, quick actions, and premium insights with forecasts by group/module/marketplace.
        </div>
      </footer>
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
  total,
  rows,
}: {
  title: string;
  total: number;
  rows: Array<{ label: string; value: number }>;
}) {
  const safeTotal = Math.max(1, total);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold text-slate-600">{title}</div>
        <div className="text-xs text-slate-500">Top {rows.length}</div>
      </div>
      <div className="mt-3 space-y-2">
        {rows.map((r) => {
          const pct = clamp((r.value / safeTotal) * 100, 0, 100);
          return (
            <div key={r.label} className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-semibold text-slate-800">{r.label}</div>
                <div className="text-xs font-semibold text-slate-900">{formatUGX(r.value)}</div>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: EVZ.green }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
