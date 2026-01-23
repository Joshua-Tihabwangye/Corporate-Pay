import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  BadgeCheck,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  FileText,
  Filter,
  Info,
  Link as LinkIcon,
  RefreshCcw,
  Search,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  X,
} from "lucide-react";

const EVZ = { green: "#03CD8C", orange: "#F77F00" };

type Currency = "UGX" | "USD" | "CNY" | "KES";

type OrgRole = "Viewer" | "Member" | "Approver" | "Finance" | "Admin" | "Owner";

type Org = { id: string; name: string; role: OrgRole };

type Tx = {
  id: string;
  when: string;
  type: "Payment" | "Payout" | "Refund" | "Deposit" | "FX";
  module: string;
  currency: Currency;
  amount: number;
  internalRef: string;
  providerRef?: string;
  status: "Posted" | "Pending" | "Reversed";
};

type InvoiceLine = {
  id: string;
  invoiceId: string;
  vendor: string;
  currency: Currency;
  amount: number;
  due: string;
  status: "Open" | "Paid" | "Partial" | "Refund pending";
  description: string;
};

type MatchState = "Matched" | "Unmatched" | "Duplicate" | "Needs review";

type Match = {
  id: string;
  txId: string;
  lineId: string;
  state: MatchState;
  confidence: number;
  reason: string;
  createdAt: string;
};

type AutoRule = {
  id: string;
  name: string;
  enabled: boolean;
  logic: string;
  note: string;
};

type ERPMap = {
  id: string;
  erp: "SAP" | "Odoo" | "QuickBooks" | "Xero" | "Custom";
  object: "GL account" | "Cost center" | "Vendor" | "Tax code";
  from: string;
  to: string;
  note: string;
  lastEdited: string;
};

type Audit = {
  id: string;
  when: string;
  actor: string;
  action: string;
  target: string;
  outcome: "Success" | "Blocked";
  why: string;
};

type Filters = {
  q: string;
  state: "ALL" | MatchState;
  currency: "ALL" | Currency;
  module: "ALL" | string;
  minConfidence: number;
};

type Toast = { id: string; title: string; message?: string; kind: "success" | "warn" | "error" | "info" };

