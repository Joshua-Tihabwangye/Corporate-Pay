import React, { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  BookMarked,
  CalendarClock,
  Check,
  ChevronDown,
  ChevronRight,
  Command,
  Copy,
  Download,
  FileText,
  Filter,
  Flame,
  Snowflake,
  Globe,
  Hash,
  HelpCircle,
  KeyRound,
  Layers,
  ListChecks,
  MapPin,
  Package,
  PiggyBank,
  Plus,
  Search,
  Shield,
  Sparkles,
  Store,
  Ticket,
  User,
  Users,
  Wallet,
  X,
  Trash2,
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

function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function formatUGX(n: number) {
  const v = Math.round(Number(n || 0));
  return `UGX ${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
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
      "text-white shadow-[0_12px_24px_rgba(3,205,140,0.22)] hover:opacity-95 focus:ring-emerald-200",
    accent:
      "text-white shadow-[0_12px_24px_rgba(247,127,0,0.22)] hover:opacity-95 focus:ring-orange-200",
    outline:
      "border border-slate-200 bg-white text-slate-800 shadow-sm hover:bg-slate-50 focus:ring-slate-200",
    ghost:
      "bg-transparent text-slate-700 hover:bg-slate-100 focus:ring-slate-200",
    danger:
      "border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 focus:ring-rose-100",
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
                {t.kind === "error" || t.kind === "warn" ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <Check className="h-5 w-5" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold text-slate-900">
                  {t.title}
                </div>
                {t.message ? (
                  <div className="mt-0.5 text-sm text-slate-600">
                    {t.message}
                  </div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-500 hover:bg-slate-100"
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
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
            className="fixed inset-x-0 top-[8vh] z-50 mx-auto w-[min(980px,calc(100vw-2rem))] overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.22)]"
            style={{ maxWidth: maxW }}
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <div className="text-lg font-semibold text-slate-900">{title}</div>
                {subtitle ? (
                  <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
                ) : null}
              </div>
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto px-5 py-4">{children}</div>
            {footer ? (
              <div className="border-t border-slate-200 px-5 py-4">{footer}</div>
            ) : null}
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
          <motion.div
            className="fixed inset-0 z-40 bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
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
              <button
                className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100"
                onClick={onClose}
                aria-label="Close"
              >
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

type ScopeKey =
  | "Users"
  | "Groups"
  | "Cost centers"
  | "Invoices"
  | "Trips"
  | "Purchases"
  | "Vendors"
  | "RFQs"
  | "Approvals";

type Role = "Org Admin" | "Accountant" | "Approver" | "Manager" | "Travel Coordinator";

type SearchItem = {
  scope: ScopeKey;
  id: string;
  title: string;
  subtitle: string;
  meta: string;
  tags: string[];
  raw: any;
};

type SavedSearch = {
  id: string;
  role: Role;
  name: string;
  query: string;
  scopes: ScopeKey[];
};

type Command = {
  id: string;
  label: string;
  description: string;
  shortcut: string;
  group: "Quick actions" | "Navigate" | "Tools";
  run: () => void;
};

type ActionKind = "rfq" | "budget" | "freeze" | "export" | null;

export default function CorporatePayGlobalSearchCommandCenterV2() {
  const [toasts, setToasts] = useState<Array<{ id: string; title: string; message?: string; kind: string }>>([]);
  const toast = (t: { title: string; message?: string; kind: string }) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const ROLES: Role[] = ["Org Admin", "Accountant", "Approver", "Manager", "Travel Coordinator"];

  const SERVICE_MODULES = [
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
  ] as const;

  const MARKETPLACES = [
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
  ] as const;

  const scopesAll: ScopeKey[] = [
    "Users",
    "Groups",
    "Cost centers",
    "Invoices",
    "Trips",
    "Purchases",
    "Vendors",
    "RFQs",
    "Approvals",
  ];

  // Search state
  const [query, setQuery] = useState("");
  const [activeScopes, setActiveScopes] = useState<Set<ScopeKey>>(
    () => new Set(scopesAll)
  );

  // Role and premium
  const [role, setRole] = useState<Role>("Org Admin");
  const [operatorMode, setOperatorMode] = useState(true);

  // Command palette
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [paletteIndex, setPaletteIndex] = useState(0);
  const paletteInputRef = useRef<HTMLInputElement | null>(null);
  const searchRef = useRef<HTMLInputElement | null>(null);

  // Detail drawer
  const [detail, setDetail] = useState<SearchItem | null>(null);

  // Save search
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState("");

  // Quick actions
  const [actionKind, setActionKind] = useState<ActionKind>(null);
  const [actionOpen, setActionOpen] = useState(false);

  // Audit reason
  const [reason, setReason] = useState("");
  const [confirmAck, setConfirmAck] = useState(false);

  // Action drafts
  const [rfqDraft, setRfqDraft] = useState({
    title: "Company vehicle purchase",
    module: "Rides & Logistics",
    marketplace: "All",
    estValue: 285000000,
    neededBy: "2026-02-01",
    description: "Need a company vehicle. Include warranty and delivery timeline.",
    attachments: true,
  });

  const [budgetDraft, setBudgetDraft] = useState({
    group: "Operations",
    period: "Monthly",
    amount: 5000000,
    hardCap: true,
  });

  const [freezeDraft, setFreezeDraft] = useState({
    mode: "Soft pause",
    scope: "CorporatePay only",
    notifyUsers: true,
  });

  const [exportDraft, setExportDraft] = useState({
    month: "2026-01",
    format: "CSV",
    breakdown: "Group + Module + Marketplace",
  });

  // Sample data
  const data = useMemo(() => {
    const now = Date.now();
    return {
      users: [
        { id: "U-1001", name: "Mary N.", email: "mary@acme.com", group: "Operations", role: "Manager" },
        { id: "U-1002", name: "Finance Desk", email: "finance@acme.com", group: "Finance", role: "Accountant" },
        { id: "U-1003", name: "John S.", email: "john@acme.com", group: "Sales", role: "User" },
      ],
      groups: [
        { id: "G-OPS", name: "Operations", budget: 15000000, usedPct: 61 },
        { id: "G-SALES", name: "Sales", budget: 12000000, usedPct: 82 },
        { id: "G-FIN", name: "Finance", budget: 6000000, usedPct: 68 },
      ],
      costCenters: [
        { id: "CC-OPS-001", code: "OPS-001", name: "Operations core", group: "Operations" },
        { id: "CC-SALES-TR", code: "SALES-TRAVEL", name: "Travel", group: "Sales" },
        { id: "CC-FIN-OPS", code: "FIN-OPS", name: "Finance operations", group: "Finance" },
      ],
      invoices: [
        { id: "INV-2026-0017", status: "Overdue", amount: 2400000, group: "Admin", due: now - 2 * 24 * 60 * 60 * 1000 },
        { id: "INV-2026-0018", status: "Sent", amount: 6800000, group: "Operations", due: now + 5 * 24 * 60 * 60 * 1000 },
      ],
      trips: [
        { id: "TR-0442", route: "Office → Airport", rider: "John S.", amount: 82000, time: now - 45 * 60 * 1000 },
        { id: "TR-0443", route: "Office → Client HQ", rider: "Mary N.", amount: 41500, time: now - 3 * 60 * 60 * 1000 },
      ],
      purchases: [
        { id: "PO-9001", marketplace: "MyLiveDealz", vendor: "Shenzhen Store", amount: 2400000, group: "Admin" },
        { id: "PO-9002", marketplace: "EVmart", vendor: "Kampala Office Mart", amount: 1200000, group: "Operations" },
      ],
      vendors: [
        { id: "VN-01", name: "Shenzhen Store", status: "Risk", marketplace: "MyLiveDealz" },
        { id: "VN-02", name: "Kampala Office Mart", status: "Preferred", marketplace: "EVmart" },
        { id: "VN-03", name: "City Courier", status: "OK", marketplace: "ServiceMart" },
      ],
      rfqs: [
        { id: "RFQ-390", title: "Company vehicle", estValue: 285000000, status: "Escalated", module: "Rides & Logistics" },
        { id: "RFQ-402", title: "Bulk EV charging credits", estValue: 8000000, status: "Pending", module: "EVs & Charging" },
      ],
      approvals: [
        { id: "AP-1821", type: "Purchase", amount: 6540000, status: "Pending", module: "E-Commerce" },
        { id: "AP-1902", type: "Budget override", amount: 18000000, status: "Pending", module: "Finance & Payments" },
      ],
    };
  }, []);

  const index = useMemo(() => {
    const items: SearchItem[] = [];

    data.users.forEach((u) =>
      items.push({
        scope: "Users",
        id: u.id,
        title: u.name,
        subtitle: u.email,
        meta: `Group: ${u.group} • Role: ${u.role}`,
        tags: [u.group, u.role],
        raw: u,
      })
    );

    data.groups.forEach((g) =>
      items.push({
        scope: "Groups",
        id: g.id,
        title: g.name,
        subtitle: `Budget: ${formatUGX(g.budget)}`,
        meta: `Used: ${g.usedPct}%`,
        tags: ["Budget"],
        raw: g,
      })
    );

    data.costCenters.forEach((c) =>
      items.push({
        scope: "Cost centers",
        id: c.id,
        title: `${c.code} - ${c.name}`,
        subtitle: `Group: ${c.group}`,
        meta: "Used in exports and chargeback",
        tags: [c.group, "Cost center"],
        raw: c,
      })
    );

    data.invoices.forEach((i) =>
      items.push({
        scope: "Invoices",
        id: i.id,
        title: i.id,
        subtitle: `Status: ${i.status}`,
        meta: `Amount: ${formatUGX(i.amount)} • Due: ${formatDate(i.due)}`,
        tags: [i.status, i.group],
        raw: i,
      })
    );

    data.trips.forEach((t) =>
      items.push({
        scope: "Trips",
        id: t.id,
        title: t.route,
        subtitle: `Rider: ${t.rider}`,
        meta: `Amount: ${formatUGX(t.amount)} • Time: ${formatDate(t.time)}`,
        tags: ["Ride"],
        raw: t,
      })
    );

    data.purchases.forEach((p) =>
      items.push({
        scope: "Purchases",
        id: p.id,
        title: p.id,
        subtitle: `Marketplace: ${p.marketplace}`,
        meta: `Vendor: ${p.vendor} • Amount: ${formatUGX(p.amount)} • Group: ${p.group}`,
        tags: [p.marketplace, p.vendor, p.group],
        raw: p,
      })
    );

    data.vendors.forEach((v) =>
      items.push({
        scope: "Vendors",
        id: v.id,
        title: v.name,
        subtitle: `Marketplace: ${v.marketplace}`,
        meta: `Status: ${v.status}`,
        tags: [v.status, v.marketplace],
        raw: v,
      })
    );

    data.rfqs.forEach((r) =>
      items.push({
        scope: "RFQs",
        id: r.id,
        title: r.title,
        subtitle: `Status: ${r.status}`,
        meta: `Value: ${formatUGX(r.estValue)} • Module: ${r.module}`,
        tags: [r.status, r.module],
        raw: r,
      })
    );

    data.approvals.forEach((a) =>
      items.push({
        scope: "Approvals",
        id: a.id,
        title: a.id,
        subtitle: `Type: ${a.type}`,
        meta: `Amount: ${formatUGX(a.amount)} • Module: ${a.module} • Status: ${a.status}`,
        tags: [a.status, a.module],
        raw: a,
      })
    );

    return items;
  }, [data]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const allowed = Array.from(activeScopes);

    const match = (it: SearchItem) => {
      if (!allowed.includes(it.scope)) return false;
      if (!q) return true;
      const blob = `${it.scope} ${it.id} ${it.title} ${it.subtitle} ${it.meta} ${(it.tags || []).join(" ")}`.toLowerCase();
      return blob.includes(q);
    };

    const grouped: Record<ScopeKey, SearchItem[]> = {
      "Users": [],
      "Groups": [],
      "Cost centers": [],
      "Invoices": [],
      "Trips": [],
      "Purchases": [],
      "Vendors": [],
      "RFQs": [],
      "Approvals": [],
    };

    index.filter(match).forEach((it) => grouped[it.scope].push(it));

    // sort each group a bit
    (Object.keys(grouped) as ScopeKey[]).forEach((k) => {
      grouped[k] = grouped[k].slice(0, 8);
    });

    return grouped;
  }, [index, query, activeScopes]);

  const totalHits = useMemo(() => {
    return Object.values(results).reduce((a, b) => a + b.length, 0);
  }, [results]);

  // Saved searches per role
  const [saved, setSaved] = useState<SavedSearch[]>(() => [
    { id: "SS-001", role: "Accountant", name: "Overdue invoices", query: "overdue", scopes: ["Invoices", "Payments" as any].filter(Boolean) as any },
    { id: "SS-002", role: "Approver", name: "Pending approvals", query: "pending", scopes: ["Approvals", "RFQs"] },
    { id: "SS-003", role: "Org Admin", name: "Vendor risk", query: "risk", scopes: ["Vendors", "Purchases"] },
  ]);

  // Fix invalid scope in seed (Payments does not exist)
  useEffect(() => {
    setSaved((prev) =>
      prev.map((s) => ({
        ...s,
        scopes: s.scopes.filter((x) => scopesAll.includes(x as any)) as ScopeKey[],
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const savedForRole = useMemo(() => saved.filter((s) => s.role === role), [saved, role]);

  const openSave = () => {
    const name = query.trim() ? `Search: ${query.trim()}` : "My search";
    setSaveName(name);
    setSaveOpen(true);
  };

  const saveSearch = () => {
    const n = saveName.trim();
    if (!n) {
      toast({ title: "Missing name", message: "Enter a name for the saved search.", kind: "warn" });
      return;
    }
    const s: SavedSearch = {
      id: uid("SS"),
      role,
      name: n,
      query,
      scopes: Array.from(activeScopes),
    };
    setSaved((p) => [s, ...p]);
    setSaveOpen(false);
    toast({ title: "Saved", message: `Saved search for ${role}.`, kind: "success" });
  };

  const applySaved = (s: SavedSearch) => {
    setQuery(s.query);
    setActiveScopes(new Set(s.scopes));
    toast({ title: "Applied", message: `Applied saved search: ${s.name}`, kind: "success" });
  };

  const deleteSaved = (id: string) => {
    setSaved((p) => p.filter((x) => x.id !== id));
    toast({ title: "Deleted", message: "Saved search removed.", kind: "info" });
  };

  // Audit-friendly action prompts
  const openAction = (k: ActionKind) => {
    setActionKind(k);
    setReason("");
    setConfirmAck(false);
    setActionOpen(true);
  };

  const requireReasonOk = useMemo(() => {
    return reason.trim().length >= 8 && confirmAck;
  }, [reason, confirmAck]);

  const performAction = () => {
    if (!actionKind) return;
    if (!requireReasonOk) {
      toast({ title: "Reason required", message: "Add a clear reason and confirm acknowledgement.", kind: "warn" });
      return;
    }

    if (actionKind === "rfq") {
      toast({ title: "RFQ created", message: `${rfqDraft.title} • ${formatUGX(rfqDraft.estValue)}`, kind: "success" });
    }

    if (actionKind === "budget") {
      toast({ title: "Budget issued", message: `${budgetDraft.group}: ${formatUGX(budgetDraft.amount)} (${budgetDraft.period})`, kind: "success" });
    }

    if (actionKind === "freeze") {
      toast({ title: "CorporatePay frozen", message: `${freezeDraft.mode} • Notifications: ${freezeDraft.notifyUsers ? "On" : "Off"}`, kind: "warn" });
    }

    if (actionKind === "export") {
      toast({ title: "Report exported", message: `${exportDraft.month} • ${exportDraft.format}`, kind: "success" });
    }

    setActionOpen(false);
  };

  const copyAuditPreview = async () => {
    const payload = {
      action: actionKind,
      reason,
      actorRole: role,
      createdAt: new Date().toISOString(),
      draft: actionKind === "rfq" ? rfqDraft : actionKind === "budget" ? budgetDraft : actionKind === "freeze" ? freezeDraft : exportDraft,
    };
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast({ title: "Copied", message: "Audit preview copied.", kind: "success" });
    } catch {
      toast({ title: "Copy failed", message: "Copy manually.", kind: "warn" });
    }
  };

  // Command palette and operator shortcuts
  const commands: Command[] = useMemo(() => {
    return [
      {
        id: "cmd_rfq",
        label: "Create RFQ",
        description: "Request a quote for high-value assets",
        shortcut: "A R",
        group: "Quick actions",
        run: () => openAction("rfq"),
      },
      {
        id: "cmd_budget",
        label: "Issue budget",
        description: "Allocate budget to a group",
        shortcut: "A B",
        group: "Quick actions",
        run: () => openAction("budget"),
      },
      {
        id: "cmd_freeze",
        label: "Freeze CorporatePay",
        description: "Pause CorporatePay at checkout",
        shortcut: "A F",
        group: "Quick actions",
        run: () => openAction("freeze"),
      },
      {
        id: "cmd_export",
        label: "Export month report",
        description: "Export spend and approvals report",
        shortcut: "A E",
        group: "Quick actions",
        run: () => openAction("export"),
      },
      {
        id: "nav_dashboard",
        label: "Go to Corporate Dashboard",
        description: "Open the dashboard",
        shortcut: "G D",
        group: "Navigate",
        run: () => toast({ title: "Navigate", message: "Opening Corporate Dashboard (demo).", kind: "info" }),
      },
      {
        id: "nav_approvals",
        label: "Go to Approvals Inbox",
        description: "Open approvals queue",
        shortcut: "G A",
        group: "Navigate",
        run: () => toast({ title: "Navigate", message: "Opening Approvals Inbox (demo).", kind: "info" }),
      },
      {
        id: "tool_save",
        label: "Save this search",
        description: "Save current query and scopes",
        shortcut: "S",
        group: "Tools",
        run: () => openSave(),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, actionKind, reason, rfqDraft, budgetDraft, freezeDraft, exportDraft, query, activeScopes]);

  const filteredCommands = useMemo(() => {
    const q = paletteQuery.trim().toLowerCase();
    const list = !q
      ? commands
      : commands.filter((c) => `${c.label} ${c.description} ${c.group} ${c.shortcut}`.toLowerCase().includes(q));
    // group order: Quick actions, Navigate, Tools
    const order = (g: Command["group"]) => (g === "Quick actions" ? 0 : g === "Navigate" ? 1 : 2);
    return [...list].sort((a, b) => {
      const oa = order(a.group);
      const ob = order(b.group);
      if (oa !== ob) return oa - ob;
      return a.label.localeCompare(b.label);
    });
  }, [commands, paletteQuery]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes("mac");
      const meta = isMac ? e.metaKey : e.ctrlKey;

      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(true);
        setPaletteQuery("");
        setPaletteIndex(0);
        window.setTimeout(() => paletteInputRef.current?.focus(), 50);
      }

      if (!paletteOpen && e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }

      if (paletteOpen) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setPaletteIndex((i) => clamp(i + 1, 0, Math.max(0, filteredCommands.length - 1)));
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setPaletteIndex((i) => clamp(i - 1, 0, Math.max(0, filteredCommands.length - 1)));
        }
        if (e.key === "Enter") {
          e.preventDefault();
          const c = filteredCommands[paletteIndex];
          if (c) {
            setPaletteOpen(false);
            c.run();
          }
        }
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, filteredCommands, paletteIndex]);

  const toggleScope = (s: ScopeKey) => {
    setActiveScopes((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  };

  const resetScopes = () => {
    setActiveScopes(new Set(scopesAll));
    toast({ title: "Scopes reset", message: "Searching across all entities.", kind: "info" });
  };

  const groupedResultCards = useMemo(() => {
    const order: ScopeKey[] = scopesAll;
    return order
      .filter((k) => results[k].length > 0)
      .map((k) => ({ scope: k, items: results[k] }));
  }, [results]);

  const scopeIcon = (s: ScopeKey) => {
    switch (s) {
      case "Users":
        return <Users className="h-4 w-4" />;
      case "Groups":
        return <Layers className="h-4 w-4" />;
      case "Cost centers":
        return <Hash className="h-4 w-4" />;
      case "Invoices":
        return <FileText className="h-4 w-4" />;
      case "Trips":
        return <MapPin className="h-4 w-4" />;
      case "Purchases":
        return <Package className="h-4 w-4" />;
      case "Vendors":
        return <Store className="h-4 w-4" />;
      case "RFQs":
        return <Ticket className="h-4 w-4" />;
      case "Approvals":
        return <BadgeCheck className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))",
      }}
    >
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />

      {/* Command palette */}
      <Modal
        open={paletteOpen}
        title="Command Center"
        subtitle="Type to search commands. Use arrow keys and Enter."
        onClose={() => setPaletteOpen(false)}
        footer={
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Tip: use Ctrl+K (or Cmd+K) to open. Use / to focus search.
            </div>
            <Button variant="outline" onClick={() => setPaletteOpen(false)}>
              Close
            </Button>
          </div>
        }
        maxW="760px"
      >
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-emerald-100">
            <Command className="h-4 w-4 text-slate-500" />
            <input
              ref={paletteInputRef}
              value={paletteQuery}
              onChange={(e) => {
                setPaletteQuery(e.target.value);
                setPaletteIndex(0);
              }}
              placeholder="Search commands or pages..."
              className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="max-h-[420px] overflow-auto">
              {filteredCommands.length ? (
                <div className="divide-y divide-slate-100">
                  {filteredCommands.map((c, idx) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setPaletteOpen(false);
                        c.run();
                      }}
                      className={cn(
                        "flex w-full items-start justify-between gap-3 px-4 py-3 text-left",
                        idx === paletteIndex ? "bg-emerald-50" : "hover:bg-slate-50"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-semibold text-slate-900">{c.label}</div>
                          <Pill label={c.group} tone={c.group === "Quick actions" ? "info" : "neutral"} />
                        </div>
                        <div className="mt-1 text-xs text-slate-600">{c.description}</div>
                      </div>
                      <div className="shrink-0 rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-700">
                        {c.shortcut}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-sm text-slate-600">No commands found.</div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      <div className="mx-auto max-w-[1400px] px-4 py-6 md:px-6">
        <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.12)]">
          {/* Header */}
          <div className="border-b border-slate-200 bg-white px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <Command className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Global Search and Command Center</div>
                  <div className="mt-1 text-xs text-slate-500">Search users, invoices, vendors, RFQs, approvals and more. Run audited admin actions.</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Role: ${role}`} tone="info" />
                    <Pill label={`Hits: ${totalHits}`} tone={totalHits ? "good" : "neutral"} />
                    <Pill label={operatorMode ? "Operator mode: On" : "Operator mode: Off"} tone={operatorMode ? "warn" : "neutral"} />
                    <Pill label="Ctrl+K" tone="neutral" />
                    <Pill label="/" tone="neutral" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2">
                  <div className="text-xs font-semibold text-slate-600">Role</div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-2 py-1 text-xs font-semibold text-slate-900 outline-none"
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                <button
                  type="button"
                  className={cn(
                    "rounded-2xl border px-3 py-2 text-sm font-semibold",
                    operatorMode ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  )}
                  onClick={() => {
                    setOperatorMode((v) => !v);
                    toast({ title: "Operator mode", message: operatorMode ? "Disabled" : "Enabled", kind: "info" });
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Operator mode
                </button>

                <Button variant="outline" onClick={() => { setPaletteOpen(true); setPaletteQuery(""); setPaletteIndex(0); window.setTimeout(() => paletteInputRef.current?.focus(), 50); }}>
                  <Command className="h-4 w-4" /> Open commands
                </Button>

                <Button variant="primary" onClick={openSave}>
                  <BookMarked className="h-4 w-4" /> Save search
                </Button>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Left rail */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Quick actions</div>
                      <div className="mt-1 text-xs text-slate-500">Audit-friendly confirmation and reason prompts.</div>
                    </div>
                    <Pill label="Audited" tone="info" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
                    <QuickActionCard
                      icon={<Ticket className="h-4 w-4" />}
                      title="Create RFQ"
                      desc="High-value assets and quotes"
                      shortcut={operatorMode ? "A R" : undefined}
                      onClick={() => openAction("rfq")}
                    />
                    <QuickActionCard
                      icon={<PiggyBank className="h-4 w-4" />}
                      title="Issue budget"
                      desc="Allocate group budget"
                      shortcut={operatorMode ? "A B" : undefined}
                      onClick={() => openAction("budget")}
                    />
                    <QuickActionCard
                      icon={<Snowflake className="h-4 w-4" />}
                      title="Freeze CorporatePay"
                      desc="Pause CorporatePay at checkout"
                      shortcut={operatorMode ? "A F" : undefined}
                      onClick={() => openAction("freeze")}
                    />
                    <QuickActionCard
                      icon={<Download className="h-4 w-4" />}
                      title="Export month report"
                      desc="CSV, PDF, JSON"
                      shortcut={operatorMode ? "A E" : undefined}
                      onClick={() => openAction("export")}
                    />
                  </div>
                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Premium: actions include reason prompts and audit preview. Sensitive actions can require dual approval.
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Saved searches</div>
                      <div className="mt-1 text-xs text-slate-500">Premium: saved searches per role.</div>
                    </div>
                    <Pill label={`${savedForRole.length}`} tone="neutral" />
                  </div>
                  <div className="mt-3 space-y-2">
                    {savedForRole.length ? (
                      savedForRole.map((s) => (
                        <div key={s.id} className="rounded-2xl border border-slate-200 bg-white p-3">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              className="min-w-0 text-left"
                              onClick={() => applySaved(s)}
                            >
                              <div className="truncate text-sm font-semibold text-slate-900">{s.name}</div>
                              <div className="mt-1 text-xs text-slate-500">Query: {s.query || "(none)"}</div>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {s.scopes.slice(0, 4).map((sc) => (
                                  <Pill key={sc} label={sc} tone="neutral" />
                                ))}
                                {s.scopes.length > 4 ? <Pill label={`+${s.scopes.length - 4}`} tone="neutral" /> : null}
                              </div>
                            </button>
                            <div className="flex flex-col gap-2">
                              <Button variant="outline" className="px-3 py-2 text-xs" onClick={() => applySaved(s)}>
                                Apply
                              </Button>
                              <Button variant="danger" className="px-3 py-2 text-xs" onClick={() => deleteSaved(s.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-6 text-center">
                        <div className="mx-auto grid h-10 w-10 place-items-center rounded-2xl bg-slate-100 text-slate-700">
                          <BookMarked className="h-5 w-5" />
                        </div>
                        <div className="mt-3 text-sm font-semibold text-slate-900">No saved searches</div>
                        <div className="mt-1 text-sm text-slate-600">Save your first search for this role.</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Operator shortcuts</div>
                      <div className="mt-1 text-xs text-slate-500">Premium: power-user shortcuts.</div>
                    </div>
                    <Pill label={operatorMode ? "On" : "Off"} tone={operatorMode ? "warn" : "neutral"} />
                  </div>
                  <div className="mt-3 space-y-2 text-sm">
                    <ShortcutRow k="Ctrl+K" v="Open commands" />
                    <ShortcutRow k="/" v="Focus search" />
                    <ShortcutRow k="A R" v="Create RFQ" />
                    <ShortcutRow k="A B" v="Issue budget" />
                    <ShortcutRow k="A F" v="Freeze CorporatePay" />
                    <ShortcutRow k="A E" v="Export month report" />
                  </div>
                  <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                    Operator shortcuts are shown in the command palette. Run actions with audit prompts.
                  </div>
                </div>
              </div>

              {/* Main */}
              <div className="lg:col-span-8 space-y-4">
                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Search</div>
                      <div className="mt-1 text-xs text-slate-500">Users, groups, cost centers, invoices, trips, purchases, vendors, RFQs, approvals.</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={resetScopes}>
                        <Filter className="h-4 w-4" /> Scopes: All
                      </Button>
                      <Button variant="outline" onClick={() => { setQuery(""); toast({ title: "Cleared", message: "Search cleared.", kind: "info" }); }}>
                        <X className="h-4 w-4" /> Clear
                      </Button>
                      <Button variant="primary" onClick={() => { setPaletteOpen(true); setPaletteQuery(""); setPaletteIndex(0); window.setTimeout(() => paletteInputRef.current?.focus(), 50); }}>
                        <Command className="h-4 w-4" /> Commands
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm focus-within:ring-4 focus-within:ring-emerald-100">
                    <Search className="h-4 w-4 text-slate-500" />
                    <input
                      ref={searchRef}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search across the whole corporate account..."
                      className="w-full bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
                    />
                    <span className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">/</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {scopesAll.map((s) => {
                      const on = activeScopes.has(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleScope(s)}
                          className={cn(
                            "flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold ring-1 transition",
                            on ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-slate-700 ring-slate-200 hover:bg-slate-50"
                          )}
                          style={on ? { background: EVZ.green } : undefined}
                        >
                          <span className={cn("text-white", !on && "text-slate-600")}>
                            {scopeIcon(s)}
                          </span>
                          {s}
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                    Tip: use saved searches per role for common workflows. Use command center for actions.
                  </div>
                </div>

                <div className="space-y-4">
                  {groupedResultCards.length ? (
                    groupedResultCards.map((g) => (
                      <ResultGroup
                        key={g.scope}
                        scope={g.scope}
                        items={g.items}
                        onOpen={(it) => setDetail(it)}
                      />
                    ))
                  ) : (
                    <Empty title="No results" subtitle="Try a different query or enable more scopes." />
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium: audit-friendly actions</div>
                      <div className="mt-1 text-xs text-slate-500">Every destructive action requires a reason and produces an audit preview.</div>
                    </div>
                    <Pill label="Always on" tone="good" />
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
                    <ExplainCard title="Reason" value="Why are you performing this action?" />
                    <ExplainCard title="Scope" value="Which org, group, or module is affected?" />
                    <ExplainCard title="Audit" value="Audit ID is created and visible to Admins." />
                  </div>
                </div>

                <div className="text-xs text-slate-500">
                  C Global Search v2: unified search across all entities, premium saved searches per role, operator shortcuts, and audited quick actions.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detail drawer */}
      <Drawer
        open={!!detail}
        title={detail ? `${detail.scope}: ${detail.title}` : ""}
        subtitle={detail ? `${detail.id} • ${detail.subtitle}` : ""}
        onClose={() => setDetail(null)}
        footer={
          detail ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs text-slate-600">Tags: {(detail.tags || []).slice(0, 4).join(", ") || "-"}</div>
              <Button variant="primary" onClick={() => toast({ title: "Open", message: `Opening ${detail.id} (demo).`, kind: "info" })}>
                <ChevronRight className="h-4 w-4" /> Open
              </Button>
            </div>
          ) : null
        }
      >
        {detail ? (
          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Summary</div>
                  <div className="mt-2 text-sm text-slate-700">{detail.meta}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Pill label={detail.scope} tone="info" />
                    <Pill label={detail.id} tone="neutral" />
                  </div>
                </div>
                <Button variant="outline" onClick={() => toast({ title: "Copy", message: "Copied ID (demo).", kind: "success" })}>
                  <Copy className="h-4 w-4" /> Copy ID
                </Button>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Raw data</div>
              <pre className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(detail.raw, null, 2)}
              </pre>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                In production, this panel respects role permissions and redacts sensitive fields.
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>

      {/* Save search modal */}
      <Modal
        open={saveOpen}
        title="Save search"
        subtitle="Premium: saved searches per role"
        onClose={() => setSaveOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveSearch}>
              <BookMarked className="h-4 w-4" /> Save
            </Button>
          </div>
        }
        maxW="780px"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs font-semibold text-slate-600">Name</div>
            <input
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
            />
            <div className="mt-2 text-xs text-slate-500">Saved under role: {role}</div>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-semibold text-slate-600">Preview</div>
            <div className="mt-2 text-sm font-semibold text-slate-900">Query: {query || "(none)"}</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Array.from(activeScopes).slice(0, 6).map((s) => (
                <Pill key={s} label={s} tone="neutral" />
              ))}
              {activeScopes.size > 6 ? <Pill label={`+${activeScopes.size - 6}`} tone="neutral" /> : null}
            </div>
          </div>
        </div>
      </Modal>

      {/* Action modal (audited) */}
      <Modal
        open={actionOpen}
        title={
          actionKind === "rfq"
            ? "Create RFQ"
            : actionKind === "budget"
              ? "Issue budget"
              : actionKind === "freeze"
                ? "Freeze CorporatePay"
                : actionKind === "export"
                  ? "Export month report"
                  : "Action"
        }
        subtitle="Audit-friendly confirmation and reason prompt"
        onClose={() => setActionOpen(false)}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
            <Button variant="outline" onClick={() => setActionOpen(false)}>Cancel</Button>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" onClick={copyAuditPreview}>
                <Copy className="h-4 w-4" /> Copy audit preview
              </Button>
              <Button variant={actionKind === "freeze" ? "danger" : "primary"} onClick={performAction} disabled={!requireReasonOk}>
                <Check className="h-4 w-4" /> Confirm
              </Button>
            </div>
          </div>
        }
        maxW="980px"
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            {actionKind === "rfq" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">RFQ details</div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FieldRow label="Title" value={rfqDraft.title} onChange={(v) => setRfqDraft((p) => ({ ...p, title: v }))} placeholder="RFQ title" />
                  <SelectRow label="Service Module" value={rfqDraft.module} onChange={(v) => setRfqDraft((p) => ({ ...p, module: v }))} options={[...SERVICE_MODULES]} />
                  <SelectRow label="Marketplace" value={rfqDraft.marketplace} onChange={(v) => setRfqDraft((p) => ({ ...p, marketplace: v }))} options={["All", ...MARKETPLACES]} />
                  <FieldRow label="Needed by" value={rfqDraft.neededBy} onChange={(v) => setRfqDraft((p) => ({ ...p, neededBy: v }))} placeholder="YYYY-MM-DD" />
                  <NumberRow label="Estimated value (UGX)" value={rfqDraft.estValue} onChange={(v) => setRfqDraft((p) => ({ ...p, estValue: v }))} />
                  <ToggleRow label="Attachments" value={rfqDraft.attachments} onChange={(v) => setRfqDraft((p) => ({ ...p, attachments: v }))} />
                  <div className="md:col-span-2">
                    <div className="text-xs font-semibold text-slate-600">Description</div>
                    <textarea
                      value={rfqDraft.description}
                      onChange={(e) => setRfqDraft((p) => ({ ...p, description: e.target.value }))}
                      rows={4}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none"
                    />
                  </div>
                </div>
                <div className="mt-3 rounded-2xl bg-amber-50 p-3 text-xs text-amber-900 ring-1 ring-amber-200">
                  RFQs are routed to approvals and can use milestone payments after quote approval.
                </div>
              </div>
            ) : null}

            {actionKind === "budget" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Budget details</div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectRow label="Group" value={budgetDraft.group} onChange={(v) => setBudgetDraft((p) => ({ ...p, group: v }))} options={["Operations", "Sales", "Finance", "Admin", "Procurement"]} />
                  <SelectRow label="Period" value={budgetDraft.period} onChange={(v) => setBudgetDraft((p) => ({ ...p, period: v }))} options={["Weekly", "Monthly", "Quarterly", "Annual"]} />
                  <NumberRow label="Amount (UGX)" value={budgetDraft.amount} onChange={(v) => setBudgetDraft((p) => ({ ...p, amount: v }))} />
                  <ToggleRow label="Hard cap" value={budgetDraft.hardCap} onChange={(v) => setBudgetDraft((p) => ({ ...p, hardCap: v }))} />
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  Premium: large budget changes can require approvals.
                </div>
              </div>
            ) : null}

            {actionKind === "freeze" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Freeze details</div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <SelectRow label="Mode" value={freezeDraft.mode} onChange={(v) => setFreezeDraft((p) => ({ ...p, mode: v }))} options={["Soft pause", "Full stop"]} />
                  <SelectRow label="Scope" value={freezeDraft.scope} onChange={(v) => setFreezeDraft((p) => ({ ...p, scope: v }))} options={["CorporatePay only", "All services and purchases"]} />
                  <ToggleRow label="Notify users" value={freezeDraft.notifyUsers} onChange={(v) => setFreezeDraft((p) => ({ ...p, notifyUsers: v }))} />
                </div>
                <div className="mt-3 rounded-2xl bg-rose-50 p-3 text-xs text-rose-800 ring-1 ring-rose-200">
                  Freeze is a sensitive action. Consider dual approval for full stop.
                </div>
              </div>
            ) : null}

            {actionKind === "export" ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <div className="text-sm font-semibold text-slate-900">Export details</div>
                <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FieldRow label="Month" value={exportDraft.month} onChange={(v) => setExportDraft((p) => ({ ...p, month: v }))} placeholder="YYYY-MM" />
                  <SelectRow label="Format" value={exportDraft.format} onChange={(v) => setExportDraft((p) => ({ ...p, format: v }))} options={["CSV", "PDF", "JSON"]} />
                  <SelectRow label="Breakdown" value={exportDraft.breakdown} onChange={(v) => setExportDraft((p) => ({ ...p, breakdown: v }))} options={["Group + Module + Marketplace", "Group only", "Vendor only", "Approvals only"]} />
                </div>
                <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                  Premium: scheduled exports can be configured in Integrations.
                </div>
              </div>
            ) : null}

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Reason and acknowledgement</div>
              <div className="mt-2 text-xs text-slate-500">Reason is required for audit logs. Keep it specific.</div>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Example: RFQ needed for vehicle procurement; monthly budget not sufficient; CFO approval requested"
                rows={4}
                className="mt-3 w-full rounded-2xl border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-900 outline-none focus:ring-4 focus:ring-emerald-100"
              />
              <label className="mt-3 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                <input
                  type="checkbox"
                  checked={confirmAck}
                  onChange={(e) => setConfirmAck(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300"
                />
                <div className="text-sm font-semibold text-slate-800">
                  I confirm this action is authorized and will be audit logged.
                </div>
              </label>
              <div className="mt-2 text-xs text-slate-500">Minimum reason length: 8 characters.</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-slate-900">Audit preview</div>
                  <div className="mt-1 text-xs text-slate-500">This is the record that would be stored.</div>
                </div>
                <Pill label="Preview" tone="info" />
              </div>
              <pre className="mt-3 max-h-[360px] overflow-auto rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-800">
                {JSON.stringify(
                  {
                    action: actionKind,
                    actorRole: role,
                    at: new Date().toISOString(),
                    reason,
                    draft:
                      actionKind === "rfq"
                        ? rfqDraft
                        : actionKind === "budget"
                          ? budgetDraft
                          : actionKind === "freeze"
                            ? freezeDraft
                            : exportDraft,
                  },
                  null,
                  2
                )}
              </pre>
              <div className="mt-3 rounded-2xl bg-slate-50 p-3 text-xs text-slate-600">
                Premium: map this to immutable audit log IDs and include policy version.
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Safety tips</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> Use group-level budgets before user caps.</li>
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.orange }} /> For freezing, notify users to avoid disruptions.</li>
                <li className="flex items-start gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full" style={{ background: EVZ.green }} /> For RFQs, attach specs and required documents.</li>
              </ul>
            </div>
          </div>
        </div>
      </Modal>

      <footer className="border-t border-slate-200 bg-white/60 py-6">
        <div className="mx-auto max-w-[1400px] px-4 text-xs text-slate-500 md:px-6">
          C Global Search & Command Center v2: unified search + premium saved searches per role + operator shortcuts + audited quick actions.
        </div>
      </footer>
    </div>
  );
}

function ResultGroup({
  scope,
  items,
  onOpen,
}: {
  scope: ScopeKey;
  items: SearchItem[];
  onOpen: (it: SearchItem) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-slate-600">{scopeIcon(scope)}</span>
          <div>
            <div className="text-sm font-semibold text-slate-900">{scope}</div>
            <div className="mt-1 text-xs text-slate-500">Top matches</div>
          </div>
        </div>
        <Pill label={`${items.length}`} tone="neutral" />
      </div>

      <div className="mt-3 space-y-2">
        {items.map((it) => (
          <button
            key={it.id}
            type="button"
            onClick={() => onOpen(it)}
            className="w-full rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-slate-900">{it.title}</div>
                <div className="mt-1 text-xs text-slate-500">{it.subtitle}</div>
                <div className="mt-2 text-xs text-slate-600">{it.meta}</div>
              </div>
              <ChevronRight className="mt-1 h-5 w-5 text-slate-400" />
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {(it.tags || []).slice(0, 4).map((t) => (
                <Pill key={t} label={t} tone="neutral" />
              ))}
              {(it.tags || []).length > 4 ? <Pill label={`+${(it.tags || []).length - 4}`} tone="neutral" /> : null}
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  function scopeIcon(s: ScopeKey) {
    switch (s) {
      case "Users":
        return <Users className="h-4 w-4" />;
      case "Groups":
        return <Layers className="h-4 w-4" />;
      case "Cost centers":
        return <Hash className="h-4 w-4" />;
      case "Invoices":
        return <FileText className="h-4 w-4" />;
      case "Trips":
        return <MapPin className="h-4 w-4" />;
      case "Purchases":
        return <Package className="h-4 w-4" />;
      case "Vendors":
        return <Store className="h-4 w-4" />;
      case "RFQs":
        return <Ticket className="h-4 w-4" />;
      case "Approvals":
        return <BadgeCheck className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  }
}

function QuickActionCard({
  icon,
  title,
  desc,
  shortcut,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  shortcut?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left hover:bg-slate-50"
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-slate-600">{icon}</span>
        <div>
          <div className="text-sm font-semibold text-slate-900">{title}</div>
          <div className="mt-1 text-xs text-slate-500">{desc}</div>
        </div>
      </div>
      {shortcut ? (
        <span className="shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">
          {shortcut}
        </span>
      ) : (
        <ChevronRight className="mt-0.5 h-5 w-5 text-slate-400" />
      )}
    </button>
  );
}

function ShortcutRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2">
      <span className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700">{k}</span>
      <span className="text-sm font-semibold text-slate-800">{v}</span>
    </div>
  );
}

function ExplainCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="text-xs font-semibold text-slate-600">{title}</div>
      <div className="mt-2 text-sm font-semibold text-slate-900">{value}</div>
    </div>
  );
}

function Empty({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-700">
        <Search className="h-6 w-6" />
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <div className="mt-1 text-sm text-slate-600">{subtitle}</div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
      />
    </div>
  );
}

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value || 0))}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
      />
    </div>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div>
      <div className="text-xs font-semibold text-slate-600">{label}</div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none"
      >
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="mt-1 text-xs text-slate-600">{value ? "On" : "Off"}</div>
        </div>
        <button
          type="button"
          className={cn(
            "relative h-7 w-12 rounded-full border transition",
            value ? "border-emerald-300 bg-emerald-200" : "border-slate-200 bg-white"
          )}
          onClick={() => onChange(!value)}
          aria-label={label}
        >
          <span
            className={cn(
              "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition",
              value ? "left-[22px]" : "left-1"
            )}
          />
        </button>
      </div>
    </div>
  );
}

function scopeIcon(scope: ScopeKey) {
  switch (scope) {
    case "Users":
      return <Users className="h-4 w-4" />;
    case "Groups":
      return <Layers className="h-4 w-4" />;
    case "Cost centers":
      return <Hash className="h-4 w-4" />;
    case "Invoices":
      return <FileText className="h-4 w-4" />;
    case "Trips":
      return <MapPin className="h-4 w-4" />;
    case "Purchases":
      return <Package className="h-4 w-4" />;
    case "Vendors":
      return <Store className="h-4 w-4" />;
    case "RFQs":
      return <Ticket className="h-4 w-4" />;
    case "Approvals":
      return <BadgeCheck className="h-4 w-4" />;
    default:
      return <Search className="h-4 w-4" />;
  }
}