function cn(...p: Array<string | false | null | undefined>) {
  return p.filter(Boolean).join(" ");
}
function uid(prefix = "id") {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}
function formatMoney(amount: number, currency: Currency) {
  const abs = Math.abs(amount);
  const isUGX = currency === "UGX";
  const decimals = isUGX ? 0 : 2;
  const num = abs.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const sign = amount < 0 ? "-" : "";
  return `${sign}${currency} ${num}`;
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

function toneForState(s: MatchState) {
  if (s === "Matched") return "good" as const;
  if (s === "Unmatched") return "warn" as const;
  if (s === "Duplicate") return "bad" as const;
  return "info" as const;
}

function toneForConfidence(c: number) {
  if (c >= 90) return "good" as const;
  if (c >= 70) return "info" as const;
  if (c >= 50) return "warn" as const;
  return "bad" as const;
}

function Button({
  variant = "outline",
  children,
  onClick,
  disabled,
  className,
  title,
}: {
  variant?: "primary" | "accent" | "outline" | "ghost" | "danger";
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
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
    <button type="button" title={title} disabled={disabled} onClick={onClick} style={style} className={cn(base, variants[variant], disabled && "cursor-not-allowed opacity-60", className)}>
      {children}
    </button>
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
          >
            <div className="flex items-start gap-3">
              <div className={cn("mt-0.5 grid h-9 w-9 place-items-center rounded-2xl", t.kind === "success" ? "bg-emerald-50 text-emerald-700" : t.kind === "warn" ? "bg-amber-50 text-amber-800" : t.kind === "error" ? "bg-rose-50 text-rose-700" : "bg-blue-50 text-blue-700")}>
                {t.kind === "warn" || t.kind === "error" ? <AlertTriangle className="h-5 w-5" /> : <BadgeCheck className="h-5 w-5" />}
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
    const onKey = (e: KeyboardEvent) => (e.key === "Escape" ? onClose() : null);
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/35" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.div
            initial={{ x: 30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 30, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-y-0 right-0 z-50 w-full max-w-[560px] overflow-hidden border-l border-slate-200 bg-white shadow-[0_20px_70px_rgba(2,8,23,0.22)]"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div className="min-w-0">
                <div className="text-base font-semibold text-slate-900">{title}</div>
                {subtitle ? <div className="mt-1 truncate text-sm text-slate-600">{subtitle}</div> : null}
              </div>
              <button className="rounded-2xl p-2 text-slate-600 hover:bg-slate-100" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="h-[calc(100vh-140px)] overflow-auto px-5 py-4">{children}</div>
            {footer ? <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">{footer}</div> : null}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: Array<{ value: string; label: string }> }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-4 focus:ring-emerald-100"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

export default function ReconciliationERPMapping() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (t: Omit<Toast, "id">) => {
    const id = uid("toast");
    setToasts((p) => [{ id, ...t }, ...p].slice(0, 4));
    window.setTimeout(() => setToasts((p) => p.filter((x) => x.id !== id)), 3200);
  };

  const orgs = useMemo<Org[]>(
    () => [
      { id: "org_acme", name: "Acme Group Ltd", role: "Finance" },
      { id: "org_khl", name: "Kampala Holdings", role: "Viewer" },
    ],
    []
  );

  const [orgId, setOrgId] = useState(orgs[0].id);
  const org = useMemo(() => orgs.find((o) => o.id === orgId) || orgs[0], [orgs, orgId]);
  const canOperate = useMemo(() => ["Owner", "Admin", "Finance"].includes(org.role), [org.role]);

  const txs = useMemo<Tx[]>(
    () => [
      { id: "TX-9006", when: "Today 08:00", type: "Payment", module: "CorporatePay", currency: "UGX", amount: -540000, internalRef: "EVZ-INT-9006", providerRef: "PRV-7006", status: "Posted" },
      { id: "TX-9005", when: "Today 06:40", type: "Payout", module: "Wallet", currency: "UGX", amount: -280000, internalRef: "EVZ-PO-3101", providerRef: "PRV-87911", status: "Posted" },
      { id: "TX-9004", when: "Yesterday", type: "Deposit", module: "Wallet", currency: "CNY", amount: 820, internalRef: "EVZ-INT-9004", providerRef: "PRV-7004", status: "Posted" },
      { id: "TX-9008", when: "2 days ago", type: "Refund", module: "E-Commerce", currency: "UGX", amount: 42000, internalRef: "EVZ-INT-9008", providerRef: "PRV-7008", status: "Pending" },
    ],
    []
  );

  const lines = useMemo<InvoiceLine[]>(
    () => [
      { id: "L-1001", invoiceId: "INV-7001", vendor: "Acme Supplies", currency: "UGX", amount: 540000, due: "Today", status: "Open", description: "EV connectors + installation" },
      { id: "L-1002", invoiceId: "INV-7002", vendor: "Payroll", currency: "UGX", amount: 280000, due: "Today", status: "Paid", description: "Staff payout" },
      { id: "L-1003", invoiceId: "INV-7003", vendor: "Marketplace", currency: "UGX", amount: 42000, due: "Tomorrow", status: "Refund pending", description: "Refund case" },
    ],
    []
  );

  const [matches, setMatches] = useState<Match[]>([
    { id: "M-1", txId: "TX-9006", lineId: "L-1001", state: "Needs review", confidence: 78, reason: "Amount matches, vendor name partial match", createdAt: "Today" },
    { id: "M-2", txId: "TX-9005", lineId: "L-1002", state: "Matched", confidence: 96, reason: "Exact reference match", createdAt: "Today" },
    { id: "M-3", txId: "TX-9008", lineId: "L-1003", state: "Unmatched", confidence: 42, reason: "Refund is pending in provider", createdAt: "2 days ago" },
  ]);

  const [autoRules, setAutoRules] = useState<AutoRule[]>([
    { id: "AR-1", name: "Exact reference", enabled: true, logic: "Match provider_ref or internal_ref", note: "Highest confidence" },
    { id: "AR-2", name: "Amount + vendor", enabled: true, logic: "Amount equals and vendor contains", note: "Medium confidence" },
    { id: "AR-3", name: "Duplicate detection", enabled: true, logic: "Same amount and same provider_ref", note: "Flags duplicates" },
  ]);

  const [erpMaps, setErpMaps] = useState<ERPMap[]>([
    { id: "E-1", erp: "Odoo", object: "GL account", from: "CorporatePay", to: "6001 - Procurement", note: "Procurement spend", lastEdited: "Today" },
    { id: "E-2", erp: "Odoo", object: "Cost center", from: "CC-PROC", to: "CC-01", note: "Procurement cost center", lastEdited: "Yesterday" },
    { id: "E-3", erp: "Custom", object: "Tax code", from: "VAT", to: "VAT-STD", note: "Standard VAT", lastEdited: "Last week" },
  ]);

  const [audit] = useState<Audit[]>([
    { id: "A-1", when: "Today 09:10", actor: "Finance Desk", action: "Accepted match", target: "M-2", outcome: "Success", why: "Exact reference" },
    { id: "A-2", when: "Today 08:55", actor: "System", action: "Auto-match", target: "TX-9005→L-1002", outcome: "Success", why: "Rule AR-1" },
    { id: "A-3", when: "Yesterday", actor: "Viewer", action: "Export", target: "Reconciliation report", outcome: "Blocked", why: "Permission boundary" },
  ]);

  const modules = useMemo(() => Array.from(new Set(txs.map((t) => t.module))), [txs]);

  const [filters, setFilters] = useState<Filters>({ q: "", state: "ALL", currency: "ALL", module: "ALL", minConfidence: 70 });

  const mergedRows = useMemo(() => {
    // Combine match records with tx and invoice
    const q = filters.q.trim().toLowerCase();
    const rows = matches
      .map((m) => {
        const tx = txs.find((t) => t.id === m.txId);
        const li = lines.find((l) => l.id === m.lineId);
        return { m, tx, li };
      })
      .filter((r) => !!r.tx && !!r.li)
      .filter((r) => (filters.state === "ALL" ? true : r.m.state === filters.state))
      .filter((r) => (filters.currency === "ALL" ? true : r.tx!.currency === filters.currency))
      .filter((r) => (filters.module === "ALL" ? true : r.tx!.module === filters.module))
      .filter((r) => r.m.confidence >= filters.minConfidence)
      .filter((r) => {
        if (!q) return true;
        const blob = `${r.m.id} ${r.tx!.id} ${r.tx!.internalRef} ${r.tx!.providerRef ?? ""} ${r.li!.invoiceId} ${r.li!.vendor} ${r.m.reason}`.toLowerCase();
        return blob.includes(q);
      });
    return rows;
  }, [matches, txs, lines, filters]);

  const stats = useMemo(() => {
    const matched = matches.filter((m) => m.state === "Matched").length;
    const review = matches.filter((m) => m.state === "Needs review").length;
    const unmatched = matches.filter((m) => m.state === "Unmatched").length;
    const dup = matches.filter((m) => m.state === "Duplicate").length;
    return { matched, review, unmatched, dup };
  }, [matches]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeMatch, setActiveMatch] = useState<Match | null>(null);

  const openMatch = (m: Match) => {
    setActiveMatch(m);
    setDrawerOpen(true);
  };

  const acceptMatch = (id: string) => {
    if (!canOperate) {
      toast({ kind: "warn", title: "Permission required" });
      return;
    }
    setMatches((p) => p.map((m) => (m.id === id ? { ...m, state: "Matched", confidence: Math.max(m.confidence, 90), reason: `${m.reason} • accepted` } : m)));
    toast({ kind: "success", title: "Match accepted", message: id });
  };

  const rejectMatch = (id: string) => {
    if (!canOperate) {
      toast({ kind: "warn", title: "Permission required" });
      return;
    }
    setMatches((p) => p.map((m) => (m.id === id ? { ...m, state: "Unmatched", confidence: Math.min(m.confidence, 49), reason: `${m.reason} • rejected` } : m)));
    toast({ kind: "info", title: "Match rejected", message: id });
  };

  const runAutoMatch = () => {
    if (!canOperate) {
      toast({ kind: "warn", title: "Permission required" });
      return;
    }
    toast({ kind: "success", title: "Auto-match run started", message: "Confidence scoring applied." });
    // demo tweak
    setMatches((p) =>
      p.map((m) =>
        m.state === "Unmatched" ? { ...m, state: "Needs review", confidence: 71, reason: "Auto-match suggested based on amount and vendor" } : m
      )
    );
  };

  const toggleRule = (id: string) => {
    if (!canOperate) {
      toast({ kind: "warn", title: "Permission required" });
      return;
    }
    setAutoRules((p) => p.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
    toast({ kind: "success", title: "Auto-match rule updated" });
  };

  const copy = async (txt: string) => {
    try {
      await navigator.clipboard.writeText(txt);
      toast({ kind: "success", title: "Copied" });
    } catch {
      toast({ kind: "warn", title: "Copy failed", message: "Clipboard access blocked." });
    }
  };

  const openAdmin = () => toast({ kind: "info", title: "Admin Console", message: "Deep link to CorporatePay Admin Console: reconciliation module" });

  return (
    <div className="min-h-screen" style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(3,205,140,0.18), rgba(255,255,255,0))" }}>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((x) => x.id !== id))} />
      <div className="mx-auto max-w-[1180px] px-4 py-5 md:px-6">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_30px_90px_rgba(2,8,23,0.10)]">
          <div className="border-b border-slate-200 px-4 py-4 md:px-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-white" style={{ background: EVZ.green }}>
                  <LinkIcon className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">Transactions Reconciliation & ERP Mapping</div>
                  <div className="mt-1 text-xs text-slate-500">Ledger-to-invoice matching, exceptions, confidence scoring, ERP mapping, audit logs</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Pill label={`Org: ${org.name}`} tone="info" />
                    <Pill label={`Role: ${org.role}`} tone={canOperate ? "info" : "neutral"} />
                    <Pill label={`Matched: ${stats.matched}`} tone={stats.matched ? "good" : "neutral"} />
                    <Pill label={`Needs review: ${stats.review}`} tone={stats.review ? "warn" : "neutral"} />
                    <Pill label={`Unmatched: ${stats.unmatched}`} tone={stats.unmatched ? "warn" : "neutral"} />
                    <Pill label={`Duplicates: ${stats.dup}`} tone={stats.dup ? "bad" : "neutral"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="min-w-[260px]">
                  <Select value={orgId} onChange={setOrgId} options={orgs.map((o) => ({ value: o.id, label: o.name }))} />
                </div>
                <Button variant="outline" onClick={openAdmin}>
                  <ChevronRight className="h-4 w-4" /> Admin Console
                </Button>
                <Button variant="primary" onClick={runAutoMatch} disabled={!canOperate} title={!canOperate ? "Finance required" : "Run"}>
                  <RefreshCcw className="h-4 w-4" /> Auto-match
                </Button>
              </div>
            </div>

            {/* filters */}
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-12">
              <div className="md:col-span-4">
                <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <Search className="h-4 w-4 text-slate-500" />
                  <input
                    value={filters.q}
                    onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                    placeholder="Search refs, invoice, vendor"
                    className="w-full bg-transparent text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <select
                  value={filters.state}
                  onChange={(e) => setFilters((p) => ({ ...p, state: e.target.value as any }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {["ALL", "Matched", "Needs review", "Unmatched", "Duplicate"].map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={filters.currency}
                  onChange={(e) => setFilters((p) => ({ ...p, currency: e.target.value as any }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {["ALL", "UGX", "USD", "CNY", "KES"].map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <select
                  value={filters.module}
                  onChange={(e) => setFilters((p) => ({ ...p, module: e.target.value as any }))}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-100"
                >
                  {["ALL", ...modules].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                  <div className="text-xs font-semibold text-slate-500">Min confidence</div>
                  <div className="mt-1 flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={filters.minConfidence}
                      onChange={(e) => setFilters((p) => ({ ...p, minConfidence: Number(e.target.value) }))}
                      className="w-full"
                    />
                    <div className="text-sm font-semibold text-slate-900 w-10 text-right">{filters.minConfidence}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* body */}
          <div className="bg-slate-50 px-4 py-5 md:px-6">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-8">
                <Section
                  title="Ledger-to-invoice matches"
                  subtitle="Review exceptions and accept or reject matches"
                  right={<Pill label={`${mergedRows.length} row(s)`} tone={mergedRows.length ? "neutral" : "warn"} />}
                >
                  <div className="space-y-2">
                    {mergedRows.map(({ m, tx, li }) => (
                      <button key={m.id} type="button" onClick={() => openMatch(m)} className="w-full rounded-3xl border border-slate-200 bg-white p-4 text-left hover:bg-slate-50">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{tx!.id} → {li!.invoiceId}</div>
                              <Pill label={m.state} tone={toneForState(m.state)} />
                              <Pill label={`${m.confidence}%`} tone={toneForConfidence(m.confidence)} />
                              <Pill label={tx!.module} tone="neutral" />
                              <Pill label={tx!.currency} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-600">{li!.vendor} • {li!.description}</div>
                            <div className="mt-2 text-xs text-slate-500">Reason: {m.reason}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{formatMoney(tx!.amount, tx!.currency)}</div>
                            <div className="mt-1 text-xs text-slate-500">Line: {formatMoney(li!.amount, li!.currency)}</div>
                          </div>
                        </div>
                      </button>
                    ))}

                    {!mergedRows.length ? (
                      <div className="rounded-3xl border border-slate-200 bg-white p-4 text-sm text-slate-600">No matches meet your filter threshold.</div>
                    ) : null}
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export reconciliation results (CSV/JSON)" })}>
                      <ChevronRight className="h-4 w-4" /> Export
                    </Button>
                    <Button variant="outline" onClick={() => toast({ kind: "info", title: "Exceptions", message: "Open exceptions workflow" })}>
                      <ChevronRight className="h-4 w-4" /> Exceptions
                    </Button>
                    <Button variant="outline" onClick={openAdmin}>
                      <ChevronRight className="h-4 w-4" /> Advanced
                    </Button>
                  </div>
                </Section>

                <Section
                  title="Auto-match rules"
                  subtitle="Enable rules and run auto-match"
                  right={<Pill label={`${autoRules.filter((r) => r.enabled).length}/${autoRules.length} enabled`} tone="info" />}
                >
                  <div className="space-y-2">
                    {autoRules.map((r) => (
                      <div key={r.id} className={cn("rounded-3xl border p-4", r.enabled ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{r.name}</div>
                              <Pill label={r.id} tone="neutral" />
                              <Pill label={r.enabled ? "Enabled" : "Disabled"} tone={r.enabled ? "good" : "neutral"} />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{r.logic}</div>
                            <div className="mt-1 text-xs text-slate-500">{r.note}</div>
                          </div>
                          <Button variant={r.enabled ? "primary" : "outline"} disabled={!canOperate} title={!canOperate ? "Finance required" : "Toggle"} onClick={() => toggleRule(r.id)} className="px-3 py-2">
                            {r.enabled ? "ON" : "OFF"}
                          </Button>
                        </div>
                      </div>
                    ))}

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="primary" disabled={!canOperate} onClick={runAutoMatch}>
                        <RefreshCcw className="h-4 w-4" /> Run auto-match
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Confidence", message: "Explain confidence scoring" })}>
                        <ChevronRight className="h-4 w-4" /> Confidence scoring
                      </Button>
                    </div>
                  </div>
                </Section>
              </div>

              <div className="space-y-4 lg:col-span-4">
                <Section
                  title="ERP mapping"
                  subtitle="Map modules and cost centers to ERP objects"
                  right={<Pill label={`${erpMaps.length} mappings`} tone="neutral" />}
                >
                  <div className="space-y-2">
                    {erpMaps.map((m) => (
                      <div key={m.id} className="rounded-3xl border border-slate-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{m.erp}</div>
                              <Pill label={m.object} tone="neutral" />
                              <Pill label={m.id} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{m.from} → {m.to}</div>
                            <div className="mt-1 text-xs text-slate-500">{m.note} • {m.lastEdited}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" className="px-3 py-2" onClick={() => copy(`${m.erp}:${m.object}:${m.from}:${m.to}`)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" className="px-3 py-2" onClick={openAdmin}>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Add mapping", message: "Create ERP mapping" })} disabled={!canOperate}>
                        <ChevronRight className="h-4 w-4" /> Add
                      </Button>
                      <Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export ERP mapping JSON" })}>
                        <ChevronRight className="h-4 w-4" /> Export
                      </Button>
                    </div>
                  </div>
                </Section>

                <Section title="Audit logs" subtitle="Actions are traceable" right={<Pill label={`${audit.length} events`} tone="neutral" />}>
                  <div className="space-y-2">
                    {audit.map((a) => (
                      <div key={a.id} className={cn("rounded-3xl border p-4", a.outcome === "Blocked" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white")}>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="text-sm font-semibold text-slate-900">{a.action}</div>
                              <Pill label={a.outcome} tone={a.outcome === "Blocked" ? "warn" : "good"} />
                              <Pill label={a.actor} tone="neutral" />
                            </div>
                            <div className="mt-1 text-sm text-slate-700">{a.target}</div>
                            <div className="mt-2 text-xs text-slate-500">{a.when} • {a.why}</div>
                          </div>
                          <Button variant="outline" className="px-3 py-2" onClick={() => toast({ kind: "info", title: "Open audit", message: a.id })}>
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2"><Button variant="outline" onClick={() => toast({ kind: "info", title: "Export", message: "Export audit log" })}><ChevronRight className="h-4 w-4" /> Export</Button></div>
                  </div>
                </Section>

                <div
                  className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                  style={{ background: "radial-gradient(90% 80% at 10% 0%, rgba(247,127,0,0.20), rgba(255,255,255,0)), radial-gradient(90% 80% at 90% 0%, rgba(3,205,140,0.16), rgba(255,255,255,0))" }}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl text-white" style={{ background: EVZ.orange }}>
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900">Premium reconciliation</div>
                      <div className="mt-1 text-sm text-slate-600">Confidence scoring, exceptions workflows, and ERP mapping for audit-ready finance.</div>
                      <div className="mt-3"><Button variant="outline" onClick={openAdmin}><ChevronRight className="h-4 w-4" /> Admin Console</Button></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-50 text-slate-700"><Info className="h-5 w-5" /></div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900">Tip</div>
                    <div className="mt-1 text-sm text-slate-600">Keep auto-match rules conservative and route low confidence matches to review.</div>
                  </div>
                </div>
                <Button variant="primary" disabled={!canOperate} onClick={runAutoMatch}>
                  <RefreshCcw className="h-4 w-4" /> Auto-match
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Drawer
        open={drawerOpen}
        title={activeMatch ? `Match ${activeMatch.id}` : "Match"}
        subtitle={activeMatch ? `${activeMatch.state} • ${activeMatch.confidence}%` : ""}
        onClose={() => setDrawerOpen(false)}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-slate-600"><Info className="h-4 w-4" /> Changes are logged.</div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>Close</Button>
              {activeMatch ? (
                <>
                  <Button variant="primary" disabled={!canOperate} onClick={() => acceptMatch(activeMatch.id)}>
                    <Check className="h-4 w-4" /> Accept
                  </Button>
                  <Button variant="accent" disabled={!canOperate} onClick={() => rejectMatch(activeMatch.id)}>
                    <X className="h-4 w-4" /> Reject
                  </Button>
                </>
              ) : null}
            </div>
          </div>
        }
      >
        {activeMatch ? (
          <div className="space-y-4">
            <div className={cn("rounded-3xl border p-4", activeMatch.state === "Matched" ? "border-emerald-200 bg-emerald-50" : activeMatch.state === "Duplicate" ? "border-rose-200 bg-rose-50" : activeMatch.state === "Unmatched" ? "border-amber-200 bg-amber-50" : "border-blue-200 bg-blue-50")}>
              <div className="flex items-start gap-3">
                <div className={cn("grid h-10 w-10 place-items-center rounded-2xl bg-white", activeMatch.state === "Matched" ? "text-emerald-700" : activeMatch.state === "Duplicate" ? "text-rose-700" : activeMatch.state === "Unmatched" ? "text-amber-800" : "text-blue-700")}>
                  {activeMatch.state === "Matched" ? <BadgeCheck className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-900">{activeMatch.state}</div>
                  <div className="mt-1 text-sm text-slate-700">Confidence {activeMatch.confidence}% • {activeMatch.reason}</div>
                  <div className="mt-2"><Pill label={`Created: ${activeMatch.createdAt}`} tone="neutral" /></div>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="text-sm font-semibold text-slate-900">Actions</div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open tx", message: activeMatch.txId })}>
                  <ChevronRight className="h-4 w-4" /> Transaction
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Open invoice", message: activeMatch.lineId })}>
                  <ChevronRight className="h-4 w-4" /> Invoice
                </Button>
                <Button variant="outline" onClick={() => toast({ kind: "info", title: "Exceptions", message: "Open exceptions workflow" })}>
                  <ChevronRight className="h-4 w-4" /> Exceptions
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
